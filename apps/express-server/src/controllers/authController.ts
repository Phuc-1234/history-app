// controllers/authController.ts
import { Request, Response } from "express";
import { AuthService } from "../services/authService";
import { rewardEngine } from "../services/rewardEngine";
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
    ResendOtpRequestBody,
    ResendOtpResponseBody,
} from "@history-app/shared";
import { prisma } from "@history-app/shared";
import { Session } from "@supabase/supabase-js";
import { getSupabaseUserClient, supabase } from "../config/supabaseClient";
import { getBearerToken } from "./userController";

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
            return res.status(400).json({
                status: "error",
                error: "Email and password are required.",
            });
        }

        // Authenticate credentials via Service Layer
        const { data, error } = await authService.signInUser({
            email,
            password,
        });

        // Handle errors coming from Supabase Auth
        if (error) {
            // Check if it's an unconfirmed email error (Supabase returns a 400 status)
            const isUnconfirmed =
                error.status === 400 &&
                error.message.toLowerCase().includes("confirmed");

            if (isUnconfirmed) {
                return res.status(400).json({
                    status: "requires_verification",
                    error: "Email not confirmed.",
                    requiresVerification: true,
                });
            }

            // Default fallback for incorrect password / invalid credentials
            return res.status(401).json({
                status: "error",
                error: error.message || "Invalid email or password.",
            });
        }

        // Safety fallback check for typescript type guards
        if (!data.user || !data.session) {
            return res.status(401).json({
                status: "error",
                error: "Invalid login session state.",
            });
        }

        // Fetch the target user profile with tier info to match GET /user/profile shape
        const userProfile = await prisma.user.findUnique({
            where: { id: data.user.id },
            select: {
                id: true,
                name: true,
                email: true,
                totalXp: true,
                totalGold: true,
                profileImgUrl: true,
                currentStreak: true,
                role: true,
                isPro: true,
                proExpiresAt: true,
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
                status: "error",
                error: "User gamification state profile not synchronized yet.",
            });
        }

        const profile: UserProfileSummary = {
            id: userProfile.id,
            name: userProfile.name,
            email: userProfile.email,
            totalXp: userProfile.totalXp,
            totalGold: userProfile.totalGold,
            profileImgUrl: userProfile.profileImgUrl,
            currentStreak: await rewardEngine.checkStreakOnLogin(userProfile.id),
            tierName: userProfile.tier.name,
            badgeImgUrl: userProfile.tier.badgeImgUrl,
            role: userProfile.role as any,
            isPro: userProfile.isPro,
            proExpiresAt: userProfile.proExpiresAt ? userProfile.proExpiresAt.toISOString() : null,
        };

        // Meets LoginSuccessResponse contract perfectly
        return res.status(200).json({
            status: "success",
            message: "Login verified successfully.",
            session: mapSession(data.session),
            profile,
        });
    } catch (error) {
        console.error("Express Controller Login Error:", error);
        return res.status(500).json({
            status: "error",
            error: "Internal server error during login.",
        });
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
                email: true,
                totalXp: true,
                totalGold: true,
                profileImgUrl: true,
                currentStreak: true,
                role: true,
                isPro: true,
                proExpiresAt: true,
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
            email: userProfile.email,
            totalXp: userProfile.totalXp,
            totalGold: userProfile.totalGold,
            profileImgUrl: userProfile.profileImgUrl,
            currentStreak: userProfile.currentStreak,
            tierName: userProfile.tier.name,
            badgeImgUrl: userProfile.tier.badgeImgUrl,
            role: userProfile.role as any,
            isPro: userProfile.isPro,
            proExpiresAt: userProfile.proExpiresAt ? userProfile.proExpiresAt.toISOString() : null,
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
        return res.status(500).json({
            error: "Internal server error during session rotation processing.",
        });
    }
};

export const resendOtp = async (
    req: Request<{}, ResendOtpResponseBody, ResendOtpRequestBody>,
    res: Response<ResendOtpResponseBody>,
): Promise<Response<ResendOtpResponseBody>> => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                status: "error",
                error: "Email is required.",
            });
        }

        // Call service layer to trigger Supabase resend
        const { error } = await authService.resendSignUpOtp(email);

        if (error) {
            // Catches rate-limits (HTTP 429) or invalid format errors gracefully
            return res.status(error.status || 400).json({
                status: "error",
                error: error.message || "Failed to resend verification code.",
            });
        }

        // Matches ResendOtpSuccessResponse perfectly
        return res.status(200).json({
            status: "success",
            message: "A fresh verification code has been sent successfully.",
        });
    } catch (error) {
        console.error("Express Controller Resend OTP Error:", error);
        return res.status(500).json({
            status: "error",
            error: "Internal server error during OTP resend.",
        });
    }
};

export const verifyGoogleSession = async (
    req: Request<{}, LoginResponseBody, { accessToken?: string, refreshToken?: string, idToken?: string }>,
    res: Response<LoginResponseBody>
): Promise<Response<LoginResponseBody>> => {
    try {
        const { accessToken, refreshToken, idToken } = req.body;

        // 1. Enforce validation check: Secure mobile logins require the OIDC ID Token wrapper
        if (!idToken) {
            return res.status(400).json({
                status: 'error',
                error: "Google ID Token (idToken) is required to complete authentication exchange.",
            });
        }

        // 2. Execute the isolated ID Token exchange via your new service helper layout
        const { data, error } = await authService.getUserViaGoogleToken(idToken);

        if (error || !data || !data.user) {
            return res.status(401).json({
                status: 'error',
                error: error?.message || "Invalid or expired Google authentication session.",
            });
        }

        const { user, session } = data;

        // 3. Fallback validation logic: Ensure email profiles are authenticated
        if (!user.email_confirmed_at) {
            return res.status(400).json({
                status: 'requires_verification',
                error: "This Google account email address is unverified.",
                requiresVerification: true,
            });
        }

        // 4. Fetch the user profile. Because of your native Supabase PostgreSQL trigger, 
        // this row is guaranteed to exist already, even for brand-new users!
        const userProfile = await prisma.user.findUnique({
            where: { id: user.id },
            select: {
                id: true,
                name: true,
                totalXp: true,
                totalGold: true,
                profileImgUrl: true,
                currentStreak: true,
                email: true,
                role: true,
                isPro: true,
                proExpiresAt: true,
                tier: {
                    select: {
                        name: true,
                        badgeImgUrl: true,
                    },
                },
            },
        });

        // Edge case fallback protection valve if database engine sync encounters latency
        if (!userProfile) {
            return res.status(404).json({
                status: 'error',
                error: "User gamification state profile not synchronized yet.",
            });
        }

        // 5. Structure the active gamification response values
        const profile: UserProfileSummary = {
            id: userProfile.id,
            name: userProfile.name,
            totalXp: userProfile.totalXp,
            email: userProfile.email,
            totalGold: userProfile.totalGold,
            profileImgUrl: userProfile.profileImgUrl,
            currentStreak: await rewardEngine.checkStreakOnLogin(userProfile.id),
            tierName: userProfile.tier?.name || "Bronze",
            badgeImgUrl: userProfile.tier?.badgeImgUrl || "",
            role: userProfile.role as any,
            isPro: userProfile.isPro,
            proExpiresAt: userProfile.proExpiresAt ? userProfile.proExpiresAt.toISOString() : null,
        };

        // 6. Return unified payload containing native, auto-refreshing Supabase session JWTs
        return res.status(200).json({
            status: 'success',
            message: "Google login verified successfully.",
            session: {
                // ✅ Grabs genuine, signed Supabase access/refresh tokens from the exchange!
                accessToken: session?.access_token || "",
                refreshToken: session?.refresh_token || "", 
                expiresAt: session?.expires_at || Math.floor(Date.now() / 1000) + 3600,
            },
            profile,
        });

    } catch (error) {
        console.error("Express Controller Google Verify Error:", error);
        return res.status(500).json({
            status: 'error',
            error: "Internal server error processing Google login."
        });
    }
};

export const verifyFacebookSession = async (
    req: Request<{}, LoginResponseBody, { accessToken?: string }>,
    res: Response<LoginResponseBody>
): Promise<Response<LoginResponseBody>> => {
    try {
        const { accessToken } = req.body;

        if (!accessToken) {
            return res.status(400).json({
                status: 'error',
                error: "Facebook Access Token (accessToken) is required to complete authentication exchange.",
            });
        }

        const { data, error } = await authService.getUserViaFacebookToken(accessToken);

        if (error || !data || !data.user) {
            return res.status(401).json({
                status: 'error',
                error: error?.message || "Invalid or expired Facebook authentication session.",
            });
        }

        const { user, session } = data;

        const userProfile = await prisma.user.findUnique({
            where: { id: user.id },
            select: {
                id: true,
                name: true,
                totalXp: true,
                totalGold: true,
                profileImgUrl: true,
                currentStreak: true,
                email: true,
                role: true,
                isPro: true,
                proExpiresAt: true,
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
                status: 'error',
                error: "User gamification state profile not synchronized yet.",
            });
        }

        const profile: UserProfileSummary = {
            id: userProfile.id,
            name: userProfile.name,
            totalXp: userProfile.totalXp,
            email: userProfile.email,
            totalGold: userProfile.totalGold,
            profileImgUrl: userProfile.profileImgUrl,
            currentStreak: await rewardEngine.checkStreakOnLogin(userProfile.id),
            tierName: userProfile.tier?.name || "Bronze",
            badgeImgUrl: userProfile.tier?.badgeImgUrl || "",
            role: userProfile.role as any,
            isPro: userProfile.isPro,
            proExpiresAt: userProfile.proExpiresAt ? userProfile.proExpiresAt.toISOString() : null,
        };

        return res.status(200).json({
            status: 'success',
            message: "Facebook login verified successfully.",
            session: {
                accessToken: session?.access_token || "",
                refreshToken: session?.refresh_token || "", 
                expiresAt: session?.expires_at || Math.floor(Date.now() / 1000) + 3600,
            },
            profile,
        });

    } catch (error) {
        console.error("Express Controller Facebook Verify Error:", error);
        return res.status(500).json({
            status: 'error',
            error: "Internal server error processing Facebook login."
        });
    }
};

// POST /api/auth/forgot-password
export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: "Vui lòng nhập email." });
        }

        // This triggers the email containing your 6-digit {{ .Token }}
        const { error } = await supabase.auth.resetPasswordForEmail(email);

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        return res.status(200).json({ message: "Mã OTP đã được gửi đến email của bạn." });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Lỗi hệ thống." });
    }
};

// POST /api/auth/verify-forgot-otp
export const verifyOtpOnly = async (req, res) => {
    try {
        const { email, token } = req.body;

        if (!email || !token) {
            return res.status(400).json({ error: "Vui lòng nhập đầy đủ email và mã OTP." });
        }

        const { data, error } = await supabase.auth.verifyOtp({
            email,
            token,
            type: 'recovery'
        });

        if (error || !data.session) {
            return res.status(400).json({ error: "Mã OTP không đúng hoặc đã hết hạn." });
        }

        // Return the temporary session token back to React Native
        return res.status(200).json({ 
            message: "Xác thực OTP thành công.",
            accessToken: data.session.access_token 
        });
    } catch (error) {
        return res.status(500).json({ error: "Lỗi hệ thống." });
    }
};

// PUT /api/auth/complete-reset
export const completeReset = async (req, res) => {
    try {
        const { newPassword } = req.body;
        
        const token = getBearerToken(req);
        

        if (!token) {
            return res.status(401).json({ error: "Phiên làm việc đã hết hạn." });
        }

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ error: "Mật khẩu phải có ít nhất 6 ký tự." });
        }

        // Use the token passed from the mobile app to target the specific user
        const userSupabase = getSupabaseUserClient(token);
        const { error: sessionError } = await userSupabase.auth.setSession({
            access_token: token,
            refresh_token: "iyl7y35cbakb",
        });
        
        const { error } = await userSupabase.auth.updateUser({ password: newPassword });
        console.log("error", error);
        if (error) return res.status(400).json({ error: error.message });

        return res.status(200).json({ message: "Đặt lại mật khẩu thành công!" });
    } catch (error) {
        return res.status(500).json({ error: "Lỗi hệ thống." });
    }
};