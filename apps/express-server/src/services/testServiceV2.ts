// services/testServiceV2.ts — Test system V2 service
import { prisma } from "@history-app/shared";
import { Prisma } from "@prisma/client";
import { progressEngine } from "./progressEngine";
import { rewardEngine } from "./rewardEngine";
import { scoreAllQuestions } from "./scoreEngine";
import {
    StartTestV2Request,
    StartTestV2Response,
    FinishTestV2Response,
    ResumableTestV2Response,
    TestHistoryV2Response,
    TestAttemptDetailV2Response,
    QuestionV2Dto,
    UserTestLogV2Dto,
    UserAnswerLogV2Dto,
    DraftAnswerEntry,
    AnswerData,
    TestInfoV2Response,
    NationalTestDto,
} from "../types/testV2Types";

// ─── Helpers ─────────────────────────────────────────────────────────────

function serviceError(message: string, code?: string) {
    const e: any = new Error(message);
    if (code) e.code = code;
    return e;
}

function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

async function resolveTestTitle(log: any): Promise<string> {
    if (log.testId) {
        const test = await prisma.test.findUnique({
            where: { id: log.testId },
            select: { title: true },
        });
        if (test) return test.title;
    }

    if (log.scopeType && log.scopeId) {
        const id = log.scopeId;
        switch (log.scopeType) {
            case "LESSON": {
                const lesson = await prisma.lesson.findUnique({ where: { id }, select: { name: true } });
                if (lesson) return `Bài học: ${lesson.name}`;
                break;
            }
            case "TOPIC": {
                const topic = await prisma.topic.findUnique({ where: { id }, select: { name: true } });
                if (topic) return `Chủ đề: ${topic.name}`;
                break;
            }
            case "NODE": {
                const node = await prisma.node.findUnique({ where: { id }, select: { header: true } });
                if (node) return `Mục: ${node.header ?? "Không có tiêu đề"}`;
                break;
            }
            case "SECTION": {
                const section = await prisma.section.findUnique({ where: { id }, select: { name: true } });
                if (section) return `Phần: ${section.name}`;
                break;
            }
            case "GRADE": {
                const grade = await prisma.grade.findUnique({ where: { id }, select: { id: true } });
                if (grade) return `Lớp ${grade.id}`;
                break;
            }
        }
    }

    if (log.scopeType === "NATIONAL") {
        return "Đề thi Quốc gia";
    }

    if (log.scopeType === "GRADE") {
        return "Khối lớp";
    }

    if (log.purposeType === "PRACTICE") {
        if (log.autoPickStrategy === "WRONG") return "Làm lại câu sai";
        return "Luyện tập cá nhân";
    }

    return log.purposeType === "EXAM" ? "Bài kiểm tra" : "Luyện tập";
}

function toLogDto(log: any, testTitle?: string | null): UserTestLogV2Dto {
    return {
        id: log.id,
        testId: log.testId ?? null,
        purposeType: log.purposeType ?? "EXAM",
        status: log.status ?? "IN_PROGRESS",
        scoreAwarded: log.scoreAwarded ?? 0,
        maxScore: log.maxScore ?? 0,
        isPassed: log.isPassed ?? null,
        startedAt: log.startedAt?.toISOString?.() ?? log.startedAt,
        submittedAt: log.submittedAt?.toISOString?.() ?? log.submittedAt ?? null,
        expiresAt: log.expiresAt?.toISOString?.() ?? log.expiresAt ?? null,
        attemptNumber: log.attemptNumber,
        questionCount: log.questionCount ?? 0,
        passThreshold: log.passThreshold ?? 80,
        timeLimit: log.timeLimit ?? null,
        scopeType: log.scopeType ?? null,
        scopeId: log.scopeId ?? null,
        currentQuestionIndex: log.currentQuestionIndex ?? 0,
        questionSequenceJson: (log.questionSequenceJson as number[]) ?? [],
        draftAnswerJson: (log.draftAnswerJson as DraftAnswerEntry[]) ?? [],
        testTitle: testTitle ?? log.testTitle ?? null,
        autoPickStrategy: log.autoPickStrategy ?? null,
        goldEarned: log.goldEarned ?? 0,
        xpEarned: log.xpEarned ?? 0,
    };
}

function toQuestionDto(q: any): QuestionV2Dto {
    return {
        id: q.id,
        type: q.type,
        difficulty: q.difficulty,
        promptText: q.promptText,
        document: q.document ?? null,
        explanation: q.explanation ?? null,
        answerData: q.answerDataJson as AnswerData,
    };
}

// ─── Scope expansion ────────────────────────────────────────────────────

// ─── Scope expansion ────────────────────────────────────────────────────

export async function expandScopeToQuestionWhere(
    scopeType: string | null | undefined,
    scopeId: number | null | undefined,
    activeOnly: boolean = true,
): Promise<Prisma.QuestionWhereInput> {
    const baseWhere: Prisma.QuestionWhereInput = activeOnly ? { isActive: true } : {};
    if (!scopeType || scopeType === "NATIONAL") return baseWhere;

    const conditions: Prisma.QuestionWhereInput[] = [];

    if (scopeType === "NODE" && scopeId) {
        conditions.push({ scopeType: "NODE" as any, scopeId });
    } else if (scopeType === "SECTION" && scopeId) {
        const sectionIds = await expandSectionIds([scopeId]);
        conditions.push({ scopeType: "SECTION" as any, scopeId: { in: sectionIds } });
        const nodeIds = await getNodeIdsForSections(sectionIds);
        if (nodeIds.length) conditions.push({ scopeType: "NODE" as any, scopeId: { in: nodeIds } });
    } else if (scopeType === "LESSON" && scopeId) {
        conditions.push({ scopeType: "LESSON" as any, scopeId });
        const rootSections = await prisma.section.findMany({
            where: { lessonId: scopeId },
            select: { id: true },
        });
        const sectionIds = await expandSectionIds(rootSections.map((s) => s.id));
        if (sectionIds.length) conditions.push({ scopeType: "SECTION" as any, scopeId: { in: sectionIds } });
        const nodeIds = await getNodeIdsForSections(sectionIds);
        if (nodeIds.length) conditions.push({ scopeType: "NODE" as any, scopeId: { in: nodeIds } });
    } else if (scopeType === "TOPIC" && scopeId) {
        conditions.push({ scopeType: "TOPIC" as any, scopeId });
        const lessons = await prisma.lesson.findMany({
            where: { topicId: scopeId },
            select: { id: true },
        });
        const lessonIds = lessons.map((l) => l.id);
        if (lessonIds.length) conditions.push({ scopeType: "LESSON" as any, scopeId: { in: lessonIds } });
        const rootSections = lessonIds.length
            ? await prisma.section.findMany({
                where: { lessonId: { in: lessonIds } },
                select: { id: true },
            })
            : [];
        const sectionIds = await expandSectionIds(rootSections.map((s) => s.id));
        if (sectionIds.length) conditions.push({ scopeType: "SECTION" as any, scopeId: { in: sectionIds } });
        const nodeIds = await getNodeIdsForSections(sectionIds);
        if (nodeIds.length) conditions.push({ scopeType: "NODE" as any, scopeId: { in: nodeIds } });
    } else if (scopeType === "GRADE" && scopeId) {
        conditions.push({ scopeType: "GRADE" as any, scopeId });
        const topics = await prisma.topic.findMany({
            where: { gradeId: scopeId },
            select: { id: true },
        });
        const topicIds = topics.map((t) => t.id);
        if (topicIds.length) conditions.push({ scopeType: "TOPIC" as any, scopeId: { in: topicIds } });
        const lessons = topicIds.length
            ? await prisma.lesson.findMany({
                where: { topicId: { in: topicIds } },
                select: { id: true },
            })
            : [];
        const lessonIds = lessons.map((l) => l.id);
        if (lessonIds.length) conditions.push({ scopeType: "LESSON" as any, scopeId: { in: lessonIds } });
        const rootSections = lessonIds.length
            ? await prisma.section.findMany({
                where: { lessonId: { in: lessonIds } },
                select: { id: true },
            })
            : [];
        const sectionIds = await expandSectionIds(rootSections.map((s) => s.id));
        if (sectionIds.length) conditions.push({ scopeType: "SECTION" as any, scopeId: { in: sectionIds } });
        const nodeIds = await getNodeIdsForSections(sectionIds);
        if (nodeIds.length) conditions.push({ scopeType: "NODE" as any, scopeId: { in: nodeIds } });
    }

    if (conditions.length === 0) return baseWhere;
    return activeOnly ? { isActive: true, OR: conditions } : { OR: conditions };
}

async function expandSectionIds(initialIds: number[]): Promise<number[]> {
    if (!initialIds.length) return [];
    const all = [...initialIds];
    let parents = [...initialIds];
    while (parents.length) {
        const children = await prisma.section.findMany({
            where: { parentSectionId: { in: parents } },
            select: { id: true },
        });
        if (!children.length) break;
        const childIds = children.map((c) => c.id);
        all.push(...childIds);
        parents = childIds;
    }
    return all;
}

async function getNodeIdsForSections(sectionIds: number[]): Promise<number[]> {
    if (!sectionIds.length) return [];
    const nodes = await prisma.node.findMany({
        where: { sectionId: { in: sectionIds } },
        select: { id: true },
    });
    return nodes.map((n) => n.id);
}

// ─── Auto-pick question selection ────────────────────────────────────────

async function autoPickQuestionsInternal(
    userId: string,
    scopeType: string | null | undefined,
    scopeId: number | null | undefined,
    strategy: string | null | undefined,
    questionCount: number | null,
    difficultyRatioJson: any,
): Promise<number[]> {
    const scopeWhere = await expandScopeToQuestionWhere(scopeType, scopeId);

    if (strategy === "LOW_MASTERY") {
        const allQuestions = await prisma.question.findMany({
            where: { ...scopeWhere, isActive: true, answerDataJson: { not: Prisma.DbNull } },
            select: { id: true },
        });
        const allQuestionIds = allQuestions.map((q) => q.id);

        const masteryRecords = await prisma.userQuestionMastery.findMany({
            where: {
                userId,
                questionId: { in: allQuestionIds },
            },
            select: {
                questionId: true,
                level: true,
            },
        });
        const masteryMap = new Map<number, number>(
            masteryRecords.map((r) => [r.questionId, r.level]),
        );

        const lowPool = allQuestionIds.filter((id) => masteryMap.has(id) && (masteryMap.get(id) ?? 0) <= 2);
        const highPool = allQuestionIds.filter((id) => masteryMap.has(id) && (masteryMap.get(id) ?? 0) >= 3);

        const shuffledLow = shuffle(lowPool);
        const shuffledHigh = shuffle(highPool);

        const totalSeen = lowPool.length + highPool.length;
        const target = questionCount != null ? Math.min(questionCount, totalSeen) : totalSeen;
        if (target === 0) return [];

        const targetLow = Math.round(target * 0.8);
        const targetHigh = target - targetLow;

        const selectedIds: number[] = [];

        if (shuffledLow.length < targetLow) {
            selectedIds.push(...shuffledLow);
            const remaining = target - selectedIds.length;
            selectedIds.push(...shuffledHigh.slice(0, remaining));
        } else if (shuffledHigh.length < targetHigh) {
            selectedIds.push(...shuffledHigh);
            const remaining = target - selectedIds.length;
            selectedIds.push(...shuffledLow.slice(0, remaining));
        } else {
            selectedIds.push(...shuffledLow.slice(0, targetLow));
            selectedIds.push(...shuffledHigh.slice(0, targetHigh));
        }

        return shuffle(selectedIds);
    }

    if (strategy === "WRONG") {
        const allQuestions = await prisma.question.findMany({
            where: { ...scopeWhere, isActive: true, answerDataJson: { not: Prisma.DbNull } },
            select: { id: true },
        });
        const allQuestionIds = allQuestions.map((q) => q.id);

        const masteryRecords = await prisma.userQuestionMastery.findMany({
            where: {
                userId,
                questionId: { in: allQuestionIds },
            },
            select: {
                questionId: true,
                level: true,
                consecutiveCorrect: true,
            },
        });
        const masteryMap = new Map<number, { level: number; consecutiveCorrect: number }>(
            masteryRecords.map((r) => [r.questionId, { level: r.level, consecutiveCorrect: r.consecutiveCorrect }]),
        );

        const wrongPool = allQuestionIds.filter((id) => {
            const m = masteryMap.get(id);
            return m !== undefined && m.consecutiveCorrect === 0;
        });
        const fallbackPool = allQuestionIds.filter((id) => {
            const m = masteryMap.get(id);
            return m !== undefined && m.consecutiveCorrect >= 1;
        });

        const shuffledWrong = shuffle(wrongPool);
        const shuffledFallback = shuffle(fallbackPool);

        const totalSeen = wrongPool.length + fallbackPool.length;
        const target = questionCount != null ? Math.min(questionCount, totalSeen) : totalSeen;
        if (target === 0) return [];

        const targetWrong = Math.round(target * 0.8);
        const targetFallback = target - targetWrong;

        const selectedIds: number[] = [];

        if (shuffledWrong.length < targetWrong) {
            selectedIds.push(...shuffledWrong);
            const remaining = target - selectedIds.length;
            selectedIds.push(...shuffledFallback.slice(0, remaining));
        } else if (shuffledFallback.length < targetFallback) {
            selectedIds.push(...shuffledFallback);
            const remaining = target - selectedIds.length;
            selectedIds.push(...shuffledWrong.slice(0, remaining));
        } else {
            selectedIds.push(...shuffledWrong.slice(0, targetWrong));
            selectedIds.push(...shuffledFallback.slice(0, targetFallback));
        }

        return shuffle(selectedIds);
    }

    // Default strategy: BALANCED
    // 1. Get all active questions under the target scope
    const allQuestionsInScope = await prisma.question.findMany({
        where: { ...scopeWhere, isActive: true, answerDataJson: { not: Prisma.DbNull } },
        select: { id: true },
    });
    const totalAvailable = allQuestionsInScope.length;
    const target = questionCount != null ? Math.min(questionCount, totalAvailable) : totalAvailable;
    if (target === 0) return [];

    // 2. Fetch direct scope questions
    let directQuestions: number[] = [];
    if (scopeType && scopeId && scopeType !== "NATIONAL") {
        const qs = await prisma.question.findMany({
            where: {
                scopeType: scopeType as any,
                scopeId: scopeId,
                isActive: true,
                answerDataJson: { not: Prisma.DbNull },
            },
            select: { id: true },
        });
        directQuestions = shuffle(qs.map((q) => q.id));
    } else {
        const qs = await prisma.question.findMany({
            where: { isActive: true, answerDataJson: { not: Prisma.DbNull } },
            select: { id: true },
        });
        directQuestions = shuffle(qs.map((q) => q.id));
    }

    if (directQuestions.length >= target) {
        return directQuestions.slice(0, target);
    }

    const selected = [...directQuestions];
    const remainingTarget = target - selected.length;

    // Find direct child scopes
    const children: { type: string; id: number }[] = [];
    if (scopeType === "GRADE" && scopeId) {
        const topics = await prisma.topic.findMany({
            where: { gradeId: scopeId },
            select: { id: true },
        });
        topics.forEach((t) => children.push({ type: "TOPIC", id: t.id }));
    } else if (scopeType === "TOPIC" && scopeId) {
        const lessons = await prisma.lesson.findMany({
            where: { topicId: scopeId },
            select: { id: true },
        });
        lessons.forEach((l) => children.push({ type: "LESSON", id: l.id }));
    } else if (scopeType === "LESSON" && scopeId) {
        const sections = await prisma.section.findMany({
            where: { lessonId: scopeId, parentSectionId: null },
            select: { id: true },
        });
        sections.forEach((s) => children.push({ type: "SECTION", id: s.id }));
    } else if (scopeType === "SECTION" && scopeId) {
        const sections = await prisma.section.findMany({
            where: { parentSectionId: scopeId },
            select: { id: true },
        });
        sections.forEach((s) => children.push({ type: "SECTION", id: s.id }));
        const nodes = await prisma.node.findMany({
            where: { sectionId: scopeId },
            select: { id: true },
        });
        nodes.forEach((n) => children.push({ type: "NODE", id: n.id }));
    }

    if (children.length === 0) {
        return selected;
    }

    // Build pools for each child
    const childPools: { type: string; id: number; pool: number[] }[] = [];
    for (const child of children) {
        const childWhere = await expandScopeToQuestionWhere(child.type, child.id);
        const qs = await prisma.question.findMany({
            where: {
                ...childWhere,
                isActive: true,
                answerDataJson: { not: Prisma.DbNull },
                id: { notIn: selected.length ? selected : undefined },
            },
            select: { id: true },
        });
        const pool = shuffle(qs.map((q) => q.id));
        if (pool.length > 0) {
            childPools.push({ type: child.type, id: child.id, pool });
        }
    }

    if (childPools.length === 0) {
        return selected;
    }

    // Compute square-root weights and allocate targets
    const targets = childPools.map((cp) => {
        const s = cp.pool.length;
        const w = Math.sqrt(s);
        return { cp, w, target: 0 };
    });

    const sumW = targets.reduce((acc, t) => acc + t.w, 0);
    if (sumW > 0) {
        targets.forEach((t) => {
            t.target = Math.round(remainingTarget * (t.w / sumW));
        });
    }

    const allocatedDrawn: number[] = [];
    for (const t of targets) {
        const toDraw = Math.min(t.target, t.cp.pool.length);
        if (toDraw > 0) {
            const drawn = t.cp.pool.splice(0, toDraw);
            allocatedDrawn.push(...drawn);
        }
    }

    if (allocatedDrawn.length > remainingTarget) {
        selected.push(...shuffle(allocatedDrawn).slice(0, remainingTarget));
    } else {
        selected.push(...allocatedDrawn);
        const gap = target - selected.length;
        if (gap > 0) {
            const leftovers = targets.flatMap((t) => t.cp.pool);
            const shuffledLeftovers = shuffle(leftovers);
            selected.push(...shuffledLeftovers.slice(0, gap));
        }
    }

    return selected;
}

export async function autoPickQuestions(
    userId: string,
    scopeType: string | null | undefined,
    scopeId: number | null | undefined,
    strategy: string | null | undefined,
    questionCount: number | null,
    difficultyRatioJson: any,
): Promise<number[]> {
    const questions = await autoPickQuestionsInternal(
        userId,
        scopeType,
        scopeId,
        strategy,
        questionCount,
        difficultyRatioJson,
    );
    if (questions.length === 0 && (scopeType || scopeId)) {
        return autoPickQuestionsInternal(
            userId,
            null,
            null,
            strategy,
            questionCount,
            difficultyRatioJson,
        );
    }
    return questions;
}

// ─── Service class ──────────────────────────────────────────────────────

export class TestServiceV2 {
    // ── Check resumable ──────────────────────────────────────────────

    async checkResumable(userId: string): Promise<ResumableTestV2Response> {
        // Abandon stale PRACTICE logs
        await prisma.userTestLog.updateMany({
            where: {
                userId,
                purposeType: "PRACTICE",
                status: "IN_PROGRESS",
            },
            data: { status: "ABANDONED" },
        });

        // Find resumable EXAM
        const resumable = await prisma.userTestLog.findFirst({
            where: {
                userId,
                purposeType: "EXAM",
                status: "IN_PROGRESS",
                expiresAt: { gt: new Date() },
            },
            orderBy: { startedAt: "desc" },
        });

        if (!resumable) {
            // Check for expired exams that need status update
            await prisma.userTestLog.updateMany({
                where: {
                    userId,
                    purposeType: "EXAM",
                    status: "IN_PROGRESS",
                    expiresAt: { lte: new Date() },
                },
                data: { status: "EXPIRED" },
            });
            return { resumable: null, questions: [] };
        }

        const seq = (resumable.questionSequenceJson as number[]) ?? [];
        const questions = await this.fetchQuestionDtos(seq);
        const title = await resolveTestTitle(resumable);

        return { resumable: toLogDto(resumable, title), questions };
    }

    // ── Start test ───────────────────────────────────────────────────

    async startTest(
        userId: string,
        req: StartTestV2Request,
    ): Promise<StartTestV2Response> {
        // Abandon any existing active exams
        await prisma.userTestLog.updateMany({
            where: {
                userId,
                status: "IN_PROGRESS",
                purposeType: "EXAM",
            },
            data: { status: "ABANDONED" },
        });

        let sequence: number[] = [];
        let preset: any = null;
        let scopeType = req.scopeType ?? null;
        let scopeId = req.scopeId ?? null;
        let purposeType = req.purposeType ?? "PRACTICE";
        let testId: string | null = req.testId ?? null;
        let test: any = null;

        // ── Manual test path ──
        if (testId) {
            test = await prisma.test.findUnique({
                where: { id: testId },
                include: {
                    testQuestions: {
                        where: {
                            question: {
                                isActive: true,
                            },
                        },
                        orderBy: { position: "asc" },
                    },
                    preset: true,
                },
            });
            if (!test) throw serviceError("Test not found", "NOT_FOUND");

            preset = test.preset;
            scopeType = test.scopeType ?? scopeType;
            scopeId = test.scopeId ?? scopeId;
            if (preset) purposeType = preset.purposeType ?? purposeType;
        }

        // Enforce PRO-locking checks
        await this.assertUserCanAccessScope(userId, scopeType, scopeId, testId);

        // Enforce PRO-locking checks
        await this.assertUserCanAccessScope(userId, scopeType, scopeId, testId);

        // Resolve preset if not already loaded or if we need default fallback
        if (!preset) {
            if (req.presetId) {
                preset = await prisma.testPreset.findUnique({ where: { id: req.presetId } });
            }
            if (!preset && scopeType && purposeType) {
                const defaultEntry = await prisma.scopeTestPresetDefault.findUnique({
                    where: {
                        scopeType_purposeType: {
                            scopeType: scopeType as any,
                            purposeType: purposeType as any,
                        },
                    },
                    include: { defaultTestPreset: true },
                });
                preset = defaultEntry?.defaultTestPreset ?? null;
            }
            if (!preset && scopeType) {
                preset = await prisma.testPreset.findFirst({
                    where: {
                        purposeType: purposeType as any,
                    },
                });
            }
            if (!preset) {
                // Fallback: create an in-memory default
                preset = {
                    id: "default-fallback",
                    questionCount: 10,
                    passThreshold: 80,
                    timeLimit: purposeType === "EXAM" ? 15 : null,
                    difficultyRatioJson: { 1: 40, 2: 30, 3: 20, 4: 10 },
                    purposeType,
                };
            }
        }

        purposeType = preset.purposeType ?? purposeType;

        // Resolve final parameters (Request overrides -> Preset settings -> Default fallbacks)
        const validReqCount = (typeof req.questionCount === "number" && !isNaN(req.questionCount) && req.questionCount > 0) ? req.questionCount : undefined;
        const finalQuestionCount = validReqCount !== undefined ? validReqCount : (preset?.questionCount ?? 10);
        const finalPassThreshold = req.passThreshold !== undefined ? req.passThreshold : (preset?.passThreshold ?? test?.passThreshold ?? 80);
        const finalTimeLimit = req.timeLimit !== undefined ? req.timeLimit : (preset?.timeLimit ?? test?.timeLimit ?? null);
        const finalDifficultyRatioJson = req.difficultyRatioJson !== undefined ? req.difficultyRatioJson : (preset?.difficultyRatioJson ?? { 1: 40, 2: 30, 3: 20, 4: 10 });

        if (req.questionIds && Array.isArray(req.questionIds) && req.questionIds.length > 0) {
            const activeQuestions = await prisma.question.findMany({
                where: { id: { in: req.questionIds }, isActive: true },
                select: { id: true },
            });
            const activeIdSet = new Set(activeQuestions.map((q) => q.id));
            sequence = req.questionIds.filter((id) => activeIdSet.has(id));
        } else if (testId && test) {
            sequence = test.testQuestions.map((tq: any) => tq.questionId);
            if (finalQuestionCount !== null && sequence.length > finalQuestionCount) {
                sequence = sequence.slice(0, finalQuestionCount);
            }
        } else {
            sequence = await autoPickQuestions(
                userId,
                scopeType,
                scopeId,
                req.autoPickStrategy ?? "BALANCED",
                finalQuestionCount,
                finalDifficultyRatioJson,
            );
        }

        if (sequence.length === 0) {
            sequence = await autoPickQuestions(
                userId,
                null,
                null,
                req.autoPickStrategy ?? "BALANCED",
                finalQuestionCount,
                finalDifficultyRatioJson,
            );
        }

        if (sequence.length === 0) {
            throw serviceError("No questions available", "NO_QUESTIONS");
        }

        // Compute attempt number
        const prevCount = testId
            ? await prisma.userTestLog.count({ where: { testId, userId } })
            : await prisma.userTestLog.count({
                where: {
                    userId,
                    generatedFromPresetId: preset?.id !== "default-fallback" ? preset?.id : undefined,
                    scopeType: scopeType as any,
                    scopeId,
                    testId: null,
                },
            });

        const now = new Date();
        const expiresAt = finalTimeLimit ? new Date(now.getTime() + finalTimeLimit * 60000) : null;

        const log = await prisma.userTestLog.create({
            data: {
                score: 0,
                userId,
                testId: testId ?? undefined,
                purposeType: purposeType as any,
                status: "IN_PROGRESS",
                generatedFromPresetId:
                    preset?.id !== "default-fallback" ? preset?.id : undefined,
                scoreAwarded: 0,
                maxScore: 0,
                startedAt: now,
                expiresAt,
                attemptNumber: prevCount + 1,
                questionCount: sequence.length,
                passThreshold: finalPassThreshold,
                timeLimit: finalTimeLimit,
                scopeType: scopeType as any,
                scopeId,
                questionSequenceJson: sequence,
                currentQuestionIndex: 0,
                draftAnswerJson: [],
                timezoneOffsetMinutes: 0,
                autoPickStrategy: req.autoPickStrategy ? (req.autoPickStrategy as any) : "BALANCED",
            },
        });

        const questions = await this.fetchQuestionDtos(sequence);
        const title = await resolveTestTitle(log);

        return { userTestLog: toLogDto(log, title), questions };
    }

    // ── Update draft ─────────────────────────────────────────────────

    async updateDraft(
        logId: string,
        userId: string,
        draftAnswerJson: DraftAnswerEntry[],
    ): Promise<void> {
        const res = await prisma.userTestLog.updateMany({
            where: { id: logId, userId, status: "IN_PROGRESS" },
            data: { draftAnswerJson: draftAnswerJson as any },
        });
        if (res.count === 0) {
            throw serviceError("Test log not found or not in progress", "NOT_FOUND");
        }
    }

    // ── Finish test ──────────────────────────────────────────────────

    async finishTest(
        logId: string,
        userId: string,
        finalDraft: DraftAnswerEntry[],
        seenQuestionIds?: number[],
    ): Promise<FinishTestV2Response> {
        return await prisma.$transaction(async (tx) => {
            const log = await tx.userTestLog.findUnique({ where: { id: logId } });
            if (!log) throw serviceError("Test log not found", "NOT_FOUND");
            if (log.userId !== userId) throw serviceError("Unauthorized", "UNAUTHORIZED");
            if (log.status === "COMPLETED" || log.submittedAt) {
                throw serviceError("Test already submitted", "ALREADY_SUBMITTED");
            }

            // Atomic lock
            const updateRes = await tx.userTestLog.updateMany({
                where: { id: logId, submittedAt: null },
                data: { submittedAt: new Date(), draftAnswerJson: finalDraft as any },
            });
            if (updateRes.count === 0) {
                throw serviceError("Test already submitted", "ALREADY_SUBMITTED");
            }

            const seq = (log.questionSequenceJson as number[]) ?? [];
            const questions = await tx.question.findMany({
                where: { id: { in: seq } },
                select: {
                    id: true,
                    type: true,
                    difficulty: true,
                    promptText: true,
                    document: true,
                    explanation: true,
                    answerDataJson: true,
                },
            });

            // Score all questions
            const scoreResults = scoreAllQuestions(
                questions.map((q) => ({
                    id: q.id,
                    type: q.type,
                    answerDataJson: q.answerDataJson,
                })),
                finalDraft,
            );

            const totalScoreAwarded = scoreResults.reduce((a, r) => a + r.scoreAwarded, 0);
            const totalMaxScore = scoreResults.reduce((a, r) => a + r.maxScore, 0);
            const isPassed =
                totalMaxScore > 0
                    ? (totalScoreAwarded / totalMaxScore) * 100 >= (log.passThreshold ?? 80)
                    : false;

            // Create permanent UserAnswerLog entries & update mastery
            for (const r of scoreResults) {
                const draft = finalDraft.find((d) => d.questionId === r.questionId);
                await tx.userAnswerLog.create({
                    data: {
                        userTestLogId: logId,
                        questionId: r.questionId,
                        type: r.type as any,
                        answerDataJson: (draft?.answerData ?? {}) as any,
                        scoreAwarded: r.scoreAwarded,
                        maxScore: r.maxScore,
                        answeredAt: draft?.answeredAt ? new Date(draft.answeredAt) : new Date(),
                    },
                });

                let isAnswered = false;
                if (draft) {
                    if (r.type === "CHOOSE") {
                        const ans = draft.answerData as any;
                        isAnswered = Array.isArray(ans?.selectedOptions) && ans.selectedOptions.length > 0;
                    } else if (r.type === "FILL") {
                        const ans = draft.answerData as any;
                        isAnswered = typeof ans?.typedAnswer === "string" && ans.typedAnswer.trim() !== "";
                    } else if (r.type === "MATCH") {
                        const ans = draft.answerData as any;
                        isAnswered = Array.isArray(ans?.pairs) && ans.pairs.length > 0;
                    }
                }

                const isSeen = !seenQuestionIds || seenQuestionIds.includes(r.questionId);
                const shouldUpdateMastery = isSeen || isAnswered;

                if (shouldUpdateMastery) {
                    const mastery = await tx.userQuestionMastery.findUnique({
                        where: {
                            userId_questionId: { userId, questionId: r.questionId },
                        },
                    });

                    const currentLevel = mastery?.level ?? 0;
                    const currentConsecutive = mastery?.consecutiveCorrect ?? 0;

                    let nextLevel = currentLevel;
                    let nextConsecutive = currentConsecutive;

                    if (r.isCorrect) {
                        if (currentLevel === 0) {
                            nextLevel = 1;
                            nextConsecutive = 1;
                        } else {
                            if (currentConsecutive >= 1) {
                                nextLevel = Math.min(currentLevel + 1, 5);
                            }
                            nextConsecutive = currentConsecutive + 1;
                        }
                    } else {
                        nextLevel = Math.max(currentLevel - 1, 0);
                        nextConsecutive = 0;
                    }

                    await tx.userQuestionMastery.upsert({
                        where: {
                            userId_questionId: { userId, questionId: r.questionId },
                        },
                        update: {
                            level: nextLevel,
                            consecutiveCorrect: nextConsecutive,
                        },
                        create: {
                            userId,
                            questionId: r.questionId,
                            level: nextLevel,
                            consecutiveCorrect: nextConsecutive,
                        },
                    });
                }
            }

            // Update log with scores
            await tx.userTestLog.update({
                where: { id: logId },
                data: {
                    scoreAwarded: totalScoreAwarded,
                    maxScore: totalMaxScore,
                    isPassed,
                    status: "COMPLETED",
                    score: totalMaxScore > 0 ? Math.floor((totalScoreAwarded / totalMaxScore) * 100) : 0,
                },
            });

            // Reward + progress engine
            let consequences: any[] = [];
            if (isPassed) {
                // 1. Reward engine: test reward → streak → xp/gold application → tier check
                const rewardResult = await rewardEngine.processTestPassRewards(
                    userId,
                    log.testId,
                    log.scopeType,
                    log.scopeId,
                    log.purposeType,
                    logId,
                    tx,
                    log.autoPickStrategy,
                    log.questionCount ?? 10,
                );
                consequences.push(...rewardResult.consequences);

                // 2. Update test log with earned rewards (test portion only for display)
                await tx.userTestLog.update({
                    where: { id: logId },
                    data: {
                        xpEarned: rewardResult.totalXpGained,
                        goldEarned: rewardResult.totalGoldGained,
                    },
                });

                // 3. Progress engine (node completion etc.)
                const progressConsequences = await progressEngine.onTestPassed(
                    userId,
                    log.scopeType,
                    log.scopeId,
                    `Test attempt #${log.attemptNumber}`,
                    tx,
                );
                consequences.push(...progressConsequences);
            }

            // Build response
            const updatedLog = await tx.userTestLog.findUnique({ where: { id: logId } });
            const title = await resolveTestTitle(updatedLog);
            const answerLogs: UserAnswerLogV2Dto[] = scoreResults.map((r) => ({
                questionId: r.questionId,
                type: r.type,
                scoreAwarded: r.scoreAwarded,
                maxScore: r.maxScore,
            }));

            return {
                userTestLog: toLogDto(updatedLog, title),
                answerLogs,
                consequences,
            };
        }, {
            maxWait: 15000,
            timeout: 30000,
        });
    }

    // ── Abandon test ─────────────────────────────────────────────────

    async abandonTest(logId: string, userId: string): Promise<void> {
        const res = await prisma.userTestLog.updateMany({
            where: { id: logId, userId, status: "IN_PROGRESS" },
            data: { status: "ABANDONED" },
        });
        if (res.count === 0) {
            throw serviceError("Test log not found or not in progress", "NOT_FOUND");
        }
    }

    // ── History ──────────────────────────────────────────────────────

    async getHistory(
        userId: string,
        scopeType?: string,
        scopeId?: number,
        testId?: string,
    ): Promise<TestHistoryV2Response> {
        const where: any = { userId };
        if (testId) where.testId = testId;
        if (scopeType) where.scopeType = scopeType;
        if (scopeId != null) where.scopeId = scopeId;

        const logs = await prisma.userTestLog.findMany({
            where,
            orderBy: { startedAt: "desc" },
            take: 50,
        });

        const logsWithTitles = await Promise.all(
            logs.map(async (l) => {
                const title = await resolveTestTitle(l);
                return toLogDto(l, title);
            }),
        );

        return { logs: logsWithTitles };
    }

    // ── Attempt detail ───────────────────────────────────────────────

    async getAttemptDetail(
        logId: string,
        userId: string,
    ): Promise<TestAttemptDetailV2Response> {
        const log = await prisma.userTestLog.findUnique({ where: { id: logId } });
        if (!log) throw serviceError("Test log not found", "NOT_FOUND");
        if (log.userId !== userId) throw serviceError("Unauthorized", "UNAUTHORIZED");

        const answerLogRows = await prisma.userAnswerLog.findMany({
            where: { userTestLogId: logId },
            include: { question: true },
        });

        const answerLogs = answerLogRows.map((row) => ({
            questionId: row.questionId,
            type: row.type,
            userAnswerData: row.answerDataJson as any,
            scoreAwarded: row.scoreAwarded ?? 0,
            maxScore: row.maxScore ?? 0,
            correctAnswerData: (row.question.answerDataJson ?? {}) as unknown as AnswerData,
            question: toQuestionDto(row.question),
        }));

        const title = await resolveTestTitle(log);

        return { userTestLog: toLogDto(log, title), answerLogs };
    }

    // ── Get test info ────────────────────────────────────────────────
    async getTestInfo(
        userId: string,
        req: StartTestV2Request,
    ): Promise<TestInfoV2Response> {
        let preset: any = null;
        let scopeType = req.scopeType ?? null;
        let scopeId = req.scopeId ?? null;
        let purposeType = req.purposeType ?? "PRACTICE";
        let testId: string | null = req.testId ?? null;
        let test: any = null;

        // ── Manual test path ──
        if (testId) {
            test = await prisma.test.findUnique({
                where: { id: testId },
                include: {
                    testQuestions: {
                        where: {
                            question: {
                                isActive: true,
                            },
                        },
                    },
                    preset: true,
                },
            });
            if (!test) throw serviceError("Test not found", "NOT_FOUND");

            preset = test.preset;
            scopeType = test.scopeType ?? scopeType;
            scopeId = test.scopeId ?? scopeId;
            if (preset) purposeType = preset.purposeType ?? purposeType;
        }

        // Enforce PRO-locking checks
        await this.assertUserCanAccessScope(userId, scopeType, scopeId, testId);

        // Resolve preset if not already loaded or if we need default fallback
        if (!preset) {
            if (req.presetId) {
                preset = await prisma.testPreset.findUnique({ where: { id: req.presetId } });
            }
            if (!preset && scopeType && purposeType) {
                const defaultEntry = await prisma.scopeTestPresetDefault.findUnique({
                    where: {
                        scopeType_purposeType: {
                            scopeType: scopeType as any,
                            purposeType: purposeType as any,
                        },
                    },
                    include: { defaultTestPreset: true },
                });
                preset = defaultEntry?.defaultTestPreset ?? null;
            }
            if (!preset && scopeType) {
                preset = await prisma.testPreset.findFirst({
                    where: {
                        purposeType: purposeType as any,
                    },
                });
            }
            if (!preset) {
                preset = {
                    id: "default-fallback",
                    questionCount: 10,
                    passThreshold: 80,
                    timeLimit: purposeType === "EXAM" ? 15 : null,
                    difficultyRatioJson: { 1: 40, 2: 30, 3: 20, 4: 10 },
                    purposeType,
                };
            }
        }

        purposeType = preset.purposeType ?? purposeType;

        // Resolve final parameters (Request overrides -> Preset settings -> Default fallbacks)
        const validReqCount = (typeof req.questionCount === "number" && !isNaN(req.questionCount) && req.questionCount > 0) ? req.questionCount : undefined;
        const finalQuestionCount = validReqCount !== undefined ? validReqCount : (preset?.questionCount ?? 10);
        const finalPassThreshold = req.passThreshold !== undefined ? req.passThreshold : (preset?.passThreshold ?? test?.passThreshold ?? 80);
        const finalTimeLimit = req.timeLimit !== undefined ? req.timeLimit : (preset?.timeLimit ?? test?.timeLimit ?? null);
        const finalDifficultyRatioJson = req.difficultyRatioJson !== undefined ? req.difficultyRatioJson : (preset?.difficultyRatioJson ?? { 1: 40, 2: 30, 3: 20, 4: 10 });

        let questionCount = 0;
        if (req.questionIds && Array.isArray(req.questionIds) && req.questionIds.length > 0) {
            questionCount = req.questionIds.length;
        } else if (testId && test) {
            const sequenceLength = test.testQuestions.length;
            questionCount = finalQuestionCount !== null && sequenceLength > finalQuestionCount ? finalQuestionCount : sequenceLength;
        } else {
            const sequence = await autoPickQuestions(
                userId,
                scopeType,
                scopeId,
                req.autoPickStrategy ?? "BALANCED",
                finalQuestionCount,
                finalDifficultyRatioJson,
            );
            questionCount = sequence.length;
        }

        if (questionCount === 0) {
            const fallbackSeq = await autoPickQuestions(
                userId,
                null,
                null,
                req.autoPickStrategy ?? "BALANCED",
                finalQuestionCount,
                finalDifficultyRatioJson,
            );
            questionCount = fallbackSeq.length;
        }

        const mockLog = {
            testId,
            scopeType,
            scopeId,
            purposeType,
            autoPickStrategy: req.autoPickStrategy,
            generatedFromPresetId: preset?.id !== "default-fallback" ? preset?.id : undefined,
        };
        const title = await resolveTestTitle(mockLog);

        // Reward preview
        const rewardPreview = await rewardEngine.previewTestReward(
            testId,
            scopeType,
            scopeId,
            userId,
            purposeType,
            req.autoPickStrategy,
            questionCount,
        );

        // Compute attempt count and pass count
        const attemptCount = testId
            ? await prisma.userTestLog.count({ where: { testId, userId } })
            : await prisma.userTestLog.count({
                where: {
                    userId,
                    generatedFromPresetId: preset?.id !== "default-fallback" ? preset?.id : undefined,
                    scopeType: scopeType as any,
                    scopeId,
                    testId: null,
                },
            });

        const passCount = testId
            ? await prisma.userTestLog.count({ where: { testId, userId, isPassed: true } })
            : await prisma.userTestLog.count({
                where: {
                    userId,
                    generatedFromPresetId: preset?.id !== "default-fallback" ? preset?.id : undefined,
                    scopeType: scopeType as any,
                    scopeId,
                    testId: null,
                    isPassed: true,
                },
            });

        return {
            title,
            questionCount,
            timeLimit: finalTimeLimit,
            scopeType,
            scopeId,
            purposeType,
            goldReward: rewardPreview.gold,
            xpReward: rewardPreview.xp,
            attemptNumber: rewardPreview.attemptNumber,
            passThreshold: finalPassThreshold,
            attemptCount,
            passCount,
            itemsReward: rewardPreview.items,
        };
    }

    private async populateTestStats(
        tests: Array<{
            id: string;
            title: string;
            summary: string | null;
            isPro: boolean;
            imgUrl: string | null;
            testQuestions: { questionId: number }[];
        }>,
        userId?: string
    ): Promise<NationalTestDto[]> {
        if (!userId) {
            return tests.map((t) => ({
                id: t.id,
                title: t.title,
                summary: t.summary,
                isPro: t.isPro,
                imgUrl: t.imgUrl,
                passCount: 0,
                masteryPercentage: 0,
            }));
        }

        const questionIds = Array.from(new Set(tests.flatMap((t) => t.testQuestions.map((tq) => tq.questionId))));

        let masteryMap = new Map<number, number>();
        if (questionIds.length > 0) {
            const masteries = await prisma.userQuestionMastery.findMany({
                where: {
                    userId,
                    questionId: { in: questionIds },
                },
                select: {
                    questionId: true,
                    level: true,
                },
            });
            masteryMap = new Map(masteries.map((m) => [m.questionId, m.level]));
        }

        const passedLogs = await prisma.userTestLog.groupBy({
            by: ["testId"],
            where: {
                userId,
                testId: { in: tests.map((t) => t.id).filter(Boolean) as string[] },
                isPassed: true,
            },
            _count: {
                id: true,
            },
        });
        const passCountMap = new Map(passedLogs.map((log) => [log.testId, log._count.id]));

        return tests.map((t) => {
            const tqIds = t.testQuestions.map((tq) => tq.questionId);
            const totalQuestions = tqIds.length;

            let masteryPercentage = 0;
            if (totalQuestions > 0) {
                const totalLevel = tqIds.reduce((sum, qId) => sum + (masteryMap.get(qId) ?? 0), 0);
                masteryPercentage = Math.round((totalLevel / (totalQuestions * 5)) * 100);
            }

            return {
                id: t.id,
                title: t.title,
                summary: t.summary,
                isPro: t.isPro,
                imgUrl: t.imgUrl,
                passCount: passCountMap.get(t.id) ?? 0,
                masteryPercentage,
            };
        });
    }

    async getNationalTests(userId?: string): Promise<NationalTestDto[]> {
        const tests = await prisma.test.findMany({
            where: {
                isNationalTest: true,
            },
            select: {
                id: true,
                title: true,
                summary: true,
                isPro: true,
                imgUrl: true,
                testQuestions: {
                    select: {
                        questionId: true,
                    },
                },
            },
            orderBy: { title: "asc" },
        });

        return this.populateTestStats(tests, userId);
    }

    async getCuratedTestsByScope(
        userId?: string,
        scopeType?: string,
        scopeId?: number
    ): Promise<NationalTestDto[]> {
        if (!scopeType || !scopeId) return [];

        const tests = await prisma.test.findMany({
            where: {
                isNationalTest: false,
                scopeType: scopeType as any,
                scopeId,
            },
            select: {
                id: true,
                title: true,
                summary: true,
                isPro: true,
                imgUrl: true,
                testQuestions: {
                    select: {
                        questionId: true,
                    },
                },
            },
            orderBy: { title: "asc" },
        });

        return this.populateTestStats(tests, userId);
    }

    // ── Helpers ──────────────────────────────────────────────────────

    private async fetchQuestionDtos(ids: number[]): Promise<QuestionV2Dto[]> {
        if (!ids.length) return [];
        const questions = await prisma.question.findMany({
            where: { id: { in: ids }, isActive: true },
            select: {
                id: true,
                type: true,
                difficulty: true,
                promptText: true,
                document: true,
                explanation: true,
                answerDataJson: true,
            },
        });
        // Maintain sequence order
        const qMap = new Map(questions.map((q) => [q.id, q]));
        return ids.map((id) => qMap.get(id)).filter(Boolean).map(toQuestionDto);
    }

    async assertUserCanAccessScope(
        userId: string,
        scopeType: string | null | undefined,
        scopeId: number | null | undefined,
        testId?: string | null,
    ): Promise<void> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { isPro: true, proExpiresAt: true, role: true },
        });

        if (user?.role === "ADMIN" || user?.role === "SUPER_ADMIN") {
            return;
        }

        const isUserPro = user?.isPro === true && (!user.proExpiresAt || new Date(user.proExpiresAt) > new Date());

        // 1. Check Test direct PRO status
        if (testId) {
            const test = await prisma.test.findUnique({
                where: { id: testId },
                select: { isPro: true, scopeId: true, scopeType: true, gradeId: true, lessonId: true },
            });
            if (test) {
                if (test.isPro && !isUserPro) {
                    throw serviceError("Đề thi này chỉ dành cho tài khoản PRO. Vui lòng nâng cấp tài khoản để tiếp tục.", "PRO_REQUIRED");
                }

                // Get the effective scope from V2 scope or V1 fallbacks
                let checkScopeType = test.scopeType as string | null | undefined;
                let checkScopeId = test.scopeId;
                if (!checkScopeType || !checkScopeId) {
                    if (test.lessonId) {
                        checkScopeType = "LESSON";
                        checkScopeId = test.lessonId;
                    } else if (test.gradeId) {
                        checkScopeType = "GRADE";
                        checkScopeId = test.gradeId;
                    }
                }

                if (checkScopeType && checkScopeId) {
                    if (checkScopeType === "GRADE") {
                        const grade = await prisma.grade.findUnique({ where: { id: checkScopeId }, select: { isPro: true } });
                        if (grade?.isPro && !isUserPro) {
                            throw serviceError("Đề thi thuộc Khối lớp PRO. Vui lòng nâng cấp tài khoản để tiếp tục.", "PRO_REQUIRED");
                        }
                    } else if (checkScopeType === "LESSON") {
                        const lesson = await prisma.lesson.findUnique({
                            where: { id: checkScopeId },
                            select: { isPro: true, topic: { select: { grade: { select: { isPro: true } } } } },
                        });
                        const lessonIsPro = lesson?.isPro || (lesson as any)?.topic?.grade?.isPro;
                        if (lessonIsPro && !isUserPro) {
                            throw serviceError("Đề thi thuộc Bài học PRO. Vui lòng nâng cấp tài khoản để tiếp tục.", "PRO_REQUIRED");
                        }
                    } else if (checkScopeType === "TOPIC") {
                        const topic = await prisma.topic.findUnique({
                            where: { id: checkScopeId },
                            select: { grade: { select: { isPro: true } } },
                        });
                        if ((topic as any)?.grade?.isPro && !isUserPro) {
                            throw serviceError("Đề thi thuộc Chủ đề PRO. Vui lòng nâng cấp tài khoản để tiếp tục.", "PRO_REQUIRED");
                        }
                    } else if (checkScopeType === "SECTION") {
                        const section = await prisma.section.findUnique({
                            where: { id: checkScopeId },
                            select: { lesson: { select: { isPro: true, topic: { select: { grade: { select: { isPro: true } } } } } } },
                        });
                        const sectionIsPro = section?.lesson?.isPro || (section as any)?.lesson?.topic?.grade?.isPro;
                        if (sectionIsPro && !isUserPro) {
                            throw serviceError("Đề thi thuộc Phần học PRO. Vui lòng nâng cấp tài khoản để tiếp tục.", "PRO_REQUIRED");
                        }
                    } else if (checkScopeType === "NODE") {
                        const node = await prisma.node.findUnique({
                            where: { id: checkScopeId },
                            select: { section: { select: { lesson: { select: { isPro: true, topic: { select: { grade: { select: { isPro: true } } } } } } } } },
                        });
                        const nodeIsPro = node?.section?.lesson?.isPro || (node as any)?.section?.lesson?.topic?.grade?.isPro;
                        if (nodeIsPro && !isUserPro) {
                            throw serviceError("Đề thi thuộc Nội dung PRO. Vui lòng nâng cấp tài khoản để tiếp tục.", "PRO_REQUIRED");
                        }
                    }
                }
            }
        }

        // 2. Check general Scope direct PRO status
        if (scopeType && scopeId) {
            if (scopeType === "GRADE") {
                const grade = await prisma.grade.findUnique({ where: { id: scopeId }, select: { isPro: true } });
                if (grade?.isPro && !isUserPro) {
                    throw serviceError("Khối lớp này chỉ dành cho tài khoản PRO. Vui lòng nâng cấp tài khoản để tiếp tục.", "PRO_REQUIRED");
                }
            } else if (scopeType === "LESSON") {
                const lesson = await prisma.lesson.findUnique({
                    where: { id: scopeId },
                    select: { isPro: true, topic: { select: { grade: { select: { isPro: true } } } } },
                });
                if ((lesson?.isPro || (lesson as any)?.topic?.grade?.isPro) && !isUserPro) {
                    throw serviceError("Bài học này chỉ dành cho tài khoản PRO. Vui lòng nâng cấp tài khoản để tiếp tục.", "PRO_REQUIRED");
                }
            } else if (scopeType === "TOPIC") {
                const topic = await prisma.topic.findUnique({
                    where: { id: scopeId },
                    select: { grade: { select: { isPro: true } } },
                });
                if ((topic as any)?.grade?.isPro && !isUserPro) {
                    throw serviceError("Chủ đề này thuộc Khối lớp PRO. Vui lòng nâng cấp tài khoản để tiếp tục.", "PRO_REQUIRED");
                }
            } else if (scopeType === "SECTION") {
                const section = await prisma.section.findUnique({
                    where: { id: scopeId },
                    select: { lesson: { select: { isPro: true, topic: { select: { grade: { select: { isPro: true } } } } } } },
                });
                if ((section?.lesson?.isPro || (section as any)?.lesson?.topic?.grade?.isPro) && !isUserPro) {
                    throw serviceError("Phần học này chỉ dành cho tài khoản PRO. Vui lòng nâng cấp tài khoản để tiếp tục.", "PRO_REQUIRED");
                }
            } else if (scopeType === "NODE") {
                const node = await prisma.node.findUnique({
                    where: { id: scopeId },
                    select: { section: { select: { lesson: { select: { isPro: true, topic: { select: { grade: { select: { isPro: true } } } } } } } } },
                });
                if ((node?.section?.lesson?.isPro || (node as any)?.section?.lesson?.topic?.grade?.isPro) && !isUserPro) {
                    throw serviceError("Nội dung này chỉ dành cho tài khoản PRO. Vui lòng nâng cấp tài khoản để tiếp tục.", "PRO_REQUIRED");
                }
            }
        }
    }

    async getPracticeStats(userId: string, scopeType?: string, scopeId?: number) {
        const scopeWhere = await expandScopeToQuestionWhere(scopeType, scopeId);

        const wrongQuestionCount = await prisma.userQuestionMastery.count({
            where: {
                userId,
                consecutiveCorrect: 0,
                question: {
                    ...scopeWhere,
                    isActive: true,
                    answerDataJson: { not: Prisma.DbNull }
                }
            }
        });

        const answeredQuestionCount = await prisma.userQuestionMastery.count({
            where: {
                userId,
                question: {
                    ...scopeWhere,
                    isActive: true,
                    answerDataJson: { not: Prisma.DbNull }
                }
            }
        });

        return { wrongQuestionCount, answeredQuestionCount };
    }
}

export const testServiceV2 = new TestServiceV2();
