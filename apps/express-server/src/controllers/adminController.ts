// controllers/adminController.ts
import { Request, Response } from "express";
import { adminService } from "../services/adminService";
import { prisma } from "@history-app/shared";
import { aiService } from "../services/aiService";
import { contentService } from "../services/contentService";
import { gamificationService } from "../services/gamificationService";
import fs from "fs";
import { videoProcessingService, activeTranscodes } from "../services/videoProcessingService";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { r2Client, R2_BUCKET_NAME, R2_PUBLIC_URL } from "../config/r2";
import crypto from "crypto";
import path from "path";
import {
    CreateGradeBody,
    UpdateGradeBody,
    AdminGradeResponse,
    CreateTopicBody,
    UpdateTopicBody,
    AdminTopicResponse,
    CreateLessonBody,
    UpdateLessonBody,
    AdminLessonResponse,
    CreateSectionBody,
    UpdateSectionBody,
    AdminSectionResponse,
    CreateNodeBody,
    UpdateNodeBody,
    AdminNodeResponse,
    DeleteResponse,
    UpdateUserBody,
    AdminUserDto,
    CreateVideoBody,
    UpdateVideoBody,
    AdminVideoDto,
    CreateQuestionBody,
    UpdateQuestionBody,
    AdminQuestionDto,
    CreateTestBody,
    UpdateTestBody,
    AdminTestDto,
    FlashcardDto,
    CreateFlashcardBody,
    UpdateFlashcardBody,
    AdminFlashcardResponse,
    AdminFlashcardsResponse,
    CreateRewardRuleBody,
    UpdateRewardRuleBody,
    RewardRuleDto,
    CreateItemDefinitionBody,
    UpdateItemDefinitionBody,
    CreateTierBody,
    UpdateTierBody,
    AdminTierDto,
} from "@history-app/shared";

// ─────────────────────────────── OVERVIEW STATS ───────────────────────────────

export const getOverviewStats = async (req: Request, res: Response) => {
    try {
        const stats = await adminService.getOverviewStats();
        return res.json(stats);
    } catch (err: any) {
        return res.status(500).json({ error: err.message || "Failed to fetch overview stats" });
    }
};

/**
 * GET /api/admin/stats/xp-activity?days=30
 * Trả về chuỗi số user (distinct) nhận XP theo từng ngày trong N ngày gần nhất.
 */
export const getXpActivitySeries = async (req: Request, res: Response) => {
    try {
        const days = Number(req.query.days) || 30;
        const series = await adminService.getXpActivitySeries(days);
        return res.json(series);
    } catch (err: any) {
        return res.status(500).json({ error: err.message || "Failed to fetch XP activity series" });
    }
};

/**
 * GET /api/admin/stats/test-activity?days=30
 * Hoạt động làm bài theo ngày: số lượt nộp bài + distinct user, phân tách
 * đề thủ công (test_id NOT NULL) vs đề tự động (test_id NULL).
 */
export const getTestActivitySeries = async (req: Request, res: Response) => {
    try {
        const days = Number(req.query.days) || 30;
        const series = await adminService.getTestActivitySeries(days);
        return res.json(series);
    } catch (err: any) {
        return res.status(500).json({ error: err.message || "Failed to fetch test activity series" });
    }
};

/**
 * GET /api/admin/stats/test-overview?days=30
 * KPI tổng quan làm bài trong N ngày: tổng lượt, user, đề thủ công/tự động,
 * pass/fail, điểm trung bình, tỷ lệ pass.
 */
export const getTestOverview = async (req: Request, res: Response) => {
    try {
        const days = Number(req.query.days) || 30;
        const overview = await adminService.getTestOverview(days);
        return res.json(overview);
    } catch (err: any) {
        return res.status(500).json({ error: err.message || "Failed to fetch test overview" });
    }
};

/**
 * GET /api/admin/stats/question-stats?days=30&limit=10
 * Thống kê câu hỏi: top câu dễ sai + phân bố đúng/sai theo loại (CHOOSE/FILL/MATCH).
 */
export const getQuestionStats = async (req: Request, res: Response) => {
    try {
        const days = Number(req.query.days) || 30;
        const limit = Number(req.query.limit) || 10;
        const stats = await adminService.getQuestionStats(days, limit);
        return res.json(stats);
    } catch (err: any) {
        return res.status(500).json({ error: err.message || "Failed to fetch question stats" });
    }
};

// ─────────────────────────────── GRADE ────────────────────────────────────────

export const createGrade = async (
    req: Request<{}, AdminGradeResponse, CreateGradeBody>,
    res: Response<AdminGradeResponse>,
) => {
    try {
        const { id, state, isPro } = req.body;
        if (id === undefined || typeof id !== "number") {
            return res.status(400).json({ error: "id (number) is required." });
        }
        const grade = await adminService.createGrade({ id, state, isPro });
        return res.status(201).json(grade);
    } catch (err: any) {
        if (err.code === "P2002") {
            return res.status(409).json({ error: "Grade with this id already exists." });
        }
        console.error("Create grade error:", err);
        return res.status(500).json({ error: "Failed to create grade." });
    }
};

export const updateGrade = async (
    req: Request<{ gradeId: string }, AdminGradeResponse, UpdateGradeBody>,
    res: Response<AdminGradeResponse>,
) => {
    try {
        const gradeId = Number(req.params.gradeId);
        if (Number.isNaN(gradeId)) return res.status(400).json({ error: "Invalid gradeId." });

        const grade = await adminService.updateGrade(gradeId, req.body);
        if (!grade) return res.status(404).json({ error: "Grade not found." });
        return res.status(200).json(grade);
    } catch (err) {
        console.error("Update grade error:", err);
        return res.status(500).json({ error: "Failed to update grade." });
    }
};

export const deleteGrade = async (
    req: Request<{ gradeId: string }, DeleteResponse, {}>,
    res: Response<DeleteResponse>,
) => {
    try {
        const gradeId = Number(req.params.gradeId);
        if (Number.isNaN(gradeId)) return res.status(400).json({ error: "Invalid gradeId." });

        const deleted = await adminService.deleteGrade(gradeId);
        if (!deleted) return res.status(404).json({ error: "Grade not found." });
        return res.status(200).json({ message: `Grade ${gradeId} deleted successfully.` });
    } catch (err) {
        console.error("Delete grade error:", err);
        return res.status(500).json({ error: "Failed to delete grade." });
    }
};

// ─────────────────────────────── TOPIC ────────────────────────────────────────

export const createTopic = async (
    req: Request<{}, AdminTopicResponse, CreateTopicBody>,
    res: Response<AdminTopicResponse>,
) => {
    try {
        const { name, position, gradeId } = req.body;
        if (!name || position === undefined || !gradeId) {
            return res.status(400).json({ error: "name, position, and gradeId are required." });
        }
        const topic = await adminService.createTopic({ name, position, gradeId });
        return res.status(201).json(topic);
    } catch (err: any) {
        if (err.code === "P2003") {
            return res.status(400).json({ error: "gradeId does not exist." });
        }
        console.error("Create topic error:", err);
        return res.status(500).json({ error: "Failed to create topic." });
    }
};

export const updateTopic = async (
    req: Request<{ topicId: string }, AdminTopicResponse, UpdateTopicBody>,
    res: Response<AdminTopicResponse>,
) => {
    try {
        const topicId = Number(req.params.topicId);
        if (Number.isNaN(topicId)) return res.status(400).json({ error: "Invalid topicId." });

        const topic = await adminService.updateTopic(topicId, req.body);
        if (!topic) return res.status(404).json({ error: "Topic not found." });
        return res.status(200).json(topic);
    } catch (err) {
        console.error("Update topic error:", err);
        return res.status(500).json({ error: "Failed to update topic." });
    }
};

export const deleteTopic = async (
    req: Request<{ topicId: string }, DeleteResponse, {}>,
    res: Response<DeleteResponse>,
) => {
    try {
        const topicId = Number(req.params.topicId);
        if (Number.isNaN(topicId)) return res.status(400).json({ error: "Invalid topicId." });

        const deleted = await adminService.deleteTopic(topicId);
        if (!deleted) return res.status(404).json({ error: "Topic not found." });
        return res.status(200).json({ message: `Topic ${topicId} deleted successfully.` });
    } catch (err) {
        console.error("Delete topic error:", err);
        return res.status(500).json({ error: "Failed to delete topic." });
    }
};

// ─────────────────────────────── LESSON ───────────────────────────────────────

export const createLesson = async (
    req: Request<{}, AdminLessonResponse, CreateLessonBody>,
    res: Response<AdminLessonResponse>,
) => {
    try {
        const { name, position, topicId, summary, isPro } = req.body;
        if (!name || position === undefined || !topicId) {
            return res.status(400).json({ error: "name, position, and topicId are required." });
        }
        const lesson = await adminService.createLesson({ name, summary, position, topicId, isPro });
        return res.status(201).json(lesson);
    } catch (err: any) {
        if (err.code === "P2003") {
            return res.status(400).json({ error: "topicId does not exist." });
        }
        console.error("Create lesson error:", err);
        return res.status(500).json({ error: "Failed to create lesson." });
    }
};

export const updateLesson = async (
    req: Request<{ lessonId: string }, AdminLessonResponse, UpdateLessonBody>,
    res: Response<AdminLessonResponse>,
) => {
    try {
        const lessonId = Number(req.params.lessonId);
        if (Number.isNaN(lessonId)) return res.status(400).json({ error: "Invalid lessonId." });

        const lesson = await adminService.updateLesson(lessonId, req.body);
        if (!lesson) return res.status(404).json({ error: "Lesson not found." });
        return res.status(200).json(lesson);
    } catch (err) {
        console.error("Update lesson error:", err);
        return res.status(500).json({ error: "Failed to update lesson." });
    }
};

export const deleteLesson = async (
    req: Request<{ lessonId: string }, DeleteResponse, {}>,
    res: Response<DeleteResponse>,
) => {
    try {
        const lessonId = Number(req.params.lessonId);
        if (Number.isNaN(lessonId)) return res.status(400).json({ error: "Invalid lessonId." });

        const deleted = await adminService.deleteLesson(lessonId);
        if (!deleted) return res.status(404).json({ error: "Lesson not found." });
        return res.status(200).json({ message: `Lesson ${lessonId} deleted successfully.` });
    } catch (err) {
        console.error("Delete lesson error:", err);
        return res.status(500).json({ error: "Failed to delete lesson." });
    }
};

// ─────────────────────────────── SECTION ──────────────────────────────────────

export const createSection = async (
    req: Request<{}, AdminSectionResponse, CreateSectionBody>,
    res: Response<AdminSectionResponse>,
) => {
    try {
        const { name, position, lessonId, summary, parentSectionId } = req.body;
        if (!name || position === undefined || !lessonId) {
            return res.status(400).json({ error: "name, position, and lessonId are required." });
        }
        const section = await adminService.createSection({
            name,
            summary,
            position,
            lessonId,
            parentSectionId,
        });
        return res.status(201).json(section);
    } catch (err: any) {
        if (err.code === "P2003") {
            return res.status(400).json({ error: "lessonId or parentSectionId does not exist." });
        }
        console.error("Create section error:", err);
        return res.status(500).json({ error: "Failed to create section." });
    }
};

export const updateSection = async (
    req: Request<{ sectionId: string }, AdminSectionResponse, UpdateSectionBody>,
    res: Response<AdminSectionResponse>,
) => {
    try {
        const sectionId = Number(req.params.sectionId);
        if (Number.isNaN(sectionId)) return res.status(400).json({ error: "Invalid sectionId." });

        const section = await adminService.updateSection(sectionId, req.body);
        if (!section) return res.status(404).json({ error: "Section not found." });
        return res.status(200).json(section);
    } catch (err) {
        console.error("Update section error:", err);
        return res.status(500).json({ error: "Failed to update section." });
    }
};

export const deleteSection = async (
    req: Request<{ sectionId: string }, DeleteResponse, {}>,
    res: Response<DeleteResponse>,
) => {
    try {
        const sectionId = Number(req.params.sectionId);
        if (Number.isNaN(sectionId)) return res.status(400).json({ error: "Invalid sectionId." });

        const deleted = await adminService.deleteSection(sectionId);
        if (!deleted) return res.status(404).json({ error: "Section not found." });
        return res.status(200).json({ message: `Section ${sectionId} deleted successfully.` });
    } catch (err) {
        console.error("Delete section error:", err);
        return res.status(500).json({ error: "Failed to delete section." });
    }
};

// ─────────────────────────────── NODE ─────────────────────────────────────────

export const createNode = async (
    req: Request<{}, AdminNodeResponse, CreateNodeBody>,
    res: Response<AdminNodeResponse>,
) => {
    try {
        const { position, body, sectionId, header, imgUrl, videoId } = req.body;
        if (!body || position === undefined || !sectionId) {
            return res.status(400).json({ error: "body, position, and sectionId are required." });
        }
        const node = await adminService.createNode({ position, header, body, imgUrl, sectionId, videoId });
        return res.status(201).json(node);
    } catch (err: any) {
        if (err.code === "P2003") {
            return res.status(400).json({ error: "sectionId does not exist." });
        }
        console.error("Create node error:", err);
        return res.status(500).json({ error: "Failed to create node." });
    }
};

export const updateNode = async (
    req: Request<{ nodeId: string }, AdminNodeResponse, UpdateNodeBody>,
    res: Response<AdminNodeResponse>,
) => {
    try {
        const nodeId = Number(req.params.nodeId);
        if (Number.isNaN(nodeId)) return res.status(400).json({ error: "Invalid nodeId." });

        const node = await adminService.updateNode(nodeId, req.body);
        if (!node) return res.status(404).json({ error: "Node not found." });
        return res.status(200).json(node);
    } catch (err) {
        console.error("Update node error:", err);
        return res.status(500).json({ error: "Failed to update node." });
    }
};

export const deleteNode = async (
    req: Request<{ nodeId: string }, DeleteResponse, {}>,
    res: Response<DeleteResponse>,
) => {
    try {
        const nodeId = Number(req.params.nodeId);
        if (Number.isNaN(nodeId)) return res.status(400).json({ error: "Invalid nodeId." });

        const deleted = await adminService.deleteNode(nodeId);
        if (!deleted) return res.status(404).json({ error: "Node not found." });
        return res.status(200).json({ message: `Node ${nodeId} deleted successfully.` });
    } catch (err) {
        console.error("Delete node error:", err);
        return res.status(500).json({ error: "Failed to delete node." });
    }
};

// ─────────────────────────────── USER ─────────────────────────────────────────

export const listUsers = async (req: Request, res: Response) => {
    try {
        const search = req.query.search as string | undefined;
        const role = req.query.role as string | undefined;
        const users = await adminService.listUsers(search, role);
        return res.status(200).json({ users });
    } catch (err) {
        console.error("List users error:", err);
        return res.status(500).json({ error: "Failed to list users." });
    }
};

export const getUserMonthlyStreakCalendar = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const now = new Date();
        const year = Number(req.query.year) || now.getFullYear();
        const month = Number(req.query.month) || (now.getMonth() + 1);

        const calendarData = await gamificationService.getMonthlyStreakCalendar(userId, year, month);
        return res.status(200).json(calendarData);
    } catch (err) {
        console.error("Fetch user monthly streak calendar error:", err);
        return res.status(500).json({ error: "Failed to fetch monthly streak calendar." });
    }
};

export const updateUser = async (req: Request<{ userId: string }, any, UpdateUserBody>, res: Response) => {
    try {
        const { userId } = req.params;
        if (req.body.role !== undefined && req.user?.role !== "SUPER_ADMIN") {
            return res.status(403).json({ error: "Access forbidden. Only SUPER_ADMIN can change user roles." });
        }
        const user = await adminService.updateUser(userId, req.body);
        if (!user) return res.status(404).json({ error: "User not found." });
        return res.status(200).json(user);
    } catch (err) {
        console.error("Update user error:", err);
        return res.status(500).json({ error: "Failed to update user." });
    }
};

export const deleteUser = async (req: Request<{ userId: string }>, res: Response) => {
    return res.status(403).json({ error: "User deletion is disabled for all roles. Hide user account instead." });
};

// ─────────────────────────────── VIDEO ────────────────────────────────────────

export const listVideos = async (req: Request, res: Response) => {
    try {
        const lessonId = req.query.lessonId ? Number(req.query.lessonId) : undefined;
        if (lessonId !== undefined && Number.isNaN(lessonId)) {
            return res.status(400).json({ error: "Invalid lessonId query parameter." });
        }
        const videos = await adminService.listVideos(lessonId);
        
        // Chèn thêm tiến độ transcode từ in-memory map vào response trả về
        const videosWithProgress = videos.map(v => ({
            ...v,
            transcodeProgress: activeTranscodes.get(v.id) ?? null
        }));

        return res.status(200).json({ videos: videosWithProgress });
    } catch (err) {
        console.error("List videos error:", err);
        return res.status(500).json({ error: "Failed to list videos." });
    }
};

export const createVideo = async (req: Request<{}, any, CreateVideoBody>, res: Response) => {
    try {
        const { title, hlsUrl } = req.body;
        if (!title || !hlsUrl) {
            return res.status(400).json({ error: "title and hlsUrl are required." });
        }
        const video = await adminService.createVideo(req.body);
        return res.status(201).json(video);
    } catch (err: any) {
        if (err.code === "P2003") {
            return res.status(400).json({ error: "lessonId does not exist." });
        }
        console.error("Create video error:", err);
        return res.status(500).json({ error: "Failed to create video." });
    }
};

export const uploadVideo = async (req: Request, res: Response) => {
    try {
        const file = req.file;
        if (!file) {
            return res.status(400).json({ error: "No video file provided." });
        }

        const { title, summary } = req.body;
        const position = req.body.position !== undefined ? Number(req.body.position) : 0;
        const lessonId = req.body.lessonId !== undefined ? Number(req.body.lessonId) : null;

        if (!title || lessonId === null || Number.isNaN(lessonId)) {
            if (fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
            }
            return res.status(400).json({ error: "title and lessonId are required." });
        }

        // Tạo bản ghi Video trong DB với trạng thái PROCESSING
        const video = await prisma.video.create({
            data: {
                title,
                position: Number.isNaN(position) ? 0 : position,
                summary: summary || null,
                hlsUrl: "processing", // Sẽ cập nhật sau khi transcode xong
                lessonId,
                status: "PROCESSING",
            },
        });

        // Chạy FFmpeg và upload R2 ngầm ở background
        videoProcessingService
            .processVideoInBackground(video.id, file.path, title)
            .catch((bgErr) => {
                console.error(`Background processing trigger failed for video ${video.id}:`, bgErr);
            });

        return res.status(201).json({
            id: video.id,
            title: video.title,
            position: video.position,
            summary: video.summary ?? null,
            hlsUrl: video.hlsUrl,
            status: video.status,
            lessonId: video.lessonId,
        });

    } catch (err: any) {
        if (req.file && fs.existsSync(req.file.path)) {
            try {
                fs.unlinkSync(req.file.path);
            } catch {}
        }
        console.error("Upload video error:", err);
        return res.status(500).json({ error: "Failed to upload video." });
    }
};

export const updateVideo = async (req: Request<{ videoId: string }, any, UpdateVideoBody>, res: Response) => {
    try {
        const { videoId } = req.params;
        const video = await adminService.updateVideo(videoId, req.body);
        if (!video) return res.status(404).json({ error: "Video not found." });
        return res.status(200).json(video);
    } catch (err) {
        console.error("Update video error:", err);
        return res.status(500).json({ error: "Failed to update video." });
    }
};

export const deleteVideo = async (req: Request<{ videoId: string }>, res: Response) => {
    try {
        const { videoId } = req.params;
        const deleted = await adminService.deleteVideo(videoId);
        if (!deleted) return res.status(404).json({ error: "Video not found." });
        return res.status(200).json({ message: "Video deleted successfully." });
    } catch (err) {
        console.error("Delete video error:", err);
        return res.status(500).json({ error: "Failed to delete video." });
    }
};

// ─────────────────────────────── QUESTION ─────────────────────────────────────

export const listQuestions = async (req: Request, res: Response) => {
    try {
        const gradeId = req.query.gradeId ? Number(req.query.gradeId) : undefined;
        const topicId = req.query.topicId ? Number(req.query.topicId) : undefined;
        const lessonId = req.query.lessonId ? Number(req.query.lessonId) : undefined;
        const sectionId = req.query.sectionId ? Number(req.query.sectionId) : undefined;
        const nodeId = req.query.nodeId ? Number(req.query.nodeId) : undefined;
        const scopeId = req.query.scopeId ? Number(req.query.scopeId) : undefined;
        const scopeType = req.query.scopeType as string | undefined;
        const type = req.query.type as string | undefined;

        const questions = await adminService.listQuestions(
            gradeId,
            topicId,
            lessonId,
            sectionId,
            nodeId,
            type,
            scopeId,
            scopeType
        );
        return res.status(200).json({ questions });
    } catch (err) {
        console.error("List questions error:", err);
        return res.status(500).json({ error: "Failed to list questions." });
    }
};

export const createQuestion = async (req: Request<{}, any, CreateQuestionBody>, res: Response) => {
    try {
        const { type, difficulty, promptText, answerDataJson } = req.body;
        if (!type || difficulty === undefined || !promptText || !answerDataJson) {
            return res.status(400).json({ error: "type, difficulty, promptText, and answerDataJson are required." });
        }
        const question = await adminService.createQuestion(req.body);
        return res.status(201).json(question);
    } catch (err) {
        console.error("Create question error:", err);
        return res.status(500).json({ error: "Failed to create question." });
    }
};

export const updateQuestion = async (req: Request<{ questionId: string }, any, UpdateQuestionBody>, res: Response) => {
    try {
        const questionId = Number(req.params.questionId);
        if (Number.isNaN(questionId)) return res.status(400).json({ error: "Invalid questionId." });

        const question = await adminService.updateQuestion(questionId, req.body);
        if (!question) return res.status(404).json({ error: "Question not found." });
        return res.status(200).json(question);
    } catch (err) {
        console.error("Update question error:", err);
        return res.status(500).json({ error: "Failed to update question." });
    }
};

export const deleteQuestion = async (req: Request<{ questionId: string }>, res: Response) => {
    try {
        const questionId = Number(req.params.questionId);
        if (Number.isNaN(questionId)) return res.status(400).json({ error: "Invalid questionId." });

        const deleted = await adminService.deleteQuestion(questionId);
        if (!deleted) return res.status(404).json({ error: "Question not found." });
        return res.status(200).json({ message: "Question deleted successfully." });
    } catch (err) {
        console.error("Delete question error:", err);
        return res.status(500).json({ error: "Failed to delete question." });
    }
};

// ─────────────────────────────── TEST ─────────────────────────────────────────

export const listTests = async (req: Request, res: Response) => {
    try {
        const tests = await adminService.listTests();
        return res.status(200).json({ tests });
    } catch (err) {
        console.error("List tests error:", err);
        return res.status(500).json({ error: "Failed to list tests." });
    }
};

export const createTest = async (req: Request<{}, any, CreateTestBody>, res: Response) => {
    try {
        const { title } = req.body;
        if (!title) {
            return res.status(400).json({ error: "title is required." });
        }
        const test = await adminService.createTest(req.body);
        return res.status(201).json(test);
    } catch (err) {
        console.error("Create test error:", err);
        return res.status(500).json({ error: "Failed to create test." });
    }
};

export const updateTest = async (req: Request<{ testId: string }, any, UpdateTestBody>, res: Response) => {
    try {
        const { testId } = req.params;
        const test = await adminService.updateTest(testId, req.body);
        if (!test) return res.status(404).json({ error: "Test not found." });
        return res.status(200).json(test);
    } catch (err) {
        console.error("Update test error:", err);
        return res.status(500).json({ error: "Failed to update test." });
    }
};

export const deleteTest = async (req: Request<{ testId: string }>, res: Response) => {
    try {
        const { testId } = req.params;
        const deleted = await adminService.deleteTest(testId);
        if (!deleted) return res.status(404).json({ error: "Test not found." });
        return res.status(200).json({ message: "Test deleted successfully." });
    } catch (err) {
        console.error("Delete test error:", err);
        return res.status(500).json({ error: "Failed to delete test." });
    }
};

// ─────────────────────────────── FLASHCARD ────────────────────────────────────

export const listFlashcards = async (req: Request, res: Response) => {
    try {
        const lessonId = req.query.lessonId ? Number(req.query.lessonId) : undefined;
        if (lessonId !== undefined && Number.isNaN(lessonId)) {
            return res.status(400).json({ error: "Invalid lessonId query parameter." });
        }
        const flashcards = await adminService.listFlashcards(lessonId);
        return res.status(200).json({ flashcards });
    } catch (err) {
        console.error("List flashcards error:", err);
        return res.status(500).json({ error: "Failed to list flashcards." });
    }
};

export const createFlashcard = async (req: Request<{}, any, CreateFlashcardBody>, res: Response) => {
    try {
        const { frontText, backText, lessonId, sectionId, nodeId } = req.body;
        if (!frontText || !backText) {
            return res.status(400).json({ error: "frontText and backText are required." });
        }
        const flashcard = await adminService.createFlashcard(req.body);
        return res.status(201).json(flashcard);
    } catch (err: any) {
        console.error("Create flashcard error:", err);
        return res.status(400).json({ error: err.message || "Failed to create flashcard." });
    }
};

export const updateFlashcard = async (req: Request<{ flashcardId: string }, any, UpdateFlashcardBody>, res: Response) => {
    try {
        const flashcardId = Number(req.params.flashcardId);
        if (Number.isNaN(flashcardId)) {
            return res.status(400).json({ error: "Invalid flashcardId." });
        }
        const flashcard = await adminService.updateFlashcard(flashcardId, req.body);
        if (!flashcard) return res.status(404).json({ error: "Flashcard not found." });
        return res.status(200).json(flashcard);
    } catch (err: any) {
        console.error("Update flashcard error:", err);
        return res.status(400).json({ error: err.message || "Failed to update flashcard." });
    }
};

export const deleteFlashcard = async (req: Request<{ flashcardId: string }>, res: Response) => {
    try {
        const flashcardId = Number(req.params.flashcardId);
        if (Number.isNaN(flashcardId)) {
            return res.status(400).json({ error: "Invalid flashcardId." });
        }
        const deleted = await adminService.deleteFlashcard(flashcardId);
        if (!deleted) return res.status(404).json({ error: "Flashcard not found." });
        return res.status(200).json({ message: "Flashcard deleted successfully." });
    } catch (err) {
        console.error("Delete flashcard error:", err);
        return res.status(500).json({ error: "Failed to delete flashcard." });
    }
};

export const bulkCreateFlashcards = async (req: Request<{ lessonId: string }, any, { flashcards: { frontText: string; backText: string }[] }>, res: Response) => {
    try {
        const lessonId = Number(req.params.lessonId);
        const { flashcards } = req.body;
        if (Number.isNaN(lessonId)) {
            return res.status(400).json({ error: "Invalid lessonId." });
        }
        if (!flashcards || !Array.isArray(flashcards)) {
            return res.status(400).json({ error: "flashcards array is required." });
        }
        await adminService.bulkCreateFlashcards(lessonId, flashcards);
        return res.status(200).json({ message: "Bulk flashcards created successfully." });
    } catch (err: any) {
        console.error("Bulk create flashcards error:", err);
        return res.status(500).json({ error: err.message || "Failed to bulk create flashcards." });
    }
};

// ─────────────────────────────── MINDMAP BULK ──────────────────────────────────

async function saveSectionsRecursively(
    tx: any,
    lessonId: number,
    sections: any[],
    parentSectionId: number | null = null
) {
    for (const sec of sections) {
        const createdSection = await tx.section.create({
            data: {
                name: sec.name,
                summary: sec.summary || null,
                position: sec.position || 1,
                lessonId,
                parentSectionId,
            },
        });

        if (sec.nodes && Array.isArray(sec.nodes)) {
            for (const node of sec.nodes) {
                await tx.node.create({
                    data: {
                        position: node.position || 1,
                        header: node.header || null,
                        body: node.body || "",
                        imgUrl: node.imgUrl || null,
                        sectionId: createdSection.id,
                    },
                });
            }
        }

        if (sec.children && Array.isArray(sec.children)) {
            await saveSectionsRecursively(tx, lessonId, sec.children, createdSection.id);
        }
    }
}

export const bulkSaveMindMap = async (req: Request<{ lessonId: string }, any, { sections: any[] }>, res: Response) => {
    try {
        const lessonId = Number(req.params.lessonId);
        const { sections } = req.body;

        if (Number.isNaN(lessonId)) {
            return res.status(400).json({ error: "Invalid lessonId." });
        }
        if (!sections || !Array.isArray(sections)) {
            return res.status(400).json({ error: "sections array is required." });
        }

        // Ensure all sections and nodes have unique IDs before saving
        let idCounter = Date.now();
        const ensureIds = (secs: any[]) => {
            for (const s of secs) {
                if (!s.id) {
                    s.id = idCounter++;
                }
                if (s.nodes && Array.isArray(s.nodes)) {
                    for (const n of s.nodes) {
                        if (!n.id) {
                            n.id = idCounter++;
                        }
                    }
                }
                if (s.children && Array.isArray(s.children)) {
                    ensureIds(s.children);
                }
            }
        };
        ensureIds(sections);

        // Save directly to MindMap table
        await prisma.mindMap.upsert({
            where: { lessonId },
            update: { data: { sections } as any },
            create: { lessonId, data: { sections } as any },
        });

        return res.status(200).json({ message: "Mind map saved successfully." });
    } catch (err) {
        console.error("Bulk save mind map error:", err);
        return res.status(500).json({ error: "Failed to save mind map in bulk." });
    }
};

export const getAdminMindMap = async (req: Request<{ lessonId: string }>, res: Response) => {
    try {
        const lessonId = Number(req.params.lessonId);
        if (Number.isNaN(lessonId)) return res.status(400).json({ error: "Invalid lessonId." });

        const mindMap = await prisma.mindMap.findUnique({
            where: { lessonId },
        });

        if (mindMap) {
            const rawData = mindMap.data as any;
            if (rawData && Array.isArray(rawData.sections)) {
                // Ensure legacy data gets IDs on the fly
                let idCounter = Date.now();
                const ensureIds = (secs: any[]) => {
                    for (const s of secs) {
                        if (!s.id) {
                            s.id = idCounter++;
                        }
                        if (s.nodes && Array.isArray(s.nodes)) {
                            for (const n of s.nodes) {
                                if (!n.id) {
                                    n.id = idCounter++;
                                }
                            }
                        }
                        if (s.children && Array.isArray(s.children)) {
                            ensureIds(s.children);
                        }
                    }
                };
                ensureIds(rawData.sections);

                return res.status(200).json({
                    id: lessonId,
                    sections: rawData.sections
                });
            }
        }

        // Fallback to generating from current lesson content (Section & Node tables)
        const defaultTree = await contentService.getLessonTree(lessonId);
        return res.status(200).json({
            id: lessonId,
            name: defaultTree?.name || "",
            sections: defaultTree?.sections ?? []
        });
    } catch (err) {
        console.error("Get admin mind map error:", err);
        return res.status(500).json({ error: "Failed to get mind map." });
    }
};

// ─────────────────────────────── AI GENERATE ───────────────────────────────────

export const generateAIContent = async (req: Request<{}, any, { type: "mindmap" | "flashcards"; text: string }>, res: Response) => {
    try {
        const { type, text } = req.body;
        if (!type || !text) {
            return res.status(400).json({ error: "type and text are required." });
        }

        if (type === "mindmap") {
            const data = await aiService.generateMindMap(text);
            return res.status(200).json(data);
        } else if (type === "flashcards") {
            const data = await aiService.generateFlashcards(text);
            return res.status(200).json(data);
        } else {
            return res.status(400).json({ error: "Invalid type. Must be 'mindmap' or 'flashcards'." });
        }
    } catch (err: any) {
        console.error("AI Generation error:", err);
        return res.status(500).json({ error: err.message || "Failed to generate content using AI." });
    }
};

// ─────────────────────────────── TEST PRESET ───────────────────────────────────

export const listTestPresets = async (req: Request, res: Response) => {
    try {
        const presets = await adminService.listTestPresets();
        return res.status(200).json({ presets });
    } catch (err) {
        console.error("List test presets error:", err);
        return res.status(500).json({ error: "Failed to list test presets." });
    }
};

export const createTestPreset = async (req: Request, res: Response) => {
    try {
        const { name, purposeType } = req.body;
        if (!name || !purposeType) {
            return res.status(400).json({ error: "name and purposeType are required." });
        }
        const preset = await adminService.createTestPreset(req.body);
        return res.status(201).json(preset);
    } catch (err) {
        console.error("Create test preset error:", err);
        return res.status(500).json({ error: "Failed to create test preset." });
    }
};

export const updateTestPreset = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const preset = await adminService.updateTestPreset(id, req.body);
        if (!preset) return res.status(404).json({ error: "Test preset not found." });
        return res.status(200).json(preset);
    } catch (err) {
        console.error("Update test preset error:", err);
        return res.status(500).json({ error: "Failed to update test preset." });
    }
};

export const deleteTestPreset = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const deleted = await adminService.deleteTestPreset(id);
        if (!deleted) return res.status(404).json({ error: "Test preset not found." });
        return res.status(200).json({ message: "Test preset deleted successfully." });
    } catch (err) {
        console.error("Delete test preset error:", err);
        return res.status(500).json({ error: "Failed to delete test preset." });
    }
};

// ─────────────────────────────── SCOPE TEST PRESET DEFAULT ──────────────────────

export const listScopeTestPresetDefaults = async (req: Request, res: Response) => {
    try {
        const defaults = await adminService.listScopeTestPresetDefaults();
        return res.status(200).json({ defaults });
    } catch (err) {
        console.error("List scope test preset defaults error:", err);
        return res.status(500).json({ error: "Failed to list defaults." });
    }
};

export const setScopeTestPresetDefault = async (req: Request, res: Response) => {
    try {
        const { scopeType, purposeType, defaultTestPresetId } = req.body;
        if (!scopeType || !purposeType || !defaultTestPresetId) {
            return res.status(400).json({ error: "scopeType, purposeType, and defaultTestPresetId are required." });
        }
        const defaultPreset = await adminService.setScopeTestPresetDefault(req.body);
        return res.status(200).json(defaultPreset);
    } catch (err) {
        console.error("Set scope test preset default error:", err);
        return res.status(500).json({ error: "Failed to set default." });
    }
};

export const deleteScopeTestPresetDefault = async (req: Request, res: Response) => {
    try {
        const { scopeType, purposeType } = req.params;
        if (!scopeType || !purposeType) {
            return res.status(400).json({ error: "scopeType and purposeType are required params." });
        }
        const deleted = await adminService.deleteScopeTestPresetDefault(scopeType, purposeType);
        if (!deleted) return res.status(404).json({ error: "Mapping not found." });
        return res.status(200).json({ message: "Mapping deleted successfully." });
    } catch (err) {
        console.error("Delete scope test preset default error:", err);
        return res.status(500).json({ error: "Failed to delete default." });
    }
};

// ─────────────────────────────── REWARD RULE ───────────────────────────────────

export const listRewardRules = async (req: Request, res: Response) => {
    try {
        const rules = await adminService.listRewardRules();
        return res.status(200).json({ rules });
    } catch (err) {
        console.error("List reward rules error:", err);
        return res.status(500).json({ error: "Failed to list reward rules." });
    }
};

export const createRewardRule = async (
    req: Request<{}, any, CreateRewardRuleBody>,
    res: Response,
) => {
    try {
        const { triggerType, triggerTimeMin } = req.body;
        if (!triggerType || triggerTimeMin === undefined) {
            return res.status(400).json({ error: "triggerType and triggerTimeMin are required." });
        }
        const rule = await adminService.createRewardRule(req.body);
        return res.status(201).json(rule);
    } catch (err: any) {
        if (err.code === "P2002") {
            return res.status(409).json({ error: "A reward rule with this exact trigger configuration already exists." });
        }
        console.error("Create reward rule error:", err);
        return res.status(500).json({ error: "Failed to create reward rule." });
    }
};

export const updateRewardRule = async (
    req: Request<{ id: string }, any, UpdateRewardRuleBody>,
    res: Response,
) => {
    try {
        const id = Number(req.params.id);
        if (Number.isNaN(id)) {
            return res.status(400).json({ error: "Invalid reward rule ID." });
        }
        const rule = await adminService.updateRewardRule(id, req.body);
        if (!rule) return res.status(404).json({ error: "Reward rule not found." });
        return res.status(200).json(rule);
    } catch (err: any) {
        if (err.code === "P2002") {
            return res.status(409).json({ error: "A reward rule with this exact trigger configuration already exists." });
        }
        console.error("Update reward rule error:", err);
        return res.status(500).json({ error: "Failed to update reward rule." });
    }
};

export const deleteRewardRule = async (req: Request<{ id: string }>, res: Response) => {
    try {
        const id = Number(req.params.id);
        if (Number.isNaN(id)) {
            return res.status(400).json({ error: "Invalid reward rule ID." });
        }
        const deleted = await adminService.deleteRewardRule(id);
        if (!deleted) return res.status(404).json({ error: "Reward rule not found." });
        return res.status(200).json({ message: "Reward rule deleted successfully." });
    } catch (err) {
        console.error("Delete reward rule error:", err);
        return res.status(500).json({ error: "Failed to delete reward rule." });
    }
};

// ─────────────────────────────── ITEM DEFINITIONS ──────────────────────────────

export const listItemDefinitions = async (req: Request, res: Response) => {
    try {
        const items = await adminService.listItemDefinitions();
        return res.status(200).json({ items });
    } catch (err) {
        console.error("List item definitions error:", err);
        return res.status(500).json({ error: "Failed to list item definitions." });
    }
};

export const createItemDefinition = async (req: Request<{}, any, CreateItemDefinitionBody>, res: Response) => {
    try {
        const { name, itemType } = req.body;
        if (!name || !itemType) {
            return res.status(400).json({ error: "name and itemType are required." });
        }
        const item = await adminService.createItemDefinition(req.body);
        return res.status(201).json(item);
    } catch (err) {
        console.error("Create item definition error:", err);
        return res.status(500).json({ error: "Failed to create item definition." });
    }
};

export const updateItemDefinition = async (req: Request<{ id: string }, any, UpdateItemDefinitionBody>, res: Response) => {
    try {
        const id = Number(req.params.id);
        if (Number.isNaN(id)) {
            return res.status(400).json({ error: "Invalid item definition ID." });
        }
        const item = await adminService.updateItemDefinition(id, req.body);
        if (!item) return res.status(404).json({ error: "Item definition not found." });
        return res.status(200).json(item);
    } catch (err) {
        console.error("Update item definition error:", err);
        return res.status(500).json({ error: "Failed to update item definition." });
    }
};

export const deleteItemDefinition = async (req: Request<{ id: string }>, res: Response) => {
    try {
        const id = Number(req.params.id);
        if (Number.isNaN(id)) {
            return res.status(400).json({ error: "Invalid item definition ID." });
        }
        const deleted = await adminService.deleteItemDefinition(id);
        if (!deleted) return res.status(404).json({ error: "Item definition not found." });
        return res.status(200).json({ message: "Item definition deleted successfully." });
    } catch (err) {
        console.error("Delete item definition error:", err);
        return res.status(500).json({ error: "Failed to delete item definition." });
    }
};

export const uploadImage = async (req: Request, res: Response) => {
    try {
        const file = req.file;
        if (!file) {
            return res.status(400).json({ error: "No image file provided." });
        }

        const fileExt = path.extname(file.originalname);
        const fileName = `${crypto.randomUUID()}${fileExt}`;
        const s3Key = `images/${fileName}`;

        const fileStream = fs.createReadStream(file.path);

        await r2Client.send(
            new PutObjectCommand({
                Bucket: R2_BUCKET_NAME,
                Key: s3Key,
                Body: fileStream,
                ContentType: file.mimetype,
            })
        );

        if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
        }

        const cleanPublicUrl = R2_PUBLIC_URL.endsWith("/")
            ? R2_PUBLIC_URL.slice(0, -1)
            : R2_PUBLIC_URL;

        const imageUrl = `${cleanPublicUrl}/${s3Key}`;
        return res.status(200).json({ url: imageUrl });
    } catch (err: any) {
        if (req.file && fs.existsSync(req.file.path)) {
            try {
                fs.unlinkSync(req.file.path);
            } catch {}
        }
        console.error("Upload image error:", err);
        return res.status(500).json({ error: "Failed to upload image." });
    }
};

// ─────────────────────────────── TIER ──────────────────────────────────────────

export const listTiers = async (req: Request, res: Response) => {
    try {
        const tiers = await adminService.listTiers();
        return res.status(200).json({ tiers });
    } catch (err) {
        console.error("List tiers error:", err);
        return res.status(500).json({ error: "Failed to list tiers." });
    }
};

export const createTier = async (req: Request<{}, any, CreateTierBody>, res: Response) => {
    return res.status(400).json({ error: "not available now" });
};

export const updateTier = async (req: Request<{ index: string }, any, UpdateTierBody>, res: Response) => {
    try {
        const index = Number(req.params.index);
        if (Number.isNaN(index)) {
            return res.status(400).json({ error: "Invalid tier index." });
        }
        const tier = await adminService.updateTier(index, req.body);
        if (!tier) return res.status(404).json({ error: "Tier not found." });
        return res.status(200).json(tier);
    } catch (err: any) {
        console.error("Update tier error:", err);
        return res.status(500).json({ error: err?.message || "Failed to update tier." });
    }
};

export const deleteTier = async (req: Request<{ index: string }>, res: Response) => {
    return res.status(400).json({ error: "not available now" });
};




