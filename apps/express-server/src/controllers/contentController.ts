// controllers/contentController.ts
import { Request, Response } from "express";
import { contentService } from "../services/contentService";
import {
    GetGradesResponse,
    GetTopicsResponse,
    GetLessonsResponse,
    GetSectionsResponse,
    GetNodesResponse,
    GetLessonTreeResponse,
    GetMindMapResponse,
    MindMapRequestQuery,
    GetGradeStructureParams,
    GetGradeStructureResponse,
    GetLessonTreeParams
} from "@history-app/shared"; 

export const getAllGrades = async (
    req: Request<{}, GetGradesResponse, {}>,
    res: Response<GetGradesResponse>,
) => {
    try {
        const grades = await contentService.getAllGrades();
        return res.status(200).json({ grades });
    } catch (err) {
        console.error("Fetch grades error:", err);
        return res.status(500).json({ error: "Failed to fetch grades." });
    }
};

export const getTopicsByGrade = async (
    req: Request<{ gradeId: string }, GetTopicsResponse, {}>,
    res: Response<GetTopicsResponse>,
) => {
    try {
        const gradeId = Number(req.params.gradeId);
        if (Number.isNaN(gradeId))
            return res.status(400).json({ error: "Invalid gradeId" });

        const topics = await contentService.getTopicsByGrade(gradeId);
        return res.status(200).json({ topics });
    } catch (err) {
        console.error("Fetch topics error:", err);
        return res.status(500).json({ error: "Failed to fetch topics." });
    }
};

export const getLessonsByTopic = async (
    req: Request<{ topicId: string }, GetLessonsResponse, {}>,
    res: Response<GetLessonsResponse>,
) => {
    try {
        const topicId = Number(req.params.topicId);
        if (Number.isNaN(topicId))
            return res.status(400).json({ error: "Invalid topicId" });

        const lessons = await contentService.getLessonsByTopic(topicId);
        return res.status(200).json({ lessons });
    } catch (err) {
        console.error("Fetch lessons error:", err);
        return res.status(500).json({ error: "Failed to fetch lessons." });
    }
};

export const getGradeStructure = async (
    req: Request<GetGradeStructureParams, GetGradeStructureResponse, {}>,
    res: Response<GetGradeStructureResponse>,
) => {
    try {
        const gradeId = Number(req.params.gradeId);
        if (Number.isNaN(gradeId)) {
            return res.status(400).json({ error: "Invalid gradeId" });
        }

        const gradeStructure = await contentService.getGradeStructure(gradeId);
        return res.status(200).json(gradeStructure);
    } catch (err) {
        console.error("Fetch grade structure error:", err);
        return res.status(500).json({ error: "Failed to fetch grade structure." });
    }
};

export const getSectionsByLesson = async (
    req: Request<{ lessonId: string }, GetSectionsResponse, {}>,
    res: Response<GetSectionsResponse>,
) => {
    try {
        const lessonId = Number(req.params.lessonId);
        if (Number.isNaN(lessonId))
            return res.status(400).json({ error: "Invalid lessonId" });

        const sections = await contentService.getSectionsByLesson(lessonId);
        return res.status(200).json({ sections });
    } catch (err) {
        console.error("Fetch sections error:", err);
        return res.status(500).json({ error: "Failed to fetch sections." });
    }
};



export const getLessonTree = async (
    req: Request<GetLessonTreeParams, GetLessonTreeResponse, {}>,
    res: Response<GetLessonTreeResponse>,
) => {
    try {
        const lessonId = Number(req.params.lessonId);
        if (Number.isNaN(lessonId)) {
            return res.status(400).json({ error: "Invalid lessonId" });
        }

        const tree = await contentService.getLessonTree(lessonId);
        if (!tree) {
            return res.status(404).json({ error: "Lesson not found." });
        }

        // Return the object directly to match LessonWithContentDto contract
        return res.status(200).json(tree);
    } catch (err) {
        console.error("Fetch lesson tree error:", err);
        return res.status(500).json({ error: "Failed to fetch lesson tree." });
    }
};

export const getMindMap = async (
    req: Request<{}, GetMindMapResponse, {}, MindMapRequestQuery>,
    res: Response<GetMindMapResponse>,
) => {
    try {
        const gradeId = req.query.gradeId ? Number(req.query.gradeId) : undefined;
        const topicId = req.query.topicId ? Number(req.query.topicId) : undefined;
        const lessonId = req.query.lessonId ? Number(req.query.lessonId) : undefined;

        if (
            (gradeId === undefined && topicId === undefined && lessonId === undefined) ||
            (gradeId !== undefined && Number.isNaN(gradeId)) ||
            (topicId !== undefined && Number.isNaN(topicId)) ||
            (lessonId !== undefined && Number.isNaN(lessonId))
        ) {
            return res.status(400).json({
                error: "Invalid or missing query parameter. Provide exactly one of gradeId, topicId, or lessonId as a number.",
            });
        }

        const providedCount = [gradeId, topicId, lessonId].filter((x) => x !== undefined).length;
        if (providedCount > 1) {
            return res.status(400).json({
                error: "Provide exactly one of gradeId, topicId, or lessonId, not multiple.",
            });
        }

        const tree = await contentService.getMindMap({ gradeId, topicId, lessonId });
        return res.status(200).json({ tree });
    } catch (err: any) {
        console.error("Fetch mind map error:", err);
        if (err.message && (err.message.includes("not found") || err.message.includes("NotFound"))) {
            return res.status(404).json({ error: err.message });
        }
        return res.status(500).json({ error: "Failed to fetch mind map." });
    }
};

export const getNodesBySection = async (
    req: Request<{ sectionId: string }, GetNodesResponse, {}>,
    res: Response<GetNodesResponse>,
) => {
    try {
        const sectionId = Number(req.params.sectionId);
        if (Number.isNaN(sectionId))
            return res.status(400).json({ error: "Invalid sectionId" });

        const nodes = await contentService.getNodesBySection(sectionId);
        return res.status(200).json({ nodes });
    } catch (err) {
        console.error("Fetch nodes error:", err);
        return res.status(500).json({ error: "Failed to fetch nodes." });
    }
};

