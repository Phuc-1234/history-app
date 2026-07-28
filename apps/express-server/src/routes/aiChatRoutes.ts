import { Router } from "express";
import { requireStudent } from "../middlewares/authMiddleware";
import {
    listSessions,
    createSession,
    getSessionMessages,
    sendMessage,
    deleteSession
} from "../controllers/aiChatController";

const router = Router();

router.use(requireStudent);

router.get("/sessions", listSessions);
router.post("/sessions", createSession);
router.delete("/sessions/:sessionId", deleteSession);
router.get("/sessions/:sessionId/messages", getSessionMessages);
router.post("/sessions/:sessionId/messages", sendMessage);

export default router;
