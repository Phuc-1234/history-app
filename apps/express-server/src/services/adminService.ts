// services/adminService.ts
import { prisma } from "@history-app/shared";
import {
    GradeDto,
    TopicDto,
    LessonDto,
    SectionDto,
    NodeDto,
    CreateGradeBody,
    UpdateGradeBody,
    CreateTopicBody,
    UpdateTopicBody,
    CreateLessonBody,
    UpdateLessonBody,
    CreateSectionBody,
    UpdateSectionBody,
    CreateNodeBody,
    UpdateNodeBody,
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
} from "@history-app/shared";
import { supabase } from "../config/supabaseClient";
import { contentService } from "./contentService";


export class AdminService {
    // ─────────────────────────────── GRADE ────────────────────────────────────

    async createGrade(data: CreateGradeBody): Promise<GradeDto> {
        const grade = await prisma.grade.create({
            data: {
                id: data.id,
                state: data.state ?? "PRIVATE",
            },
        });
        return { id: grade.id, state: grade.state };
    }

    async updateGrade(id: number, data: UpdateGradeBody): Promise<GradeDto | null> {
        const existing = await prisma.grade.findUnique({ where: { id } });
        if (!existing) return null;

        const grade = await prisma.grade.update({
            where: { id },
            data: {
                ...(data.state !== undefined && { state: data.state }),
            },
        });
        return { id: grade.id, state: grade.state };
    }

    async deleteGrade(id: number): Promise<boolean> {
        const existing = await prisma.grade.findUnique({ where: { id } });
        if (!existing) return false;
        await prisma.grade.delete({ where: { id } });
        return true;
    }

    // ─────────────────────────────── TOPIC ────────────────────────────────────

    async createTopic(data: CreateTopicBody): Promise<TopicDto> {
        const topic = await prisma.topic.create({
            data: {
                name: data.name,
                position: data.position,
                gradeId: data.gradeId,
            },
        });
        return { id: topic.id, name: topic.name, position: topic.position, gradeId: topic.gradeId };
    }

    async updateTopic(id: number, data: UpdateTopicBody): Promise<TopicDto | null> {
        const existing = await prisma.topic.findUnique({ where: { id } });
        if (!existing) return null;

        const topic = await prisma.topic.update({
            where: { id },
            data: {
                ...(data.name !== undefined && { name: data.name }),
                ...(data.position !== undefined && { position: data.position }),
            },
        });
        return { id: topic.id, name: topic.name, position: topic.position, gradeId: topic.gradeId };
    }

    async deleteTopic(id: number): Promise<boolean> {
        const existing = await prisma.topic.findUnique({ where: { id } });
        if (!existing) return false;
        await prisma.topic.delete({ where: { id } });
        return true;
    }

    // ─────────────────────────────── LESSON ───────────────────────────────────

    async createLesson(data: CreateLessonBody): Promise<LessonDto> {
        const lesson = await prisma.lesson.create({
            data: {
                name: data.name,
                summary: data.summary ?? null,
                position: data.position,
                topicId: data.topicId,
            },
        });
        return {
            id: lesson.id,
            name: lesson.name,
            summary: lesson.summary ?? null,
            position: lesson.position,
            topicId: lesson.topicId,
        };
    }

    async updateLesson(id: number, data: UpdateLessonBody): Promise<LessonDto | null> {
        const existing = await prisma.lesson.findUnique({ where: { id } });
        if (!existing) return null;

        const lesson = await prisma.lesson.update({
            where: { id },
            data: {
                ...(data.name !== undefined && { name: data.name }),
                ...(data.summary !== undefined && { summary: data.summary }),
                ...(data.position !== undefined && { position: data.position }),
            },
        });
        return {
            id: lesson.id,
            name: lesson.name,
            summary: lesson.summary ?? null,
            position: lesson.position,
            topicId: lesson.topicId,
        };
    }

    async deleteLesson(id: number): Promise<boolean> {
        const existing = await prisma.lesson.findUnique({ where: { id } });
        if (!existing) return false;
        await prisma.lesson.delete({ where: { id } });
        return true;
    }

    // ─────────────────────────────── MINDMAP SYNC ──────────────────────────────

    async syncMindMapForLesson(lessonId: number): Promise<void> {
        try {
            const tree = await contentService.generateMindMapForLesson(lessonId);
            await prisma.mindMap.upsert({
                where: { lessonId },
                update: { data: tree as any },
                create: { lessonId, data: tree as any },
            });
        } catch (err) {
            console.error(`Error syncing mind map for lesson ${lessonId}:`, err);
        }
    }

    // ─────────────────────────────── SECTION ──────────────────────────────────

    async createSection(data: CreateSectionBody): Promise<SectionDto> {
        const section = await prisma.section.create({
            data: {
                name: data.name,
                summary: data.summary ?? null,
                position: data.position,
                lessonId: data.lessonId,
                parentSectionId: data.parentSectionId ?? null,
            },
        });
        return {
            id: section.id,
            name: section.name,
            summary: section.summary ?? null,
            position: section.position,
            lessonId: section.lessonId,
            parentSectionId: section.parentSectionId ?? null,
        };
    }

    async updateSection(id: number, data: UpdateSectionBody): Promise<SectionDto | null> {
        const existing = await prisma.section.findUnique({ where: { id } });
        if (!existing) return null;

        const section = await prisma.section.update({
            where: { id },
            data: {
                ...(data.name !== undefined && { name: data.name }),
                ...(data.summary !== undefined && { summary: data.summary }),
                ...(data.position !== undefined && { position: data.position }),
                ...(data.parentSectionId !== undefined && {
                    parentSectionId: data.parentSectionId,
                }),
            },
        });
        return {
            id: section.id,
            name: section.name,
            summary: section.summary ?? null,
            position: section.position,
            lessonId: section.lessonId,
            parentSectionId: section.parentSectionId ?? null,
        };
    }

    async deleteSection(id: number): Promise<boolean> {
        const existing = await prisma.section.findUnique({ where: { id } });
        if (!existing) return false;
        await prisma.section.delete({ where: { id } });
        return true;
    }

    // ─────────────────────────────── NODE ─────────────────────────────────────

    async createNode(data: CreateNodeBody): Promise<NodeDto> {
        const node = await prisma.node.create({
            data: {
                position: data.position,
                header: data.header ?? null,
                body: data.body,
                imgUrl: data.imgUrl ?? null,
                sectionId: data.sectionId,
            },
        });
        return {
            id: node.id,
            position: node.position,
            header: node.header ?? null,
            body: node.body,
            imgUrl: node.imgUrl ?? null,
            sectionId: node.sectionId,
        };
    }

    async updateNode(id: number, data: UpdateNodeBody): Promise<NodeDto | null> {
        const existing = await prisma.node.findUnique({
            where: { id },
            include: { section: true },
        });
        if (!existing) return null;

        const node = await prisma.node.update({
            where: { id },
            data: {
                ...(data.position !== undefined && { position: data.position }),
                ...(data.header !== undefined && { header: data.header }),
                ...(data.body !== undefined && { body: data.body }),
                ...(data.imgUrl !== undefined && { imgUrl: data.imgUrl }),
            },
        });
        return {
            id: node.id,
            position: node.position,
            header: node.header ?? null,
            body: node.body,
            imgUrl: node.imgUrl ?? null,
            sectionId: node.sectionId,
        };
    }

    async deleteNode(id: number): Promise<boolean> {
        const existing = await prisma.node.findUnique({
            where: { id },
            include: { section: true },
        });
        if (!existing) return false;
        await prisma.node.delete({ where: { id } });
        return true;
    }

    // ─────────────────────────────── USER ─────────────────────────────────────

    async listUsers(search?: string, role?: string): Promise<AdminUserDto[]> {
        const users = await prisma.user.findMany({
            where: {
                AND: [
                    search ? {
                        OR: [
                            { email: { contains: search, mode: "insensitive" } },
                            { name: { contains: search, mode: "insensitive" } },
                        ],
                    } : {},
                    role ? { role: role as any } : {},
                ],
            },
            orderBy: { name: "asc" },
        });

        return users.map(u => ({
            id: u.id,
            email: u.email,
            name: u.name,
            role: u.role,
            totalXp: u.totalXp,
            totalGold: u.totalGold,
            isHidden: u.isHidden,
            isVerified: u.isVerified,
            profileImgUrl: u.profileImgUrl ?? null,
            currentStreak: u.currentStreak,
            highestStreak: u.highestStreak,
        }));
    }

    async updateUser(id: string, data: UpdateUserBody): Promise<AdminUserDto | null> {
        const existing = await prisma.user.findUnique({ where: { id } });
        if (!existing) return null;

        const updated = await prisma.user.update({
            where: { id },
            data: {
                ...(data.role !== undefined && { role: data.role as any }),
                ...(data.isHidden !== undefined && { isHidden: data.isHidden }),
                ...(data.isVerified !== undefined && { isVerified: data.isVerified }),
                ...(data.totalXp !== undefined && { totalXp: data.totalXp }),
                ...(data.totalGold !== undefined && { totalGold: data.totalGold }),
            },
        });

        return {
            id: updated.id,
            email: updated.email,
            name: updated.name,
            role: updated.role,
            totalXp: updated.totalXp,
            totalGold: updated.totalGold,
            isHidden: updated.isHidden,
            isVerified: updated.isVerified,
            profileImgUrl: updated.profileImgUrl ?? null,
            currentStreak: updated.currentStreak,
            highestStreak: updated.highestStreak,
        };
    }

    async deleteUser(id: string): Promise<boolean> {
        const existing = await prisma.user.findUnique({ where: { id } });
        if (!existing) return false;

        // 1. Delete from Supabase Auth
        try {
            await supabase.auth.admin.deleteUser(id);
        } catch (authErr) {
            console.error(`Failed to delete user ${id} from Supabase auth:`, authErr);
        }

        // 2. Delete from Postgres
        await prisma.user.delete({ where: { id } });
        return true;
    }

    // ─────────────────────────────── VIDEO ────────────────────────────────────

    async listVideos(lessonId?: number): Promise<AdminVideoDto[]> {
        const videos = await prisma.video.findMany({
            where: lessonId ? { lessonId } : {},
            orderBy: { position: "asc" },
        });
        return videos.map(v => ({
            id: v.id,
            title: v.title,
            position: v.position,
            summary: v.summary ?? null,
            hlsUrl: v.hlsUrl,
            status: v.status,
            lessonId: v.lessonId,
        }));
    }

    async createVideo(data: CreateVideoBody): Promise<AdminVideoDto> {
        const video = await prisma.video.create({
            data: {
                title: data.title,
                position: data.position,
                summary: data.summary ?? null,
                hlsUrl: data.hlsUrl,
                lessonId: data.lessonId,
                status: "READY",
            },
        });
        return {
            id: video.id,
            title: video.title,
            position: video.position,
            summary: video.summary ?? null,
            hlsUrl: video.hlsUrl,
            status: video.status,
            lessonId: video.lessonId,
        };
    }

    async updateVideo(id: string, data: UpdateVideoBody): Promise<AdminVideoDto | null> {
        const existing = await prisma.video.findUnique({ where: { id } });
        if (!existing) return null;

        const updated = await prisma.video.update({
            where: { id },
            data: {
                ...(data.title !== undefined && { title: data.title }),
                ...(data.position !== undefined && { position: data.position }),
                ...(data.summary !== undefined && { summary: data.summary }),
                ...(data.hlsUrl !== undefined && { hlsUrl: data.hlsUrl }),
                ...(data.lessonId !== undefined && { lessonId: data.lessonId }),
            },
        });
        return {
            id: updated.id,
            title: updated.title,
            position: updated.position,
            summary: updated.summary ?? null,
            hlsUrl: updated.hlsUrl,
            status: updated.status,
            lessonId: updated.lessonId,
        };
    }

    async deleteVideo(id: string): Promise<boolean> {
        const existing = await prisma.video.findUnique({ where: { id } });
        if (!existing) return false;
        await prisma.video.delete({ where: { id } });
        return true;
    }

    // ─────────────────────────────── QUESTION ─────────────────────────────────

    async listQuestions(
        gradeId?: number,
        topicId?: number,
        lessonId?: number,
        sectionId?: number,
        nodeId?: number,
        type?: string
    ): Promise<AdminQuestionDto[]> {
        const questions = await prisma.question.findMany({
            where: {
                AND: [
                    gradeId ? { gradeId } : {},
                    topicId ? { topicId } : {},
                    lessonId ? { lessonId } : {},
                    sectionId ? { sectionId } : {},
                    nodeId ? { nodeId } : {},
                    type ? { type: type as any } : {},
                ],
            },
            include: {
                answers: true,
            },
            orderBy: { id: "desc" },
            take: 100,
        });

        return questions.map(q => ({
            id: q.id,
            type: q.type,
            difficulty: q.difficulty,
            promptText: q.promptText,
            document: q.document ?? null,
            gradeId: q.gradeId,
            topicId: q.topicId,
            lessonId: q.lessonId,
            sectionId: q.sectionId,
            nodeId: q.nodeId,
            answers: q.answers.map(a => ({
                id: a.id,
                content: a.content,
                isCorrect: a.isCorrect,
                leftText: a.leftText ?? null,
                rightText: a.rightText ?? null,
                correctAnswer: a.correctAnswer ?? null,
            })),
        }));
    }

    async createQuestion(data: CreateQuestionBody): Promise<AdminQuestionDto> {
        const question = await prisma.question.create({
            data: {
                type: data.type,
                difficulty: data.difficulty,
                promptText: data.promptText,
                document: data.document ?? null,
                gradeId: data.gradeId ?? null,
                topicId: data.topicId ?? null,
                lessonId: data.lessonId ?? null,
                sectionId: data.sectionId ?? null,
                nodeId: data.nodeId ?? null,
                answers: {
                    create: data.answers.map(a => ({
                        content: a.content,
                        isCorrect: a.isCorrect ?? null,
                        leftText: a.leftText ?? null,
                        rightText: a.rightText ?? null,
                        correctAnswer: a.correctAnswer ?? null,
                    })),
                },
            },
            include: {
                answers: true,
            },
        });

        return {
            id: question.id,
            type: question.type,
            difficulty: question.difficulty,
            promptText: question.promptText,
            document: question.document ?? null,
            gradeId: question.gradeId,
            topicId: question.topicId,
            lessonId: question.lessonId,
            sectionId: question.sectionId,
            nodeId: question.nodeId,
            answers: question.answers.map(a => ({
                id: a.id,
                content: a.content,
                isCorrect: a.isCorrect,
                leftText: a.leftText ?? null,
                rightText: a.rightText ?? null,
                correctAnswer: a.correctAnswer ?? null,
            })),
        };
    }

    async updateQuestion(id: number, data: UpdateQuestionBody): Promise<AdminQuestionDto | null> {
        const existing = await prisma.question.findUnique({ where: { id } });
        if (!existing) return null;

        const question = await prisma.$transaction(async (tx) => {
            if (data.answers !== undefined) {
                await tx.questionAnswer.deleteMany({ where: { questionId: id } });
            }

            return await tx.question.update({
                where: { id },
                data: {
                    ...(data.type !== undefined && { type: data.type }),
                    ...(data.difficulty !== undefined && { difficulty: data.difficulty }),
                    ...(data.promptText !== undefined && { promptText: data.promptText }),
                    ...(data.document !== undefined && { document: data.document }),
                    ...(data.gradeId !== undefined && { gradeId: data.gradeId }),
                    ...(data.topicId !== undefined && { topicId: data.topicId }),
                    ...(data.lessonId !== undefined && { lessonId: data.lessonId }),
                    ...(data.sectionId !== undefined && { sectionId: data.sectionId }),
                    ...(data.nodeId !== undefined && { nodeId: data.nodeId }),
                    ...(data.answers !== undefined && {
                        answers: {
                            create: data.answers.map(a => ({
                                content: a.content,
                                isCorrect: a.isCorrect ?? null,
                                leftText: a.leftText ?? null,
                                rightText: a.rightText ?? null,
                                correctAnswer: a.correctAnswer ?? null,
                            })),
                        },
                    }),
                },
                include: {
                    answers: true,
                },
            });
        });

        return {
            id: question.id,
            type: question.type,
            difficulty: question.difficulty,
            promptText: question.promptText,
            document: question.document ?? null,
            gradeId: question.gradeId,
            topicId: question.topicId,
            lessonId: question.lessonId,
            sectionId: question.sectionId,
            nodeId: question.nodeId,
            answers: question.answers.map(a => ({
                id: a.id,
                content: a.content,
                isCorrect: a.isCorrect,
                leftText: a.leftText ?? null,
                rightText: a.rightText ?? null,
                correctAnswer: a.correctAnswer ?? null,
            })),
        };
    }

    async deleteQuestion(id: number): Promise<boolean> {
        const existing = await prisma.question.findUnique({ where: { id } });
        if (!existing) return false;
        await prisma.question.delete({ where: { id } });
        return true;
    }

    // ─────────────────────────────── TEST ─────────────────────────────────────

    async listTests(): Promise<AdminTestDto[]> {
        const tests = await prisma.test.findMany({
            include: {
                testQuestions: {
                    select: {
                        questionId: true,
                    },
                },
            },
            orderBy: { title: "asc" },
        });

        return tests.map(t => ({
            id: t.id,
            title: t.title,
            summary: t.summary ?? null,
            isManual: t.isManual,
            isNationalTest: t.isNationalTest,
            questionNumber: t.questionNumber,
            timeLimit: t.timeLimit,
            xpReward: t.xpReward,
            goldReward: t.goldReward,
            passThreshold: t.passThreshold,
            gradeId: t.gradeId,
            topicId: t.topicId,
            lessonId: t.lessonId,
            sectionId: t.sectionId,
            questionIds: t.testQuestions.map(tq => tq.questionId),
        }));
    }

    async createTest(data: CreateTestBody): Promise<AdminTestDto> {
        const test = await prisma.$transaction(async (tx) => {
            const newTest = await tx.test.create({
                data: {
                    title: data.title,
                    summary: data.summary ?? null,
                    isManual: data.isManual,
                    isNationalTest: data.isNationalTest,
                    questionNumber: data.questionNumber,
                    timeLimit: data.timeLimit ?? null,
                    xpReward: data.xpReward,
                    goldReward: data.goldReward,
                    passThreshold: data.passThreshold,
                    gradeId: data.gradeId ?? null,
                    topicId: data.topicId ?? null,
                    lessonId: data.lessonId ?? null,
                    sectionId: data.sectionId ?? null,
                },
            });

            if (data.questionIds && data.questionIds.length > 0) {
                await tx.testQuestion.createMany({
                    data: data.questionIds.map((qid, idx) => ({
                        testId: newTest.id,
                        questionId: qid,
                        position: idx + 1,
                    })),
                });
            }

            return newTest;
        });

        const testQuestions = await prisma.testQuestion.findMany({
            where: { testId: test.id },
            select: { questionId: true },
        });

        return {
            id: test.id,
            title: test.title,
            summary: test.summary ?? null,
            isManual: test.isManual,
            isNationalTest: test.isNationalTest,
            questionNumber: test.questionNumber,
            timeLimit: test.timeLimit,
            xpReward: test.xpReward,
            goldReward: test.goldReward,
            passThreshold: test.passThreshold,
            gradeId: test.gradeId,
            topicId: test.topicId,
            lessonId: test.lessonId,
            sectionId: test.sectionId,
            questionIds: testQuestions.map(tq => tq.questionId),
        };
    }

    async updateTest(id: string, data: UpdateTestBody): Promise<AdminTestDto | null> {
        const existing = await prisma.test.findUnique({ where: { id } });
        if (!existing) return null;

        const updated = await prisma.$transaction(async (tx) => {
            const test = await tx.test.update({
                where: { id },
                data: {
                    ...(data.title !== undefined && { title: data.title }),
                    ...(data.summary !== undefined && { summary: data.summary }),
                    ...(data.isManual !== undefined && { isManual: data.isManual }),
                    ...(data.isNationalTest !== undefined && { isNationalTest: data.isNationalTest }),
                    ...(data.questionNumber !== undefined && { questionNumber: data.questionNumber }),
                    ...(data.timeLimit !== undefined && { timeLimit: data.timeLimit }),
                    ...(data.xpReward !== undefined && { xpReward: data.xpReward }),
                    ...(data.goldReward !== undefined && { goldReward: data.goldReward }),
                    ...(data.passThreshold !== undefined && { passThreshold: data.passThreshold }),
                    ...(data.gradeId !== undefined && { gradeId: data.gradeId }),
                    ...(data.topicId !== undefined && { topicId: data.topicId }),
                    ...(data.lessonId !== undefined && { lessonId: data.lessonId }),
                    ...(data.sectionId !== undefined && { sectionId: data.sectionId }),
                },
            });

            if (data.questionIds !== undefined) {
                await tx.testQuestion.deleteMany({ where: { testId: id } });

                if (data.questionIds.length > 0) {
                    await tx.testQuestion.createMany({
                        data: data.questionIds.map((qid, idx) => ({
                            testId: id,
                            questionId: qid,
                            position: idx + 1,
                        })),
                    });
                }
            }

            return test;
        });

        const testQuestions = await prisma.testQuestion.findMany({
            where: { testId: id },
            select: { questionId: true },
        });

        return {
            id: updated.id,
            title: updated.title,
            summary: updated.summary ?? null,
            isManual: updated.isManual,
            isNationalTest: updated.isNationalTest,
            questionNumber: updated.questionNumber,
            timeLimit: updated.timeLimit,
            xpReward: updated.xpReward,
            goldReward: updated.goldReward,
            passThreshold: updated.passThreshold,
            gradeId: updated.gradeId,
            topicId: updated.topicId,
            lessonId: updated.lessonId,
            sectionId: updated.sectionId,
            questionIds: testQuestions.map(tq => tq.questionId),
        };
    }

    async deleteTest(id: string): Promise<boolean> {
        const existing = await prisma.test.findUnique({ where: { id } });
        if (!existing) return false;
        await prisma.test.delete({ where: { id } });
        return true;
    }

    // ─────────────────────────────── FLASHCARD ────────────────────────────────────

    async listFlashcards(lessonId?: number): Promise<FlashcardDto[]> {
        let flashcards;
        if (lessonId) {
            flashcards = await prisma.flashcard.findMany({
                where: {
                    OR: [
                        { lessonId },
                        { section: { lessonId } },
                        { node: { section: { lessonId } } },
                    ],
                },
                orderBy: { id: "asc" },
            });
        } else {
            flashcards = await prisma.flashcard.findMany({
                orderBy: { id: "asc" },
            });
        }

        return flashcards.map((f) => ({
            id: f.id,
            frontText: f.frontText,
            backText: f.backText,
            lessonId: f.lessonId,
            sectionId: f.sectionId,
            nodeId: f.nodeId,
        }));
    }

    async createFlashcard(data: CreateFlashcardBody): Promise<FlashcardDto> {
        const count = [data.lessonId, data.sectionId, data.nodeId].filter(
            (id) => id !== undefined && id !== null
        ).length;
        if (count !== 1) {
            throw new Error("A flashcard must belong to exactly one of: lessonId, sectionId, or nodeId.");
        }

        // Verify entity exists
        if (data.lessonId) {
            const lesson = await prisma.lesson.findUnique({ where: { id: data.lessonId } });
            if (!lesson) throw new Error("Lesson not found.");
        } else if (data.sectionId) {
            const section = await prisma.section.findUnique({ where: { id: data.sectionId } });
            if (!section) throw new Error("Section not found.");
        } else if (data.nodeId) {
            const node = await prisma.node.findUnique({ where: { id: data.nodeId } });
            if (!node) throw new Error("Node not found.");
        }

        const flashcard = await prisma.flashcard.create({
            data: {
                frontText: data.frontText,
                backText: data.backText,
                lessonId: data.lessonId ?? null,
                sectionId: data.sectionId ?? null,
                nodeId: data.nodeId ?? null,
            },
        });

        return {
            id: flashcard.id,
            frontText: flashcard.frontText,
            backText: flashcard.backText,
            lessonId: flashcard.lessonId,
            sectionId: flashcard.sectionId,
            nodeId: flashcard.nodeId,
        };
    }

    async updateFlashcard(id: number, data: UpdateFlashcardBody): Promise<FlashcardDto | null> {
        const existing = await prisma.flashcard.findUnique({ where: { id } });
        if (!existing) return null;

        // Merge inputs
        const targetLessonId = data.lessonId !== undefined ? data.lessonId : existing.lessonId;
        const targetSectionId = data.sectionId !== undefined ? data.sectionId : existing.sectionId;
        const targetNodeId = data.nodeId !== undefined ? data.nodeId : existing.nodeId;

        const count = [targetLessonId, targetSectionId, targetNodeId].filter(
            (id) => id !== undefined && id !== null
        ).length;
        if (count !== 1) {
            throw new Error("A flashcard must belong to exactly one of: lessonId, sectionId, or nodeId.");
        }

        // Verify entity exists
        if (data.lessonId) {
            const lesson = await prisma.lesson.findUnique({ where: { id: data.lessonId } });
            if (!lesson) throw new Error("Lesson not found.");
        } else if (data.sectionId) {
            const section = await prisma.section.findUnique({ where: { id: data.sectionId } });
            if (!section) throw new Error("Section not found.");
        } else if (data.nodeId) {
            const node = await prisma.node.findUnique({ where: { id: data.nodeId } });
            if (!node) throw new Error("Node not found.");
        }

        const flashcard = await prisma.flashcard.update({
            where: { id },
            data: {
                ...(data.frontText !== undefined && { frontText: data.frontText }),
                ...(data.backText !== undefined && { backText: data.backText }),
                lessonId: targetLessonId,
                sectionId: targetSectionId,
                nodeId: targetNodeId,
            },
        });

        return {
            id: flashcard.id,
            frontText: flashcard.frontText,
            backText: flashcard.backText,
            lessonId: flashcard.lessonId,
            sectionId: flashcard.sectionId,
            nodeId: flashcard.nodeId,
        };
    }

    async deleteFlashcard(id: number): Promise<boolean> {
        const existing = await prisma.flashcard.findUnique({ where: { id } });
        if (!existing) return false;
        await prisma.flashcard.delete({ where: { id } });
        return true;
    }

    async bulkCreateFlashcards(lessonId: number, flashcards: { frontText: string; backText: string }[]): Promise<void> {
        const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
        if (!lesson) throw new Error("Lesson not found.");

        await prisma.$transaction(async (tx) => {
            // Delete all existing flashcards for lesson structure (direct lesson, or sections/nodes of this lesson)
            await tx.flashcard.deleteMany({
                where: {
                    OR: [
                        { lessonId },
                        { section: { lessonId } },
                        { node: { section: { lessonId } } },
                    ],
                },
            });

            // Create new ones directly under lesson
            if (flashcards.length > 0) {
                await tx.flashcard.createMany({
                    data: flashcards.map((f) => ({
                        frontText: f.frontText,
                        backText: f.backText,
                        lessonId,
                    })),
                });
            }
        });
    }
}

export const adminService = new AdminService();

