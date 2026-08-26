import { Router } from "express";
import {
    createRoom,
    joinRoom,
    getRoomInfo,
    getActiveRoom,
    startRoom,
    submitAnswer,
    nextState,
    getCuratedTests,
    getAvailableQuestionsCount,
    leaveRoom,
    getPublicRooms,
    redirectToPvpRoom,
} from "../controllers/pvpController";
import { requireStudent } from "../middlewares/authMiddleware";

const router = Router();

// GET /api/pvp/link/:code (Public deep link landing bridge)
router.get("/link/:code", redirectToPvpRoom);
router.get("/link", redirectToPvpRoom);

// GET /api/pvp/public-rooms
router.get("/public-rooms", requireStudent, getPublicRooms);

// GET /api/pvp/curated-tests
router.get("/curated-tests", requireStudent, getCuratedTests);

// GET /api/pvp/available-questions-count
router.get("/available-questions-count", requireStudent, getAvailableQuestionsCount);

// GET /api/pvp/active-room
router.get("/active-room", requireStudent, getActiveRoom);

// POST /api/pvp/create
router.post("/create", requireStudent, createRoom);

// POST /api/pvp/join
router.post("/join", requireStudent, joinRoom);

// POST /api/pvp/leave
router.post("/leave", requireStudent, leaveRoom);

// GET /api/pvp/room/:code
router.get("/room/:code", requireStudent, getRoomInfo);

// POST /api/pvp/start
router.post("/start", requireStudent, startRoom);

// POST /api/pvp/submit-answer
router.post("/submit-answer", requireStudent, submitAnswer);

// POST /api/pvp/next-state
router.post("/next-state", requireStudent, nextState);

export default router;
