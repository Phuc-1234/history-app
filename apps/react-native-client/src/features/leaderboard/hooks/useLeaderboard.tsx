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
    avatar: string;
    equippedFrameUrl: string | null;
    isFriend: boolean;
    isFollowing: boolean;
    rank: number;
}

export function useLeaderboard(myUserId?: string) {
    const { width } = useWindowDimensions();
    const isSmallDevice = width < 390;

    const [activeTab, setActiveTab] = useState<"xp" | "streak">("xp");
    const [filterFriends, setFilterFriends] = useState(true);
    const [filterFollowing, setFilterFollowing] = useState(true);
    const [filterAll, setFilterAll] = useState(true);

    const toggleAll = () => {
        if (filterAll) {
            setFilterAll(false);
            setFilterFriends(false);
            setFilterFollowing(false);
        } else {
            setFilterAll(true);
            setFilterFriends(true);
            setFilterFollowing(true);
        }
    };

    const toggleFriends = () => {
        setFilterFriends((prev) => {
            const next = !prev;
            if (!next) {
                setFilterAll(false);
            }
            return next;
        });
    };

    const toggleFollowing = () => {
        setFilterFollowing((prev) => {
            const next = !prev;
            if (!next) {
                setFilterAll(false);
            }
            return next;
        });
    };

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

        const filtered = filterAll
            ? mapped
            : mapped.filter((user) => {
                  if (myUserId && String(user.id) === String(myUserId)) {
                      return true;
                  }
                  const matchFriend = filterFriends && user.isFriend;
                  const matchFollowing = filterFollowing && user.isFollowing;
                  return matchFriend || matchFollowing;
              });

        return filtered.map((user, idx) => ({
            ...user,
            rank: idx + 1,
        }));
    }, [response, friendIdsSet, followingIdsSet, filterAll, filterFriends, filterFollowing, myUserId]);

    const topUsers = displayUsers.slice(0, 3);
    const rankingList = displayUsers.slice(3);

    return {
        topUsers,
        rankingList,
        displayUsers,
        isSmallDevice,
        activeTab,
        setActiveTab,
        filterAll,
        toggleAll,
        filterFriends,
        toggleFriends,
        filterFollowing,
        toggleFollowing,
        isLoading: isLeaderboardLoading,
        isFetching: isLeaderboardFetching,
        isError,
        refetch,
        total: displayUsers.length,
    };
}

