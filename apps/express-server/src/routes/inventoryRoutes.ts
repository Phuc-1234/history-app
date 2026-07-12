import { Router } from "express";
import { requireStudent } from "../middlewares/authMiddleware";
import { getUserInventory } from "../controllers/shopController";

const router = Router();

// GET /api/inventory
router.get("/", requireStudent, getUserInventory);

export default router;
