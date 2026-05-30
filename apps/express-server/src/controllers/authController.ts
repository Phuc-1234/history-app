// controllers/authController.ts
import { Request, Response } from "express";
import { AuthService } from "../services/authService";
import {
    RegisterRequestBody,
    LoginRequestBody,
    VerifyOtpRequestBody,
} from "../types/auth";
import { prisma } from "@history-app/shared";

const authService = new AuthService();

export const registerUser = async (
    req: Request<{}, {}, RegisterRequestBody>,
    res: Response,
): Promise<Response> => {
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
                email: data.user.email,
            },
            session: data.session,
        });
    } catch (error) {
        console.error("Express Controller Register Error:", error);
        return res
            .status(500)
            .json({ error: "Internal server error during registration." });
    }
};

export const loginUser = async (
    req: Request<{}, {}, LoginRequestBody>,
    res: Response,
): Promise<Response> => {
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

        if (error || !data.user) {
            return res.status(401).json({
                error: error?.message || "Invalid email or password.",
            });
        }

        // Fetch the target user profile. This profile row was created completely automatically
        // by our PostgreSQL database trigger when signUpUser executed!
        const userProfile = await prisma.user.findUnique({
            where: { id: data.user.id },
        });

        if (!userProfile) {
            return res.status(404).json({
                error: "User gamification state profile not synchronized yet.",
            });
        }

        return res.status(200).json({
            message: "Login verified successfully.",
            session: data.session,
            profile: userProfile,
        });
    } catch (error) {
        console.error("Express Controller Login Error:", error);
        return res
            .status(500)
            .json({ error: "Internal server error during login." });
    }
};

export const verifyOtp = async (
    req: Request<{}, {}, VerifyOtpRequestBody>,
    res: Response,
): Promise<Response> => {
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

        if (error || !data.user) {
            return res
                .status(400)
                .json({ error: error?.message || "Invalid or expired token." });
        }

        // 3. Fetch the gamification engine details
        // Because the trigger function fired, the database row is guaranteed to be ready now
        const userProfile = await prisma.user.findUnique({
            where: { id: data.user.id },
        });

        if (!userProfile) {
            return res
                .status(404)
                .json({
                    error: "Game account profile synchronization failed.",
                });
        }

        // 4. Return tokens and data right back to the React Native UI layout
        return res.status(200).json({
            message: "Email successfully verified!",
            session: data.session, // The app stores this active token securely to stay logged in
            profile: userProfile,
        });
    } catch (error) {
        console.error("Express Controller OTP Verification Error:", error);
        return res
            .status(500)
            .json({ error: "Internal server error during verification loop." });
    }
};
