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
