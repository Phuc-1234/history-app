// services/progressEngine.ts — Central engine for all progress mutations
import { prisma } from "@history-app/shared";
import { Prisma } from "@prisma/client";
import {
    ProgressEventType,
    ProgressConsequence,
} from "../types/progressTypes";

export class ProgressEngine {
    /**
     * Called when user stays long enough on the node screen / watches end of video.
     * - Upserts studiedAt
     * - If node has no relevant questions → auto-complete
     */
    async finishStudy(
        nodeId: number,
        userId: string,
    ): Promise<ProgressConsequence[]> {
        const consequences: ProgressConsequence[] = [];

        const hasRelevantQuestions = await this.nodeHasRelevantQuestions(nodeId);

        await prisma.userNodeProgress.upsert({
            where: {
                userId_nodeId: { userId, nodeId },
            },
            update: {
                studiedAt: new Date(),
            },
            create: {
                userId,
                nodeId,
                studiedAt: new Date(),
            },
        });

        // If no relevant questions → node is auto-completed upon studying
        if (!hasRelevantQuestions) {
            const progress = await prisma.userNodeProgress.findUnique({
                where: { userId_nodeId: { userId, nodeId } },
            });

            // Only complete if not already completed
            if (progress && !progress.nodeCompletedAt) {
                await prisma.userNodeProgress.update({
                    where: { userId_nodeId: { userId, nodeId } },
                    data: { nodeCompletedAt: new Date() },
                });

                const completionConsequences =
                    await this.handleNodeCompletion(userId, nodeId);
                consequences.push(...completionConsequences);
            }
        }

        return consequences;
    }

    /**
     * Called by test service when a node-scoped test is passed.
     * Sets allTestPassedAt; if studiedAt already set → complete the node.
     */
    async onNodeTestPassed(
        nodeId: number,
        userId: string,
    ): Promise<ProgressConsequence[]> {
        const consequences: ProgressConsequence[] = [];

        const progress = await prisma.userNodeProgress.upsert({
            where: { userId_nodeId: { userId, nodeId } },
            update: {
                allTestPassedAt: new Date(),
            },
            create: {
                userId,
                nodeId,
                allTestPassedAt: new Date(),
            },
        });

        // Both conditions met → complete
        if (progress.studiedAt && !progress.nodeCompletedAt) {
            await prisma.userNodeProgress.update({
                where: { userId_nodeId: { userId, nodeId } },
                data: { nodeCompletedAt: new Date() },
            });

            const completionConsequences =
                await this.handleNodeCompletion(userId, nodeId);
            consequences.push(...completionConsequences);
        }

        return consequences;
    }

    /**
     * Handles all cascading effects of a node completion.
     * Placeholder for: XP, tier check, streak, rewards, etc.
     */
    private async handleNodeCompletion(
        userId: string,
        nodeId: number,
    ): Promise<ProgressConsequence[]> {
        const consequences: ProgressConsequence[] = [];

        // --- NODE_COMPLETED event ---
        consequences.push({
            eventType: ProgressEventType.NODE_COMPLETED,
            message: `Node ${nodeId} completed!`,
            xpGained: 0, // placeholder — wire up XP reward logic later
            goldGained: 0,
        });

        // --- TIER check placeholder ---
        // TODO: calculate new XP total, check tier thresholds, push TIER_GAINED if leveled up

        // --- STREAK placeholder ---
        // TODO: update daily activity tracking, push STREAK_UPDATED if changed

        return consequences;
    }

    /**
     * Checks whether a node has any questions scoped to it (nodeId match).
     */
    async nodeHasRelevantQuestions(nodeId: number): Promise<boolean> {
        const count = await prisma.question.count({
            where: { nodeId },
        });
        return count > 0;
    }
}

export const progressEngine = new ProgressEngine();
