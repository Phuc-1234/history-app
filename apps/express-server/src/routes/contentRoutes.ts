// routes/contentRoutes.ts
import { Router } from "express";
import {
    getAllGrades,
    getTopicsByGrade,
    getLessonsByTopic,
    getSectionsByLesson,
    getLessonTree,
    getMindMap,
    getGradeStructure,
    getNodesBySection,
    getNodeDetail,
    finishStudyNode,
} from "../controllers/contentController";
import { optionalAuth, requireStudent } from "../middlewares/authMiddleware";

const router = Router();

// GET /api/content/grades
router.get("/grades", getAllGrades);

// GET /api/content/grades/:gradeId/topics
router.get("/grades/:gradeId/topics", getTopicsByGrade);

// GET /api/content/topics/:topicId/lessons
router.get("/topics/:topicId/lessons", getLessonsByTopic);

// GET /api/content/lessons/:lessonId/sections
router.get("/lessons/:lessonId/sections", getSectionsByLesson);

// GET /api/content/sections/:sectionId/nodes
router.get("/sections/:sectionId/nodes", getNodesBySection);

// GET /api/content/lessons/:lessonId/tree — optionalAuth for progress %
router.get("/lessons/:lessonId/tree", optionalAuth, getLessonTree);

// GET /api/content/mindmap
router.get("/mindmap", getMindMap);

// GET /api/content/grade-struct/:gradeId — optionalAuth for progress %
router.get("/grade-struct/:gradeId", optionalAuth, getGradeStructure);

// GET /api/content/nodes/:nodeId — full node detail
router.get("/nodes/:nodeId", optionalAuth, getNodeDetail);

// POST /api/content/nodes/:nodeId/finish-study — mark node as studied
router.post("/nodes/:nodeId/finish-study", requireStudent, finishStudyNode);

export default router;