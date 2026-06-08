// routes/adminRoutes.ts
import { Router } from "express";
import { requireAdmin } from "../middlewares/authMiddleware";
import {
    createGrade,
    updateGrade,
    deleteGrade,
    createTopic,
    updateTopic,
    deleteTopic,
    createLesson,
    updateLesson,
    deleteLesson,
    createSection,
    updateSection,
    deleteSection,
    createNode,
    updateNode,
    deleteNode,
    listUsers,
    updateUser,
    deleteUser,
    listVideos,
    createVideo,
    updateVideo,
    deleteVideo,
    listQuestions,
    createQuestion,
    updateQuestion,
    deleteQuestion,
    listTests,
    createTest,
    updateTest,
    deleteTest,
} from "../controllers/adminController";

const router = Router();

// All admin routes require ADMIN or SUPER_ADMIN role
router.use(requireAdmin);

// ─── Grade ────────────────────────────────────────────────────────────────────
// POST   /api/admin/grades
router.post("/grades", createGrade);

// PATCH  /api/admin/grades/:gradeId
router.patch("/grades/:gradeId", updateGrade);

// DELETE /api/admin/grades/:gradeId
router.delete("/grades/:gradeId", deleteGrade);

// ─── Topic ────────────────────────────────────────────────────────────────────
// POST   /api/admin/topics
router.post("/topics", createTopic);

// PATCH  /api/admin/topics/:topicId
router.patch("/topics/:topicId", updateTopic);

// DELETE /api/admin/topics/:topicId
router.delete("/topics/:topicId", deleteTopic);

// ─── Lesson ───────────────────────────────────────────────────────────────────
// POST   /api/admin/lessons
router.post("/lessons", createLesson);

// PATCH  /api/admin/lessons/:lessonId
router.patch("/lessons/:lessonId", updateLesson);

// DELETE /api/admin/lessons/:lessonId
router.delete("/lessons/:lessonId", deleteLesson);

// ─── Section ──────────────────────────────────────────────────────────────────
// POST   /api/admin/sections
router.post("/sections", createSection);

// PATCH  /api/admin/sections/:sectionId
router.patch("/sections/:sectionId", updateSection);

// DELETE /api/admin/sections/:sectionId
router.delete("/sections/:sectionId", deleteSection);

// ─── Node ─────────────────────────────────────────────────────────────────────
// POST   /api/admin/nodes
router.post("/nodes", createNode);

// PATCH  /api/admin/nodes/:nodeId
router.patch("/nodes/:nodeId", updateNode);

// DELETE /api/admin/nodes/:nodeId
router.delete("/nodes/:nodeId", deleteNode);

// ─── User ─────────────────────────────────────────────────────────────────────
// GET    /api/admin/users
router.get("/users", listUsers);

// PATCH  /api/admin/users/:userId
router.patch("/users/:userId", updateUser);

// DELETE /api/admin/users/:userId
router.delete("/users/:userId", deleteUser);

// ─── Video ────────────────────────────────────────────────────────────────────
// GET    /api/admin/videos
router.get("/videos", listVideos);

// POST   /api/admin/videos
router.post("/videos", createVideo);

// PATCH  /api/admin/videos/:videoId
router.patch("/videos/:videoId", updateVideo);

// DELETE /api/admin/videos/:videoId
router.delete("/videos/:videoId", deleteVideo);

// ─── Question ─────────────────────────────────────────────────────────────────
// GET    /api/admin/questions
router.get("/questions", listQuestions);

// POST   /api/admin/questions
router.post("/questions", createQuestion);

// PATCH  /api/admin/questions/:questionId
router.patch("/questions/:questionId", updateQuestion);

// DELETE /api/admin/questions/:questionId
router.delete("/questions/:questionId", deleteQuestion);

// ─── Test ─────────────────────────────────────────────────────────────────────
// GET    /api/admin/tests
router.get("/tests", listTests);

// POST   /api/admin/tests
router.post("/tests", createTest);

// PATCH  /api/admin/tests/:testId
router.patch("/tests/:testId", updateTest);

// DELETE /api/admin/tests/:testId
router.delete("/tests/:testId", deleteTest);

export default router;
