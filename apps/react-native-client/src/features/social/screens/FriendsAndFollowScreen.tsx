import React, { useState } from "react";
import { ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import {
    EmptyState,
    PrimaryButton,
    ScreenShell,
    SegmentTabs,
    StatCard,
    UserCard,
} from "@/components/ui";
import { useGetProfileQuery } from "@/features/auth/services/authApi";
import { useAppSelector } from "@/store/storeHook";
import {
    useGetFollowersQuery,
    useGetFollowingQuery,
    useGetFriendsQuery,
    useRemoveFriendMutation,
    useUnfollowUserMutation,
} from "../services/socialApi";
import { styles } from "../styles/social.styles";
import { toViewUser, type ViewUser } from "../utils/socialView";

type Tab = "Bạn bè" | "Người theo dõi" | "Đang theo dõi";

function pushRoute(router: ReturnType<typeof useRouter>, route: string) {
    router.push(route as never);
}

export function FriendsAndFollowScreen() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<Tab>("Bạn bè");
    useGetProfileQuery();
    const currentUserId = useAppSelector((state) => state.auth.profile?.id);
    const friendsQuery = useGetFriendsQuery();
    const followersQuery = useGetFollowersQuery(currentUserId ?? "", {
        skip: !currentUserId,
    });
    const followingQuery = useGetFollowingQuery(currentUserId ?? "", {
        skip: !currentUserId,
    });
    const [removeFriend] = useRemoveFriendMutation();
    const [unfollowUser] = useUnfollowUserMutation();

    const friends = friendsQuery.data?.friends.map((item) => toViewUser(item.user)) ?? [];
    const followers = followersQuery.data?.followers.map((item) => toViewUser(item.user)) ?? [];
    const following = followingQuery.data?.following.map((item) => toViewUser(item.user)) ?? [];

    const activeUsers =
        activeTab === "Bạn bè" ? friends : activeTab === "Đang theo dõi" ? following : followers;
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

    const renderCardActions = (user: ViewUser) => {
        if (activeTab === "Bạn bè") {
            // Lỗi 5: thêm nút huỷ kết bạn (removeFriend) cho từng bạn bè.
            // Lưu ý: KHÔNG dùng icon "chevron-forward" làm primary vì UserCard sẽ
            // bật chế độ "chevron" (ẩn toàn bộ bottom actions) → mất nút Huỷ kết bạn.
            return {
                primaryLabel: "Xem hồ sơ",
                primaryIcon: "eye-outline" as const,
                primaryVariant: "soft" as const,
                primaryOnPress: () =>
                    pushRoute(router, `/(social)/profile?userId=${user.id}`),
                secondaryLabel: "Huỷ kết bạn",
                secondaryIcon: "person-remove" as const,
                secondaryVariant: "outline" as const,
                secondaryOnPress: () => removeFriend(user.id),
            };
        }
        if (activeTab === "Đang theo dõi") {
            // Lỗi 2 (mở rộng): huỷ theo dõi trực tiếp từ danh sách
            return {
                primaryLabel: "Bỏ theo dõi",
                primaryIcon: "eye-off-outline" as const,
                primaryVariant: "outline" as const,
                primaryOnPress: () => unfollowUser(user.id),
                secondaryLabel: "Xem hồ sơ",
                secondaryIcon: "eye-outline" as const,
                secondaryVariant: "soft" as const,
                secondaryOnPress: () =>
                    pushRoute(router, `/(social)/profile?userId=${user.id}`),
            };
        }
        // Người theo dõi: chevron-mode (chỉ cho xem profile)
        return {
            primaryLabel: "Xem",
            primaryIcon: "chevron-forward" as const,
            primaryOnPress: () => pushRoute(router, `/(social)/profile?userId=${user.id}`),
        };
    };

    return (
        <ScreenShell title="Bạn bè & Theo dõi">
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.summaryGrid}>
                    <StatCard
                        value={friendsQuery.isFetching ? "--" : String(friends.length)}
                        label="Bạn bè"
                        backgroundColor="#3182CE"
                    />
                    <StatCard
                        value={followersQuery.isFetching ? "--" : String(followers.length)}
                        label="Người theo dõi"
                        backgroundColor="#FF6B00"
                    />
                    <StatCard
                        value={followingQuery.isFetching ? "--" : String(following.length)}
                        label="Đang theo dõi"
                        backgroundColor="#10B981"
                    />
                </View>
                <SegmentTabs
                    tabs={["Bạn bè", "Người theo dõi", "Đang theo dõi"]}
                    active={activeTab}
                    onChange={(t) => setActiveTab(t as Tab)}
                    activeColors={{
                        "Bạn bè": "#3182CE",
                        "Đang theo dõi": "#10B981",
                        "Người theo dõi": "#FF6B00",
                    }}
                />
                <View style={styles.actionRow}>
                    <PrimaryButton
                        label="Tìm bạn"
                        icon="search"
                        variant="primary"
                        onPress={() => pushRoute(router, "/(social)/search")}
                    />
                    <PrimaryButton
                        label="Lời mời"
                        icon="mail-unread"
                        variant="primary"
                        onPress={() => pushRoute(router, "/(social)/requests")}
                    />
                </View>
                {!currentUserId ? <EmptyState title="Đang tải thông tin đăng nhập..." /> : null}
                {activeQuery.isError ? (
                    <EmptyState
                        title="Không tải được danh sách. Hãy kiểm tra đăng nhập hoặc server."
                        actionLabel="Tải lại"
                        onAction={activeQuery.refetch}
                    />
                ) : null}
                {currentUserId &&
                !activeQuery.isFetching &&
                !activeQuery.isError &&
                activeUsers.length === 0 ? (
                    <EmptyState
                        title={activeEmptyTitle}
                        actionLabel="Tìm bạn"
                        onAction={() => pushRoute(router, "/(social)/search")}
                    />
                ) : null}
                {activeUsers.map((user) => (
                    <UserCard key={user.id} user={user} {...renderCardActions(user)} />
                ))}
            </ScrollView>
        </ScreenShell>
    );
}
