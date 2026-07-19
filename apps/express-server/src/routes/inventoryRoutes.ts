import { Router } from "express";
import { requireStudent } from "../middlewares/authMiddleware";
import { getUserInventory, activateItem, getUserActiveEffects } from "../controllers/shopController";

const router = Router();

// GET /api/inventory
router.get("/", requireStudent, getUserInventory);

// GET /api/inventory/active-effects
router.get("/active-effects", requireStudent, getUserActiveEffects);

// POST /api/inventory/activate
router.post("/activate", requireStudent, activateItem);

export default router;
