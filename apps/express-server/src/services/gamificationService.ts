// services/gamificationService.ts
import { prisma } from "@history-app/shared";
import { rewardEngine } from "./rewardEngine";

function getVnDateString(date: Date = new Date()): string {
    const vnTime = new Date(date.getTime() + 7 * 60 * 60 * 1000);
    return vnTime.toISOString().slice(0, 10);
}

export class GamificationService {
    async getLeaderboard(page = 1, limit = 20, sort: "xp" | "streak" = "xp") {
        const pageNum = Math.max(1, Math.floor(page));
        const pageSize = Math.max(1, Math.floor(limit));

        const total = await prisma.user.count({
            where: {
                isVerified: true,
                isHidden: false,
            },
        });

        const orderBy =
            sort === "streak"
                ? [
                      { currentStreak: "desc" as const },
                      { totalXp: "desc" as const },
                  ]
                : [
                      { totalXp: "desc" as const },
                      { currentStreak: "desc" as const },
                  ];

        const users = await prisma.user.findMany({
            where: {
                isVerified: true,
                isHidden: false,
            },
            orderBy,
            skip: (pageNum - 1) * pageSize,
            take: pageSize,
            select: {
                id: true,
                profileImgUrl: true,
                currentStreak: true,
                lastXpGainedAt: true,
                name: true,
                totalXp: true,
                tier: { select: { name: true, badgeImgUrl: true } } as any,
                userEquippedItems: {
                    where: { equipmentSlot: "AVT_FRAME" },
                    include: { itemDefinition: true },
                },
            },
        });

        const todayStr = getVnDateString(new Date());
        const entries = users.map((u: any) => {
            const lastXpStr = u.lastXpGainedAt ? getVnDateString(u.lastXpGainedAt) : null;
            const hasCompletedToday = lastXpStr === todayStr;
            return {
                id: u.id,
                avatarUrl: u.profileImgUrl ?? null,
                name: u.name,
                tierName: u.tier?.name ?? null,
                currentStreak: u.currentStreak ?? 0,
                hasCompletedToday,
                badgeImgUrl: u.tier?.badgeImgUrl ?? null,
                totalXp: u.totalXp,
                equippedFrameUrl: u.userEquippedItems.length > 0
                    ? u.userEquippedItems[0].itemDefinition.imgUrl
                    : null,
            };
        });

        return { entries, total, page: pageNum, pageSize };
    }

    async getUserPosition(
        userId: string,
        sort: "xp" | "streak" = "xp",
    ): Promise<number | null> {
        if (sort === "streak") {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { currentStreak: true, totalXp: true, isHidden: true } as any,
            });
            if (!user || (user as any).isHidden) return null;
            const higher = await prisma.user.count({
                where: {
                    isVerified: true,
                    isHidden: false,
                    OR: [
                        { currentStreak: { gt: (user as any).currentStreak } },
                        {
                            currentStreak: (user as any).currentStreak,
                            totalXp: { gt: (user as any).totalXp },
                        },
                    ],
                },
            });
            return higher + 1;
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { totalXp: true, currentStreak: true, isHidden: true } as any,
        });
        if (!user || (user as any).isHidden) return null;
        const higher = await prisma.user.count({
            where: {
                isVerified: true,
                isHidden: false,
                OR: [
                    { totalXp: { gt: (user as any).totalXp } },
                    {
                        totalXp: (user as any).totalXp,
                        currentStreak: { gt: (user as any).currentStreak },
                    },
                ],
            },
        });
        return higher + 1;
    }

    async getTiers() {
        const tiers = await prisma.tier.findMany({ orderBy: { index: "asc" } });

        const rewardRules = await prisma.rewardRule.findMany({
            where: {
                triggerType: "TIER_REACHED",
            },
            include: {
                rewardRuleItems: {
                    include: {
                        itemDefinition: true,
                    },
                },
            },
        });

        const rewardMap = new Map<string, typeof rewardRules[0]>();
        rewardRules.forEach((rule) => {
            if (rule.triggerTargetId) {
                rewardMap.set(rule.triggerTargetId, rule);
            }
        });

        return tiers.map((t) => {
            const rule = rewardMap.get(String(t.index));
            return {
                index: t.index,
                name: t.name,
                description: t.description ?? null,
                badgeImgUrl: t.badgeImgUrl ?? null,
                xpThreshold: t.xpThreshold,
                rewards: rule
                    ? {
                          xp: rule.xp,
                          gold: rule.gold,
                          items: rule.rewardRuleItems.map((rri) => ({
                              id: rri.itemDefinition.id,
                              name: rri.itemDefinition.name,
                              imgUrl: rri.itemDefinition.imgUrl,
                              quantity: rri.quantity,
                          })),
                      }
                    : null,
            };
        });
    }

    async getStreakInfo(userId?: string) {
        let currentStreak = 0;
        let highestStreak = 0;
        let hasCompletedToday = false;

        const now = new Date();
        const vnNow = new Date(now.getTime() + 7 * 60 * 60 * 1000);
        const todayIndex = (vnNow.getUTCDay() + 6) % 7; // 0 = Mon, 6 = Sun
        const monVn = new Date(vnNow);
        monVn.setUTCDate(vnNow.getUTCDate() - todayIndex);
        monVn.setUTCHours(0, 0, 0, 0);

        const monUtcQuery = new Date(monVn.getTime() - 7 * 60 * 60 * 1000);

        const weekDayNames = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
        const dateMap = new Map<string, number>();
        const dailyXp: { date: string; xp: number; dayName: string }[] = [];

        for (let i = 0; i < 7; i++) {
            const d = new Date(monVn);
            d.setUTCDate(monVn.getUTCDate() + i);
            const dStr = d.toISOString().slice(0, 10);
            dateMap.set(dStr, 0);
            dailyXp.push({ date: dStr, xp: 0, dayName: weekDayNames[i] });
        }

        if (userId) {
            await rewardEngine.checkStreakOnLogin(userId);

            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: {
                    currentStreak: true,
                    highestStreak: true,
                    lastXpGainedAt: true,
                    lastTestPassedAt: true,
                } as any,
            });

            if (user) {
                currentStreak = (user as any).currentStreak;
                highestStreak = (user as any).highestStreak;
            }

            const logs = await (prisma as any).userXpLog.findMany({
                where: {
                    userId,
                    createdAt: { gte: monUtcQuery },
                },
                select: { amount: true, createdAt: true },
            });

            logs.forEach((log: any) => {
                const dStr = getVnDateString(log.createdAt);
                if (dateMap.has(dStr)) {
                    dateMap.set(dStr, (dateMap.get(dStr) || 0) + log.amount);
                }
            });

            const todayStr = getVnDateString(now);
            const todayXp = dateMap.get(todayStr) || 0;
            hasCompletedToday = todayXp > 0;

            dailyXp.forEach((item) => {
                item.xp = dateMap.get(item.date) || 0;
            });
        }

        const streakRules = await prisma.rewardRule.findMany({
            where: {
                triggerType: "STREAK_REACHED",
            },
            include: {
                rewardRuleItems: {
                    include: {
                        itemDefinition: true,
                    },
                },
            },
        });

        let claimedRuleIds = new Set<number>();
        if (userId) {
            const logs = await prisma.userRewardLog.findMany({
                where: {
                    userId,
                    triggerType: "STREAK_REACHED",
                },
                select: { rewardRuleId: true },
            });
            claimedRuleIds = new Set(logs.map((l) => l.rewardRuleId));
        }

        const milestones = streakRules
            .map((rule) => {
                const day = rule.triggerTargetId ? parseInt(rule.triggerTargetId, 10) : 0;
                return {
                    id: rule.id,
                    day,
                    xp: rule.xp,
                    gold: rule.gold,
                    items: rule.rewardRuleItems.map((rri) => ({
                        id: rri.itemDefinition.id,
                        name: rri.itemDefinition.name,
                        imgUrl: rri.itemDefinition.imgUrl,
                        quantity: rri.quantity,
                    })),
                    isReached: currentStreak >= day || highestStreak >= day,
                    isClaimed: claimedRuleIds.has(rule.id),
                };
            })
            .sort((a, b) => a.day - b.day);

        const defaultMilestones = [3, 7, 14, 30, 60, 100];
        const finalMilestones =
            milestones.length > 0
                ? milestones
                : defaultMilestones.map((day) => ({
                      id: day,
                      day,
                      xp: day * 50,
                      gold: day * 10,
                      items: [],
                      isReached: currentStreak >= day || highestStreak >= day,
                      isClaimed: currentStreak >= day,
                  }));

        return {
            currentStreak,
            highestStreak,
            hasCompletedToday,
            dailyXp,
            milestones: finalMilestones,
        };
    }

    async getMonthlyStreakCalendar(userId: string, year: number, month: number) {
        const startOfMonthVn = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
        const startOfMonthUtc = new Date(startOfMonthVn.getTime() - 7 * 60 * 60 * 1000);
        const endOfMonthVn = new Date(Date.UTC(year, month, 0, 23, 59, 59));
        const endOfMonthUtc = new Date(endOfMonthVn.getTime() - 7 * 60 * 60 * 1000);

        const logs = await (prisma as any).userXpLog.findMany({
            where: {
                userId,
                createdAt: { gte: startOfMonthUtc, lte: endOfMonthUtc },
            },
            select: { amount: true, createdAt: true },
        });

        const dateMap = new Map<string, number>();
        logs.forEach((log: any) => {
            const dStr = getVnDateString(log.createdAt);
            dateMap.set(dStr, (dateMap.get(dStr) || 0) + log.amount);
        });

        const dailyXp: { date: string; xp: number }[] = [];
        const daysInMonth = endOfMonthVn.getUTCDate();

        for (let day = 1; day <= daysInMonth; day++) {
            const d = new Date(Date.UTC(year, month - 1, day));
            const dStr = d.toISOString().slice(0, 10);
            dailyXp.push({
                date: dStr,
                xp: dateMap.get(dStr) || 0,
            });
        }

        return {
            year,
            month,
            dailyXp,
        };
    }
}

export const gamificationService = new GamificationService();
