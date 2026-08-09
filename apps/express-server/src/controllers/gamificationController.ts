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

export const getStreakDetails = async (
    req: Request,
    res: Response,
) => {
    try {
        const userId = req.user?.id;
        const streakInfo = await gamificationService.getStreakInfo(userId);
        return res.status(200).json(streakInfo);
    } catch (err) {
        console.error("Fetch streak error:", err);
        return res.status(500).json({ error: "Failed to fetch streak details." });
    }
};

export const getMonthlyStreakCalendar = async (
    req: Request,
    res: Response,
) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: "Authentication required." });
        }
        const now = new Date();
        const year = Number(req.query.year) || now.getFullYear();
        const month = Number(req.query.month) || (now.getMonth() + 1);

        const calendarData = await gamificationService.getMonthlyStreakCalendar(userId, year, month);
        return res.status(200).json(calendarData);
    } catch (err) {
        console.error("Fetch monthly streak calendar error:", err);
        return res.status(500).json({ error: "Failed to fetch monthly streak calendar." });
    }
};

