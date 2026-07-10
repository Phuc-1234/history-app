import React, { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
    Avatar,
    EmptyState,
    PrimaryButton,
    ScreenShell,
    StatCard,
} from "@/components/ui";
import { colors } from "@/theme/colors";
import {
    useFollowUserMutation,
    useGetSocialProfileQuery,
    useRemoveFriendMutation,
    useSendFriendRequestMutation,
    useUnfollowUserMutation,
} from "../services/socialApi";
import { styles } from "../styles/social.styles";
import { searchActions, toViewUser, type ViewUser } from "../utils/socialView";

function pushRoute(router: ReturnType<typeof useRouter>, route: string) {
    router.push(route as never);
}

export function OtherProfileScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{ userId?: string }>();
    const userId = typeof params.userId === "string" ? params.userId : "";
    const { data, isFetching, isError, refetch } = useGetSocialProfileQuery(userId, {
        skip: !userId,
    });

    // TẤT CẢ hooks phải được gọi vô điều kiện (Rules of Hooks).
    const [following, setFollowing] = useState(false);
    const [followUser] = useFollowUserMutation();
    const [unfollowUser] = useUnfollowUserMutation();
    const [sendFriendRequest] = useSendFriendRequestMutation();
    const [removeFriend] = useRemoveFriendMutation();

    const apiProfile = data?.profile;
    const profile = apiProfile ? toViewUser(apiProfile) : null;

    // Khi profile tải xong / đổi user → đồng bộ trạng thái theo dõi từ server
    useEffect(() => {
        if (profile) setFollowing(profile.isFollowing);
    }, [profile?.id, profile?.isFollowing]);

    const handleFollow = () => {
        if (!profile) return;
        if (following) {
            setFollowing(false);
            unfollowUser(profile.id)
                .unwrap()
                .catch(() => setFollowing(true));
        } else {
            setFollowing(true);
            followUser(profile.id)
                .unwrap()
                .catch(() => setFollowing(false));
        }
    };

    const handleFriend = () => {
        if (!profile) return;
        if (profile.friendStatus === "friend") {
            removeFriend(profile.id); // Lỗi 5: huỷ kết bạn
        } else if (
            profile.friendStatus === "pending_out" ||
            profile.friendStatus === "pending_in"
        ) {
            pushRoute(router, "/(social)/requests"); // vào màn lời mời để xử lý
        } else {
            sendFriendRequest({ receiverId: profile.id });
        }
    };

    // Trả JSX ngay tại đây (không early-return trước hooks)
    if (!profile) {
        return (
            <ScreenShell title="Hồ sơ">
                <ScrollView
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={false}
                >
                    {!userId ? <EmptyState title="Thiếu thông tin người dùng." /> : null}
                    {isFetching ? <EmptyState title="Đang tải hồ sơ..." /> : null}
                    {isError ? (
                        <EmptyState
                            title="Không tải được hồ sơ người dùng."
                            actionLabel="Tải lại"
                            onAction={refetch}
                        />
                    ) : null}
                    {!isFetching && !isError ? (
                        <EmptyState title="Không tìm thấy hồ sơ người dùng." />
                    ) : null}
                </ScrollView>
            </ScreenShell>
        );
    }

    // View-model tạm với trạng thái theo dõi optimistic để tính nút
    const optimisticUser: ViewUser = { ...profile, isFollowing: following };
    const actions = searchActions(optimisticUser);

    return (
        <ScreenShell title="Hồ sơ">
            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.profileHero}>
                    <Avatar user={profile} size={88} />
                    <Text style={styles.profileName}>{profile.name}</Text>
                    <Text style={styles.profileSubtitle}>
                        Lv. {profile.level} - {profile.title}
                    </Text>
                    <View style={styles.profileStats}>
                        <StatCard
                            value={String(apiProfile?.stats.friends ?? 0)}
                            label="Bạn bè"
                            backgroundColor={colors.socialFriends}
                        />
                        <StatCard
                            value={String(apiProfile?.stats.followers ?? 0)}
                            label="Người theo dõi"
                            backgroundColor={colors.socialFollowers}
                        />
                        <StatCard
                            value={profile.winRate ? `${profile.winRate}%` : "--"}
                            label="Thắng"
                            variant="accent-outline"
                        />
                    </View>
                    <View style={styles.actionRow}>
                        <PrimaryButton
                            label={actions.follow.label}
                            icon={following ? "checkmark" : "eye-outline"}
                            variant="outline"
                            onPress={handleFollow}
                        />
                        <PrimaryButton
                            label={actions.friend.label}
                            icon={actions.friend.icon}
                            onPress={handleFriend}
                        />
                    </View>
                </View>

                <View style={{ gap: 12 }}>
                    <Text style={styles.sectionTitle}>Thành tích nổi bật</Text>
                    <View style={styles.badgeGrid}>
                        <View
                            style={[
                                styles.badgeCard,
                                { backgroundColor: colors.warning, borderWidth: 0 },
                            ]}
                        >
                            <Ionicons name="trophy" size={24} color={colors.textLight} />
                            <Text style={[styles.badgeTitle, { color: colors.textLight }]}>
                                {profile.xp.toLocaleString()} XP
                            </Text>
                        </View>
                        <View
                            style={[
                                styles.badgeCard,
                                { backgroundColor: colors.error, borderWidth: 0 },
                            ]}
                        >
                            <Ionicons name="flame" size={24} color={colors.textLight} />
                            <Text style={[styles.badgeTitle, { color: colors.textLight }]}>
                                Chuỗi học {apiProfile?.currentStreak ?? 0}
                            </Text>
                        </View>
                    </View>
                </View>

                <View style={{ gap: 12 }}>
                    <Text style={styles.sectionTitle}>Bạn chung</Text>
                    <EmptyState title="Chưa có dữ liệu bạn chung." />
                </View>
            </ScrollView>
        </ScreenShell>
    );
}
