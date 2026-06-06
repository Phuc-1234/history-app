import { useCallback } from "react";
import { useWindowDimensions } from "react-native";
import { useSelector } from "react-redux";
import { RootState } from "../../../store/store";
import { useGetLeaderboardXpQuery } from "../services/leaderboardApi";
import { useGetProfileQuery } from "@/features/auth/services/authApi";
import { LeaderboardEntry, UserProfileSummary } from "@history-app/shared";

// ─── Public types ────────────────────────────────────────────────────────────

export interface LeaderboardUser {
    id: string;
    name: string;
    xp: number;
    avatar: string;
    tierName: string | null;
    badgeImgUrl: string | null;
    currentStreak: number;
    /** True when this slot was synthesised from the current user's profile */
    isCurrentUser: boolean;
}

/** Shown as a separate card when the user is outside the top-N entries (userPosition > 3) */
export interface MyRankCard {
    position: number;
    user: LeaderboardUser;
}

export interface UseLeaderboardResult {
    /** Always length-3, padded with EMPTY_USER, arranged as [2nd, 1st, 3rd] */
    topUsers: LeaderboardUser[];
    /** Rank 4+ */
    rankingList: LeaderboardUser[];
    /** Non-null only when userPosition > 3 AND user not already in entries */
    myRankCard: MyRankCard | null;
    isSmallDevice: boolean;
    isLoading: boolean;
    error: unknown;
    refetch: () => Promise<void>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const EMPTY_USER: LeaderboardUser = {
    id: "",
    name: "-",
    xp: 0,
    avatar: "",
    tierName: null,
    badgeImgUrl: null,
    currentStreak: 0,
    isCurrentUser: false,
};

function entryToUser(entry: LeaderboardEntry, currentUserId?: string): LeaderboardUser {
    return {
        id: entry.id,
        name: entry.id === currentUserId ? "Bạn" : entry.name,
        xp: entry.totalXp,
        avatar: entry.avatarUrl ?? "",
        tierName: entry.tierName ?? null,
        badgeImgUrl: entry.badgeImgUrl ?? null,
        currentStreak: entry.currentStreak,
        isCurrentUser: entry.id === currentUserId,
    };
}

function profileToUser(profile: UserProfileSummary): LeaderboardUser {
    return {
        id: profile.id,
        name: "Bạn",
        xp: profile.totalXp,
        avatar: profile.profileImgUrl ?? "",
        tierName: profile.tierName ?? null,
        badgeImgUrl: profile.badgeImgUrl ?? null,
        currentStreak: profile.currentStreak,
        isCurrentUser: true,
    };
}

/**
 * Insert the current user's profile entry at the correct 0-based index
 * (userPosition is 1-based from the server).
 * Existing entries at that index and beyond shift down by one.
 */
function mergeProfileAt(
    sorted: LeaderboardEntry[],
    profile: UserProfileSummary,
    userPosition: number, // 1-based
): LeaderboardUser[] {
    const insertIdx = userPosition - 1; // convert to 0-based
    const result: LeaderboardUser[] = sorted.map((e) => entryToUser(e, profile.id));
    result.splice(insertIdx, 0, profileToUser(profile));
    return result;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useLeaderboard(): UseLeaderboardResult {
    const { width } = useWindowDimensions();
    const isSmallDevice = width < 390;

    const currentProfile = useSelector((state: RootState) => state.auth.profile);
    const currentUserId = currentProfile?.id;

    // ── 1. Fetch leaderboard ────────────────────────────────────────────────
    const {
        data: leaderboardData,
        isLoading,
        error,
        refetch: refetchLeaderboard,
    } = useGetLeaderboardXpQuery({ limit: 20, page: 1, sort: "xp" });

    // ── 2. Subscribe to profile so TopBar re-renders on pull-to-refresh ─────
    const { refetch: refetchProfile } = useGetProfileQuery();

    // ── 3. Combined pull-to-refresh ─────────────────────────────────────────
    const refetch = useCallback(async () => {
        try {
            await Promise.all([refetchLeaderboard(), refetchProfile()]);
        } catch (err) {
            console.error("Leaderboard/profile refresh failed:", err);
        }
    }, [refetchLeaderboard, refetchProfile]);

    // ── 4. Extract & sort entries desc by totalXp ───────────────────────────
    const rawEntries: LeaderboardEntry[] =
        leaderboardData && "entries" in leaderboardData
            ? leaderboardData.entries
            : [];

    // Sort desc by totalXp (in case backend skips it)
    const sorted = [...rawEntries].sort((a, b) => b.totalXp - a.totalXp);

    // userPosition is 1-based; null means anonymous / not returned
    const userPosition: number | null =
        leaderboardData && "userPosition" in leaderboardData
            ? (leaderboardData.userPosition ?? null)
            : null;

    const userAlreadyInEntries =
        !!currentUserId && sorted.some((e) => e.id === currentUserId);

    // ── 5. Build the working list with merge logic ──────────────────────────
    let workingList: LeaderboardUser[];

    if (!userAlreadyInEntries && userPosition !== null && currentProfile) {
        if (userPosition <= 3) {
            // ▸ User belongs in the podium but is missing from entries.
            //   Insert at the correct position so the podium is accurate.
            workingList = mergeProfileAt(sorted, currentProfile, userPosition);
        } else {
            // ▸ User is outside the fetched page — show as a separate card below.
            workingList = sorted.map((e) => entryToUser(e, currentUserId));
        }
    } else {
        // ▸ User already present in entries or not logged in — no merge needed.
        workingList = sorted.map((e) => entryToUser(e, currentUserId));
    }

    // ── 6. Podium & ranking list from workingList ───────────────────────────
    // Podium display order: [2nd place (left), 1st place (center), 3rd place (right)]
    const topUsers: LeaderboardUser[] = [
        workingList[1] ?? EMPTY_USER, // 2nd
        workingList[0] ?? EMPTY_USER, // 1st
        workingList[2] ?? EMPTY_USER, // 3rd
    ];

    const rankingList: LeaderboardUser[] = workingList.slice(3);

    // ── 7. "Hạng của bạn" card — only when userPosition > 3 ─────────────────
    let myRankCard: MyRankCard | null = null;

    if (
        currentProfile &&
        currentUserId &&
        userPosition !== null &&
        userPosition > 3
    ) {
        myRankCard = {
            position: userPosition,
            user: profileToUser(currentProfile),
        };
    }

    return {
        topUsers,
        rankingList,
        myRankCard,
        isSmallDevice,
        isLoading,
        error,
        refetch,
    };
}
