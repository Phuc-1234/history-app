import { Request, Response } from "express";
import { prisma } from "@history-app/shared";
import { UserProfileResponseBody } from "@history-app/shared";

export const getUserProfile = async (
    req: Request<{}, UserProfileResponseBody, {}>, // 👈 PathParams = {}, ReqBody = {}
    res: Response<UserProfileResponseBody>,
): Promise<Response<UserProfileResponseBody>> => {
    try {
        // 1. GUEST CHECK: If middleware didn't find a user, return a peaceful guest state
        if (!req.user) {
            return res.status(200).json({
                isGuest: true,
                name: "Anonymous Historian",
                totalGold: 0,
                totalXp: 0,
                tierName: null, 
                badgeImgUrl: null, // Default fallback asset link
                profileImgUrl: null,
            });
        }

        // 2. STUDENT CHECK: A token existed, so fetch their actual database metrics
        const fullProfile = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                name: true,
                totalXp: true,
                totalGold: true,
                profileImgUrl: true,
                currentStreak: true,
                tier: {
                    select: {
                        name: true,
                        badgeImgUrl: true,
                    },
                },
            },
        });

        // Handle edge case where token is valid but DB row was manually deleted
        if (!fullProfile) {
            return res.status(200).json({
                isGuest: true,
                name: "Anonymous Historian",
                totalGold: 0,
                totalXp: 0,
                tierName: "",
                badgeImgUrl: null,
                profileImgUrl: null,
            });
        }

        // 3. Return the fully loaded student payload
        return res.status(200).json({
            isGuest: false, // 👈 Frontend uses this to toggle UI states instantly
            id: fullProfile.id,
            name: fullProfile.name,
            totalXp: fullProfile.totalXp,
            totalGold: fullProfile.totalGold,
            profileImgUrl: fullProfile.profileImgUrl,
            currentStreak: fullProfile.currentStreak,
            tierName: fullProfile.tier.name,
            badgeImgUrl: fullProfile.tier.badgeImgUrl,
        });
    } catch (error) {
        console.error("Express Profile Fetch Controller Crash:", error);
        return res.status(500).json({
            error: "Internal server error assembling user dashboard profile.",
        });
    }
};

