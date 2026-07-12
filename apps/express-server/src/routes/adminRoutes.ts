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
    listFlashcards,
    createFlashcard,
    updateFlashcard,
    deleteFlashcard,
    bulkCreateFlashcards,
    bulkSaveMindMap,
    getAdminMindMap,
    generateAIContent,
    listTestPresets,
    createTestPreset,
    updateTestPreset,
    deleteTestPreset,
    listScopeTestPresetDefaults,
    setScopeTestPresetDefault,
    deleteScopeTestPresetDefault,
    listRewardRules,
    createRewardRule,
    updateRewardRule,
    deleteRewardRule,
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

// ─── Flashcard ───────────────────────────────────────────────────────────────
// GET    /api/admin/flashcards
router.get("/flashcards", listFlashcards);

// POST   /api/admin/flashcards
router.post("/flashcards", createFlashcard);

// PATCH  /api/admin/flashcards/:flashcardId
router.patch("/flashcards/:flashcardId", updateFlashcard);

// DELETE /api/admin/flashcards/:flashcardId
router.delete("/flashcards/:flashcardId", deleteFlashcard);

// POST   /api/admin/lessons/:lessonId/flashcards/bulk
router.post("/lessons/:lessonId/flashcards/bulk", bulkCreateFlashcards);

// ─── MindMap Bulk ────────────────────────────────────────────────────────────
// GET    /api/admin/lessons/:lessonId/mindmap
router.get("/lessons/:lessonId/mindmap", getAdminMindMap);

// POST   /api/admin/lessons/:lessonId/mindmap/bulk
router.post("/lessons/:lessonId/mindmap/bulk", bulkSaveMindMap);

// ─── AI Generate ─────────────────────────────────────────────────────────────
// POST   /api/admin/ai/generate
router.post("/ai/generate", generateAIContent);

// ─── Test Preset ───────────────────────────────────────────────────────────────
// GET    /api/admin/test-presets
router.get("/test-presets", listTestPresets);
// POST   /api/admin/test-presets
router.post("/test-presets", createTestPreset);
// PATCH  /api/admin/test-presets/:id
router.patch("/test-presets/:id", updateTestPreset);
// DELETE /api/admin/test-presets/:id
router.delete("/test-presets/:id", deleteTestPreset);

// ─── Scope Test Preset Default ───────────────────────────────────────────────
// GET    /api/admin/scope-test-preset-defaults
router.get("/scope-test-preset-defaults", listScopeTestPresetDefaults);
// POST   /api/admin/scope-test-preset-defaults
router.post("/scope-test-preset-defaults", setScopeTestPresetDefault);
// DELETE /api/admin/scope-test-preset-defaults/:scopeType/:purposeType
router.delete("/scope-test-preset-defaults/:scopeType/:purposeType", deleteScopeTestPresetDefault);

// ─── Reward Rules ────────────────────────────────────────────────────────────
// GET    /api/admin/reward-rules
router.get("/reward-rules", listRewardRules);
// POST   /api/admin/reward-rules
router.post("/reward-rules", createRewardRule);
// PATCH  /api/admin/reward-rules/:id
router.patch("/reward-rules/:id", updateRewardRule);
// DELETE /api/admin/reward-rules/:id
router.delete("/reward-rules/:id", deleteRewardRule);

export default router;
