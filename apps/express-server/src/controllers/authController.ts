// controllers/authController.ts
import { Request, Response } from "express";
import { AuthService } from "../services/authService";
import {
    RegisterRequestBody,
    RegisterResponseBody,
    LoginRequestBody,
    LoginResponseBody,
    VerifyOtpRequestBody,
    VerifyOtpResponseBody,
    RefreshTokenRequestBody,
    RefreshTokenResponseBody,
    SessionTokens,
    UserProfileSummary,
} from "@history-app/shared";
import { prisma } from "@history-app/shared";
import { Session } from "@supabase/supabase-js";

const authService = new AuthService();

/**
 * Maps a raw Supabase Session into our slim, Supabase-agnostic SessionTokens contract.
 */
const mapSession = (session: Session): SessionTokens => ({
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    expiresAt: session.expires_at ?? 0,
});

export const registerUser = async (
    req: Request<{}, RegisterResponseBody, RegisterRequestBody>,
    res: Response<RegisterResponseBody>,
): Promise<Response<RegisterResponseBody>> => {
    try {
        const { name, email, password, confirmPassword } = req.body;

        // Validation Checkpoints
        if (!name || !email || !password || !confirmPassword) {
            return res.status(400).json({ error: "All fields are required." });
        }
        if (password !== confirmPassword) {
            return res.status(400).json({ error: "Passwords do not match." });
        }
        if (password.length < 6) {
            return res.status(400).json({
                error: "Password must be at least 6 characters long.",
            });
        }

        // Execute authentication via Service Layer
        const { data, error } = await authService.signUpUser({
            email,
            password,
            name,
        });

        if (error || !data.user) {
            return res
                .status(400)
                .json({ error: error?.message || "Registration failed." });
        }

        return res.status(201).json({
            message:
                "Registration complete! Check your email for verification if enabled.",
            user: {
                id: data.user.id,
                email: data.user.email!,
            },
            session: data.session ? mapSession(data.session) : null,
        });
    } catch (error) {
        console.error("Express Controller Register Error:", error);
        return res
            .status(500)
            .json({ error: "Internal server error during registration." });
    }
};

export const loginUser = async (
    req: Request<{}, LoginResponseBody, LoginRequestBody>,
    res: Response<LoginResponseBody>,
): Promise<Response<LoginResponseBody>> => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res
                .status(400)
                .json({ error: "Email and password are required." });
        }

        // Authenticate credentials via Service Layer
        const { data, error } = await authService.signInUser({
            email,
            password,
        });

        if (error || !data.user || !data.session) {
            return res.status(401).json({
                error: error?.message || "Invalid email or password.",
            });
        }

        // Fetch the target user profile with tier info to match GET /user/profile shape
        const userProfile = await prisma.user.findUnique({
            where: { id: data.user.id },
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

        if (!userProfile) {
            return res.status(404).json({
                error: "User gamification state profile not synchronized yet.",
            });
        }

        const profile: UserProfileSummary = {
            id: userProfile.id,
            name: userProfile.name,
            totalXp: userProfile.totalXp,
            totalGold: userProfile.totalGold,
            profileImgUrl: userProfile.profileImgUrl,
            currentStreak: userProfile.currentStreak,
            tierName: userProfile.tier.name,
            badgeImgUrl: userProfile.tier.badgeImgUrl,
        };

        return res.status(200).json({
            message: "Login verified successfully.",
            session: mapSession(data.session),
            profile,
        });
    } catch (error) {
        console.error("Express Controller Login Error:", error);
        return res
            .status(500)
            .json({ error: "Internal server error during login." });
    }
};

export const verifyOtp = async (
    req: Request<{}, VerifyOtpResponseBody, VerifyOtpRequestBody>,
    res: Response<VerifyOtpResponseBody>,
): Promise<Response<VerifyOtpResponseBody>> => {
    try {
        const { email, token } = req.body;

        // 1. Validation Checkpoints
        if (!email || !token) {
            return res
                .status(400)
                .json({ error: "Email and verification token are required." });
        }

        // 2. Process token validation through our Service Layer
        const { data, error } = await authService.verifyOtpToken({
            email,
            token,
        });

        if (error || !data.user || !data.session) {
            return res
                .status(400)
                .json({ error: error?.message || "Invalid or expired token." });
        }

        // 3. Fetch the gamification engine details with tier info
        const userProfile = await prisma.user.findUnique({
            where: { id: data.user.id },
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

        if (!userProfile) {
            return res.status(404).json({
                error: "Game account profile synchronization failed.",
            });
        }

        const profile: UserProfileSummary = {
            id: userProfile.id,
            name: userProfile.name,
            totalXp: userProfile.totalXp,
            totalGold: userProfile.totalGold,
            profileImgUrl: userProfile.profileImgUrl,
            currentStreak: userProfile.currentStreak,
            tierName: userProfile.tier.name,
            badgeImgUrl: userProfile.tier.badgeImgUrl,
        };

        // 4. Return tokens and data right back to the React Native UI layout
        return res.status(200).json({
            message: "Email successfully verified!",
            session: mapSession(data.session),
            profile,
        });
    } catch (error) {
        console.error("Express Controller OTP Verification Error:", error);
        return res
            .status(500)
            .json({ error: "Internal server error during verification loop." });
    }
};

export const refreshSessionToken = async (
    // Generic Args: PathParams = {}, ResBody = RefreshTokenResponseBody, ReqBody = RefreshTokenRequestBody
    req: Request<{}, RefreshTokenResponseBody, RefreshTokenRequestBody>,
    res: Response<RefreshTokenResponseBody>, // 👈 Forces res.json() to adhere to the types
): Promise<Response<RefreshTokenResponseBody>> => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            // ✅ Completely valid under { error: string } union block
            return res
                .status(400)
                .json({ error: "Refresh token is a required parameter." });
        }

        const { data, error } =
            await authService.refreshUserSession(refreshToken);

        if (error || !data.session) {
            // ✅ Completely valid under { error: string } union block
            return res.status(401).json({
                error:
                    error?.message ||
                    "Session rotation failed. Token may be completely expired or reuse-detected.",
            });
        }

        const successResponse: RefreshTokenResponseBody = {
            accessToken: data.session.access_token, // 100% guarded everywhere
            refreshToken: data.session.refresh_token,
        };

        return res.status(200).json(successResponse);
        
    } catch (error) {
        console.error("Express Controller Token Refresh Loop Crash:", error);
        return res
            .status(500)
            .json({
                error: "Internal server error during session rotation processing.",
            });
    }
};
