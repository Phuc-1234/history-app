// controllers/gamificationController.ts
import { Request, Response } from "express";
import {
    GetLeaderboardResponse,
    GetTiersResponse,
    GetMilestoneRewardsResponse,
    GetPendingRewardsResponse,
    GetItemsResponse,
    GetUserItemsResponse,
} from "@history-app/shared";
import { gamificationService } from "../services/gamificationService";

export const getLeaderboard = async (
    req: Request<{}, GetLeaderboardResponse, {}>,
    res: Response<GetLeaderboardResponse>,
) => {
    try {
        const page = Number(req.query.page as any) || 1;
        const limit = Number(req.query.limit as any) || 20;
        const sort = (req.query.sort as any) === "streak" ? "streak" : "xp";
        const data = await gamificationService.getLeaderboard(
            page,
            limit,
            sort as any,
        );

        // If optional auth populated req.user, include current user position
        let userPosition: number | null = null;
        if (req.user && req.user.id) {
            userPosition = await gamificationService.getUserPosition(
                req.user.id,
                sort as any,
            );
        }

        return res.status(200).json({
            entries: data.entries,
            total: data.total,
            page: data.page,
            pageSize: data.pageSize,
            userPosition,
        } as any);
    } catch (err) {
        console.error("Leaderboard fetch error:", err);
        return res.status(500).json({ error: "Failed to fetch leaderboard." });
    }
};

export const getTiers = async (
    req: Request<{}, GetTiersResponse, {}>,
    res: Response<GetTiersResponse>,
) => {
    try {
        const tiers = await gamificationService.getTiers();
        return res.status(200).json({ tiers });
    } catch (err) {
        console.error("Fetch tiers error:", err);
        return res.status(500).json({ error: "Failed to fetch tiers." });
    }
};

export const getMilestoneRewardsByTier = async (
    req: Request<{ tierIndex: string }, GetMilestoneRewardsResponse, {}>,
    res: Response<GetMilestoneRewardsResponse>,
) => {
    try {
        const tierIndex = Number(req.params.tierIndex);
        if (Number.isNaN(tierIndex))
            return res.status(400).json({ error: "Invalid tierIndex" });

        const rewards =
            await gamificationService.getMilestoneRewardsByTier(tierIndex);
        return res.status(200).json({ rewards });
    } catch (err) {
        console.error("Fetch milestone rewards error:", err);
        return res
            .status(500)
            .json({ error: "Failed to fetch milestone rewards." });
    }
};

export const getPendingRewardsByTierForUser = async (
    req: Request<{ tierIndex: string }, GetPendingRewardsResponse, {}>,
    res: Response<GetPendingRewardsResponse>,
) => {
    try {
        const tierIndex = Number(req.params.tierIndex);
        if (Number.isNaN(tierIndex))
            return res.status(400).json({ error: "Invalid tierIndex" });
        if (!req.user)
            return res.status(401).json({ error: "Authentication required." });

        const pending =
            await gamificationService.getPendingRewardsForUserByTier(
                req.user.id,
                tierIndex,
            );
        return res.status(200).json({ rewards: pending } as any);
    } catch (err) {
        console.error("Fetch pending rewards error:", err);
        return res
            .status(500)
            .json({ error: "Failed to fetch pending rewards." });
    }
};

export const getAllItems = async (
    req: Request<{}, GetItemsResponse, {}>,
    res: Response<GetItemsResponse>,
) => {
    try {
        const items = await gamificationService.getAllItems();
        return res.status(200).json({ items });
    } catch (err) {
        console.error("Fetch items error:", err);
        return res.status(500).json({ error: "Failed to fetch items." });
    }
};

export const getUserItems = async (
    req: Request<{}, GetUserItemsResponse, {}>,
    res: Response<GetUserItemsResponse>,
) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: "Authentication required." });
        const items = await gamificationService.getUserItems(req.user.id);
        return res.status(200).json({ items } as any);
    } catch (err) {
        console.error("Fetch user items error:", err);
        return res.status(500).json({ error: "Failed to fetch user items." });
    }
};
