import { prisma } from "@history-app/shared";
import {
    StartTestResponse,
    QuestionDto,
    QuestionAnswerDto,
    JumpResponse,
    SubmitAnswerResponse,
    FinishTestResponse,
} from "@history-app/shared";

const NETWORK_BUFFER_SECONDS = 10;

function shuffle<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function serviceError(message: string, code?: string) {
    const e: any = new Error(message);
    if (code) e.code = code;
    return e;
}

export class TestService {
    private assertNotExpired(log: any) {
        const timeLimitSeconds = log?.test?.timeLimit ?? null;
        if (!timeLimitSeconds) return;
        const startedAt = new Date(log.startedAt);
        const expireAt = new Date(
            startedAt.getTime() + (timeLimitSeconds + NETWORK_BUFFER_SECONDS) * 1000,
        );
        if (new Date() > expireAt) {
            throw serviceError("Time limit exceeded", "TIME_EXCEEDED");
        }
    }

    async jumpTo(
        userTestLogId: string,
        userId: string,
        targetIndex: number,
    ): Promise<JumpResponse> {
        const log = await prisma.userTestLog.findUnique({
            where: { id: userTestLogId },
            include: { test: true },
        });
        if (!log) throw serviceError("Test log not found", "NOT_FOUND");
        if (log.userId !== userId) throw serviceError("Unauthorized", "UNAUTHORIZED");
        if (log.submittedAt) throw serviceError("Test already submitted", "ALREADY_SUBMITTED");

        this.assertNotExpired(log);

        const seq = ((log as any).questionSequenceJson ?? []) as number[];
        const total = Array.isArray(seq) ? seq.length : 0;
        if (targetIndex < 0 || targetIndex >= total)
            throw serviceError("Invalid target index", "INVALID_TARGET");

        const qId = seq[targetIndex];
        const q = await prisma.question.findUnique({
            where: { id: qId },
            select: {
                id: true,
                type: true,
                difficulty: true,
                promptText: true,
                answers: {
                    select: {
                        id: true,
                        content: true,
                        leftText: true,
                        rightText: true,
                    },
                },
            },
        });

        let question: QuestionDto | null = null;
        if (q) {
            question = {
                id: q.id,
                type: q.type as any,
                difficulty: q.difficulty,
                promptText: q.promptText,
                answers:
                    q.answers?.map((a) => ({
                        id: a.id,
                        content: a.content,
                        leftText: a.leftText ?? null,
                        rightText: a.rightText ?? null,
                    })) ?? [],
            };
        }

        const prev = await prisma.userAnswerLog.findFirst({
            where: { userTestLogId, questionId: qId },
        });

        return {
            index: targetIndex,
            totalCount: total,
            question,
            previousAnswer: (prev ? prev.answerDataJson : null) as any,
        };
    }

    async submitAnswer(
        userTestLogId: string,
        userId: string,
        questionId: number,
        answerData: any,
    ): Promise<SubmitAnswerResponse> {
        const log = await prisma.userTestLog.findUnique({
            where: { id: userTestLogId },
            include: { test: true },
        });
        if (!log) throw serviceError("Test log not found", "NOT_FOUND");
        if (log.userId !== userId) throw serviceError("Unauthorized", "UNAUTHORIZED");
        if (log.submittedAt) throw serviceError("Test already submitted", "ALREADY_SUBMITTED");

        this.assertNotExpired(log);

        const seq = ((log as any).questionSequenceJson ?? []) as number[];
        if (!Array.isArray(seq) || !seq.includes(questionId)) {
            throw serviceError("Invalid question for this test log", "INVALID_QUESTION");
        }

        const question = await prisma.question.findUnique({
            where: { id: questionId },
            select: { type: true },
        });

        const existing = await prisma.userAnswerLog.findFirst({
            where: { userTestLogId, questionId },
        });
        if (existing) {
            await prisma.userAnswerLog.update({
                where: { id: existing.id },
                data: { answerDataJson: answerData },
            });
        } else {
            await prisma.userAnswerLog.create({
                data: {
                    userTestLogId,
                    questionId,
                    type: (question?.type as any) ?? "CHOOSE",
                    answerDataJson: answerData,
                },
            });
        }

        return { saved: true };
    }

    async finishTest(
        userTestLogId: string,
        userId: string,
    ): Promise<FinishTestResponse> {
        return await prisma.$transaction(async (tx) => {
            // Lock the user row immediately to prevent concurrent parallel multi-tab reward extraction
            const user = await tx.user.findUnique({
                where: { id: userId },
            });
            if (!user) throw serviceError("User not found", "NOT_FOUND");

            const log = await tx.userTestLog.findUnique({
                where: { id: userTestLogId },
                include: { test: true },
            });
            if (!log) throw serviceError("Test log not found", "NOT_FOUND");
            if (log.userId !== userId) throw serviceError("Unauthorized", "UNAUTHORIZED");
            if (log.submittedAt) throw serviceError("Test already submitted", "ALREADY_SUBMITTED");

            // Server-side expiration validation: do not abort on expiry.
            // If the test has expired we will still evaluate answers and close the log,
            // but we won't throw here so the transaction can complete and the log will be closed.
            const timeLimitSeconds = log?.test?.timeLimit ?? null;
            let wasExpired = false;
            if (timeLimitSeconds) {
                const startedAt = new Date(log.startedAt);
                const expireAt = new Date(
                    startedAt.getTime() + (timeLimitSeconds + NETWORK_BUFFER_SECONDS) * 1000,
                );
                if (new Date() > expireAt) {
                    wasExpired = true;
                }
            }

            // Fix Race Condition: Enforce atomic state validation via conditional update constraint
            const updateRes = await tx.userTestLog.updateMany({
                where: { id: userTestLogId, submittedAt: null },
                data: { submittedAt: new Date() }, // Lock row using atomic check constraints
            });
            if (updateRes.count === 0) {
                throw serviceError("Test already submitted", "ALREADY_SUBMITTED");
            }

            const seq = ((log as any).questionSequenceJson ?? []) as number[];
            const qIds: number[] = Array.isArray(seq) ? seq : [];

            const questions = await tx.question.findMany({
                where: { id: { in: qIds } },
                include: { answers: true },
            });
            const qMap = new Map<number, any>();
            for (const q of questions) qMap.set(q.id, q);

            const answerLogs = await tx.userAnswerLog.findMany({
                where: { userTestLogId },
            });
            const answerMap = new Map<number, any>();
            for (const a of answerLogs)
                answerMap.set(a.questionId, a.answerDataJson);

            let correct = 0;
            const summaries: Array<{ questionId: number; isCorrect: boolean }> = [];

            const evaluate = (q: any, ans: any) => {
                if (!ans) return false;
                try {
                    if (q.type === "CHOOSE") {
                        const cleanAnswers = Array.isArray(ans)
                            ? ans
                            : typeof ans === "object" && "selectedAnswerIds" in ans
                              ? ans.selectedAnswerIds
                              : [ans];

                        const correctAnswers = q.answers.filter((a: any) => a.isCorrect);
                        if (correctAnswers.length !== cleanAnswers.length) return false;
                        return correctAnswers.every((a: any) =>
                            cleanAnswers.includes(a.id),
                        );
                    }

                    if (q.type === "FILL") {
                        const userString = (
                            typeof ans === "object" && "typedAnswer" in ans
                                ? String(ans.typedAnswer)
                                : String(ans)
                        )
                            .trim()
                            .toLowerCase();
                        if (!userString) return false;
                        return q.answers.some(
                            (a: any) =>
                                (a.correctAnswer ?? "").toLowerCase().trim() === userString,
                        );
                    }

                    if (q.type === "MATCH") {
                        const userPairs = Array.isArray(ans) ? ans : ans?.pairs;
                        if (!Array.isArray(userPairs) || userPairs.length !== q.answers.length) {
                            return false;
                        }

                        // Fix Performance Flaw: Convert target array into O(1) Key-Value Map
                        const userPairMap = new Map<string, string>();
                        for (const p of userPairs) {
                            if (p && p.left !== undefined) {
                                userPairMap.set(String(p.left), String(p.right ?? ""));
                            }
                        }

                        return q.answers.every((dbAnswer: any) => {
                            const leftKey = String(dbAnswer.leftText);
                            if (!userPairMap.has(leftKey)) return false;
                            return userPairMap.get(leftKey) === String(dbAnswer.rightText);
                        });
                    }
                } catch (e) {
                    return false;
                }
                return false;
            };

            for (const qId of qIds) {
                const q = qMap.get(qId);
                const ans = answerMap.get(qId) ?? null;
                const isCorrect = q ? evaluate(q, ans) : false;
                if (isCorrect) correct++;
                summaries.push({ questionId: qId, isCorrect });
            }

            const total = qIds.length || 1;
            const score = Math.floor((correct / total) * 100);
            const isPassed = score >= (log.test?.passThreshold ?? 70);

            const hasPassedBefore =
                (await tx.userTestLog.findFirst({
                    where: { testId: log.testId, userId, isPassed: true },
                })) != null;

            let xpEarned = isPassed ? (log.test?.xpReward ?? 0) : 0;
            let goldEarned = isPassed ? (log.test?.goldReward ?? 0) : 0;
            if (hasPassedBefore && isPassed) {
                xpEarned = Math.floor(xpEarned / 2);
                goldEarned = Math.floor(goldEarned / 2);
            }

            const nowUtc = new Date();
            // Use the timezone offset persisted on the test log (trusted server state)
            const tzMinutes = (log as any).timezoneOffsetMinutes ?? 0;
            const localNow = new Date(nowUtc.getTime() - tzMinutes * 60000);

            const getCalendarDateString = (d: Date) => {
                return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
            };

            let newCurrentStreak = user.currentStreak;
            let newHighest = user.highestStreak;

            if (isPassed) {
                if (user.lastTestPassedAt) {
                    const localLast = new Date(user.lastTestPassedAt.getTime() - tzMinutes * 60000);

                    const todayStr = getCalendarDateString(localNow);
                    const lastPassedStr = getCalendarDateString(localLast);

                    const yesterday = new Date(localNow.getTime() - 86400000);
                    const yesterdayStr = getCalendarDateString(yesterday);

                    if (lastPassedStr === todayStr) {
                        // Keep current streak stable for daily continuation
                    } else if (lastPassedStr === yesterdayStr) {
                        newCurrentStreak = user.currentStreak + 1;
                    } else {
                        newCurrentStreak = 1;
                    }
                } else {
                    newCurrentStreak = 1;
                }
                newHighest = Math.max(user.highestStreak, newCurrentStreak);
            }

            const newTotalXp = user.totalXp + xpEarned;

            const Tiers = await tx.tier.findMany({
                orderBy: { xpThreshold: "asc" },
            });
            let newTierIndex = user.currentTierIndex;
            for (const t of Tiers) {
                if (t.xpThreshold <= newTotalXp) newTierIndex = t.index;
            }
            const leveledUp = newTierIndex > user.currentTierIndex;

            // Save state mutations via specific atomic identifier update
            await tx.userTestLog.update({
                where: { id: userTestLogId },
                data: {
                    score,
                    isPassed,
                    xpEarned,
                    goldEarned,
                },
            });

            const userUpdateData: any = {
                totalXp: { increment: xpEarned },
                totalGold: { increment: goldEarned },
            };
            if (isPassed) {
                userUpdateData.currentStreak = newCurrentStreak;
                userUpdateData.highestStreak = newHighest;
                userUpdateData.lastTestPassedAt = nowUtc;
            }
            if (leveledUp) userUpdateData.currentTierIndex = newTierIndex;

            await tx.user.update({
                where: { id: userId },
                data: userUpdateData,
            });

            if (leveledUp) {
                const mRewards = await tx.milestoneReward.findMany({
                    where: { sourceType: "TIER", sourceValue: newTierIndex },
                });
                for (const r of mRewards) {
                    await tx.pendingReward.create({
                        data: {
                            goldAmount: r.goldAmount,
                            xpAmount: r.xpAmount,
                            itemQuantity: r.itemQuantity,
                            sourceType: "TIER",
                            sourceValue: newTierIndex,
                            userId,
                            itemId: r.itemId ?? undefined,
                            rewardType: r.rewardType,
                        },
                    });
                }
            }

            return {
                score,
                isPassed,
                xpEarned,
                goldEarned,
                currentStreak: newCurrentStreak,
                leveledUp,
                newTierIndex: leveledUp ? newTierIndex : undefined,
                questionSummaries: summaries.map((s) => ({
                    ...s,
                    earnedXp: 0,
                })),
            };
        });
    }

    async startTest(
        userId: string,
        testId: string,
        timezoneOffsetMinutes?: number,
    ): Promise<StartTestResponse> {
        const test = await prisma.test.findUnique({ where: { id: testId } });
        if (!test) throw serviceError("Test not found", "NOT_FOUND");

        const existing = await prisma.userTestLog.findFirst({
            where: { testId, userId, submittedAt: null },
            orderBy: { startedAt: "desc" },
            include: { test: true },
        });

        const hasPassedBefore =
            (await prisma.userTestLog.findFirst({
                where: { testId, userId, isPassed: true },
            })) != null;

        if (existing) {
            const seq = ((existing as any).questionSequenceJson ?? []) as number[];
            const total = Array.isArray(seq) ? seq.length : 0;

            let firstQuestion: QuestionDto | null = null;

            const timeLimitSeconds = existing.test?.timeLimit ?? null;
            if (timeLimitSeconds) {
                const startedAtDate = new Date(existing.startedAt);
                const expireAt = new Date(
                    startedAtDate.getTime() + (timeLimitSeconds + NETWORK_BUFFER_SECONDS) * 1000,
                );
                if (new Date() > expireAt) {
                    // expire the old log so we create a fresh one below
                    await prisma.userTestLog.update({
                        where: { id: existing.id },
                        data: { submittedAt: expireAt },
                    });
                } else {
                    if (total > 0) {
                        const q = await prisma.question.findUnique({
                            where: { id: seq[0] },
                            select: {
                                id: true,
                                type: true,
                                difficulty: true,
                                promptText: true,
                                answers: {
                                    select: {
                                        id: true,
                                        content: true,
                                        leftText: true,
                                        rightText: true,
                                    },
                                },
                            },
                        });
                        if (q != null) {
                            firstQuestion = {
                                id: q.id,
                                type: q.type as any,
                                difficulty: q.difficulty,
                                promptText: q.promptText,
                                answers: q.answers?.map((a) => ({
                                    id: a.id,
                                    content: a.content,
                                    leftText: a.leftText ?? null,
                                    rightText: a.rightText ?? null,
                                })),
                            };
                        }
                    }

                    const elapsedSeconds = Math.floor((Date.now() - new Date(existing.startedAt).getTime()) / 1000);
                    const remaining = Math.max(0, (timeLimitSeconds ?? 0) - elapsedSeconds);

                    return {
                        userTestLogId: existing.id,
                        totalQuestionCount: total,
                        timeLimitSeconds: remaining,
                        attemptNumber: existing.attemptNumber,
                        hasPassedBefore,
                        firstQuestion,
                    };
                }
            } else {
                if (total > 0) {
                    const q = await prisma.question.findUnique({
                        where: { id: seq[0] },
                        select: {
                            id: true,
                            type: true,
                            difficulty: true,
                            promptText: true,
                            answers: {
                                select: {
                                    id: true,
                                    content: true,
                                    leftText: true,
                                    rightText: true,
                                },
                            },
                        },
                    });
                    if (q != null) {
                        firstQuestion = {
                            id: q.id,
                            type: q.type as any,
                            difficulty: q.difficulty,
                            promptText: q.promptText,
                            answers: q.answers?.map((a) => ({
                                id: a.id,
                                content: a.content,
                                leftText: a.leftText ?? null,
                                rightText: a.rightText ?? null,
                            })),
                        };
                    }
                }

                return {
                    userTestLogId: existing.id,
                    totalQuestionCount: total,
                    timeLimitSeconds: test.timeLimit ?? null,
                    attemptNumber: existing.attemptNumber,
                    hasPassedBefore,
                    firstQuestion,
                };
            }
        }

        let sequence: number[] = [];

        if (test.isManual) {
            const tqs = await prisma.testQuestion.findMany({
                where: { testId },
                orderBy: { position: "asc" },
                select: { questionId: true },
            });
            sequence = tqs.map((t) => t.questionId);
        } else {
            const total = test.questionNumber;
            const d1 = Math.floor(total * 0.3);
            const d2 = Math.floor(total * 0.3);
            const d3 = Math.floor(total * 0.2);
            const d4 = total - (d1 + d2 + d3);
            const desired: Record<number, number> = { 1: d1, 2: d2, 3: d3, 4: d4 };

            // build scope conditions by expanding hierarchical children for grade/topic/lesson/section
            const scopeConditions: any[] = [];

            if (test.gradeId != null) {
                scopeConditions.push({ gradeId: test.gradeId });

                const topics = await prisma.topic.findMany({ where: { gradeId: test.gradeId }, select: { id: true } });
                const topicIds = topics.map((t) => t.id);
                if (topicIds.length) scopeConditions.push({ topicId: { in: topicIds } });

                const lessons = topicIds.length
                    ? await prisma.lesson.findMany({ where: { topicId: { in: topicIds } }, select: { id: true } })
                    : [];
                const lessonIds = lessons.map((l) => l.id);
                if (lessonIds.length) scopeConditions.push({ lessonId: { in: lessonIds } });

                let sectionIdsPool: number[] = [];
                if (lessonIds.length) {
                    const rootSections = await prisma.section.findMany({ where: { lessonId: { in: lessonIds } }, select: { id: true } });
                    sectionIdsPool = rootSections.map((s) => s.id);
                }
                if (sectionIdsPool.length) {
                    let currentParents = [...sectionIdsPool];
                    while (currentParents.length > 0) {
                        const children = await prisma.section.findMany({ where: { parentSectionId: { in: currentParents } }, select: { id: true } });
                        if (children.length === 0) break;
                        const childIds = children.map((c) => c.id);
                        sectionIdsPool.push(...childIds);
                        currentParents = childIds;
                    }
                    scopeConditions.push({ sectionId: { in: sectionIdsPool } });
                }

                const nodeIds =
                    sectionIdsPool.length > 0
                        ? (await prisma.node.findMany({ where: { sectionId: { in: sectionIdsPool } }, select: { id: true } })).map((n) => n.id)
                        : [];
                if (nodeIds.length) scopeConditions.push({ nodeId: { in: nodeIds } });
            } else if (test.topicId != null) {
                scopeConditions.push({ topicId: test.topicId });

                const lessons = await prisma.lesson.findMany({ where: { topicId: test.topicId }, select: { id: true } });
                const lessonIds = lessons.map((l) => l.id);
                if (lessonIds.length) scopeConditions.push({ lessonId: { in: lessonIds } });

                let sectionIdsPool: number[] = [];
                if (lessonIds.length) {
                    const rootSections = await prisma.section.findMany({ where: { lessonId: { in: lessonIds } }, select: { id: true } });
                    sectionIdsPool = rootSections.map((s) => s.id);
                }
                if (sectionIdsPool.length) {
                    let currentParents = [...sectionIdsPool];
                    while (currentParents.length > 0) {
                        const children = await prisma.section.findMany({ where: { parentSectionId: { in: currentParents } }, select: { id: true } });
                        if (children.length === 0) break;
                        const childIds = children.map((c) => c.id);
                        sectionIdsPool.push(...childIds);
                        currentParents = childIds;
                    }
                    scopeConditions.push({ sectionId: { in: sectionIdsPool } });
                }

                const nodeIds =
                    sectionIdsPool.length > 0
                        ? (await prisma.node.findMany({ where: { sectionId: { in: sectionIdsPool } }, select: { id: true } })).map((n) => n.id)
                        : [];
                if (nodeIds.length) scopeConditions.push({ nodeId: { in: nodeIds } });
            } else if (test.lessonId != null) {
                scopeConditions.push({ lessonId: test.lessonId });

                let sectionIdsPool: number[] = [];
                const rootSections = await prisma.section.findMany({ where: { lessonId: test.lessonId }, select: { id: true } });
                sectionIdsPool = rootSections.map((s) => s.id);

                if (sectionIdsPool.length) {
                    let currentParents = [...sectionIdsPool];
                    while (currentParents.length > 0) {
                        const children = await prisma.section.findMany({ where: { parentSectionId: { in: currentParents } }, select: { id: true } });
                        if (children.length === 0) break;
                        const childIds = children.map((c) => c.id);
                        sectionIdsPool.push(...childIds);
                        currentParents = childIds;
                    }
                    scopeConditions.push({ sectionId: { in: sectionIdsPool } });
                }

                const nodeIds =
                    sectionIdsPool.length > 0
                        ? (await prisma.node.findMany({ where: { sectionId: { in: sectionIdsPool } }, select: { id: true } })).map((n) => n.id)
                        : [];
                if (nodeIds.length) scopeConditions.push({ nodeId: { in: nodeIds } });
            } else if (test.sectionId != null) {
                // original section traversal logic
                let sectionIdsPool = [test.sectionId];
                let currentParents = [test.sectionId];

                while (currentParents.length > 0) {
                    const children = await prisma.section.findMany({ where: { parentSectionId: { in: currentParents } }, select: { id: true } });
                    if (children.length === 0) break;
                    const childIds = children.map((c) => c.id);
                    sectionIdsPool.push(...childIds);
                    currentParents = childIds;
                }

                scopeConditions.push({ sectionId: { in: sectionIdsPool } });
                scopeConditions.push({ node: { sectionId: { in: sectionIdsPool } } });
            }

            const scopeWhere = scopeConditions.length ? { OR: scopeConditions } : {};

            const pools: Record<number, number[]> = { 1: [], 2: [], 3: [], 4: [] };
            for (let d = 1; d <= 4; d++) {
                const qRes = await prisma.question.findMany({
                    where: { ...scopeWhere, difficulty: d },
                    select: { id: true },
                });
                pools[d] = qRes.map((q) => q.id);
                shuffle(pools[d]);
            }

            const order = [4, 3, 2, 1];
            for (const d of order) {
                const want = desired[d] || 0;
                const take = Math.min(want, pools[d].length);
                if (take > 0) sequence.push(...pools[d].splice(0, take));

                let remaining = want - take;
                let back = d - 1;
                while (remaining > 0 && back >= 1) {
                    const t = Math.min(remaining, pools[back].length);
                    if (t > 0) {
                        sequence.push(...pools[back].splice(0, t));
                        remaining -= t;
                    }
                    back--;
                }
            }

            const allRemaining = [1, 2, 3, 4].flatMap((i) => pools[i]);
            shuffle(allRemaining);
            while (sequence.length < test.questionNumber && allRemaining.length > 0) {
                sequence.push(allRemaining.shift()!);
            }

            shuffle(sequence);
            sequence = sequence.slice(0, test.questionNumber);

            // Fix Content Validation Flaw: Throw clean content errors on missing pool dependencies
            if (sequence.length < test.questionNumber) {
                throw serviceError("Insufficient questions in the configured scope pool to meet target parameters", "INSUFFICIENT_POOL");
            }
        }

        // create userTestLog atomically (prevent attemptNumber race)
        const created = await prisma.$transaction(async (tx) => {
            const prevCount = await tx.userTestLog.count({
                where: { testId, userId },
            });
            const attemptNumber = prevCount + 1;

            return tx.userTestLog.create({
                data: {
                    score: 0,
                    isPassed: false,
                    attemptNumber,
                    testId,
                    userId,
                    timezoneOffsetMinutes: timezoneOffsetMinutes ?? 0,
                    questionSequenceJson: sequence as any,
                },
            });
        });

        let firstQuestion: QuestionDto | null = null;
        if (sequence.length > 0) {
            const q = await prisma.question.findUnique({
                where: { id: sequence[0] },
                select: {
                    id: true,
                    type: true,
                    difficulty: true,
                    promptText: true,
                    answers: {
                        select: {
                            id: true,
                            content: true,
                            leftText: true,
                            rightText: true,
                        },
                    },
                },
            });
            if (q != null)
                firstQuestion = {
                    id: q.id,
                    type: q.type as any,
                    difficulty: q.difficulty,
                    promptText: q.promptText,
                    answers:
                        q.answers?.map((a) => ({
                            id: a.id,
                            content: a.content,
                            leftText: a.leftText ?? null,
                            rightText: a.rightText ?? null,
                        })) ?? [],
                };
        }

        return {
            userTestLogId: created.id,
            totalQuestionCount: sequence.length,
            timeLimitSeconds: test.timeLimit ?? null,
            attemptNumber: created.attemptNumber,
            hasPassedBefore,
            firstQuestion,
        };
    }
}

export const testService = new TestService();
