import { prisma, AiChatMode } from "@history-app/shared";
import { AIService } from "./aiService";
import { contentSearchService } from "./contentSearchService";

const aiService = new AIService();

export interface ScreenContextPayload {
    screenName?: string;
    lessonId?: number;
    nodeId?: number;
    topicId?: number;
    grade?: number;
    isSupported?: boolean;
}

export class AiChatService {
    async listSessions(userId: string) {
        return prisma.aiChatSession.findMany({
            where: { userId },
            orderBy: { updatedAt: "desc" },
            select: {
                id: true,
                title: true,
                mode: true,
                createdAt: true,
                updatedAt: true,
                messages: {
                    take: 1,
                    orderBy: { createdAt: "desc" },
                    select: { content: true }
                }
            }
        });
    }

    async createSession(userId: string, initialTitle?: string, mode?: AiChatMode) {
        return prisma.aiChatSession.create({
            data: {
                userId,
                title: initialTitle || "Cuộc trò chuyện mới",
                mode: mode || AiChatMode.GENERAL
            }
        });
    }

    async getSessionMessages(userId: string, sessionId: string) {
        const session = await prisma.aiChatSession.findFirst({
            where: { id: sessionId, userId }
        });
        if (!session) {
            throw new Error("Chat session not found or unauthorized.");
        }

        return prisma.aiChatMessage.findMany({
            where: { sessionId },
            orderBy: { createdAt: "asc" }
        });
    }

    async sendMessage(
        userId: string,
        sessionId: string,
        content: string,
        screenContext?: ScreenContextPayload
    ) {
        const session = await prisma.aiChatSession.findFirst({
            where: { id: sessionId, userId },
            include: {
                messages: {
                    orderBy: { createdAt: "asc" }
                }
            }
        });

        if (!session) {
            throw new Error("Chat session not found or unauthorized.");
        }

        // Check user PRO status and daily token quota limit
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { isPro: true, proExpiresAt: true }
        });

        const isUserPro = Boolean(user?.isPro && user?.proExpiresAt && user.proExpiresAt > new Date());
        const dailyLimit = isUserPro ? 500000 : 50000;
        const todayStr = new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);

        const currentQuota = await prisma.userAiQuota.findUnique({
            where: { userId_date: { userId, date: todayStr } }
        });

        if (currentQuota && currentQuota.tokensUsed >= dailyLimit) {
            throw new Error("QUOTA_EXCEEDED");
        }

        // Save user message
        const userMsg = await prisma.aiChatMessage.create({
            data: {
                sessionId,
                sender: "user",
                content,
                screenContext: screenContext ? (screenContext as any) : undefined
            }
        });

        // Auto-generate title if this is the first message in the session
        if (session.messages.length === 0) {
            aiService
                .generateChatTitle(content)
                .then(async (newTitle) => {
                    await prisma.aiChatSession.update({
                        where: { id: sessionId },
                        data: { title: newTitle }
                    });
                })
                .catch(() => {});
        }

        // Search grounding course context if mode is COURSE_ONLY / COURSE_FIRST or screenContext has lessonId/nodeId/grade
        let groundingContext = "";
        if (
            session.mode === AiChatMode.COURSE_ONLY ||
            session.mode === AiChatMode.COURSE_FIRST ||
            screenContext?.lessonId ||
            screenContext?.nodeId ||
            screenContext?.grade
        ) {
            const searchResult = await contentSearchService.searchCourseContent(content, {
                contextLessonId: screenContext?.lessonId,
                contextNodeId: screenContext?.nodeId,
                contextGrade: screenContext?.grade
            });
            groundingContext = searchResult.formattedContext;
        }

        let screenContextText = "";
        if (screenContext?.screenName) {
            screenContextText = `- Màn hình: ${screenContext.screenName}`;
            if (screenContext.grade) screenContextText += ` (Lớp ${screenContext.grade})`;
            if (screenContext.lessonId) screenContextText += ` (Bài học ID: ${screenContext.lessonId})`;
            if (screenContext.nodeId) screenContextText += ` (Nút kiến thức ID: ${screenContext.nodeId})`;
        }

        // Prepare context (sliding window of last 15 messages)
        const history = [...session.messages, userMsg].slice(-15);
        const formattedContents = history.map((msg) => ({
            role: (msg.sender === "user" ? "user" : "model") as "user" | "model",
            parts: [{ text: msg.content }]
        }));

        // Call Gemini with mode, summary & grounding context
        const { text: assistantText, usageTokens } = await aiService.callGeminiChat(formattedContents, {
            mode: session.mode,
            groundingContext,
            screenContextText,
            isSupportedScreen: screenContext?.isSupported,
            summary: session.summary || undefined
        });

        // Update token quota tracking
        await prisma.userAiQuota.upsert({
            where: { userId_date: { userId, date: todayStr } },
            create: {
                userId,
                date: todayStr,
                tokensUsed: usageTokens
            },
            update: {
                tokensUsed: { increment: usageTokens }
            }
        });

        // Save assistant response
        const assistantMsg = await prisma.aiChatMessage.create({
            data: {
                sessionId,
                sender: "assistant",
                content: assistantText
            }
        });

        // Async context summarization every 15 messages
        const totalMessages = [...session.messages, userMsg, assistantMsg];
        if (totalMessages.length % 15 === 0) {
            const chunkToSummarize = totalMessages.slice(-15);
            aiService
                .summarizeContext(chunkToSummarize, session.summary || undefined)
                .then(async (newSummary) => {
                    if (newSummary) {
                        await prisma.aiChatSession.update({
                            where: { id: sessionId },
                            data: { summary: newSummary }
                        });
                    }
                })
                .catch((err) => console.error("Async summarization error:", err));
        }

        // Update session updatedAt
        await prisma.aiChatSession.update({
            where: { id: sessionId },
            data: { updatedAt: new Date() }
        });

        return {
            userMessage: userMsg,
            assistantMessage: assistantMsg
        };
    }

    async deleteSession(userId: string, sessionId: string) {
        const session = await prisma.aiChatSession.findFirst({
            where: { id: sessionId, userId }
        });
        if (!session) {
            throw new Error("Chat session not found or unauthorized.");
        }
        await prisma.aiChatSession.delete({
            where: { id: sessionId }
        });
        return { success: true };
    }

    async updateSession(
        userId: string,
        sessionId: string,
        updateData: { title?: string; mode?: AiChatMode }
    ) {
        const session = await prisma.aiChatSession.findFirst({
            where: { id: sessionId, userId }
        });
        if (!session) {
            throw new Error("Chat session not found or unauthorized.");
        }
        const updated = await prisma.aiChatSession.update({
            where: { id: sessionId },
            data: {
                ...(updateData.title ? { title: updateData.title } : {}),
                ...(updateData.mode ? { mode: updateData.mode } : {})
            }
        });
        return updated;
    }

    async getUserQuota(userId: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { isPro: true, proExpiresAt: true }
        });

        const isUserPro = Boolean(user?.isPro && user?.proExpiresAt && user.proExpiresAt > new Date());
        const dailyLimit = isUserPro ? 500000 : 50000;
        const todayStr = new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);

        const currentQuota = await prisma.userAiQuota.findUnique({
            where: { userId_date: { userId, date: todayStr } }
        });

        return {
            tokensUsed: currentQuota?.tokensUsed || 0,
            dailyLimit,
            isPro: isUserPro
        };
    }
}
