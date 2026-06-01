import { Router } from "express";
import { jump, submitAnswer, finishTest } from "../controllers/testController";
import { requireStudent } from "../middlewares/authMiddleware";

const router = Router();

// POST /api/test-logs/:logId/jump
router.post("/:logId/jump", requireStudent, jump);

// POST /api/test-logs/:logId/submit-answer
router.post("/:logId/submit-answer", requireStudent, submitAnswer);

// POST /api/test-logs/:logId/finish
router.post("/:logId/finish", requireStudent, finishTest);

export default router;
