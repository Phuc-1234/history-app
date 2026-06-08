import { Request, Response } from "express";
import { prisma } from "@history-app/shared";
import { UserProfileResponseBody } from "@history-app/shared";
import { AuthService } from "../services/authService";



const authService = new AuthService();

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

export const updateUserData = async (req: Request, res: Response) => {
    const { name } = req.body;

    try {
        if (name) {
            await authService.updateUserData(req.user!.id, { name });
        }
    } catch (error) {
        console.error("Express User Update Controller Crash:", error);
        return res.status(500).json({
            error: "Internal server error updating user data.",
        });
    }
    return res.status(200).json({
        message: "User data updated successfully.",
    });
};

export const updateUserPassword = async (req: Request, res: Response) => {
    const { oldPassword, newPassword } = req.body;
    try {        
        const result = await authService.updateUserPassword(
            req!.user!.accessToken!,
            oldPassword,
            newPassword,
        )      
        if (result.error) {
            return res.status(400).json({
                error: result.error.message,
            });
        }
    } catch (error) {
        console.error("Express Password Update Controller Crash:", error);
        return res.status(500).json({
            error: "Internal server error updating password.",
        });
    }   
    return res.status(200).json({
        message: "Password updated successfully.",
    });
};

export const updateUserEmail = async (req: Request, res: Response) => {
    const { newEmail } = req.body;
    try {
        const result = await authService.updateUserEmail(
            req!.user!.accessToken!,
            newEmail,
        );
        if (result.error) {
            return res.status(400).json({
                error: result.error.message,
            });
        }
    } catch (error) {
        console.error("Express Email Update Controller Crash:", error);
        return res.status(500).json({
            error: "Internal server error updating email.",
        });
    }
    return res.status(200).json({
        message: "Email updated successfully.",
    });
};
