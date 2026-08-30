import { prisma } from "@history-app/shared";
import { pushNotificationService } from "./pushNotificationService";

const db = prisma as any;

export type ReminderCategory = "LESSON" | "STREAK" | "TIER" | "TEST";

export interface ReminderPayload {
    category: ReminderCategory;
    title: string;
    body: string;
    targetId: string | null;
    route: string;
    sideIcon: string;
}

function getVnDateString(date: Date = new Date()): string {
    const vnTime = new Date(date.getTime() + 7 * 60 * 60 * 1000);
    return vnTime.toISOString().slice(0, 10);
}

function getVnTimeString(date: Date = new Date()): string {
    const vnTime = new Date(date.getTime() + 7 * 60 * 60 * 1000);
    const hours = String(vnTime.getUTCHours()).padStart(2, "0");
    const minutes = String(vnTime.getUTCMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
}

const CATEGORY_ORDER: ReminderCategory[] = ["LESSON", "STREAK", "TIER", "TEST"];

export class StudyReminderService {
    /**
     * Get user's reminder settings
     */
    async getReminderSettings(userId: string): Promise<{ isEnabled: boolean; times: string[] }> {
        const record = await db.userStudyReminder.findUnique({
            where: { userId },
        });

        if (!record) {
            return {
                isEnabled: false,
                times: ["20:00"],
            };
        }

        const times = Array.isArray(record.times)
            ? (record.times as string[])
            : typeof record.times === "string"
            ? JSON.parse(record.times)
            : ["20:00"];

        return {
            isEnabled: record.isEnabled,
            times,
        };
    }

    /**
     * Upsert user's reminder settings
     */
    async updateReminderSettings(
        userId: string,
        isEnabled: boolean,
        times: string[]
    ): Promise<{ isEnabled: boolean; times: string[] }> {
        // Validate and clean times (format HH:mm)
        const validTimes = Array.from(
            new Set(
                (times || [])
                    .filter((t) => typeof t === "string" && /^\d{2}:\d{2}$/.test(t))
                    .sort()
            )
        );

        const cleanedTimes = validTimes.length > 0 ? validTimes : ["20:00"];

        const updated = await db.userStudyReminder.upsert({
            where: { userId },
            create: {
                userId,
                isEnabled,
                times: cleanedTimes,
            },
            update: {
                isEnabled,
                times: cleanedTimes,
            },
        });

        const resultTimes = Array.isArray(updated.times)
            ? (updated.times as string[])
            : typeof updated.times === "string"
            ? JSON.parse(updated.times)
            : cleanedTimes;

        return {
            isEnabled: updated.isEnabled,
            times: resultTimes,
        };
    }

    /**
     * Category 1: tiếp tục học (LESSON)
     * Finds lesson with highest incomplete progress percentage (< 100%)
     */
    private async evaluateLessonCategory(userId: string): Promise<ReminderPayload | null> {
        try {
            const allLessons = await db.lesson.findMany({
                where: {
                    topic: {
                        grade: { state: "PUBLIC" },
                    },
                },
                include: {
                    sections: {
                        include: {
                            nodes: {
                                select: { id: true },
                            },
                        },
                    },
                },
                orderBy: [{ topic: { position: "asc" } }, { position: "asc" }],
            });

            if (!allLessons || allLessons.length === 0) return null;

            const allNodeIds: number[] = [];
            const lessonNodeMap = new Map<number, number[]>();

            for (const l of allLessons) {
                const nodeIds: number[] = [];
                for (const sec of l.sections) {
                    for (const node of sec.nodes) {
                        nodeIds.push(node.id);
                        allNodeIds.push(node.id);
                    }
                }
                lessonNodeMap.set(l.id, nodeIds);
            }

            const completedNodeSet = new Set<number>();
            if (allNodeIds.length > 0) {
                const completed = await db.userNodeProgress.findMany({
                    where: {
                        userId,
                        nodeId: { in: allNodeIds },
                        nodeCompletedAt: { not: null },
                    },
                    select: { nodeId: true },
                });
                for (const c of completed) {
                    completedNodeSet.add(c.nodeId);
                }
            }

            const progressList = allLessons.map((l: any) => {
                const nodeIds = lessonNodeMap.get(l.id) ?? [];
                const total = nodeIds.length;
                const done = nodeIds.filter((id) => completedNodeSet.has(id)).length;
                const pct = total > 0 ? done / total : 0;
                return { lesson: l, total, done, pct };
            });

            // Filter incomplete lessons (< 100%)
            const incomplete = progressList.filter((item: any) => item.pct < 1);
            if (incomplete.length === 0) return null;

            // Sort: highest percentage first (> 0%), then by topic/lesson position
            incomplete.sort((a: any, b: any) => {
                if (b.pct !== a.pct) return b.pct - a.pct;
                if (b.done !== a.done) return b.done - a.done;
                return 0;
            });

            const targetItem = incomplete[0];
            const percentNumber = Math.round(targetItem.pct * 100);

            const bodyText =
                percentNumber > 0
                    ? `Tiếp tục bài học "${targetItem.lesson.name}" (đã hoàn thành ${percentNumber}%) ngay hôm nay nhé!`
                    : `Bắt đầu bài học "${targetItem.lesson.name}" để tích lũy thêm kiến thức lịch sử!`;

            return {
                category: "LESSON",
                title: "Nhắc nhở học tập",
                body: bodyText,
                targetId: String(targetItem.lesson.id),
                route: `/(3_4_lessons)/lesson/${targetItem.lesson.id}`,
                sideIcon: "book-outline",
            };
        } catch (error) {
            console.error("[StudyReminder] Error evaluating lesson category:", error);
            return null;
        }
    }

    /**
     * Category 2: streak (STREAK)
     * Skipped if user already lit the streak flame today (lastXpGainedAt is today in UTC+7)
     */
    private async evaluateStreakCategory(userId: string): Promise<ReminderPayload | null> {
        try {
            const user = await db.user.findUnique({
                where: { id: userId },
                select: { currentStreak: true, lastXpGainedAt: true },
            });

            if (!user) return null;

            const todayVn = getVnDateString(new Date());
            const lastXpDate = user.lastXpGainedAt ? getVnDateString(new Date(user.lastXpGainedAt)) : null;

            // SKIP if user already gained XP today
            if (lastXpDate === todayVn) {
                console.log(`[StudyReminder] Streak category skipped for user ${userId}: already lit today.`);
                return null;
            }

            const currentStreak = user.currentStreak ?? 0;
            const bodyText =
                currentStreak > 0
                    ? `Duy trì chuỗi ${currentStreak} ngày liên tục! Vào học ngay hôm nay để không bị gián đoạn!`
                    : `Bắt đầu chuỗi học tập mới hôm nay để tích lũy điểm thưởng!`;

            return {
                category: "STREAK",
                title: "Nhắc nhở học tập",
                body: bodyText,
                targetId: "streak",
                route: "/(tabs)/home?openStreak=true",
                sideIcon: "flame-outline",
            };
        } catch (error) {
            console.error("[StudyReminder] Error evaluating streak category:", error);
            return null;
        }
    }

    /**
     * Category 3: tier + xp (TIER)
     * Skipped if max tier (no higher tier available)
     */
    private async evaluateTierCategory(userId: string): Promise<ReminderPayload | null> {
        try {
            const user = await db.user.findUnique({
                where: { id: userId },
                select: { totalXp: true, currentTierIndex: true },
            });

            if (!user) return null;

            const nextTier = await db.tier.findFirst({
                where: {
                    index: { gt: user.currentTierIndex },
                },
                orderBy: { index: "asc" },
            });

            // SKIP if user is at max tier
            if (!nextTier) {
                console.log(`[StudyReminder] Tier category skipped for user ${userId}: max tier reached.`);
                return null;
            }

            const xpNeeded = Math.max(0, nextTier.xpThreshold - user.totalXp);
            const bodyText = `Chỉ còn ${xpNeeded} XP nữa là đạt danh hiệu ${nextTier.name}! Cố gắng học tập hôm nay nhé!`;

            return {
                category: "TIER",
                title: "Nhắc nhở học tập",
                body: bodyText,
                targetId: String(nextTier.index),
                route: "/(tabs)/9_1_leaderboard",
                sideIcon: "trophy-outline",
            };
        } catch (error) {
            console.error("[StudyReminder] Error evaluating tier category:", error);
            return null;
        }
    }

    /**
     * Category 4: đề (TEST)
     * Finds a test with low mastery level (< 60% or lowest score)
     */
    private async evaluateTestCategory(userId: string): Promise<ReminderPayload | null> {
        try {
            const tests = await db.test.findMany({
                where: {
                    testQuestions: { some: {} },
                },
                include: {
                    testQuestions: {
                        select: { questionId: true },
                    },
                },
                take: 30,
            });

            if (!tests || tests.length === 0) return null;

            const allQuestionIds: number[] = [];
            tests.forEach((t: any) => {
                t.testQuestions.forEach((tq: any) => allQuestionIds.push(tq.questionId));
            });

            const masteries = await db.userQuestionMastery.findMany({
                where: {
                    userId,
                    questionId: { in: allQuestionIds },
                },
                select: { questionId: true, level: true },
            });

            const masteryMap = new Map<number, number>(
                masteries.map((m: any) => [m.questionId, m.level])
            );

            const testScores = tests.map((t: any) => {
                const totalQ = t.testQuestions.length;
                if (totalQ === 0) return { test: t, masteryPct: 0 };
                const totalLevel = t.testQuestions.reduce(
                    (sum: number, tq: any) => sum + (masteryMap.get(tq.questionId) ?? 0),
                    0
                );
                const masteryPct = Math.round((totalLevel / (totalQ * 5)) * 100);
                return { test: t, masteryPct };
            });

            // Sort ascending by masteryPct (lowest mastery first)
            testScores.sort((a: any, b: any) => a.masteryPct - b.masteryPct);

            const chosen = testScores[0];
            const bodyText =
                chosen.masteryPct > 0
                    ? `Ôn luyện lại đề "${chosen.test.title}" (mức độ thành thạo ${chosen.masteryPct}%) để cải thiện điểm số nhé!`
                    : `Thử sức với bài thi "${chosen.test.title}" để kiểm tra kiến thức của bạn!`;

            return {
                category: "TEST",
                title: "Nhắc nhở học tập",
                body: bodyText,
                targetId: chosen.test.id,
                route: `/(6_tests)/6_2_ques_choose?testId=${chosen.test.id}`,
                sideIcon: "clipboard-outline",
            };
        } catch (error) {
            console.error("[StudyReminder] Error evaluating test category:", error);
            return null;
        }
    }

    /**
     * Generate dynamic payload cycling through the 4 categories one by one with skip rules
     */
    async generateReminderPayload(userId: string): Promise<ReminderPayload> {
        // Retrieve last category if available
        const reminderRecord = await db.userStudyReminder.findUnique({
            where: { userId },
            select: { lastCategory: true },
        });

        const lastCat = (reminderRecord?.lastCategory as ReminderCategory) || "TEST";
        const lastIndex = CATEGORY_ORDER.indexOf(lastCat);

        // Sequence of categories to evaluate starting after lastCategory
        const evaluationSequence: ReminderCategory[] = [];
        for (let i = 1; i <= CATEGORY_ORDER.length; i++) {
            const nextIdx = (lastIndex + i) % CATEGORY_ORDER.length;
            evaluationSequence.push(CATEGORY_ORDER[nextIdx]);
        }

        let selectedPayload: ReminderPayload | null = null;

        for (const cat of evaluationSequence) {
            if (cat === "LESSON") {
                selectedPayload = await this.evaluateLessonCategory(userId);
            } else if (cat === "STREAK") {
                selectedPayload = await this.evaluateStreakCategory(userId);
            } else if (cat === "TIER") {
                selectedPayload = await this.evaluateTierCategory(userId);
            } else if (cat === "TEST") {
                selectedPayload = await this.evaluateTestCategory(userId);
            }

            if (selectedPayload) {
                break;
            }
        }

        // Fallback default if all skipped
        if (!selectedPayload) {
            selectedPayload = {
                category: "LESSON",
                title: "Nhắc nhở học tập",
                body: "Đã đến giờ học tập hôm nay! Hãy dành ít phút tích lũy kiến thức lịch sử nhé!",
                targetId: null,
                route: "/(tabs)/2_1_lessons",
                sideIcon: "book-outline",
            };
        }

        // Record last category
        await db.userStudyReminder.upsert({
            where: { userId },
            create: {
                userId,
                isEnabled: true,
                times: ["20:00"],
                lastCategory: selectedPayload.category,
            },
            update: {
                lastCategory: selectedPayload.category,
            },
        });

        return selectedPayload;
    }

    /**
     * Send study reminder to a user: creates DB notification and pushes via FCM
     */
    async sendReminder(userId: string): Promise<ReminderPayload> {
        const payload = await this.generateReminderPayload(userId);

        // 1. Save in-app notification to DB
        await db.notification.create({
            data: {
                userId,
                type: `STUDY_REMINDER_${payload.category}`,
                targetId: payload.targetId,
                title: payload.title,
                body: payload.body,
            },
        });

        // 2. Multicast push via Firebase Admin
        await pushNotificationService.sendToUser(userId, payload.title, payload.body, {
            type: "STUDY_REMINDER",
            category: payload.category,
            targetId: payload.targetId || "",
            route: payload.route,
            sideIcon: payload.sideIcon,
        });

        console.log(
            `[StudyReminder] Sent reminder to user ${userId} [Category: ${payload.category}]: ${payload.body}`
        );

        return payload;
    }

    /**
     * Checks all enabled reminders matching current HH:mm in UTC+7
     */
    async checkAndSendDueReminders(): Promise<number> {
        const now = new Date();
        const currentTimeStr = getVnTimeString(now); // "HH:mm"
        const currentSlot = `${getVnDateString(now)}_${currentTimeStr}`; // "2026-08-30_20:00"

        const enabledReminders = await db.userStudyReminder.findMany({
            where: { isEnabled: true },
        });

        let sentCount = 0;

        for (const rem of enabledReminders) {
            const times = Array.isArray(rem.times)
                ? (rem.times as string[])
                : typeof rem.times === "string"
                ? JSON.parse(rem.times)
                : [];

            if (times.includes(currentTimeStr)) {
                if (rem.lastSentSlot !== currentSlot) {
                    try {
                        await this.sendReminder(rem.userId);
                        await db.userStudyReminder.update({
                            where: { id: rem.id },
                            data: { lastSentSlot: currentSlot },
                        });
                        sentCount++;
                    } catch (err) {
                        console.error(`[StudyReminder] Failed to send reminder for user ${rem.userId}:`, err);
                    }
                }
            }
        }

        if (sentCount > 0) {
            console.log(`[StudyReminder] Successfully dispatched ${sentCount} reminders for slot ${currentSlot}`);
        }

        return sentCount;
    }
}

export const studyReminderService = new StudyReminderService();
