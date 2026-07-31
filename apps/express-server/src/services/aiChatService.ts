import { prisma, AiChatMode } from "@history-app/shared";
import { AIService } from "./aiService";
import { contentSearchService } from "./contentSearchService";

const aiService = new AIService();

export interface ScreenContextPayload {
    screenName?: string;
    lessonId?: number;
    nodeId?: number;
    topicId?: number;
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

        // Search grounding course context if mode is COURSE_ONLY / COURSE_FIRST or screenContext has lessonId/nodeId
        let groundingContext = "";
        if (session.mode === AiChatMode.COURSE_ONLY || session.mode === AiChatMode.COURSE_FIRST) {
            const searchResult = await contentSearchService.searchCourseContent(content, {
                contextLessonId: screenContext?.lessonId,
                contextNodeId: screenContext?.nodeId
            });
            groundingContext = searchResult.formattedContext;
        }

        let screenContextText = "";
        if (screenContext?.screenName) {
            screenContextText = `- Màn hình: ${screenContext.screenName}`;
            if (screenContext.lessonId) screenContextText += ` (Bài học ID: ${screenContext.lessonId})`;
            if (screenContext.nodeId) screenContextText += ` (Nút kiến thức ID: ${screenContext.nodeId})`;
        }

        // Prepare context (sliding window of last 16 messages)
        const history = [...session.messages, userMsg].slice(-16);
        const formattedContents = history.map((msg) => ({
            role: (msg.sender === "user" ? "user" : "model") as "user" | "model",
            parts: [{ text: msg.content }]
        }));

        // Call Gemini with mode & grounding context
        const assistantText = await aiService.callGeminiChat(formattedContents, {
            mode: session.mode,
            groundingContext,
            screenContextText
        });

        // Save assistant response
        const assistantMsg = await prisma.aiChatMessage.create({
            data: {
                sessionId,
                sender: "assistant",
                content: assistantText
            }
        });

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
}
