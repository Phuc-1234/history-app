import React, { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { ScrollView, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { EmptyState, ScreenShell, SegmentTabs } from "@/components/ui";
import { colors } from "@/theme/colors";
import {
    useFollowUserMutation,
    useSearchSocialUsersQuery,
    useSendFriendRequestMutation,
    useUnfollowUserMutation,
} from "../services/socialApi";
import { styles } from "../styles/social.styles";
import { toViewUser } from "../utils/socialView";
import { SearchUserCard } from "../components/SearchUserCard";

function pushRoute(router: ReturnType<typeof useRouter>, route: string) {
    router.push(route as never);
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
    const [unfollowUser] = useUnfollowUserMutation();
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
                    <SearchUserCard
                        key={user.id}
                        user={user}
                        onOpen={() => pushRoute(router, `/(social)/profile?userId=${user.id}`)}
                        // follow/unfollow trả promise để SearchUserCard rollback khi lỗi (Lỗi 4)
                        onFollow={() => followUser(user.id).unwrap()}
                        onUnfollow={() => unfollowUser(user.id).unwrap()}
                        onFriend={() => {
                            if (
                                user.friendStatus === "friend" ||
                                user.friendStatus === "pending_out" ||
                                user.friendStatus === "pending_in"
                            ) {
                                // Đã là bạn / đang chờ / có lời mời tới → mở profile để xử lý
                                pushRoute(router, `/(social)/profile?userId=${user.id}`);
                            } else {
                                sendFriendRequest({ receiverId: user.id });
                            }
                        }}
                    />
                ))}
            </ScrollView>
        </ScreenShell>
    );
}
