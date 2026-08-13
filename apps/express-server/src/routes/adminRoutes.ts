// routes/adminRoutes.ts
import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { requireAdmin, requireSuperAdmin } from "../middlewares/authMiddleware";
import {
    getOverviewStats,
    getXpActivitySeries,
    getTestActivitySeries,
    getTestOverview,
    getQuestionStats,
    getAiUsageStats,
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
    getUserMonthlyStreakCalendar,
    updateUser,
    deleteUser,
    listVideos,
    createVideo,
    uploadVideo,
    uploadImage,
    updateVideo,
    deleteVideo,
    listQuestions,
    getQuestionById,
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
    listItemDefinitions,
    createItemDefinition,
    updateItemDefinition,
    deleteItemDefinition,
    listTiers,
    createTier,
    updateTier,
    deleteTier,
} from "../controllers/adminController";
import {
    listGoldPackagesAdmin,
    createGoldPackageAdmin,
    updateGoldPackageAdmin,
    deleteGoldPackageAdmin,
    listProPackagesAdmin,
    createProPackageAdmin,
    updateProPackageAdmin,
    deleteProPackageAdmin,
} from "../controllers/packageController";
import { listAllFeedbacks, updateFeedbackStatus } from "../controllers/feedbackController";

// Cấu hình lưu trữ file tạm của multer
const uploadDir = path.resolve(__dirname, "../../temp/uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
const upload = multer({
    dest: uploadDir,
    limits: {
        fileSize: 100 * 1024 * 1024, // 100MB max limit
    },
});

const router = Router();

// All admin routes require ADMIN or SUPER_ADMIN role
router.use(requireAdmin);

// ─── Overview Stats ───────────────────────────────────────────────────────────
// GET    /api/admin/stats
router.get("/stats", getOverviewStats);

// GET    /api/admin/stats/xp-activity?days=30
// Số user (distinct) nhận XP theo từng ngày.
router.get("/stats/xp-activity", getXpActivitySeries);

// GET    /api/admin/stats/test-activity?days=30
// Hoạt động làm bài theo ngày (đề thủ công vs tự động).
router.get("/stats/test-activity", getTestActivitySeries);

// GET    /api/admin/stats/test-overview?days=30
// KPI tổng quan làm bài trong N ngày.
router.get("/stats/test-overview", getTestOverview);

// GET    /api/admin/stats/question-stats?days=30&limit=10
// Top câu dễ sai + phân bố đúng/sai theo loại câu hỏi.
router.get("/stats/question-stats", getQuestionStats);

// GET    /api/admin/stats/ai-usage?days=30&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&userId=...
// Thống kê AI token usage và xếp hạng người dùng.
router.get("/stats/ai-usage", getAiUsageStats);


// ─── Feedback ─────────────────────────────────────────────────────────────────
// GET    /api/admin/feedback
router.get("/feedback", listAllFeedbacks);
// PATCH  /api/admin/feedback/:id
router.patch("/feedback/:id", updateFeedbackStatus);

// ─── Grade ────────────────────────────────────────────────────────────────────
// POST   /api/admin/grades
router.post("/grades", createGrade);

// PATCH  /api/admin/grades/:gradeId
router.patch("/grades/:gradeId", updateGrade);

// DELETE /api/admin/grades/:gradeId
router.delete("/grades/:gradeId", requireSuperAdmin, deleteGrade);

// ─── Topic ────────────────────────────────────────────────────────────────────
// POST   /api/admin/topics
router.post("/topics", createTopic);

// PATCH  /api/admin/topics/:topicId
router.patch("/topics/:topicId", updateTopic);

// DELETE /api/admin/topics/:topicId
router.delete("/topics/:topicId", requireSuperAdmin, deleteTopic);

// ─── Lesson ───────────────────────────────────────────────────────────────────
// POST   /api/admin/lessons
router.post("/lessons", createLesson);

// PATCH  /api/admin/lessons/:lessonId
router.patch("/lessons/:lessonId", updateLesson);

// DELETE /api/admin/lessons/:lessonId
router.delete("/lessons/:lessonId", requireSuperAdmin, deleteLesson);

// ─── Section ──────────────────────────────────────────────────────────────────
// POST   /api/admin/sections
router.post("/sections", createSection);

// PATCH  /api/admin/sections/:sectionId
router.patch("/sections/:sectionId", updateSection);

// DELETE /api/admin/sections/:sectionId
router.delete("/sections/:sectionId", requireSuperAdmin, deleteSection);

// ─── Node ─────────────────────────────────────────────────────────────────────
// POST   /api/admin/nodes
router.post("/nodes", createNode);

// PATCH  /api/admin/nodes/:nodeId
router.patch("/nodes/:nodeId", updateNode);

// DELETE /api/admin/nodes/:nodeId
router.delete("/nodes/:nodeId", requireSuperAdmin, deleteNode);

// ─── User ─────────────────────────────────────────────────────────────────────
// GET    /api/admin/users
router.get("/users", listUsers);

// GET    /api/admin/users/:userId/streak/calendar
router.get("/users/:userId/streak/calendar", getUserMonthlyStreakCalendar);

// PATCH  /api/admin/users/:userId
router.patch("/users/:userId", updateUser);

// DELETE /api/admin/users/:userId
router.delete("/users/:userId", requireSuperAdmin, deleteUser);

// ─── Video ────────────────────────────────────────────────────────────────────
// GET    /api/admin/videos
router.get("/videos", listVideos);

// POST   /api/admin/videos
router.post("/videos", createVideo);

// POST   /api/admin/videos/upload
router.post("/videos/upload", upload.single("video"), uploadVideo);

// POST   /api/admin/images/upload
router.post("/images/upload", upload.single("image"), uploadImage);

// PATCH  /api/admin/videos/:videoId
router.patch("/videos/:videoId", updateVideo);

// DELETE /api/admin/videos/:videoId
router.delete("/videos/:videoId", requireSuperAdmin, deleteVideo);

// ─── Question ─────────────────────────────────────────────────────────────────
// GET    /api/admin/questions
router.get("/questions", listQuestions);

// GET    /api/admin/questions/:questionId
router.get("/questions/:questionId", getQuestionById);

// POST   /api/admin/questions
router.post("/questions", createQuestion);

// PATCH  /api/admin/questions/:questionId
router.patch("/questions/:questionId", updateQuestion);

// DELETE /api/admin/questions/:questionId
router.delete("/questions/:questionId", requireSuperAdmin, deleteQuestion);

// ─── Test ─────────────────────────────────────────────────────────────────────
// GET    /api/admin/tests
router.get("/tests", listTests);

// POST   /api/admin/tests
router.post("/tests", createTest);

// PATCH  /api/admin/tests/:testId
router.patch("/tests/:testId", updateTest);

// DELETE /api/admin/tests/:testId
router.delete("/tests/:testId", requireSuperAdmin, deleteTest);

// ─── Flashcard ───────────────────────────────────────────────────────────────
// GET    /api/admin/flashcards
router.get("/flashcards", listFlashcards);

// POST   /api/admin/flashcards
router.post("/flashcards", createFlashcard);

// PATCH  /api/admin/flashcards/:flashcardId
router.patch("/flashcards/:flashcardId", updateFlashcard);

// DELETE /api/admin/flashcards/:flashcardId
router.delete("/flashcards/:flashcardId", requireSuperAdmin, deleteFlashcard);

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
router.delete("/test-presets/:id", requireSuperAdmin, deleteTestPreset);

// ─── Scope Test Preset Default ───────────────────────────────────────────────
// GET    /api/admin/scope-test-preset-defaults
router.get("/scope-test-preset-defaults", listScopeTestPresetDefaults);
// POST   /api/admin/scope-test-preset-defaults
router.post("/scope-test-preset-defaults", setScopeTestPresetDefault);
// DELETE /api/admin/scope-test-preset-defaults/:scopeType/:purposeType
router.delete("/scope-test-preset-defaults/:scopeType/:purposeType", requireSuperAdmin, deleteScopeTestPresetDefault);

// ─── Reward Rules ────────────────────────────────────────────────────────────
// GET    /api/admin/reward-rules
router.get("/reward-rules", listRewardRules);
// POST   /api/admin/reward-rules
router.post("/reward-rules", createRewardRule);
// PATCH  /api/admin/reward-rules/:id
router.patch("/reward-rules/:id", updateRewardRule);
// DELETE /api/admin/reward-rules/:id
router.delete("/reward-rules/:id", requireSuperAdmin, deleteRewardRule);

// ─── Item Definitions ─────────────────────────────────────────────────────────
// GET    /api/admin/item-definitions
router.get("/item-definitions", listItemDefinitions);
// POST   /api/admin/item-definitions
router.post("/item-definitions", createItemDefinition);
// PATCH  /api/admin/item-definitions/:id
router.patch("/item-definitions/:id", updateItemDefinition);
// DELETE /api/admin/item-definitions/:id
router.delete("/item-definitions/:id", requireSuperAdmin, deleteItemDefinition);

// ─── Tier ─────────────────────────────────────────────────────────────────────
// GET    /api/admin/tiers
router.get("/tiers", listTiers);
// POST   /api/admin/tiers
router.post("/tiers", createTier);
// PATCH  /api/admin/tiers/:index
router.patch("/tiers/:index", updateTier);
// DELETE /api/admin/tiers/:index
router.delete("/tiers/:index", requireSuperAdmin, deleteTier);

// ─── Packages (Gold & Pro) ───────────────────────────────────────────────────
// GET    /api/admin/packages/gold
router.get("/packages/gold", listGoldPackagesAdmin);
// POST   /api/admin/packages/gold
router.post("/packages/gold", createGoldPackageAdmin);
// PUT    /api/admin/packages/gold/:id
router.put("/packages/gold/:id", updateGoldPackageAdmin);
// DELETE /api/admin/packages/gold/:id
router.delete("/packages/gold/:id", requireSuperAdmin, deleteGoldPackageAdmin);

// GET    /api/admin/packages/pro
router.get("/packages/pro", listProPackagesAdmin);
// POST   /api/admin/packages/pro
router.post("/packages/pro", createProPackageAdmin);
// PUT    /api/admin/packages/pro/:id
router.put("/packages/pro/:id", updateProPackageAdmin);
// DELETE /api/admin/packages/pro/:id
router.delete("/packages/pro/:id", requireSuperAdmin, deleteProPackageAdmin);

export default router;


