import { prisma } from "@history-app/shared";
import { AIService } from "./aiService";

const aiService = new AIService();

export class AiChatService {
    async listSessions(userId: string) {
        return prisma.aiChatSession.findMany({
            where: { userId },
            orderBy: { updatedAt: "desc" },
            select: {
                id: true,
                title: true,
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

    async createSession(userId: string, initialTitle?: string) {
        return prisma.aiChatSession.create({
            data: {
                userId,
                title: initialTitle || "Cuộc trò chuyện mới"
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

    async sendMessage(userId: string, sessionId: string, content: string) {
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
                content
            }
        });

        // Auto-generate title if this is the first message in the session
        if (session.messages.length === 0) {
            aiService.generateChatTitle(content).then(async (newTitle) => {
                await prisma.aiChatSession.update({
                    where: { id: sessionId },
                    data: { title: newTitle }
                });
            }).catch(() => {});
        }

        // Prepare context (sliding window of last 16 messages)
        const history = [...session.messages, userMsg].slice(-16);
        const formattedContents = history.map((msg) => ({
            role: (msg.sender === "user" ? "user" : "model") as "user" | "model",
            parts: [{ text: msg.content }]
        }));

        // Call Gemini
        const assistantText = await aiService.callGeminiChat(formattedContents);

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
}
