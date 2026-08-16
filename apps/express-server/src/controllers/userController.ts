import { Request, Response } from "express";
import {
    prisma,
    UserProfileResponseBody,
    UserProfileSummary,
    UpdateProfileRequestBody,
    ChangePasswordRequestBody,
    UpdateUserDataRequestBody,
    UpdateUserEmailRequestBody,
} from "@history-app/shared";
import { supabase, getSupabaseUserClient } from "../config/supabaseClient";
import { rewardEngine } from "../services/rewardEngine";

export const getBearerToken = (req: Request) => {
    const authHeader = req.headers.authorization;
    return authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;
};

const getRefreshToken = (req: Request) => {
    const headerValue = req.headers["x-refresh-token"];
    return Array.isArray(headerValue) ? headerValue[0] : headerValue;
};

const updateSupabaseAuthUser = async (req: Request, updates: any) => {
    const accessToken = getBearerToken(req);
    const refreshToken = getRefreshToken(req);

    if (!accessToken || !refreshToken) {
        return {
            error: {
                message: "Phiên đăng nhập thiếu refresh token. Vui lòng đăng nhập lại.",
            },
        };
    }

    const userSupabase = getSupabaseUserClient(accessToken);
    const { error: sessionError } = await userSupabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
    });

    if (sessionError) {
        return { error: sessionError };
    }

    return userSupabase.auth.updateUser(updates);
};

export const getUserProfile = async (
    req: Request<{}, UserProfileResponseBody, {}>,
    res: Response<UserProfileResponseBody>,
): Promise<Response<UserProfileResponseBody>> => {
    try {
        if (!req.user) {
            return res.status(200).json({
                isGuest: true,
                name: "Anonymous Historian",
                totalGold: 0,
                totalXp: 0,
                tierName: null,
                badgeImgUrl: null,
                profileImgUrl: null,
            });
        }

        await rewardEngine.checkStreakOnLogin(req.user.id);

        const fullProfile = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                name: true,
                email: true,
                totalXp: true,
                totalGold: true,
                profileImgUrl: true,
                currentStreak: true,
                isPro: true,
                proExpiresAt: true,
                currentTierIndex: true,
                tier: {
                    select: {
                        name: true,
                        badgeImgUrl: true,
                    },
                },
                userEquippedItems: {
                    where: { equipmentSlot: "AVT_FRAME" },
                    include: { itemDefinition: true },
                },
            },
        });

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

        const equippedFrameUrl = fullProfile.userEquippedItems.length > 0
            ? fullProfile.userEquippedItems[0].itemDefinition.imgUrl
            : null;

        return res.status(200).json({
            isGuest: false,
            id: fullProfile.id,
            name: fullProfile.name,
            email: fullProfile.email,
            totalXp: fullProfile.totalXp,
            totalGold: fullProfile.totalGold,
            profileImgUrl: fullProfile.profileImgUrl,
            currentStreak: fullProfile.currentStreak,
            tierName: fullProfile.tier.name,
            badgeImgUrl: fullProfile.tier.badgeImgUrl,
            equippedFrameUrl,
            isPro: fullProfile.isPro ?? false,
            proExpiresAt: fullProfile.proExpiresAt ? fullProfile.proExpiresAt.toISOString() : null,
            currentTierIndex: fullProfile.currentTierIndex,
        });
    } catch (error) {
        console.error("Express Profile Fetch Controller Crash:", error);
        return res.status(500).json({
            error: "Internal server error assembling user dashboard profile.",
        });
    }
};

export const updateUserProfile = async (
    req: Request<{}, UserProfileSummary | { error: string }, UpdateProfileRequestBody>,
    res: Response<UserProfileSummary | { error: string }>,
): Promise<Response<UserProfileSummary | { error: string }>> => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Access denied. Valid session missing." });
        }

        const { name, email, profileImgUrl } = req.body;
        const trimmedName = name?.trim();
        const trimmedEmail = email?.trim();

        if (trimmedName === "") {
            return res.status(400).json({ error: "Tên không được để trống." });
        }
        if (trimmedEmail === "") {
            return res.status(400).json({ error: "Email không được để trống." });
        }

        // Check if email already exists in public.users to avoid uniqueness constraint violation
        if (trimmedEmail && trimmedEmail !== req.user.email) {
            const existingUser = await prisma.user.findUnique({
                where: { email: trimmedEmail },
            });
            if (existingUser) {
                return res.status(400).json({
                    error: "Email này đã được sử dụng bởi một tài khoản khác.",
                });
            }
        }

        // 1. Update in Supabase Auth via admin API. The request is already scoped
        // to req.user by requireStudent; auth.updateUser() needs an in-memory session.
        const authUpdates: any = {};
        if (trimmedEmail) authUpdates.email = trimmedEmail;
        if (trimmedName) authUpdates.data = { name: trimmedName };

        if (Object.keys(authUpdates).length > 0) {
            const { error: authError } = await updateSupabaseAuthUser(req, authUpdates);
            if (authError) {
                return res.status(400).json({ error: authError.message });
            }
        }

        // 2. Update in Prisma DB
        const dbUpdates: any = {};
        if (trimmedName) dbUpdates.name = trimmedName;
        if (trimmedEmail) dbUpdates.email = trimmedEmail;
        if (profileImgUrl !== undefined) dbUpdates.profileImgUrl = profileImgUrl;

        const updatedProfile = await prisma.user.update({
            where: { id: req.user.id },
            data: dbUpdates,
            select: {
                id: true,
                name: true,
                email: true,
                totalXp: true,
                totalGold: true,
                profileImgUrl: true,
                currentStreak: true,
                isPro: true,
                proExpiresAt: true,
                currentTierIndex: true,
                tier: {
                    select: {
                        name: true,
                        badgeImgUrl: true,
                    },
                },
            },
        });

        return res.status(200).json({
            id: updatedProfile.id,
            name: updatedProfile.name,
            email: updatedProfile.email,
            totalXp: updatedProfile.totalXp,
            totalGold: updatedProfile.totalGold,
            profileImgUrl: updatedProfile.profileImgUrl,
            currentStreak: updatedProfile.currentStreak,
            tierName: updatedProfile.tier.name,
            badgeImgUrl: updatedProfile.tier.badgeImgUrl,
            isPro: updatedProfile.isPro ?? false,
            proExpiresAt: updatedProfile.proExpiresAt ? updatedProfile.proExpiresAt.toISOString() : null,
            currentTierIndex: updatedProfile.currentTierIndex,
        });
    } catch (error: any) {
        console.error("Express Profile Update Controller Crash:", error);
        if (error.code === "P2002") {
            return res.status(400).json({
                error: "Email này đã được sử dụng bởi một tài khoản khác.",
            });
        }
        return res.status(500).json({
            error: "Lỗi hệ thống khi cập nhật thông tin cá nhân.",
        });
    }
};

export const changeUserPassword = async (
    req: Request<{}, { message: string } | { error: string }, ChangePasswordRequestBody>,
    res: Response<{ message: string } | { error: string }>,
): Promise<Response<{ message: string } | { error: string }>> => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Access denied. Valid session missing." });
        }

        const body = req.body as ChangePasswordRequestBody & {
            current_password?: string;
            old_password?: string;
            new_password?: string;
        };
        const currentPassword = body.oldPassword || body.currentPassword || body.old_password || body.current_password;
        const newPassword = body.newPassword || body.new_password;

        if (!currentPassword) {
            return res.status(400).json({ error: "Vui lòng nhập mật khẩu cũ." });
        }

        if (!newPassword) {
            return res.status(400).json({ error: "Vui lòng nhập đầy đủ mật khẩu cũ và mới." });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ error: "Mật khẩu mới phải có ít nhất 6 ký tự." });
        }

        if (newPassword === currentPassword) {
            return res.status(400).json({ error: "Mật khẩu mới không được trùng mật khẩu cũ." });
        }

        const token = getBearerToken(req);
        if (!token) {
            return res.status(401).json({ error: "Access token missing." });
        }

        const { data: authUserData, error: authUserError } = await supabase.auth.getUser(token);
        if (authUserError || !authUserData.user.email) {
            return res.status(401).json({ error: "Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại." });
        }

        // 1. Verify old password against the Supabase Auth email for this token.
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: authUserData.user.email,
            password: currentPassword,
        });

        if (signInError || !signInData.session) {
            return res.status(400).json({ error: "Mật khẩu cũ không đúng." });
        }

        const userSupabase = getSupabaseUserClient(signInData.session.access_token);
        const { error: sessionError } = await userSupabase.auth.setSession({
            access_token: signInData.session.access_token,
            refresh_token: signInData.session.refresh_token,
        });

        if (sessionError) {
            return res.status(400).json({ error: sessionError.message });
        }

        // 2. Change password using the verified fresh session.
        const { error: updateError } = await userSupabase.auth.updateUser({
            password: newPassword,
            current_password: currentPassword,
        });

        if (updateError) {
            return res.status(400).json({ error: updateError.message });
        }

        return res.status(200).json({ message: "Password updated successfully." });
    } catch (error) {
        console.error("Express Change Password Controller Crash:", error);
        return res.status(500).json({
            error: "Lỗi hệ thống khi cập nhật mật khẩu.",
        });
    }
};

export const updateUserData = async (
    req: Request<{}, { message: string } | { error: string }, UpdateUserDataRequestBody>,
    res: Response<{ message: string } | { error: string }>,
): Promise<Response<{ message: string } | { error: string }>> => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Access denied. Valid session missing." });
        }

        const { name, profileImgUrl } = req.body;
        const trimmedName = name?.trim();

        if (trimmedName === "") {
            return res.status(400).json({ error: "Tên không được để trống." });
        }

        // 1. Update in Supabase Auth metadata
        if (trimmedName) {
            const { error: authError } = await updateSupabaseAuthUser(req, { data: { name: trimmedName } });
            if (authError) {
                return res.status(400).json({ error: authError.message });
            }
        }

        // 2. Update in Prisma DB
        const dbUpdates: any = {};
        if (trimmedName) dbUpdates.name = trimmedName;
        if (profileImgUrl !== undefined) dbUpdates.profileImgUrl = profileImgUrl;

        if (Object.keys(dbUpdates).length > 0) {
            await prisma.user.update({
                where: { id: req.user.id },
                data: dbUpdates,
            });
        }

        return res.status(200).json({
            message: "User data updated successfully.",
        });
    } catch (error) {
        console.error("Express User Data Update Controller Crash:", error);
        return res.status(500).json({
            error: "Lỗi hệ thống khi cập nhật thông tin người dùng.",
        });
    }
};

export const updateUserEmail = async (
    req: Request<{}, { message: string } | { error: string }, UpdateUserEmailRequestBody>,
    res: Response<{ message: string } | { error: string }>,
): Promise<Response<{ message: string } | { error: string }>> => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Access denied. Valid session missing." });
        }

        const { newEmail } = req.body;
        const trimmedEmail = newEmail?.trim();

        if (!trimmedEmail) {
            return res.status(400).json({ error: "Email mới không được để trống." });
        }

        if (trimmedEmail === req.user.email) {
            return res.status(400).json({ error: "Email mới phải khác email hiện tại." });
        }

        // Check email uniqueness
        const existingUser = await prisma.user.findUnique({
            where: { email: trimmedEmail },
        });
        if (existingUser) {
            return res.status(400).json({
                error: "Email này đã được sử dụng bởi một tài khoản khác.",
            });
        }

        // 1. Initiate update in Supabase Auth (sends OTP code to new email)
        const { error: authError } = await updateSupabaseAuthUser(req, { email: trimmedEmail });
        if (authError) {
            return res.status(400).json({ error: authError.message });
        }

        return res.status(200).json({
            message: "Mã OTP đã được gửi đến email mới. Vui lòng kiểm tra hộp thư của bạn.",
        });
    } catch (error: any) {
        console.error("Express User Email Update Controller Crash:", error);
        if (error.code === "P2002") {
            return res.status(400).json({
                error: "Email này đã được sử dụng bởi một tài khoản khác.",
            });
        }
        return res.status(500).json({
            error: "Lỗi hệ thống khi gửi mã xác thực email.",
        });
    }
};

export const verifyUserEmailChange = async (
    req: Request<{}, { message: string } | { error: string }, { newEmail: string; token: string }>,
    res: Response<{ message: string } | { error: string }>,
): Promise<Response<{ message: string } | { error: string }>> => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Access denied. Valid session missing." });
        }

        const { newEmail, token } = req.body;
        const trimmedEmail = newEmail?.trim();
        const trimmedToken = token?.trim();

        if (!trimmedEmail || !trimmedToken) {
            return res.status(400).json({ error: "Email mới và mã OTP không được để trống." });
        }

        const accessToken = getBearerToken(req);
        const refreshToken = getRefreshToken(req);

        if (!accessToken) {
            return res.status(401).json({ error: "Access token missing." });
        }

        const userSupabase = getSupabaseUserClient(accessToken);
        if (refreshToken) {
            await userSupabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
            });
        }

        const { error } = await userSupabase.auth.verifyOtp({
            email: trimmedEmail,
            token: trimmedToken,
            type: "email_change",
        });

        if (error) {
            return res.status(400).json({ error: error.message || "Mã OTP không chính xác hoặc đã hết hạn." });
        }

        // Update email in Prisma DB after successful OTP verification
        await prisma.user.update({
            where: { id: req.user.id },
            data: { email: trimmedEmail },
        });

        return res.status(200).json({
            message: "Xác thực và cập nhật email thành công.",
        });
    } catch (error: any) {
        console.error("Express Verify User Email Controller Crash:", error);
        if (error.code === "P2002") {
            return res.status(400).json({
                error: "Email này đã được sử dụng bởi một tài khoản khác.",
            });
        }
        return res.status(500).json({
            error: "Lỗi hệ thống khi xác thực email.",
        });
    }
};
