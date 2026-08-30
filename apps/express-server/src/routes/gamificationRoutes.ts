// routes/gamificationRoutes.ts
import { Router } from "express";
import {
    getLeaderboard,
    getTiers,
    getStreakDetails,
    getMonthlyStreakCalendar,
} from "../controllers/gamificationController";
import { optionalAuth, requireStudent } from "../middlewares/authMiddleware";

const router = Router();

// GET /api/gamification/leaderboard?limit=20&page=1
router.get("/leaderboard", optionalAuth, getLeaderboard);

// GET /api/gamification/tiers
router.get("/tiers", optionalAuth, getTiers);

// GET /api/gamification/streak
router.get("/streak", optionalAuth, getStreakDetails);

// GET /api/gamification/streak/calendar
router.get("/streak/calendar", requireStudent, getMonthlyStreakCalendar);


export default router;
