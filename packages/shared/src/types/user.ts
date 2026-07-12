// types/user.ts
import { UserProfileSummary } from "./auth";

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
}

export interface UpdateUserDataRequestBody {
    name?: string;
    profileImgUrl?: string | null;
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
    type: string; // "BUG" | "FEATURE" | "OTHER"
}

export interface FeedbackDto {
    id: string;
    userId: string;
    content: string;
    type: string;
    createdAt: string;
}


