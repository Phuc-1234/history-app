// routes/homeRoutes.ts
import { Router } from "express";
import { getHomeData } from "../controllers/homeController";
import { optionalAuth } from "../middlewares/authMiddleware";

const router = Router();

// GET /api/home
router.get("/", optionalAuth, getHomeData);

export default router;
