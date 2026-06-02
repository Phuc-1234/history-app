// routes/contentRoutes.ts
import { Router } from "express";
import {
    getAllGrades,
    getTopicsByGrade,
    getLessonsByTopic,
    getSectionsByLesson,
    getLessonTree,
    getMindMap,
} from "../controllers/contentController";

const router = Router();

// GET /api/content/grades
router.get("/grades", getAllGrades);

// GET /api/content/grades/:gradeId/topics
router.get("/grades/:gradeId/topics", getTopicsByGrade);

// GET /api/content/topics/:topicId/lessons
router.get("/topics/:topicId/lessons", getLessonsByTopic);

// GET /api/content/lessons/:lessonId/sections
router.get("/lessons/:lessonId/sections", getSectionsByLesson);

// GET /api/content/lessons/:lessonId/tree
router.get("/lessons/:lessonId/tree", getLessonTree);

// GET /api/content/mindmap
router.get("/mindmap", getMindMap);

export default router;
