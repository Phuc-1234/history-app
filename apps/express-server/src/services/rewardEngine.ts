// services/rewardEngine.ts — Central reward resolution, granting, streak & tier logic
import { prisma } from "@history-app/shared";
import { Prisma, RewardTriggerType } from "@prisma/client";
import {
    ProgressEventType,
    ProgressConsequence,
} from "../types/progressTypes";

// Default fallback reward for test triggers when no RewardRule exists
const DEFAULT_TEST_REWARD = { xp: 10, gold: 5 };

type TxClient = Prisma.TransactionClient;

// ─── Helpers ─────────────────────────────────────────────────────────────

function utcDateString(d: Date): string {
    return d.toISOString().slice(0, 10); // "YYYY-MM-DD"
}

function yesterdayUtc(): string {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - 1);
    return utcDateString(d);
}

function todayUtc(): string {
    return utcDateString(new Date());
}

/**
 * Maps a scopeType from UserTestLog to the corresponding RewardTriggerType for auto-pick tests.
 */
function scopeToAutoTrigger(scopeType: string): RewardTriggerType {
    switch (scopeType) {
        case "NODE": return RewardTriggerType.AUTO_NODE_TEST_COMPLETE;
        case "SECTION": return RewardTriggerType.AUTO_SECTION_TEST_COMPLETE;
        case "LESSON": return RewardTriggerType.AUTO_LESSON_TEST_COMPLETE;
        case "TOPIC": return RewardTriggerType.AUTO_TOPIC_TEST_COMPLETE;
        case "GRADE": return RewardTriggerType.AUTO_GRADE_TEST_COMPLETE;
        default: return RewardTriggerType.AUTO_NODE_TEST_COMPLETE;
    }
}

// ─── Core engine ─────────────────────────────────────────────────────────

export class RewardEngine {
    /**
     * Determines the trigger type and target from a test log.
     */
    determineTrigger(
        testId: string | null,
        scopeType: string | null,
        scopeId: number | null,
        purposeType?: string | null,
        autoPickStrategy?: string | null,
    ): { triggerType: RewardTriggerType; triggerTargetId: string | null } {
        if (testId) {
            return {
                triggerType: RewardTriggerType.MANUAL_TEST_COMPLETE,
                triggerTargetId: testId,
            };
        }
        
        
        if (autoPickStrategy === "WRONG") {
            return {
                triggerType: RewardTriggerType.AUTO_WRONG_PRACTICE_COMPLETE,
                triggerTargetId: null,
            };
        }
        else if (autoPickStrategy === "LOW_MASTERY") return {
            triggerType: RewardTriggerType.AUTO_PERSONAL_PRACTICE_COMPLETE,
            triggerTargetId: null,
        };
        if (scopeType) {
            
            return {
                triggerType: scopeToAutoTrigger(scopeType),
                triggerTargetId: scopeId != null ? String(scopeId) : null,
            };
        }
        
        return {
            triggerType: RewardTriggerType.MANUAL_TEST_COMPLETE,
            triggerTargetId: null,
        };
    }

    /**
     * Count how many times the user has previously been rewarded for this exact trigger.
     * This is the "trigger time" — how many passes already recorded in reward logs.
     */
    async countPreviousTriggerTimes(
        userId: string,
        triggerType: RewardTriggerType,
        triggerTargetId: string | null,
        tx: TxClient,
    ): Promise<number> {
        return tx.userRewardLog.count({
            where: {
                userId,
                triggerType,
                triggerTargetId,
            },
        });
    }

    /**
     * Resolves the best matching RewardRule for a given trigger + triggerTime.
     * Priority: exact triggerTargetId match > null fallback row.
     * For STREAK_REACHED / TIER_REACHED: no fallback if rule not found (return null).
     * For test triggers: return hardcoded default if no rule found.
     */
    async resolveReward(
        triggerType: RewardTriggerType,
        triggerTargetId: string | null,
        triggerTime: number,
        tx: TxClient,
    ): Promise<{ ruleId: number; xp: number; gold: number; rewardRuleItems?: any[] } | null> {
        // Try exact match first
        const exactRule = await tx.rewardRule.findFirst({
            where: {
                triggerType,
                triggerTargetId,
                triggerTimeMin: { lte: triggerTime },
                OR: [
                    { triggerTimeMax: { gte: triggerTime } },
                    { triggerTimeMax: null },
                ],
            },
            include: {
                rewardRuleItems: {
                    include: {
                        itemDefinition: true,
                    },
                },
            },
            orderBy: { triggerTimeMin: "desc" }, // most specific range first
        });

        if (exactRule) {
            return {
                ruleId: exactRule.id,
                xp: exactRule.xp,
                gold: exactRule.gold,
                rewardRuleItems: exactRule.rewardRuleItems,
            };
        }

        // Try fallback (triggerTargetId = null)
        if (triggerTargetId != null) {
            const fallbackRule = await tx.rewardRule.findFirst({
                where: {
                    triggerType,
                    triggerTargetId: null,
                    triggerTimeMin: { lte: triggerTime },
                    OR: [
                        { triggerTimeMax: { gte: triggerTime } },
                        { triggerTimeMax: null },
                    ],
                },
                include: {
                    rewardRuleItems: {
                        include: {
                            itemDefinition: true,
                        },
                    },
                },
                orderBy: { triggerTimeMin: "desc" },
            });

            if (fallbackRule) {
                return {
                    ruleId: fallbackRule.id,
                    xp: fallbackRule.xp,
                    gold: fallbackRule.gold,
                    rewardRuleItems: fallbackRule.rewardRuleItems,
                };
            }
        }

        // No rule found — for streak/tier, return null (no reward)
        if (
            triggerType === RewardTriggerType.STREAK_REACHED ||
            triggerType === RewardTriggerType.TIER_REACHED
        ) {
            return null;
        }

        // For test triggers: hardcoded fallback — but no ruleId to log
        return null;
    }

    /**
     * Grants a reward: creates UserRewardLog entry (idempotent via unique constraint).
     * Returns xp/gold awarded, or 0/0 if already granted.
     */
    async grantReward(
        userId: string,
        ruleId: number,
        triggerType: RewardTriggerType,
        triggerTargetId: string | null,
        triggerTime: number,
        xp: number,
        gold: number,
        rewardRuleItems: any[],
        userTestLogId: string | null,
        tx: TxClient,
    ): Promise<{ xpAwarded: number; goldAwarded: number; itemsAwarded: { itemDefinitionId: number; name: string; quantity: number; imgUrl: string | null }[] }> {
        // Idempotency check
        const existing = await tx.userRewardLog.findUnique({
            where: {
                userId_rewardRuleId_triggerTargetId_triggerTime: {
                    userId,
                    rewardRuleId: ruleId,
                    triggerTargetId: triggerTargetId as any,
                    triggerTime,
                },
            },
        });

        if (existing) {
            return { xpAwarded: 0, goldAwarded: 0, itemsAwarded: [] };
        }

        await tx.userRewardLog.create({
            data: {
                userId,
                rewardRuleId: ruleId,
                triggerType,
                triggerTargetId,
                triggerTime,
                xpAwarded: xp,
                goldAwarded: gold,
                userTestLogId,
            },
        });

        // Grant items
        const itemsAwarded: { itemDefinitionId: number; name: string; quantity: number; imgUrl: string | null }[] = [];
        if (rewardRuleItems && rewardRuleItems.length > 0) {
            for (const rri of rewardRuleItems) {
                const itemDef = rri.itemDefinition;
                const quantity = rri.quantity;

                const existingUserItem = await tx.userItem.findUnique({
                    where: {
                        userId_itemDefinitionId: {
                            userId,
                            itemDefinitionId: itemDef.id,
                        },
                    },
                });

                const currentQty = existingUserItem ? existingUserItem.quantity : 0;
                let newQty = currentQty + quantity;
                if (itemDef.maxStackSize !== null && newQty > itemDef.maxStackSize) {
                    newQty = itemDef.maxStackSize;
                }

                if (existingUserItem) {
                    await tx.userItem.update({
                        where: {
                            userId_itemDefinitionId: {
                                userId,
                                itemDefinitionId: itemDef.id,
                            },
                        },
                        data: {
                            quantity: newQty,
                        },
                    });
                } else {
                    await tx.userItem.create({
                        data: {
                            userId,
                            itemDefinitionId: itemDef.id,
                            quantity: newQty,
                        },
                    });
                }

                itemsAwarded.push({
                    itemDefinitionId: itemDef.id,
                    name: itemDef.name,
                    quantity,
                    imgUrl: itemDef.imgUrl,
                });
            }
        }

        return { xpAwarded: xp, goldAwarded: gold, itemsAwarded };
    }

    /**
     * Applies XP and gold to user. Returns the updated user.
     */
    async applyXpAndGold(
        userId: string,
        xpGain: number,
        goldGain: number,
        tx: TxClient,
    ) {
        if (xpGain === 0 && goldGain === 0) {
            return tx.user.findUniqueOrThrow({ where: { id: userId } });
        }
        return tx.user.update({
            where: { id: userId },
            data: {
                totalXp: { increment: xpGain },
                totalGold: { increment: goldGain },
            },
        });
    }

    /**
     * Checks if user's new XP total qualifies for a tier-up.
     * Cascades: tier reward could give more XP → another tier-up (unlikely but handled).
     * Returns all tier consequences and total xp/gold from tier rewards.
     */
    async checkTierUp(
        userId: string,
        userTestLogId: string | null,
        tx: TxClient,
    ): Promise<{ consequences: ProgressConsequence[]; totalXp: number; totalGold: number }> {
        const consequences: ProgressConsequence[] = [];
        let totalXp = 0;
        let totalGold = 0;

        // Loop to handle cascading tier-ups
        let keepChecking = true;
        while (keepChecking) {
            keepChecking = false;

            const user = await tx.user.findUniqueOrThrow({
                where: { id: userId },
                select: { totalXp: true, currentTierIndex: true },
            });

            // Find the highest tier the user qualifies for
            const nextTier = await tx.tier.findFirst({
                where: {
                    xpThreshold: { lte: user.totalXp },
                    index: { gt: user.currentTierIndex },
                },
                orderBy: { index: "desc" },
            });

            if (!nextTier) break;

            // Update user's tier
            await tx.user.update({
                where: { id: userId },
                data: { currentTierIndex: nextTier.index },
            });

            consequences.push({
                eventType: ProgressEventType.TIER_GAINED,
                message: `Đạt danh hiệu: ${nextTier.name}!`,
                xpGained: 0,
                goldGained: 0,
                payload: {
                    tierIndex: nextTier.index,
                    tierName: nextTier.name,
                    badgeImgUrl: nextTier.badgeImgUrl,
                    items: [],
                },
            });

            // Check for tier reward
            const triggerTargetId = String(nextTier.index);
            const triggerTime = 1; // reaching a tier is always "first time" per tier index

            const tierReward = await this.resolveReward(
                RewardTriggerType.TIER_REACHED,
                triggerTargetId,
                triggerTime,
                tx,
            );

            if (tierReward) {
                const granted = await this.grantReward(
                    userId,
                    tierReward.ruleId,
                    RewardTriggerType.TIER_REACHED,
                    triggerTargetId,
                    triggerTime,
                    tierReward.xp,
                    tierReward.gold,
                    tierReward.rewardRuleItems || [],
                    userTestLogId,
                    tx,
                );

                if (granted.xpAwarded > 0 || granted.goldAwarded > 0 || granted.itemsAwarded.length > 0) {
                    totalXp += granted.xpAwarded;
                    totalGold += granted.goldAwarded;

                    // Update the last tier gained consequence payload to also have items and rewards!
                    const lastIdx = consequences.length - 1;
                    if (lastIdx >= 0 && consequences[lastIdx].eventType === ProgressEventType.TIER_GAINED) {
                        consequences[lastIdx].xpGained = granted.xpAwarded;
                        consequences[lastIdx].goldGained = granted.goldAwarded;
                        consequences[lastIdx].itemsGained = granted.itemsAwarded;
                        consequences[lastIdx].payload = {
                            ...consequences[lastIdx].payload,
                            items: granted.itemsAwarded,
                        };
                    }
 
                    // Apply tier reward XP/gold immediately so cascading tier check works
                    await this.applyXpAndGold(userId, granted.xpAwarded, granted.goldAwarded, tx);

                    // Could cascade into another tier
                    keepChecking = true;
                }
            }
        }

        return { consequences, totalXp, totalGold };
    }

    /**
     * Processes streak logic after a test pass.
     * - If already passed today → no change
     * - If passed yesterday → increment streak
     * - If older/never → reset to 1
     * Updates lastTestPassedAt, highestStreak.
     * Returns streak consequences including any streak milestone rewards.
     */
    async processStreak(
        userId: string,
        userTestLogId: string | null,
        tx: TxClient,
    ): Promise<{ consequences: ProgressConsequence[]; totalXp: number; totalGold: number }> {
        const consequences: ProgressConsequence[] = [];
        let totalXp = 0;
        let totalGold = 0;

        const user = await tx.user.findUniqueOrThrow({
            where: { id: userId },
            select: { lastTestPassedAt: true, currentStreak: true, highestStreak: true },
        });

        const today = todayUtc();
        let newStreak = user.currentStreak;

        if (user.lastTestPassedAt) {
            const lastPassDate = utcDateString(user.lastTestPassedAt);

            if (lastPassDate === today) {
                // Already counted today — just return
                return { consequences, totalXp, totalGold };
            } else if (lastPassDate === yesterdayUtc()) {
                // Consecutive day → increment
                newStreak = user.currentStreak + 1;
            } else {
                // Gap → reset to 1
                newStreak = 1;
            }
        } else {
            // First ever test pass
            newStreak = 1;
        }

        const newHighest = Math.max(newStreak, user.highestStreak);

        await tx.user.update({
            where: { id: userId },
            data: {
                currentStreak: newStreak,
                highestStreak: newHighest,
                lastTestPassedAt: new Date(),
            },
        });

        consequences.push({
            eventType: ProgressEventType.STREAK_UPDATED,
            message: `Chuỗi ngày: ${newStreak}`,
            payload: { currentStreak: newStreak, highestStreak: newHighest },
        });

        // Check streak milestone reward
        const triggerTargetId = String(newStreak);
        // Count how many times user has hit exactly this streak value before
        const prevStreakHits = await this.countPreviousTriggerTimes(
            userId,
            RewardTriggerType.STREAK_REACHED,
            triggerTargetId,
            tx,
        );
        const triggerTime = prevStreakHits + 1;

        const streakReward = await this.resolveReward(
            RewardTriggerType.STREAK_REACHED,
            triggerTargetId,
            triggerTime,
            tx,
        );

        if (streakReward) {
            const granted = await this.grantReward(
                userId,
                streakReward.ruleId,
                RewardTriggerType.STREAK_REACHED,
                triggerTargetId,
                triggerTime,
                streakReward.xp,
                streakReward.gold,
                streakReward.rewardRuleItems || [],
                userTestLogId,
                tx,
            );

            if (granted.xpAwarded > 0 || granted.goldAwarded > 0 || granted.itemsAwarded.length > 0) {
                totalXp += granted.xpAwarded;
                totalGold += granted.goldAwarded;

                consequences.push({
                    eventType: ProgressEventType.STREAK_MILESTONE,
                    message: `Cột mốc chuỗi ${newStreak} ngày: +${granted.xpAwarded} XP, +${granted.goldAwarded} vàng`,
                    xpGained: granted.xpAwarded,
                    goldGained: granted.goldAwarded,
                    itemsGained: granted.itemsAwarded,
                    payload: {
                        streakValue: newStreak,
                        items: granted.itemsAwarded,
                    },
                });
            }
        }

        return { consequences, totalXp, totalGold };
    }

    /**
     * Full reward pipeline for a passed test. Called inside finishTest transaction.
     * Returns all consequences for FE display + totals applied.
     */
    async processTestPassRewards(
        userId: string,
        testId: string | null,
        scopeType: string | null,
        scopeId: number | null,
        purposeType: string | null,
        userTestLogId: string,
        tx: TxClient,
        autoPickStrategy?: string | null,
    ): Promise<{ consequences: ProgressConsequence[]; totalXpGained: number; totalGoldGained: number }> {
        const consequences: ProgressConsequence[] = [];
        let totalXpGained = 0;
        let totalGoldGained = 0;

        // 1. Determine trigger
        const { triggerType, triggerTargetId } = this.determineTrigger(testId, scopeType, scopeId, purposeType, autoPickStrategy);

        // 2. Count previous passes for trigger time
        const prevTimes = await this.countPreviousTriggerTimes(userId, triggerType, triggerTargetId, tx);
        const triggerTime = prevTimes + 1;

        // 3. Resolve reward
        const testReward = await this.resolveReward(triggerType, triggerTargetId, triggerTime, tx);

        let testXp = 0;
        let testGold = 0;
        let testItems: any[] = [];

        if (testReward) {
            const granted = await this.grantReward(
                userId,
                testReward.ruleId,
                triggerType,
                triggerTargetId,
                triggerTime,
                testReward.xp,
                testReward.gold,
                testReward.rewardRuleItems || [],
                userTestLogId,
                tx,
            );
            testXp = granted.xpAwarded;
            testGold = granted.goldAwarded;
            testItems = granted.itemsAwarded;
        } else {
            // Hardcoded fallback for test triggers (no rule found, no ruleId to log)
            testXp = DEFAULT_TEST_REWARD.xp;
            testGold = DEFAULT_TEST_REWARD.gold;
            testItems = [];
        }

        if (testXp > 0 || testGold > 0 || testItems.length > 0) {
            totalXpGained += testXp;
            totalGoldGained += testGold;

            consequences.push({
                eventType: ProgressEventType.REWARD_EARNED,
                message: `Phần thưởng bài kiểm tra: +${testXp} XP, +${testGold} vàng`,
                xpGained: testXp,
                goldGained: testGold,
                itemsGained: testItems,
                payload: {
                    items: testItems,
                },
            });
        }

        // 4. Process streak
        const streakResult = await this.processStreak(userId, userTestLogId, tx);
        consequences.push(...streakResult.consequences);
        totalXpGained += streakResult.totalXp;
        totalGoldGained += streakResult.totalGold;

        // 5. Apply all XP and gold from test + streak
        await this.applyXpAndGold(userId, totalXpGained, totalGoldGained, tx);

        // 6. Check tier up (reads updated totalXp)
        const tierResult = await this.checkTierUp(userId, userTestLogId, tx);
        consequences.push(...tierResult.consequences);
        totalXpGained += tierResult.totalXp;
        totalGoldGained += tierResult.totalGold;

        return { consequences, totalXpGained, totalGoldGained };
    }

    /**
     * Called on login. Resets streak to 0 if user hasn't passed a test yesterday or today.
     * Returns the (possibly updated) currentStreak.
     */
    async checkStreakOnLogin(userId: string): Promise<number> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { lastTestPassedAt: true, currentStreak: true },
        });

        if (!user) return 0;

        if (user.currentStreak === 0) return 0;

        if (!user.lastTestPassedAt) {
            // No test ever passed but streak > 0 — reset
            await prisma.user.update({
                where: { id: userId },
                data: { currentStreak: 0 },
            });
            return 0;
        }

        const lastPassDate = utcDateString(user.lastTestPassedAt);
        const today = todayUtc();
        const yesterday = yesterdayUtc();

        if (lastPassDate === today || lastPassDate === yesterday) {
            // Streak is still valid
            return user.currentStreak;
        }

        // Streak broken — reset
        await prisma.user.update({
            where: { id: userId },
            data: { currentStreak: 0 },
        });
        return 0;
    }

    /**
     * Resolves the reward preview for the test info screen.
     * Shows what the user WOULD get if they pass.
     */
    async previewTestReward(
        testId: string | null,
        scopeType: string | null,
        scopeId: number | null,
        userId: string,
        purposeType?: string | null,
        autoPickStrategy?: string | null,
    ): Promise<{ xp: number; gold: number; attemptNumber: number; items: { id: number; name: string; imgUrl: string | null; quantity: number }[] }> {
        const { triggerType, triggerTargetId } = this.determineTrigger(testId, scopeType, scopeId, purposeType, autoPickStrategy);

        // Count previous reward grants for this trigger
        const prevTimes = await prisma.userRewardLog.count({
            where: {
                userId,
                triggerType,
                triggerTargetId,
            },
        });
        const nextTriggerTime = prevTimes + 1;

        const reward = await prisma.$transaction(async (tx) => {
            return this.resolveReward(triggerType, triggerTargetId, nextTriggerTime, tx);
        });

        const items = (reward?.rewardRuleItems || []).map((ri: any) => ({
            id: ri.itemDefinition.id,
            name: ri.itemDefinition.name,
            imgUrl: ri.itemDefinition.imgUrl,
            quantity: ri.quantity,
        }));

        return {
            xp: reward?.xp ?? DEFAULT_TEST_REWARD.xp,
            gold: reward?.gold ?? DEFAULT_TEST_REWARD.gold,
            attemptNumber: nextTriggerTime,
            items,
        };
    }
}

export const rewardEngine = new RewardEngine();

