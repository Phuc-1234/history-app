// types/user.ts
import { UserProfileSummary } from "./auth";
import { FeedbackStatus } from "@prisma/client";

// --- GET /user/profile ---

// Guest fallback: no token or token invalid, user browses as anonymous
export interface GuestProfileResponse {
    isGuest: true;
    name: string;
    totalGold: number;
    totalXp: number;
    tierName: string | null;
    badgeImgUrl: string | null;
    profileImgUrl: null;
}

// Authenticated student: full profile with tier info
export interface StudentProfileResponse extends UserProfileSummary {
    isGuest: false;
}

export type UserProfileResponseBody =
    | GuestProfileResponse
    | StudentProfileResponse
    | { error: string };

export interface UpdateProfileRequestBody {
    name?: string;
    email?: string;
    profileImgUrl?: string | null;
    isHidden?: boolean;
}

export interface UpdateUserDataRequestBody {
    name?: string;
    profileImgUrl?: string | null;
    isHidden?: boolean;
}

export interface UpdateUserEmailRequestBody {
    newEmail?: string;
}

export interface ChangePasswordRequestBody {
    currentPassword?: string;
    oldPassword?: string;
    newPassword?: string;
}

export interface CreateFeedbackRequestBody {
    content: string;
    type: string; // "BUG" | "FEATURE" | "OTHER" | "INCORRECT_INFO"
    targetType?: string | null;
    targetId?: string | null;
}

export interface FeedbackDto {
    id: string;
    userId: string;
    content: string;
    type: string;
    status: FeedbackStatus;
    createdAt: string;
    targetType?: string | null;
    targetId?: string | null;
    targetName?: string | null;
}



