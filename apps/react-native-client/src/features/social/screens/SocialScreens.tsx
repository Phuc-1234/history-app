import React, { useState } from "react";
import {
    Image,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import {
    useAcceptFriendRequestMutation,
    useCancelFriendRequestMutation,
    useFollowUserMutation,
    useGetFollowersQuery,
    useGetFollowingQuery,
    useGetFriendsQuery,
    useGetIncomingFriendRequestsQuery,
    useGetOutgoingFriendRequestsQuery,
    useGetSocialProfileQuery,
    useRejectFriendRequestMutation,
    useSearchSocialUsersQuery,
    useSendFriendRequestMutation,
    useUnfollowUserMutation,
} from "../services/socialApi";
import type { SocialProfile, SocialUser as ApiSocialUser } from "../types/socialApiTypes";
import { useGetProfileQuery } from "@/features/auth/services/authApi";
import { useAppSelector } from "@/store/storeHook";

type SocialUser = {
    id: string;
    name: string;
    level: number;
    avatar: string;
    title: string;
    xp: number;
    mutualFriends: number;
    relation: "friend" | "following" | "none" | "pending";
    winRate: number;
};

type Challenge = {
    id: string;
    opponent: SocialUser;
    topic: string;
    status: "incoming" | "outgoing" | "done";
    score?: string;
};

const colors = {
    background: "#FAFAF9",
    surface: "#FFFFFF",
    primary: "#4F46E5",
    primaryDark: "#3525CD",
    primarySoft: "#EEF2FF",
    amber: "#F59E0B",
    amberSoft: "#FEF3C7",
    emerald: "#10B981",
    emeraldSoft: "#D1FAE5",
    rose: "#F43F5E",
    roseSoft: "#FFE4E6",
    text: "#1C1917",
    textMuted: "#78716C",
    border: "#E7E5E4",
};

const users: SocialUser[] = [
    {
        id: "lan-chi",
        name: "Lan Chi",
        level: 12,
        avatar: "https://i.pravatar.cc/160?img=47",
        title: "Chuyên gia Nhà Trần",
        xp: 8640,
        mutualFriends: 5,
        relation: "friend",
        winRate: 68,
    },
    {
        id: "minh-anh",
        name: "Minh Anh",
        level: 10,
        avatar: "https://i.pravatar.cc/160?img=32",
        title: "Đang ôn thi THPT",
        xp: 7210,
        mutualFriends: 3,
        relation: "following",
        winRate: 54,
    },
    {
        id: "quang-huy",
        name: "Quang Huy",
        level: 9,
        avatar: "https://i.pravatar.cc/160?img=12",
        title: "Yêu thích chiến dịch lịch sử",
        xp: 6780,
        mutualFriends: 2,
        relation: "pending",
        winRate: 61,
    },
    {
        id: "bao-ngoc",
        name: "Bảo Ngọc",
        level: 7,
        avatar: "https://i.pravatar.cc/160?img=44",
        title: "Mới tham gia",
        xp: 4120,
        mutualFriends: 0,
        relation: "none",
        winRate: 49,
    },
];

const challenges: Challenge[] = [
    {
        id: "challenge-1",
        opponent: users[0],
        topic: "Nhà Trần chống Nguyên Mông",
        status: "incoming",
    },
    {
        id: "challenge-2",
        opponent: users[1],
        topic: "Các triều đại Việt Nam",
        status: "outgoing",
    },
    {
        id: "challenge-3",
        opponent: users[2],
        topic: "Nhân vật lịch sử nổi bật",
        status: "done",
        score: "85 - 70",
    },
];

const questionPacks = [
    {
        id: "tran",
        title: "Nhà Trần chống Nguyên Mông",
        meta: "10 câu - 8 phút - Khó vừa",
        reward: "+120 XP",
    },
    {
        id: "dynasty",
        title: "Các triều đại Việt Nam",
        meta: "12 câu - 10 phút - Dễ",
        reward: "+90 XP",
    },
    {
        id: "people",
        title: "Nhân vật lịch sử nổi bật",
        meta: "15 câu - 12 phút - Trung bình",
        reward: "+110 XP",
    },
];

function pushRoute(router: ReturnType<typeof useRouter>, route: string) {
    router.push(route as never);
}

function replaceRoute(router: ReturnType<typeof useRouter>, route: string) {
    router.replace(route as never);
}

function toViewUser(user: ApiSocialUser): SocialUser {
    const relation =
        user.relationStatus === "friend"
            ? "friend"
            : user.relationStatus === "outgoing_request"
              ? "pending"
              : user.isFollowing
                ? "following"
                : "none";

    return {
        id: user.id,
        name: user.name,
        level: Math.max(1, Math.floor((user.totalXp ?? 0) / 1000) + 1),
        avatar: user.profileImgUrl ?? "",
        title: user.tierName || "Người học lịch sử",
        xp: user.totalXp ?? 0,
        mutualFriends: 0,
        relation,
        winRate: 0,
    };
}

function relationButton(user: SocialUser) {
    if (user.relation === "friend") {
        return { label: "Bạn bè", icon: "checkmark" as const };
    }
    if (user.relation === "pending") {
        return { label: "Đang chờ", icon: "time" as const };
    }
    if (user.relation === "following") {
        return { label: "Đã theo dõi", icon: "notifications" as const };
    }
    return { label: "Theo dõi", icon: "person-add" as const };
}

function EmptyState({
    title,
    actionLabel,
    onAction,
}: {
    title: string;
    actionLabel?: string;
    onAction?: () => void;
}) {
    return (
        <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={30} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>{title}</Text>
            {actionLabel && onAction ? (
                <PrimaryButton label={actionLabel} icon="refresh" variant="soft" onPress={onAction} />
            ) : null}
        </View>
    );
}

function SocialBottomBar() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const isWeb = Platform.OS === "web";
    const bottomPadding = isWeb ? 12 : insets.bottom > 0 ? insets.bottom + 4 : 16;
    const bottomHeight = isWeb ? 70 : insets.bottom > 0 ? 50 + insets.bottom : 68;

    const tabs: Array<{
        route: string;
        icon: keyof typeof Ionicons.glyphMap;
        activeIcon: keyof typeof Ionicons.glyphMap;
        active?: boolean;
    }> = [
        { route: "/(tabs)/2_1_lessons", icon: "book-outline", activeIcon: "book" },
        { route: "/(tabs)/5_1_national_tests", icon: "clipboard-outline", activeIcon: "clipboard" },
        { route: "/(tabs)/7_1_inventory", icon: "cube-outline", activeIcon: "cube" },
        { route: "/(tabs)/8_1_store", icon: "storefront-outline", activeIcon: "storefront" },
        { route: "/(tabs)/9_1_leaderboard", icon: "stats-chart-outline", activeIcon: "stats-chart" },
        { route: "/(tabs)/10_1_profile", icon: "person-outline", activeIcon: "person", active: true },
    ];

    return (
        <View
            style={[
                styles.bottomBar,
                {
                    height: bottomHeight,
                    paddingBottom: bottomPadding,
                },
            ]}
        >
            {tabs.map((tab) => (
                <TouchableOpacity
                    key={tab.route}
                    style={styles.bottomBarItem}
                    onPress={() => replaceRoute(router, tab.route)}
                    activeOpacity={0.78}
                    hitSlop={8}
                >
                    <View style={[styles.bottomIconWrapper, tab.active && styles.bottomIconActive]}>
                        <Ionicons
                            name={tab.active ? tab.activeIcon : tab.icon}
                            size={22}
                            color={tab.active ? "#FFFFFF" : "#4E4A58"}
                        />
                    </View>
                </TouchableOpacity>
            ))}
        </View>
    );
}

function ScreenShell({
    title,
    rightLabel,
    children,
}: {
    title: string;
    rightLabel?: string;
    children: React.ReactNode;
}) {
    const router = useRouter();

    return (
        <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => router.back()}
                    activeOpacity={0.75}
                >
                    <Ionicons name="chevron-back" size={22} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>
                    {title}
                </Text>
                {rightLabel ? (
                    <TouchableOpacity activeOpacity={0.75}>
                        <Text style={styles.headerAction}>{rightLabel}</Text>
                    </TouchableOpacity>
                ) : (
                    <View style={styles.iconButton} />
                )}
            </View>
            {children}
            <SocialBottomBar />
        </SafeAreaView>
    );
}

function getInitials(name: string) {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "?";
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function Avatar({ user, size = 52 }: { user: SocialUser; size?: number }) {
    if (!user.avatar) {
        return (
            <View
                style={[
                    styles.avatarFallback,
                    {
                        width: size,
                        height: size,
                        borderRadius: size / 2,
                    },
                ]}
            >
                <Text style={[styles.avatarFallbackText, { fontSize: size * 0.4 }]}>
                    {getInitials(user.name)}
                </Text>
            </View>
        );
    }
    return (
        <Image
            source={{ uri: user.avatar }}
            style={{ width: size, height: size, borderRadius: size / 2 }}
        />
    );
}

function PrimaryButton({
    label,
    icon,
    onPress,
    variant = "primary",
}: {
    label: string;
    icon?: keyof typeof Ionicons.glyphMap;
    onPress?: () => void;
    variant?: "primary" | "outline" | "soft" | "danger";
}) {
    const isPrimary = variant === "primary";
    const isDanger = variant === "danger";
    return (
        <TouchableOpacity
            style={[
                styles.button,
                isPrimary && styles.buttonPrimary,
                variant === "outline" && styles.buttonOutline,
                variant === "soft" && styles.buttonSoft,
                isDanger && styles.buttonDanger,
            ]}
            onPress={onPress}
            activeOpacity={0.82}
        >
            {icon ? (
                <Ionicons
                    name={icon}
                    size={17}
                    color={isPrimary || isDanger ? "#FFFFFF" : colors.primary}
                />
            ) : null}
            <Text
                style={[
                    styles.buttonText,
                    (isPrimary || isDanger) && styles.buttonTextPrimary,
                ]}
            >
                {label}
            </Text>
        </TouchableOpacity>
    );
}

function SegmentTabs({
    tabs,
    active,
    onChange,
}: {
    tabs: string[];
    active: string;
    onChange: (tab: string) => void;
}) {
    return (
        <View style={styles.segment}>
            {tabs.map((tab) => {
                const selected = tab === active;
                return (
                    <TouchableOpacity
                        key={tab}
                        style={[styles.segmentItem, selected && styles.segmentItemActive]}
                        onPress={() => onChange(tab)}
                        activeOpacity={0.8}
                    >
                        <Text
                            style={[
                                styles.segmentText,
                                selected && styles.segmentTextActive,
                            ]}
                        >
                            {tab}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

function UserCard({
    user,
    onPress,
    primaryLabel,
    primaryIcon,
    primaryOnPress,
}: {
    user: SocialUser;
    onPress?: () => void;
    primaryLabel?: string;
    primaryIcon?: keyof typeof Ionicons.glyphMap;
    primaryOnPress?: () => void;
}) {
    return (
        <TouchableOpacity style={styles.userCard} onPress={onPress} activeOpacity={0.85}>
            <Avatar user={user} />
            <View style={styles.userInfo}>
                <View style={styles.rowCenter}>
                    <Text style={styles.userName}>{user.name}</Text>
                    <View style={styles.levelPill}>
                        <Text style={styles.levelText}>Lv. {user.level}</Text>
                    </View>
                </View>
                <Text style={styles.userTitle} numberOfLines={1}>
                    {user.title}
                </Text>
                <Text style={styles.userMeta}>
                    {user.xp.toLocaleString()} XP - {user.mutualFriends} bạn chung
                </Text>
            </View>
            {primaryLabel ? (
                <PrimaryButton
                    label={primaryLabel}
                    icon={primaryIcon}
                    variant="soft"
                    onPress={primaryOnPress}
                />
            ) : null}
        </TouchableOpacity>
    );
}

function StatCard({ value, label }: { value: string; label: string }) {
    return (
        <View style={styles.statCard}>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
        </View>
    );
}

export function SearchUsersScreen() {
    const router = useRouter();
    const [query, setQuery] = useState("");
    const [selectedTab, setSelectedTab] = useState("Tất cả");
    const { data, isFetching, isError, refetch } = useSearchSocialUsersQuery({
        q: query,
        limit: 20,
    });
    const [followUser] = useFollowUserMutation();
    const [sendFriendRequest] = useSendFriendRequestMutation();
    const filteredUsers = data?.users.map(toViewUser) ?? [];

    return (
        <ScreenShell title="Tìm bạn">
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.searchBox}>
                    <Ionicons name="search" size={18} color={colors.textMuted} />
                    <TextInput
                        value={query}
                        onChangeText={setQuery}
                        placeholder="Tìm theo tên, lớp, thành tích"
                        placeholderTextColor={colors.textMuted}
                        style={styles.searchInput}
                    />
                </View>
                <SegmentTabs
                    tabs={["Tất cả", "Bạn chung", "Đang học", "Gần đây"]}
                    active={selectedTab}
                    onChange={setSelectedTab}
                />
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Gợi ý kết nối</Text>
                    <Text style={styles.sectionHint}>
                        {isFetching ? "Đang tải" : `${filteredUsers.length} người`}
                    </Text>
                </View>
                {isError ? (
                    <EmptyState
                        title="Không tải được danh sách người dùng. Hãy kiểm tra đăng nhập hoặc server."
                        actionLabel="Tải lại"
                        onAction={refetch}
                    />
                ) : null}
                {!isFetching && !isError && filteredUsers.length === 0 ? (
                    <EmptyState title="Chưa tìm thấy người dùng phù hợp." />
                ) : null}
                {filteredUsers.map((user) => (
                    <UserCard
                        key={user.id}
                        user={user}
                        onPress={() => pushRoute(router, `/(social)/profile?userId=${user.id}`)}
                        primaryLabel={relationButton(user).label}
                        primaryIcon={relationButton(user).icon}
                        primaryOnPress={() => {
                            if (user.relation === "none") {
                                followUser(user.id);
                            } else if (user.relation === "following") {
                                sendFriendRequest({ receiverId: user.id });
                            }
                        }}
                    />
                ))}
            </ScrollView>
        </ScreenShell>
    );
}

export function OtherProfileScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{ userId?: string }>();
    const userId = typeof params.userId === "string" ? params.userId : "";
    const { data, isFetching, isError, refetch } = useGetSocialProfileQuery(userId, {
        skip: !userId,
    });
    const [sendFriendRequest] = useSendFriendRequestMutation();
    const [followUser] = useFollowUserMutation();
    const [unfollowUser] = useUnfollowUserMutation();

    const apiProfile = data?.profile;
    const profile = apiProfile ? toViewUser(apiProfile) : null;
    const relation = apiProfile?.relationStatus ?? "none";
    const isFollowing = apiProfile?.isFollowing ?? false;

    const friendLabel =
        relation === "friend"
            ? "Bạn bè"
            : relation === "outgoing_request" || relation === "incoming_request"
              ? "Đang chờ"
              : "Kết bạn";

    return (
        <ScreenShell title="Hồ sơ" rightLabel="Báo cáo">
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {!userId ? (
                    <EmptyState title="Thiếu thông tin người dùng." />
                ) : null}
                {isFetching ? (
                    <EmptyState title="Đang tải hồ sơ..." />
                ) : null}
                {isError ? (
                    <EmptyState
                        title="Không tải được hồ sơ người dùng."
                        actionLabel="Tải lại"
                        onAction={refetch}
                    />
                ) : null}
                {!isFetching && !isError && !profile ? (
                    <EmptyState title="Không tìm thấy hồ sơ người dùng." />
                ) : null}
                {profile ? (
                <>
                <View style={styles.profileHero}>
                    <Avatar user={profile} size={88} />
                    <Text style={styles.profileName}>{profile.name}</Text>
                    <Text style={styles.profileSubtitle}>Lv. {profile.level} - {profile.title}</Text>
                    <View style={styles.profileStats}>
                        <StatCard value={String(apiProfile?.stats.friends ?? 0)} label="Bạn bè" />
                        <StatCard value={String(apiProfile?.stats.followers ?? 0)} label="Người theo dõi" />
                        <StatCard value={profile.winRate ? `${profile.winRate}%` : "--"} label="Thắng" />
                    </View>
                    <View style={styles.actionRow}>
                        <PrimaryButton
                            label={friendLabel}
                            icon={relation === "none" ? "person-add" : "checkmark"}
                            onPress={() => {
                                if (userId && relation === "none") {
                                    sendFriendRequest({ receiverId: userId });
                                }
                            }}
                        />
                        <PrimaryButton
                            label={isFollowing ? "Bỏ theo dõi" : "Theo dõi"}
                            icon={isFollowing ? "notifications-off" : "notifications"}
                            variant="outline"
                            onPress={() => {
                                if (!userId) return;
                                if (isFollowing) {
                                    unfollowUser(userId);
                                } else {
                                    followUser(userId);
                                }
                            }}
                        />
                    </View>
                    <PrimaryButton
                        label="Thách đấu"
                        icon="flash"
                        onPress={() => pushRoute(router, `/(social)/challenge-create?userId=${profile.id}`)}
                    />
                </View>

                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Thành tích nổi bật</Text>
                    <View style={styles.badgeGrid}>
                        <View style={styles.badgeCard}>
                            <Ionicons name="trophy" size={24} color={colors.amber} />
                            <Text style={styles.badgeTitle}>{profile.xp.toLocaleString()} XP</Text>
                        </View>
                        <View style={styles.badgeCard}>
                            <Ionicons name="flame" size={24} color={colors.rose} />
                            <Text style={styles.badgeTitle}>Chuỗi học {apiProfile?.currentStreak ?? 0}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Bạn chung</Text>
                    <EmptyState title="Chưa có dữ liệu bạn chung." />
                </View>
                </>
                ) : null}
            </ScrollView>
        </ScreenShell>
    );
}

export function FriendsAndFollowScreen() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("Bạn bè");
    useGetProfileQuery();
    const currentUserId = useAppSelector((state) => state.auth.profile?.id);
    const friendsQuery = useGetFriendsQuery();
    const followersQuery = useGetFollowersQuery(currentUserId ?? "", {
        skip: !currentUserId,
    });
    const followingQuery = useGetFollowingQuery(currentUserId ?? "", {
        skip: !currentUserId,
    });

    const friends = friendsQuery.data?.friends.map((item) => toViewUser(item.user)) ?? [];
    const followers = followersQuery.data?.followers.map((item) => toViewUser(item.user)) ?? [];
    const following = followingQuery.data?.following.map((item) => toViewUser(item.user)) ?? [];
    const activeUsers =
        activeTab === "Bạn bè"
            ? friends
            : activeTab === "Đang theo dõi"
              ? following
              : followers;
    const activeQuery =
        activeTab === "Bạn bè"
            ? friendsQuery
            : activeTab === "Đang theo dõi"
              ? followingQuery
              : followersQuery;
    const activeEmptyTitle =
        activeTab === "Bạn bè"
            ? "Bạn chưa có bạn bè nào."
            : activeTab === "Đang theo dõi"
              ? "Bạn chưa theo dõi ai."
              : "Chưa có người theo dõi.";

    return (
        <ScreenShell title="Bạn bè & Theo dõi" rightLabel="Tìm bạn">
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.summaryGrid}>
                    <StatCard value={friendsQuery.isFetching ? "--" : String(friends.length)} label="Bạn bè" />
                    <StatCard value={followersQuery.isFetching ? "--" : String(followers.length)} label="Người theo dõi" />
                    <StatCard value={followingQuery.isFetching ? "--" : String(following.length)} label="Đang theo dõi" />
                </View>
                <SegmentTabs
                    tabs={["Bạn bè", "Đang theo dõi", "Người theo dõi"]}
                    active={activeTab}
                    onChange={setActiveTab}
                />
                <View style={styles.actionRow}>
                    <PrimaryButton
                        label="Tìm bạn"
                        icon="search"
                        variant="soft"
                        onPress={() => pushRoute(router, "/(social)/search")}
                    />
                    <PrimaryButton
                        label="Lời mời"
                        icon="mail-unread"
                        variant="soft"
                        onPress={() => pushRoute(router, "/(social)/requests")}
                    />
                </View>
                {!currentUserId ? (
                    <EmptyState title="Đang tải thông tin đăng nhập..." />
                ) : null}
                {activeQuery.isError ? (
                    <EmptyState
                        title="Không tải được danh sách. Hãy kiểm tra đăng nhập hoặc server."
                        actionLabel="Tải lại"
                        onAction={activeQuery.refetch}
                    />
                ) : null}
                {currentUserId && !activeQuery.isFetching && !activeQuery.isError && activeUsers.length === 0 ? (
                    <EmptyState title={activeEmptyTitle} actionLabel="Tìm bạn" onAction={() => pushRoute(router, "/(social)/search")} />
                ) : null}
                {activeUsers.map((user) => (
                    <UserCard
                        key={user.id}
                        user={user}
                        onPress={() => pushRoute(router, `/(social)/profile?userId=${user.id}`)}
                        primaryLabel="Xem"
                        primaryIcon="chevron-forward"
                    />
                ))}
            </ScrollView>
        </ScreenShell>
    );
}

export function FriendRequestsScreen() {
    const [activeTab, setActiveTab] = useState("Đã nhận");
    const incomingQuery = useGetIncomingFriendRequestsQuery();
    const outgoingQuery = useGetOutgoingFriendRequestsQuery();
    const [acceptRequest] = useAcceptFriendRequestMutation();
    const [rejectRequest] = useRejectFriendRequestMutation();
    const [cancelRequest] = useCancelFriendRequestMutation();

    const activeQuery = activeTab === "Đã nhận" ? incomingQuery : outgoingQuery;
    const requestUsers = activeQuery.data?.requests ?? [];

    return (
        <ScreenShell title="Lời mời kết bạn">
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <SegmentTabs tabs={["Đã nhận", "Đã gửi"]} active={activeTab} onChange={setActiveTab} />
                {activeQuery.isError ? (
                    <EmptyState
                        title="Không tải được lời mời kết bạn."
                        actionLabel="Tải lại"
                        onAction={activeQuery.refetch}
                    />
                ) : null}
                {!activeQuery.isFetching && !activeQuery.isError && requestUsers.length === 0 ? (
                    <EmptyState title="Không có lời mời nào." />
                ) : null}
                {requestUsers.map((request) => {
                    const user = request.user ? toViewUser(request.user) : null;
                    if (!user) return null;
                    return (
                        <View key={request.id} style={styles.requestCard}>
                            <UserCard user={user} />
                            {activeTab === "Đã nhận" ? (
                                <View style={styles.actionRow}>
                                    <PrimaryButton
                                        label="Chấp nhận"
                                        icon="checkmark"
                                        onPress={() => acceptRequest(request.id)}
                                    />
                                    <PrimaryButton
                                        label="Từ chối"
                                        icon="close"
                                        variant="outline"
                                        onPress={() => rejectRequest(request.id)}
                                    />
                                </View>
                            ) : (
                                <PrimaryButton
                                    label="Hủy lời mời"
                                    icon="close"
                                    variant="outline"
                                    onPress={() => cancelRequest(request.id)}
                                />
                            )}
                        </View>
                    );
                })}
            </ScrollView>
        </ScreenShell>
    );
}

export function ChallengeHubScreen() {
    const router = useRouter();

    return (
        <ScreenShell title="Thi đấu với bạn bè" rightLabel="BXH">
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <LinearGradient
                    colors={[colors.primary, "#7C3AED"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.challengeHero}
                >
                    <View>
                        <Text style={styles.challengeEyebrow}>Thi đấu lịch sử 1v1</Text>
                        <Text style={styles.challengeTitle}>Thách đấu bạn bè</Text>
                        <Text style={styles.challengeCopy}>
                            Làm cùng bộ câu hỏi, số điểm và thời gian quyết định người thắng.
                        </Text>
                    </View>
                    <PrimaryButton
                        label="Tạo thách đấu"
                        icon="flash"
                        onPress={() => pushRoute(router, "/(social)/challenge-create")}
                    />
                </LinearGradient>

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Đang chờ xử lý</Text>
                    <Text style={styles.sectionHint}>2 trận</Text>
                </View>
                {challenges.slice(0, 2).map((challenge) => (
                    <View key={challenge.id} style={styles.card}>
                        <UserCard user={challenge.opponent} />
                        <Text style={styles.topicText}>{challenge.topic}</Text>
                        <View style={styles.actionRow}>
                            <PrimaryButton
                                label={challenge.status === "incoming" ? "Vào trận" : "Đang chờ"}
                                icon={challenge.status === "incoming" ? "play" : "time"}
                                onPress={() => pushRoute(router, "/(social)/battle")}
                            />
                            <PrimaryButton label="Từ chối" icon="close" variant="outline" />
                        </View>
                    </View>
                ))}

                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Lịch sử gần đây</Text>
                    <Text style={styles.topicText}>Bạn thắng Quang Huy - 85 - 70</Text>
                    <PrimaryButton
                        label="Xem kết quả"
                        icon="stats-chart"
                        variant="soft"
                        onPress={() => pushRoute(router, "/(social)/battle-result")}
                    />
                </View>
            </ScrollView>
        </ScreenShell>
    );
}

export function CreateChallengeScreen() {
    const router = useRouter();
    const [selectedPack, setSelectedPack] = useState(questionPacks[0].id);
    const opponent = users[0];

    return (
        <ScreenShell title="Tạo thách đấu" rightLabel="Lịch sử">
            <ScrollView contentContainerStyle={styles.contentWithFooter} showsVerticalScrollIndicator={false}>
                <View style={styles.card}>
                    <View style={styles.rowCenter}>
                        <Avatar user={opponent} />
                        <View style={styles.userInfo}>
                            <Text style={styles.userName}>{opponent.name}</Text>
                            <Text style={styles.userMeta}>
                                Lv. {opponent.level} - Tỉ lệ thắng {opponent.winRate}%
                            </Text>
                        </View>
                        <TouchableOpacity style={styles.iconButton}>
                            <Ionicons name="swap-horizontal" size={20} color={colors.primary} />
                        </TouchableOpacity>
                    </View>
                </View>
                <Text style={styles.sectionTitle}>Chọn chủ đề</Text>
                <View style={styles.chipRow}>
                    {["Tất cả", "Triều đại", "Chiến dịch", "Nhân vật", "Văn hóa"].map((chip) => (
                        <View key={chip} style={[styles.chip, chip === "Tất cả" && styles.chipActive]}>
                            <Text style={[styles.chipText, chip === "Tất cả" && styles.chipTextActive]}>
                                {chip}
                            </Text>
                        </View>
                    ))}
                </View>
                {questionPacks.map((pack) => {
                    const selected = pack.id === selectedPack;
                    return (
                        <TouchableOpacity
                            key={pack.id}
                            style={[styles.packCard, selected && styles.packCardSelected]}
                            onPress={() => setSelectedPack(pack.id)}
                            activeOpacity={0.84}
                        >
                            <View style={styles.packIcon}>
                                <Ionicons name="book" size={22} color={colors.primary} />
                            </View>
                            <View style={styles.userInfo}>
                                <Text style={styles.userName}>{pack.title}</Text>
                                <Text style={styles.userMeta}>{pack.meta}</Text>
                                <Text style={styles.rewardText}>{pack.reward}</Text>
                            </View>
                            {selected ? (
                                <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                            ) : null}
                        </TouchableOpacity>
                    );
                })}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Luật thi đấu</Text>
                    <Text style={styles.bodyText}>
                        Hai người cùng làm một bộ câu hỏi. Đúng nhiều hơn sẽ thắng, nếu hòa sẽ xét
                        thời gian hoàn thành.
                    </Text>
                </View>
            </ScrollView>
            <View style={styles.footer}>
                <Text style={styles.footerHint}>Đã chọn: Nhà Trần chống Nguyên Mông</Text>
                <PrimaryButton
                    label="Gửi lời thách đấu"
                    icon="send"
                    onPress={() => pushRoute(router, "/(social)/challenges")}
                />
            </View>
        </ScreenShell>
    );
}

export function BattleScreen() {
    const router = useRouter();
    const [answer, setAnswer] = useState("A");
    const options = [
        ["A", "Trần Hưng Đạo"],
        ["B", "Trần Quang Khải"],
        ["C", "Phạm Ngũ Lão"],
        ["D", "Yết Kiêu"],
    ];

    return (
        <ScreenShell title="Thi đấu 1v1" rightLabel="06:42">
            <ScrollView contentContainerStyle={styles.contentWithFooter} showsVerticalScrollIndicator={false}>
                <View style={styles.scoreCard}>
                    <View style={styles.playerScore}>
                        <Avatar user={users[1]} size={44} />
                        <Text style={styles.userName}>Bạn</Text>
                        <Text style={styles.scoreText}>4</Text>
                    </View>
                    <View style={styles.roundPill}>
                        <Text style={styles.roundPillText}>Câu 5/10</Text>
                    </View>
                    <View style={styles.playerScore}>
                        <Avatar user={users[0]} size={44} />
                        <Text style={styles.userName}>Lan Chi</Text>
                        <Text style={styles.scoreText}>3</Text>
                    </View>
                </View>
                <View style={styles.card}>
                    <Text style={styles.userMeta}>Nhà Trần chống Nguyên Mông - Khó vừa</Text>
                    <Text style={styles.questionText}>
                        Ai là vị tướng đã chỉ huy trận Bạch Đằng năm 1288?
                    </Text>
                </View>
                {options.map(([key, value]) => {
                    const selected = answer === key;
                    return (
                        <TouchableOpacity
                            key={key}
                            style={[styles.answerCard, selected && styles.answerCardSelected]}
                            onPress={() => setAnswer(key)}
                            activeOpacity={0.84}
                        >
                            <Text style={[styles.answerKey, selected && styles.answerKeySelected]}>
                                {key}
                            </Text>
                            <Text style={styles.answerText}>{value}</Text>
                        </TouchableOpacity>
                    );
                })}
                <View style={styles.livePanel}>
                    <View style={styles.onlineDot} />
                    <Text style={styles.userMeta}>Lan Chi vừa trả lời câu 5 - 3 giây trước</Text>
                </View>
            </ScrollView>
            <View style={styles.footer}>
                <Text style={styles.footerHint}>Đúng nhanh hơn sẽ được ưu tiên khi hòa</Text>
                <View style={styles.actionRow}>
                    <PrimaryButton label="Bỏ qua" icon="play-skip-forward" variant="outline" />
                    <PrimaryButton
                        label="Trả lời"
                        icon="checkmark"
                        onPress={() => pushRoute(router, "/(social)/battle-result")}
                    />
                </View>
            </View>
        </ScreenShell>
    );
}

export function BattleResultScreen() {
    const router = useRouter();

    return (
        <ScreenShell title="Kết quả đối đầu" rightLabel="Chia sẻ">
            <ScrollView contentContainerStyle={styles.contentWithFooter} showsVerticalScrollIndicator={false}>
                <LinearGradient
                    colors={[colors.primary, "#7C3AED"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.resultHero}
                >
                    <Ionicons name="trophy" size={40} color="#FDE68A" />
                    <Text style={styles.resultTitle}>Bạn thắng!</Text>
                    <Text style={styles.challengeCopy}>Nhà Trần chống Nguyên Mông</Text>
                    <Text style={styles.finalScore}>85 - 70</Text>
                </LinearGradient>
                <View style={styles.comparisonCard}>
                    <View style={styles.playerScore}>
                        <Avatar user={users[1]} />
                        <Text style={styles.userName}>Bạn</Text>
                        <Text style={styles.userMeta}>8/10 đúng</Text>
                        <Text style={styles.rewardText}>+120 XP</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.playerScore}>
                        <Avatar user={users[0]} />
                        <Text style={styles.userName}>Lan Chi</Text>
                        <Text style={styles.userMeta}>7/10 đúng</Text>
                        <Text style={styles.rewardText}>+80 XP</Text>
                    </View>
                </View>
                <View style={styles.summaryGrid}>
                    <StatCard value="80%" label="Độ chính xác" />
                    <StatCard value="23s" label="Nhanh hơn" />
                    <StatCard value="2/3" label="Câu khó đúng" />
                </View>
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Câu cần ôn lại</Text>
                    <Text style={styles.topicText}>Hội nghị Diên Hồng - Sai</Text>
                    <Text style={styles.topicText}>Chiến thuật thủy chiến Bạch Đằng - Đúng chậm</Text>
                </View>
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Lịch sử đối đầu</Text>
                    <Text style={styles.topicText}>Bạn 3 - 1 Lan Chi</Text>
                </View>
            </ScrollView>
            <View style={styles.footer}>
                <PrimaryButton label="Thách đấu lại" icon="refresh" onPress={() => pushRoute(router, "/(social)/challenge-create")} />
                <PrimaryButton label="Về danh sách bạn bè" icon="people" variant="outline" onPress={() => pushRoute(router, "/(social)/friends")} />
            </View>
        </ScreenShell>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        height: 58,
        paddingHorizontal: 20,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: colors.background,
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.surface,
    },
    avatarFallback: {
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.primarySoft,
    },
    avatarFallbackText: {
        fontWeight: "800",
        color: colors.primary,
    },
    headerTitle: {
        flex: 1,
        textAlign: "center",
        fontSize: 18,
        fontWeight: "800",
        color: colors.text,
    },
    headerAction: {
        minWidth: 40,
        textAlign: "right",
        fontSize: 13,
        fontWeight: "700",
        color: colors.primary,
    },
    content: {
        paddingHorizontal: 20,
        paddingBottom: 116,
        gap: 14,
    },
    contentWithFooter: {
        paddingHorizontal: 20,
        paddingBottom: 208,
        gap: 14,
    },
    searchBox: {
        height: 48,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
        paddingHorizontal: 14,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: colors.text,
        fontWeight: "600",
    },
    segment: {
        flexDirection: "row",
        padding: 4,
        borderRadius: 16,
        backgroundColor: "#EEEAE6",
    },
    segmentItem: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 12,
        alignItems: "center",
    },
    segmentItemActive: {
        backgroundColor: colors.surface,
        shadowColor: colors.primary,
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 1,
    },
    segmentText: {
        fontSize: 12,
        fontWeight: "700",
        color: colors.textMuted,
    },
    segmentTextActive: {
        color: colors.primary,
    },
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: "800",
        color: colors.text,
    },
    sectionHint: {
        fontSize: 13,
        fontWeight: "700",
        color: colors.textMuted,
    },
    emptyState: {
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.surface,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 20,
        gap: 10,
    },
    emptyTitle: {
        fontSize: 14,
        fontWeight: "700",
        color: colors.textMuted,
        lineHeight: 20,
        textAlign: "center",
    },
    userCard: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        backgroundColor: colors.surface,
        borderRadius: 18,
        padding: 14,
        borderWidth: 1,
        borderColor: colors.border,
        shadowColor: colors.primary,
        shadowOpacity: 0.05,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 1,
    },
    userInfo: {
        flex: 1,
        minWidth: 0,
    },
    rowCenter: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    userName: {
        fontSize: 15,
        fontWeight: "800",
        color: colors.text,
    },
    userTitle: {
        marginTop: 3,
        fontSize: 13,
        fontWeight: "600",
        color: colors.textMuted,
    },
    userMeta: {
        marginTop: 4,
        fontSize: 12,
        fontWeight: "600",
        color: colors.textMuted,
        lineHeight: 17,
    },
    levelPill: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 999,
        backgroundColor: colors.amberSoft,
    },
    levelText: {
        fontSize: 11,
        fontWeight: "800",
        color: "#92400E",
    },
    button: {
        minHeight: 42,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 999,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 7,
    },
    buttonPrimary: {
        flex: 1,
        backgroundColor: colors.primary,
        shadowColor: colors.primary,
        shadowOpacity: 0.18,
        shadowRadius: 12,
        elevation: 2,
    },
    buttonOutline: {
        flex: 1,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
    },
    buttonSoft: {
        backgroundColor: colors.primarySoft,
    },
    buttonDanger: {
        flex: 1,
        backgroundColor: colors.rose,
    },
    buttonText: {
        fontSize: 13,
        fontWeight: "800",
        color: colors.primary,
    },
    buttonTextPrimary: {
        color: "#FFFFFF",
    },
    profileHero: {
        alignItems: "center",
        backgroundColor: colors.surface,
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: colors.border,
        gap: 10,
    },
    profileName: {
        fontSize: 22,
        fontWeight: "900",
        color: colors.text,
    },
    profileSubtitle: {
        fontSize: 13,
        fontWeight: "700",
        color: colors.textMuted,
    },
    profileStats: {
        width: "100%",
        flexDirection: "row",
        gap: 10,
        marginVertical: 8,
    },
    summaryGrid: {
        flexDirection: "row",
        gap: 10,
    },
    statCard: {
        flex: 1,
        backgroundColor: colors.surface,
        borderRadius: 16,
        paddingVertical: 14,
        alignItems: "center",
        borderWidth: 1,
        borderColor: colors.border,
    },
    statValue: {
        fontSize: 18,
        fontWeight: "900",
        color: colors.primary,
    },
    statLabel: {
        marginTop: 3,
        fontSize: 11,
        fontWeight: "700",
        color: colors.textMuted,
        textAlign: "center",
    },
    actionRow: {
        width: "100%",
        flexDirection: "row",
        gap: 10,
    },
    card: {
        backgroundColor: colors.surface,
        borderRadius: 18,
        padding: 16,
        borderWidth: 1,
        borderColor: colors.border,
        gap: 12,
    },
    badgeGrid: {
        flexDirection: "row",
        gap: 12,
    },
    badgeCard: {
        flex: 1,
        borderRadius: 16,
        backgroundColor: "#F8F7FF",
        padding: 14,
        alignItems: "center",
        gap: 8,
    },
    badgeTitle: {
        fontSize: 12,
        fontWeight: "800",
        color: colors.text,
        textAlign: "center",
    },
    requestCard: {
        backgroundColor: colors.surface,
        borderRadius: 20,
        padding: 12,
        borderWidth: 1,
        borderColor: colors.border,
        gap: 10,
    },
    challengeHero: {
        borderRadius: 24,
        padding: 18,
        gap: 18,
    },
    challengeEyebrow: {
        fontSize: 12,
        fontWeight: "900",
        color: "#DDD6FE",
        textTransform: "uppercase",
    },
    challengeTitle: {
        marginTop: 4,
        fontSize: 26,
        fontWeight: "900",
        color: "#FFFFFF",
    },
    challengeCopy: {
        marginTop: 6,
        fontSize: 13,
        fontWeight: "600",
        color: "#EDE9FE",
        lineHeight: 19,
    },
    topicText: {
        fontSize: 14,
        fontWeight: "700",
        color: colors.text,
        lineHeight: 20,
    },
    chipRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },
    chip: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: "#F5F5F4",
    },
    chipActive: {
        backgroundColor: colors.primary,
    },
    chipText: {
        fontSize: 12,
        fontWeight: "800",
        color: colors.textMuted,
    },
    chipTextActive: {
        color: "#FFFFFF",
    },
    packCard: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        backgroundColor: colors.surface,
        borderRadius: 18,
        padding: 14,
        borderWidth: 1,
        borderColor: colors.border,
    },
    packCardSelected: {
        borderColor: colors.primary,
        backgroundColor: "#F8F7FF",
    },
    packIcon: {
        width: 46,
        height: 46,
        borderRadius: 14,
        backgroundColor: colors.primarySoft,
        alignItems: "center",
        justifyContent: "center",
    },
    rewardText: {
        marginTop: 5,
        fontSize: 12,
        fontWeight: "900",
        color: colors.emerald,
    },
    bodyText: {
        fontSize: 13,
        fontWeight: "600",
        color: colors.textMuted,
        lineHeight: 20,
    },
    footer: {
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 76,
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 24,
        backgroundColor: colors.background,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        gap: 10,
    },
    bottomBar: {
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-around",
        paddingTop: 8,
        paddingHorizontal: 16,
        backgroundColor: "#F3EFEA",
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.04,
        shadowRadius: 10,
        elevation: 8,
    },
    bottomBarItem: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    bottomIconWrapper: {
        alignItems: "center",
        justifyContent: "center",
        height: 40,
        width: Platform.OS === "web" ? 72 : 64,
        borderRadius: 20,
    },
    bottomIconActive: {
        backgroundColor: "#5F4DE5",
    },
    footerHint: {
        fontSize: 12,
        fontWeight: "700",
        color: colors.textMuted,
        textAlign: "center",
    },
    scoreCard: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: colors.surface,
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: colors.border,
    },
    playerScore: {
        flex: 1,
        alignItems: "center",
        gap: 6,
    },
    scoreText: {
        fontSize: 28,
        fontWeight: "900",
        color: colors.primary,
    },
    roundPill: {
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 999,
        backgroundColor: colors.amberSoft,
    },
    roundPillText: {
        fontSize: 12,
        fontWeight: "900",
        color: "#92400E",
    },
    questionText: {
        fontSize: 21,
        lineHeight: 29,
        fontWeight: "900",
        color: colors.text,
    },
    answerCard: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        backgroundColor: colors.surface,
        borderRadius: 18,
        padding: 15,
        borderWidth: 1,
        borderColor: colors.border,
    },
    answerCardSelected: {
        borderColor: colors.primary,
        backgroundColor: colors.primarySoft,
    },
    answerKey: {
        width: 32,
        height: 32,
        borderRadius: 16,
        textAlign: "center",
        lineHeight: 32,
        overflow: "hidden",
        backgroundColor: "#F5F5F4",
        color: colors.textMuted,
        fontWeight: "900",
    },
    answerKeySelected: {
        backgroundColor: colors.primary,
        color: "#FFFFFF",
    },
    answerText: {
        flex: 1,
        fontSize: 15,
        fontWeight: "800",
        color: colors.text,
    },
    livePanel: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        borderRadius: 16,
        padding: 12,
        backgroundColor: colors.emeraldSoft,
    },
    onlineDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.emerald,
    },
    resultHero: {
        borderRadius: 26,
        padding: 22,
        alignItems: "center",
        gap: 8,
    },
    resultTitle: {
        fontSize: 28,
        fontWeight: "900",
        color: "#FFFFFF",
    },
    finalScore: {
        fontSize: 42,
        fontWeight: "900",
        color: "#FFFFFF",
    },
    comparisonCard: {
        flexDirection: "row",
        backgroundColor: colors.surface,
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: colors.border,
    },
    divider: {
        width: 1,
        backgroundColor: colors.border,
        marginHorizontal: 12,
    },
});
