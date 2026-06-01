import { Router } from "express";
import { startTest } from "../controllers/testController";
import { requireStudent } from "../middlewares/authMiddleware";

const router = Router();

// POST /api/tests/:testId/start
router.post("/:testId/start", requireStudent, startTest);

export default router;
