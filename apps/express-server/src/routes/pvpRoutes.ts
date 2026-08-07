import { Router } from "express";
import {
    createRoom,
    joinRoom,
    getRoomInfo,
    getActiveRoom,
    startRoom,
    submitAnswer,
} from "../controllers/pvpController";
import { requireStudent } from "../middlewares/authMiddleware";

const router = Router();

// GET /api/pvp/active-room
router.get("/active-room", requireStudent, getActiveRoom);

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
