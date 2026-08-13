import { useState, useMemo } from "react";
import { useWindowDimensions } from "react-native";
import { useGetLeaderboardQuery } from "../services/leaderboardApi";
import { SortType } from "../types/leaderboardTypes";
import { useGetFriendsQuery, useGetFollowingQuery } from "@/features/social/services/socialApi";

export interface DisplayUser {
    id: string;
    name: string;
    xp: number;
    streak: number;
    hasCompletedToday?: boolean;
    avatar: string;
    equippedFrameUrl: string | null;
    isFriend: boolean;
    isFollowing: boolean;
    rank: number;
}

export type LeaderboardFilterOption = "all" | "friends" | "following" | "both";

export function useLeaderboard(myUserId?: string) {
    const { width } = useWindowDimensions();
    const isSmallDevice = width < 390;

    const [activeTab, setActiveTab] = useState<"xp" | "streak">("xp");
    const [filterOption, setFilterOption] = useState<LeaderboardFilterOption>("all");

    const {
        data: response,
        isLoading: isLeaderboardLoading,
        isFetching: isLeaderboardFetching,
        isError,
        refetch,
    } = useGetLeaderboardQuery({
        limit: 20,
        page: 1,
        sort: activeTab as SortType,
    });

    const { data: friendsData } = useGetFriendsQuery(undefined, { skip: !myUserId });
    const { data: followingData } = useGetFollowingQuery(myUserId ?? "", { skip: !myUserId });

    const friendIdsSet = useMemo(() => {
        const set = new Set<string>();
        if (friendsData?.friends) {
            friendsData.friends.forEach((f) => {
                if (f.user?.id) set.add(String(f.user.id));
            });
        }
        return set;
    }, [friendsData]);

    const followingIdsSet = useMemo(() => {
        const set = new Set<string>();
        if (followingData?.following) {
            followingData.following.forEach((f) => {
                if (f.user?.id) set.add(String(f.user.id));
            });
        }
        return set;
    }, [followingData]);

    const displayUsers: DisplayUser[] = useMemo(() => {
        if (!response?.entries) return [];

        const mapped = response.entries.map((user) => {
            const userIdStr = String(user.id);
            return {
                id: userIdStr,
                name: user.name || "Ẩn danh",
                xp: user.totalXp ?? 0,
                streak: user.currentStreak ?? 0,
                hasCompletedToday: user.hasCompletedToday ?? false,
                avatar:
                    user.avatarUrl ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        user.name || "User"
                    )}&background=E8E4F4&color=5856D6&bold=true`,
                equippedFrameUrl: user.equippedFrameUrl ?? null,
                isFriend: friendIdsSet.has(userIdStr),
                isFollowing: followingIdsSet.has(userIdStr),
                rank: 0,
            };
        });

        const filtered = mapped.filter((user) => {
            if (myUserId && String(user.id) === String(myUserId)) {
                return true;
            }
            if (filterOption === "all") {
                return true;
            }
            if (filterOption === "friends") {
                return user.isFriend;
            }
            if (filterOption === "following") {
                return user.isFollowing;
            }
            if (filterOption === "both") {
                return user.isFriend || user.isFollowing;
            }
            return true;
        });

        return filtered.map((user, idx) => ({
            ...user,
            rank: idx + 1,
        }));
    }, [response, friendIdsSet, followingIdsSet, filterOption, myUserId]);

    const topUsers = displayUsers.slice(0, 3);
    const rankingList = displayUsers.slice(3);

    return {
        topUsers,
        rankingList,
        displayUsers,
        isSmallDevice,
        activeTab,
        setActiveTab,
        filterOption,
        setFilterOption,
        isLoading: isLeaderboardLoading,
        isFetching: isLeaderboardFetching,
        isError,
        refetch,
        total: displayUsers.length,
    };
}

