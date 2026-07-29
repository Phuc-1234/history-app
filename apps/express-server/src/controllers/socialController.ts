import { Request, Response } from "express";
import {
    socialService,
    type SocialSearchFilter,
} from "../services/socialService";

function handleSocialError(error: any, res: Response) {
    const statusCode = Number(error?.statusCode) || 500;
    if (statusCode >= 500) {
        console.error("Social API error:", error);
    }
    return res.status(statusCode).json({
        error: error?.message || "Unexpected social API error.",
    });
}

function requireCurrentUser(req: Request) {
    if (!req.user) {
        throw Object.assign(new Error("Authentication required."), {
            statusCode: 401,
        });
    }
    return req.user;
}

const ALLOWED_FILTERS: ReadonlySet<string> = new Set([
    "all",
    "mutual",
    "learning",
    "recent",
]);

function parseFilter(value: unknown): SocialSearchFilter {
    const v = typeof value === "string" ? value.trim().toLowerCase() : "";
    return ALLOWED_FILTERS.has(v) ? (v as SocialSearchFilter) : "all";
}

export const searchUsers = async (req: Request, res: Response) => {
    try {
        const currentUser = requireCurrentUser(req);
        const users = await socialService.searchUsers(
            currentUser.id,
            String(req.query.q ?? ""),
            Number(req.query.limit ?? 20),
            parseFilter(req.query.filter),
        );
        return res.status(200).json({ users });
    } catch (error) {
        return handleSocialError(error, res);
    }
};

export const getMutualFriends = async (req: Request, res: Response) => {
    try {
        const currentUser = requireCurrentUser(req);
        const result = await socialService.getMutualFriends(
            currentUser.id,
            req.params.userId,
            Number(req.query.limit ?? 10),
        );
        return res.status(200).json(result);
    } catch (error) {
        return handleSocialError(error, res);
    }
};

export const getSocialUserProfile = async (req: Request, res: Response) => {
    try {
        const currentUser = requireCurrentUser(req);
        const profile = await socialService.getUserProfile(
            currentUser.id,
            req.params.userId,
        );
        return res.status(200).json({ profile });
    } catch (error) {
        return handleSocialError(error, res);
    }
};

export const createFriendRequest = async (req: Request, res: Response) => {
    try {
        const currentUser = requireCurrentUser(req);
        const receiverId = String(req.body.receiverId ?? "");
        if (!receiverId) {
            return res.status(400).json({ error: "receiverId is required." });
        }

        const request = await socialService.sendFriendRequest(
            currentUser.id,
            receiverId,
        );
        return res.status(201).json({ request });
    } catch (error) {
        return handleSocialError(error, res);
    }
};

export const acceptFriendRequest = async (req: Request, res: Response) => {
    try {
        const currentUser = requireCurrentUser(req);
        const result = await socialService.acceptFriendRequest(
            currentUser.id,
            req.params.requestId,
        );
        return res.status(200).json(result);
    } catch (error) {
        return handleSocialError(error, res);
    }
};

export const rejectFriendRequest = async (req: Request, res: Response) => {
    try {
        const currentUser = requireCurrentUser(req);
        const result = await socialService.rejectFriendRequest(
            currentUser.id,
            req.params.requestId,
        );
        return res.status(200).json(result);
    } catch (error) {
        return handleSocialError(error, res);
    }
};

export const cancelFriendRequest = async (req: Request, res: Response) => {
    try {
        const currentUser = requireCurrentUser(req);
        const result = await socialService.cancelFriendRequest(
            currentUser.id,
            req.params.requestId,
        );
        return res.status(200).json(result);
    } catch (error) {
        return handleSocialError(error, res);
    }
};

export const removeFriend = async (req: Request, res: Response) => {
    try {
        const currentUser = requireCurrentUser(req);
        const result = await socialService.removeFriend(
            currentUser.id,
            req.params.friendId,
        );
        return res.status(200).json(result);
    } catch (error) {
        return handleSocialError(error, res);
    }
};

export const getFriends = async (req: Request, res: Response) => {
    try {
        const currentUser = requireCurrentUser(req);
        const friends = await socialService.getFriends(currentUser.id);
        return res.status(200).json({ friends });
    } catch (error) {
        return handleSocialError(error, res);
    }
};

export const getIncomingFriendRequests = async (
    req: Request,
    res: Response,
) => {
    try {
        const currentUser = requireCurrentUser(req);
        const requests = await socialService.getIncomingRequests(currentUser.id);
        return res.status(200).json({ requests });
    } catch (error) {
        return handleSocialError(error, res);
    }
};

export const getOutgoingFriendRequests = async (
    req: Request,
    res: Response,
) => {
    try {
        const currentUser = requireCurrentUser(req);
        const requests = await socialService.getOutgoingRequests(currentUser.id);
        return res.status(200).json({ requests });
    } catch (error) {
        return handleSocialError(error, res);
    }
};

export const followUser = async (req: Request, res: Response) => {
    try {
        const currentUser = requireCurrentUser(req);
        const result = await socialService.followUser(
            currentUser.id,
            req.params.userId,
        );
        return res.status(200).json(result);
    } catch (error) {
        return handleSocialError(error, res);
    }
};

export const unfollowUser = async (req: Request, res: Response) => {
    try {
        const currentUser = requireCurrentUser(req);
        const result = await socialService.unfollowUser(
            currentUser.id,
            req.params.userId,
        );
        return res.status(200).json(result);
    } catch (error) {
        return handleSocialError(error, res);
    }
};

export const getFollowers = async (req: Request, res: Response) => {
    try {
        const followers = await socialService.getFollowers(req.params.userId);
        return res.status(200).json({ followers });
    } catch (error) {
        return handleSocialError(error, res);
    }
};

export const getFollowing = async (req: Request, res: Response) => {
    try {
        const following = await socialService.getFollowing(req.params.userId);
        return res.status(200).json({ following });
    } catch (error) {
        return handleSocialError(error, res);
    }
};
