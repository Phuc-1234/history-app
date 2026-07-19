// routes/gamificationRoutes.ts
import { Router } from "express";
import {
    getLeaderboard,
    getTiers,
    getStreakDetails,
} from "../controllers/gamificationController";
import { optionalAuth, requireStudent } from "../middlewares/authMiddleware";

const router = Router();

// GET /api/gamification/leaderboard?limit=20&page=1
router.get("/leaderboard", optionalAuth, getLeaderboard);

// GET /api/gamification/tiers
router.get("/tiers", getTiers);

// GET /api/gamification/streak
router.get("/streak", optionalAuth, getStreakDetails);


export default router;
