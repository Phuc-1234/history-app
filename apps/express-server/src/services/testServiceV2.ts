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
                if (grade) return `Lớp: ${grade.id}`;
                break;
            }
        }
    }
    
    if (log.generatedFromPresetId) {
        const preset = await prisma.testPreset.findUnique({
            where: { id: log.generatedFromPresetId },
            select: { name: true },
        });
        if (preset?.name) return preset.name;
    }

    return log.purposeType === "EXAM" ? "Bài thi tự do" : "Luyện tập tự do";
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

async function expandScopeToQuestionWhere(
    scopeType: string | null | undefined,
    scopeId: number | null | undefined,
): Promise<Prisma.QuestionWhereInput> {
    if (!scopeType || scopeType === "NATIONAL") return { isActive: true };

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

    if (conditions.length === 0) return { isActive: true };
    return { isActive: true, OR: conditions };
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

async function autoPickQuestions(
    scopeWhere: Prisma.QuestionWhereInput,
    questionCount: number | null,
    difficultyRatioJson: any,
): Promise<number[]> {
    // Parse difficulty ratio (default: {1:40, 2:30, 3:20, 4:10})
    const ratio: Record<number, number> = difficultyRatioJson ?? {
        1: 40,
        2: 30,
        3: 20,
        4: 10,
    };
    const totalRatio = Object.values(ratio).reduce((a, b) => a + b, 0) || 100;

    // Fetch all candidate question IDs grouped by difficulty
    const pools: Record<number, number[]> = { 1: [], 2: [], 3: [], 4: [] };
    for (let d = 1; d <= 4; d++) {
        const qs = await prisma.question.findMany({
            where: { ...scopeWhere, difficulty: d, answerDataJson: { not: Prisma.DbNull } },
            select: { id: true },
        });
        pools[d] = shuffle(qs.map((q) => q.id));
    }

    const totalAvailable = Object.values(pools).reduce((a, b) => a + b.length, 0);

    // If questionCount is null, take all
    if (questionCount == null) {
        const all = [1, 2, 3, 4].flatMap((d) => pools[d]);
        return shuffle(all);
    }

    const target = Math.min(questionCount, totalAvailable);
    if (target === 0) return [];

    // Desired count per difficulty
    const desired: Record<number, number> = {};
    for (let d = 1; d <= 4; d++) {
        desired[d] = Math.floor((target * (ratio[d] ?? 0)) / totalRatio);
    }
    // Fill remainder
    let assigned = Object.values(desired).reduce((a, b) => a + b, 0);
    for (let d = 1; assigned < target && d <= 4; d++) {
        desired[d]++;
        assigned++;
    }

    const sequence: number[] = [];

    // Take from each difficulty, overflow to neighbors
    for (const d of [4, 3, 2, 1]) {
        const want = desired[d] || 0;
        const take = Math.min(want, pools[d].length);
        if (take > 0) sequence.push(...pools[d].splice(0, take));
        let remaining = want - take;
        let fallback = d - 1;
        while (remaining > 0 && fallback >= 1) {
            const t = Math.min(remaining, pools[fallback].length);
            if (t > 0) {
                sequence.push(...pools[fallback].splice(0, t));
                remaining -= t;
            }
            fallback--;
        }
    }

    // Fill any remaining slots
    const leftover = [1, 2, 3, 4].flatMap((d) => pools[d]);
    while (sequence.length < target && leftover.length > 0) {
        sequence.push(leftover.shift()!);
    }

    return shuffle(sequence.slice(0, target));
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
        // Block if user has an active test
        const active = await prisma.userTestLog.findFirst({
            where: {
                userId,
                status: "IN_PROGRESS",
                purposeType: "EXAM",
                expiresAt: { gt: new Date() },
            },
        });
        if (active) {
            throw serviceError(
                "You have an unfinished exam. Resume or abandon it first.",
                "ACTIVE_TEST_EXISTS",
            );
        }

        let sequence: number[] = [];
        let preset: any = null;
        let scopeType = req.scopeType ?? null;
        let scopeId = req.scopeId ?? null;
        let purposeType = req.purposeType ?? "PRACTICE";
        let testId: string | null = req.testId ?? null;

        // ── Manual test path ──
        if (testId) {
            const test = await prisma.test.findUnique({
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

            sequence = test.testQuestions.map((tq) => tq.questionId);
        } else {
            // ── Auto-pick path ──
            // Resolve preset
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

            purposeType = preset.purposeType ?? purposeType;

            const scopeWhere = await expandScopeToQuestionWhere(scopeType, scopeId);
            sequence = await autoPickQuestions(
                scopeWhere,
                preset.questionCount,
                preset.difficultyRatioJson,
            );

            if (sequence.length === 0) {
                throw serviceError("No questions available in this scope", "NO_QUESTIONS");
            }
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
        const timeLimit = preset?.timeLimit ?? null;
        const expiresAt = timeLimit ? new Date(now.getTime() + timeLimit * 60000) : null;

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
                passThreshold: preset?.passThreshold ?? 80,
                timeLimit,
                scopeType: scopeType as any,
                scopeId,
                questionSequenceJson: sequence,
                currentQuestionIndex: 0,
                draftAnswerJson: [],
                timezoneOffsetMinutes: 0,
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

            // Create permanent UserAnswerLog entries
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
                    logId,
                    tx,
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
                userAnswerData: r.userAnswerData,
                scoreAwarded: r.scoreAwarded,
                maxScore: r.maxScore,
                correctAnswerData: r.correctAnswerData,
            }));

            return {
                userTestLog: toLogDto(updatedLog, title),
                answerLogs,
                consequences,
            };
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
        let questionCount = 0;

        // ── Manual test path ──
        if (testId) {
            const test = await prisma.test.findUnique({
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
            questionCount = test.testQuestions.length;
        } else {
            // ── Auto-pick path ──
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

            purposeType = preset.purposeType ?? purposeType;

            const scopeWhere = await expandScopeToQuestionWhere(scopeType, scopeId);
            const sequence = await autoPickQuestions(
                scopeWhere,
                preset.questionCount,
                preset.difficultyRatioJson,
            );
            questionCount = sequence.length;
        }

        const mockLog = {
            testId,
            scopeType,
            scopeId,
            purposeType,
            generatedFromPresetId: preset?.id !== "default-fallback" ? preset?.id : undefined,
        };
        const title = await resolveTestTitle(mockLog);
        const timeLimit = preset?.timeLimit ?? null;

        // Reward preview
        const rewardPreview = await rewardEngine.previewTestReward(
            testId,
            scopeType,
            scopeId,
            userId,
        );

        return {
            title,
            questionCount,
            timeLimit,
            scopeType,
            scopeId,
            purposeType,
            goldReward: rewardPreview.gold,
            xpReward: rewardPreview.xp,
            attemptNumber: rewardPreview.attemptNumber,
        };
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
}

export const testServiceV2 = new TestServiceV2();
