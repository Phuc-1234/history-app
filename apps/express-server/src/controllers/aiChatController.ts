import { Request, Response } from "express";
import { AiChatService } from "../services/aiChatService";

const aiChatService = new AiChatService();

export const listSessions = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        const sessions = await aiChatService.listSessions(userId);
        return res.status(200).json({ sessions });
    } catch (err: any) {
        return res.status(500).json({ error: err.message || "Failed to fetch chat sessions." });
    }
};

export const createSession = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        const { title } = req.body;
        const session = await aiChatService.createSession(userId, title);
        return res.status(201).json({ session });
    } catch (err: any) {
        return res.status(500).json({ error: err.message || "Failed to create chat session." });
    }
};

export const getSessionMessages = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        const { sessionId } = req.params;
        const messages = await aiChatService.getSessionMessages(userId, sessionId);
        return res.status(200).json({ messages });
    } catch (err: any) {
        return res.status(500).json({ error: err.message || "Failed to fetch messages." });
    }
};

export const sendMessage = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        const { sessionId } = req.params;
        const { content } = req.body;
        if (!content || typeof content !== "string" || !content.trim()) {
            return res.status(400).json({ error: "Content is required." });
        }

        const result = await aiChatService.sendMessage(userId, sessionId, content.trim());
        return res.status(200).json(result);
    } catch (err: any) {
        return res.status(500).json({ error: err.message || "Failed to process chat message." });
    }
};

export const deleteSession = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        const { sessionId } = req.params;
        const result = await aiChatService.deleteSession(userId, sessionId);
        return res.status(200).json(result);
    } catch (err: any) {
        return res.status(500).json({ error: err.message || "Failed to delete chat session." });
    }
};
