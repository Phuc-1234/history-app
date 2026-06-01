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

    async getMilestoneRewardsByTier(tierIndex: number) {
        const rewards = await prisma.milestoneReward.findMany({
            where: { sourceType: "TIER", sourceValue: tierIndex },
            select: {
                id: true,
                goldAmount: true,
                xpAmount: true,
                itemQuantity: true,
                sourceValue: true,
                itemId: true,
                rewardType: true,
                name: true,
            },
        });
        return rewards.map((r) => ({
            id: r.id,
            goldAmount: r.goldAmount,
            xpAmount: r.xpAmount,
            itemQuantity: r.itemQuantity,
            sourceValue: r.sourceValue,
            itemId: r.itemId,
            rewardType: r.rewardType,
            name: r.name,
        }));
    }

    async getPendingRewardsForUserByTier(userId: string, tierIndex: number) {
        const pending = await prisma.pendingReward.findMany({
            where: { userId, sourceType: "TIER", sourceValue: tierIndex },
            select: {
                id: true,
                goldAmount: true,
                xpAmount: true,
                itemQuantity: true,
                sourceType: true,
                sourceValue: true,
                isClaimed: true,
                userId: true,
                itemId: true,
                rewardType: true,
            },
        });
        return pending.map((p) => ({
            id: p.id,
            goldAmount: p.goldAmount,
            xpAmount: p.xpAmount,
            itemQuantity: p.itemQuantity,
            sourceType: p.sourceType,
            sourceValue: p.sourceValue,
            isClaimed: p.isClaimed,
            userId: p.userId,
            itemId: p.itemId,
            rewardType: p.rewardType,
        }));
    }

    async getAllItems() {
        const items = await prisma.item.findMany({
            where: { isPurchaseable: true },
            select: {
                id: true,
                name: true,
                cost: true,
                isConsumable: true,
                isPurchaseable: true,
                imgUrl: true,
                description: true,
                type: true,
                value: true,
                testLimit: true,
                timeLimit: true,
            },
        });
        return items.map((i) => ({
            id: i.id,
            name: i.name,
            cost: i.cost ?? null,
            isConsumable: i.isConsumable,
            isPurchaseable: i.isPurchaseable,
            imgUrl: i.imgUrl ?? null,
            description: i.description ?? null,
            type: i.type,
            value: i.value ?? null,
            testLimit: i.testLimit ?? null,
            timeLimit: i.timeLimit ?? null,
        }));
    }

    async getUserItems(userId: string) {
        const userItems = await prisma.userItem.findMany({
            where: { userId },
            include: {
                item: {
                    select: {
                        id: true,
                        name: true,
                        cost: true,
                        isConsumable: true,
                        isPurchaseable: true,
                        imgUrl: true,
                        description: true,
                        type: true,
                        value: true,
                        testLimit: true,
                        timeLimit: true,
                    },
                },
            },
        });
        return userItems.map((ui) => ({
            userId: ui.userId,
            itemId: ui.itemId,
            quantity: ui.quantity,
            isActive: ui.isActive,
            activateAt: ui.activateAt ? ui.activateAt.toISOString() : null,
            item: ui.item
                ? {
                      id: ui.item.id,
                      name: ui.item.name,
                      cost: ui.item.cost ?? null,
                      isConsumable: ui.item.isConsumable,
                      isPurchaseable: ui.item.isPurchaseable,
                      imgUrl: ui.item.imgUrl ?? null,
                      description: ui.item.description ?? null,
                      type: ui.item.type,
                      value: ui.item.value ?? null,
                      testLimit: ui.item.testLimit ?? null,
                      timeLimit: ui.item.timeLimit ?? null,
                  }
                : null,
        }));
    }
}

export const gamificationService = new GamificationService();
