import { Router } from "express";
import {
    createRoom,
    joinRoom,
    getRoomInfo,
    startRoom,
    submitAnswer,
} from "../controllers/pvpController";
import { requireStudent } from "../middlewares/authMiddleware";

const router = Router();

// POST /api/pvp/create
router.post("/create", requireStudent, createRoom);

// POST /api/pvp/join
router.post("/join", requireStudent, joinRoom);

// GET /api/pvp/room/:code
router.get("/room/:code", requireStudent, getRoomInfo);

// POST /api/pvp/start
router.post("/start", requireStudent, startRoom);

// POST /api/pvp/submit-answer
router.post("/submit-answer", requireStudent, submitAnswer);

export default router;
