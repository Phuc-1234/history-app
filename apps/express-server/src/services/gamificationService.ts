// services/gamificationService.ts
import { prisma } from "@history-app/shared";

export class GamificationService {
    async getLeaderboard(page = 1, limit = 20, sort: "xp" | "streak" = "xp") {
        const pageNum = Math.max(1, Math.floor(page));
        const pageSize = Math.max(1, Math.floor(limit));

        const total = await prisma.user.count();

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
                isVerified: true, // Only returns users who have verified their emails in Supabase
            },
            orderBy,
            skip: (pageNum - 1) * pageSize,
            take: pageSize,
            select: {
                id: true,
                profileImgUrl: true,
                currentStreak: true,
                name: true,
                totalXp: true,
                tier: { select: { name: true, badgeImgUrl: true } } as any,
                userEquippedItems: {
                    where: { equipmentSlot: "AVT_FRAME" },
                    include: { itemDefinition: true },
                },
            },
        });

        const entries = users.map((u) => ({
            id: u.id,
            avatarUrl: u.profileImgUrl ?? null,
            name: u.name,
            tierName: u.tier?.name ?? null,
            currentStreak: u.currentStreak ?? 0,
            badgeImgUrl: u.tier?.badgeImgUrl ?? null,
            totalXp: u.totalXp,
            equippedFrameUrl: u.userEquippedItems.length > 0
                ? u.userEquippedItems[0].itemDefinition.imgUrl
                : null,
        }));

        return { entries, total, page: pageNum, pageSize };
    }

    async getUserPosition(
        userId: string,
        sort: "xp" | "streak" = "xp",
    ): Promise<number | null> {
        if (sort === "streak") {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { currentStreak: true, totalXp: true } as any,
            });
            if (!user) return null;
            const higher = await prisma.user.count({
                where: {
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
            select: { totalXp: true, currentStreak: true } as any,
        });
        if (!user) return null;
        const higher = await prisma.user.count({
            where: {
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
        return tiers.map((t) => ({
            index: t.index,
            name: t.name,
            description: t.description ?? null,
            badgeImgUrl: t.badgeImgUrl ?? null,
            xpThreshold: t.xpThreshold,
        }));
    }

    
}

export const gamificationService = new GamificationService();
