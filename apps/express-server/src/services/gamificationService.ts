// services/gamificationService.ts
import { prisma } from "@history-app/shared";

export class GamificationService {
    async getLeaderboard(page = 1, limit = 20, sort: "xp" | "streak" = "xp") {
        const pageNum = Math.max(1, Math.floor(page));
        const pageSize = Math.max(1, Math.floor(limit));

        const total = await prisma.user.count();

        const orderBy =
            sort === "streak"
                ? { currentStreak: "desc" as const }
                : { totalXp: "desc" as const };

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
                select: { currentStreak: true } as any,
            });
            if (!user) return null;
            const higher = await prisma.user.count({
                where: { currentStreak: { gt: (user as any).currentStreak } },
            });
            return higher + 1;
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { totalXp: true } as any,
        });
        if (!user) return null;
        const higher = await prisma.user.count({
            where: { totalXp: { gt: (user as any).totalXp } },
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
