import { Router } from "express";
import { requireStudent } from "../middlewares/authMiddleware";
import { getShopItems, purchaseItem } from "../controllers/shopController";

const router = Router();

// GET /api/shop/items
router.get("/items", requireStudent, getShopItems);

// POST /api/shop/purchase
router.post("/purchase", requireStudent, purchaseItem);

export default router;
