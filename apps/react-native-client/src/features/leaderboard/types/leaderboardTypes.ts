// types/leaderboardTypes.ts — Matched with real API response

export interface LeaderboardUser {
    id: string;
    name: string;
    avatarUrl: string | null;
    equippedFrameUrl?: string | null;
    tierName: string;
    currentStreak: number;
    badgeImgUrl: string | null;
    totalXp: number;
}

export interface LeaderboardResponse {
    entries: LeaderboardUser[];
    total: number;
    page: number;
    pageSize: number;
    userPosition: {
        rank: number;
        userId: string;
        name: string;
        avatarUrl: string | null;
        equippedFrameUrl?: string | null;
        totalXp: number;
        currentStreak: number;
    } | null;
}

export type SortType = "xp" | "streak";
