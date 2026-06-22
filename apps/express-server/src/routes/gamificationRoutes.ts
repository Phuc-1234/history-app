// routes/gamificationRoutes.ts
import { Router } from "express";
import {
    getLeaderboard,
    getTiers,

} from "../controllers/gamificationController";
import { optionalAuth, requireStudent } from "../middlewares/authMiddleware";

const router = Router();

// GET /api/gamification/leaderboard?limit=20&page=1
router.get("/leaderboard", optionalAuth, getLeaderboard);

// GET /api/gamification/tiers
router.get("/tiers", getTiers);


export default router;
