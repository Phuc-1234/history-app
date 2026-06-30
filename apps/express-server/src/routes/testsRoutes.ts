import { Router } from "express";
import { startTest, getTestSummary } from "../controllers/testController";
import { requireStudent } from "../middlewares/authMiddleware";

const router = Router();

// POST /api/tests/:testId/start
router.post("/:testId/start", requireStudent, startTest);
router.get("/:testId/summary", requireStudent, getTestSummary);

export default router;
