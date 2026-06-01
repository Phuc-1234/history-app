// routes/gamificationRoutes.ts
import { Router } from "express";
import {
    getLeaderboard,
    getTiers,
    getMilestoneRewardsByTier,
    getPendingRewardsByTierForUser,
    getAllItems,
    getUserItems,
} from "../controllers/gamificationController";
import { optionalAuth, requireStudent } from "../middlewares/authMiddleware";

const router = Router();

// GET /api/gamification/leaderboard?limit=20&page=1
router.get("/leaderboard", optionalAuth, getLeaderboard);

// GET /api/gamification/tiers
router.get("/tiers", getTiers);

// GET /api/gamification/tiers/:tierIndex/milestone-rewards
router.get("/tiers/:tierIndex/milestone-rewards", getMilestoneRewardsByTier);

// GET /api/gamification/tiers/:tierIndex/pending-rewards (requires student)
router.get(
    "/tiers/:tierIndex/pending-rewards",
    requireStudent,
    getPendingRewardsByTierForUser,
);

// GET /api/gamification/items
router.get("/items", getAllItems);

// GET /api/gamification/items/me (requires student)
router.get("/items/me", requireStudent, getUserItems);

export default router;
