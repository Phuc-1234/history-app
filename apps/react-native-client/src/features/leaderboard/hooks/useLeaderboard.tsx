import { useState, useMemo } from "react";
import { useWindowDimensions } from "react-native";
import { useGetLeaderboardQuery } from "../services/leaderboardApi";
import { SortType } from "../types/leaderboardTypes";

export interface DisplayUser {
    id: string;
    name: string;
    xp: number;
    streak: number;
    avatar: string;
}

export function useLeaderboard() {
    const { width } = useWindowDimensions();
    const isSmallDevice = width < 390;

    const [activeTab, setActiveTab] = useState<"xp" | "streak">("xp");

    const {
        data: response,
        isLoading,
        isError,
        refetch,
    } = useGetLeaderboardQuery({
        limit: 20,
        page: 1,
        sort: activeTab as SortType,
    });

    const displayUsers: DisplayUser[] = useMemo(() => {
        if (!response?.entries) return [];
        return response.entries.map((user) => ({
            id: user.id,
            name: user.name || "Ẩn danh",
            xp: user.totalXp ?? 0,
            streak: user.currentStreak ?? 0,
            avatar:
                user.avatarUrl ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    user.name || "User"
                )}&background=E8E4F4&color=5856D6&bold=true`,
        }));
    }, [response]);

    const topUsers = displayUsers.slice(0, 3);
    const rankingList = displayUsers.slice(3);

    return {
        topUsers,
        rankingList,
        isSmallDevice,
        activeTab,
        setActiveTab,
        isLoading,
        isError,
        refetch,
        total: response?.total ?? 0,
    };
}
