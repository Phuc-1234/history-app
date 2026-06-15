import { Router } from "express";
import {
    checkResumable,
    startTest,
    updateDraft,
    finishTest,
    abandonTest,
    getHistory,
    getAttemptDetail,
    getTestInfo,
} from "../controllers/testControllerV2";
import { requireStudent } from "../middlewares/authMiddleware";

const router = Router();

// GET /api/tests-v2/resumable
router.get("/resumable", requireStudent, checkResumable);

// POST /api/tests-v2/info
router.post("/info", requireStudent, getTestInfo);

// POST /api/tests-v2/start
router.post("/start", requireStudent, startTest);

// PUT /api/tests-v2/:logId/draft
router.put("/:logId/draft", requireStudent, updateDraft);

// POST /api/tests-v2/:logId/finish
router.post("/:logId/finish", requireStudent, finishTest);

// POST /api/tests-v2/:logId/abandon
router.post("/:logId/abandon", requireStudent, abandonTest);

// GET /api/tests-v2/history
router.get("/history", requireStudent, getHistory);

// GET /api/tests-v2/history/:logId
router.get("/history/:logId", requireStudent, getAttemptDetail);

export default router;
