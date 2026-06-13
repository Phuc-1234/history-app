// controllers/adminController.ts
import { Request, Response } from "express";
import { adminService } from "../services/adminService";
import { prisma } from "@history-app/shared";
import { aiService } from "../services/aiService";
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
} from "@history-app/shared";

// ─────────────────────────────── GRADE ────────────────────────────────────────

export const createGrade = async (
    req: Request<{}, AdminGradeResponse, CreateGradeBody>,
    res: Response<AdminGradeResponse>,
) => {
    try {
        const { id, state } = req.body;
        if (id === undefined || typeof id !== "number") {
            return res.status(400).json({ error: "id (number) is required." });
        }
        const grade = await adminService.createGrade({ id, state });
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
        const { name, position, topicId, summary } = req.body;
        if (!name || position === undefined || !topicId) {
            return res.status(400).json({ error: "name, position, and topicId are required." });
        }
        const lesson = await adminService.createLesson({ name, summary, position, topicId });
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
        const { position, body, sectionId, header, imgUrl } = req.body;
        if (!body || position === undefined || !sectionId) {
            return res.status(400).json({ error: "body, position, and sectionId are required." });
        }
        const node = await adminService.createNode({ position, header, body, imgUrl, sectionId });
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

export const updateUser = async (req: Request<{ userId: string }, any, UpdateUserBody>, res: Response) => {
    try {
        const { userId } = req.params;
        const user = await adminService.updateUser(userId, req.body);
        if (!user) return res.status(404).json({ error: "User not found." });
        return res.status(200).json(user);
    } catch (err) {
        console.error("Update user error:", err);
        return res.status(500).json({ error: "Failed to update user." });
    }
};

export const deleteUser = async (req: Request<{ userId: string }>, res: Response) => {
    try {
        const { userId } = req.params;
        const deleted = await adminService.deleteUser(userId);
        if (!deleted) return res.status(404).json({ error: "User not found." });
        return res.status(200).json({ message: "User deleted successfully." });
    } catch (err) {
        console.error("Delete user error:", err);
        return res.status(500).json({ error: "Failed to delete user." });
    }
};

// ─────────────────────────────── VIDEO ────────────────────────────────────────

export const listVideos = async (req: Request, res: Response) => {
    try {
        const lessonId = req.query.lessonId ? Number(req.query.lessonId) : undefined;
        if (lessonId !== undefined && Number.isNaN(lessonId)) {
            return res.status(400).json({ error: "Invalid lessonId query parameter." });
        }
        const videos = await adminService.listVideos(lessonId);
        return res.status(200).json({ videos });
    } catch (err) {
        console.error("List videos error:", err);
        return res.status(500).json({ error: "Failed to list videos." });
    }
};

export const createVideo = async (req: Request<{}, any, CreateVideoBody>, res: Response) => {
    try {
        const { title, position, lessonId, hlsUrl } = req.body;
        if (!title || position === undefined || !lessonId || !hlsUrl) {
            return res.status(400).json({ error: "title, position, lessonId, and hlsUrl are required." });
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
        const type = req.query.type as string | undefined;

        const questions = await adminService.listQuestions(gradeId, topicId, lessonId, sectionId, nodeId, type);
        return res.status(200).json({ questions });
    } catch (err) {
        console.error("List questions error:", err);
        return res.status(500).json({ error: "Failed to list questions." });
    }
};

export const createQuestion = async (req: Request<{}, any, CreateQuestionBody>, res: Response) => {
    try {
        const { type, difficulty, promptText, answers } = req.body;
        if (!type || difficulty === undefined || !promptText || !answers || !Array.isArray(answers)) {
            return res.status(400).json({ error: "type, difficulty, promptText, and answers array are required." });
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
        const { title, isManual, isNationalTest, questionNumber, xpReward, goldReward, passThreshold } = req.body;
        if (!title || isManual === undefined || isNationalTest === undefined || questionNumber === undefined || xpReward === undefined || goldReward === undefined || passThreshold === undefined) {
            return res.status(400).json({ error: "Missing required fields for Test." });
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

        await prisma.$transaction(async (tx) => {
            // Delete all existing sections (cascade will delete nodes)
            await tx.section.deleteMany({
                where: { lessonId },
            });

            // Recursively create new sections and nodes
            await saveSectionsRecursively(tx, lessonId, sections);
        });

        // Sync to MindMap table
        await adminService.syncMindMapForLesson(lessonId);

        return res.status(200).json({ message: "Mind map saved successfully." });
    } catch (err) {
        console.error("Bulk save mind map error:", err);
        return res.status(500).json({ error: "Failed to save mind map in bulk." });
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

