import { Router } from "express";
import { requireStudent } from "../middlewares/authMiddleware";
import { getUserInventory, activateItem } from "../controllers/shopController";

const router = Router();

// GET /api/inventory
router.get("/", requireStudent, getUserInventory);

// POST /api/inventory/activate
router.post("/activate", requireStudent, activateItem);

export default router;
