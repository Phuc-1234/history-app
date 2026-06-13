import { Router } from "express";
import {
    getFlashcardsByLesson,
    getFlashcardsBySection,
    getFlashcardsByNode,
} from "../controllers/flashcardController";

const router = Router();

// GET /api/flashcards/lesson/:lessonId
router.get("/lesson/:lessonId", getFlashcardsByLesson);

// GET /api/flashcards/section/:sectionId
router.get("/section/:sectionId", getFlashcardsBySection);

// GET /api/flashcards/node/:nodeId
router.get("/node/:nodeId", getFlashcardsByNode);

export default router;
