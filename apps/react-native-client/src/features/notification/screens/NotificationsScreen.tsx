import React, { useState } from "react";
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { ScreenShell, EmptyState, UserCard, SegmentTabs } from "@/components/ui";
import {
    useGetIncomingFriendRequestsQuery,
    useAcceptFriendRequestMutation,
    useRejectFriendRequestMutation,
} from "@/features/social/services/socialApi";
import { toViewUser } from "@/features/social/utils/socialView";
import { colors } from "@/theme/colors";
import { typography } from "@/theme/typography";
import type { SystemNotification } from "../types";
import { NotificationItem } from "../components/NotificationItem";

const INITIAL_SYSTEM_NOTIFICATIONS: SystemNotification[] = [
    {
        id: "sys-1",
        type: "push",
        title: "Đến giờ ôn tập rồi! 🕒",
        body: "Hãy luyện tập 5 câu hỏi hôm nay để tiếp tục duy trì chuỗi Streak học tập của bạn nhé.",
        timestamp: "10 phút trước",
        isRead: false,
    },
    {
        id: "sys-2",
        type: "reward",
        title: "Phần thưởng hàng ngày 🎁",
        body: "Bạn nhận được 50 XP và 10 Vàng từ việc hoàn thành Nhiệm vụ hàng ngày.",
        timestamp: "1 giờ trước",
        isRead: false,
    },
    {
        id: "sys-3",
        type: "achievement",
        title: "Thăng hạng thành công! 🏆",
        body: "Chúc mừng bạn đã leo lên Hạng Bạc trong bảng xếp hạng tuần này.",
        timestamp: "5 giờ trước",
        isRead: true,
    },
    {
        id: "sys-4",
        type: "system",
        title: "Chào mừng bạn đến với Sắc sử! 🎉",
        body: "Cảm ơn bạn đã lựa chọn Sắc sử để cùng khám phá những trang sử hào hùng của dân tộc Việt Nam.",
        timestamp: "1 ngày trước",
        isRead: true,
    },
    {
        id: "sys-5",
        type: "system",
        title: "Bài học Lớp 12 mới cập nhật 📚",
        body: "Chủ đề 'Việt Nam từ năm 1945 đến năm 1954' đã được cập nhật thêm các câu hỏi trắc nghiệm mới.",
        timestamp: "2 ngày trước",
        isRead: true,
    }
];

type Tab = "Tất cả" | "Lời mời" | "Hệ thống";

export function NotificationsScreen() {
    const [activeTab, setActiveTab] = useState<Tab>("Tất cả");
    const [systemNotis, setSystemNotis] = useState<SystemNotification[]>(INITIAL_SYSTEM_NOTIFICATIONS);

    // Queries & Mutations for real friend requests
    const { data: incomingData, isLoading: isLoadingRequests, isError: isErrorRequests, refetch: refetchRequests } = useGetIncomingFriendRequestsQuery();
    const [acceptRequest] = useAcceptFriendRequestMutation();
    const [rejectRequest] = useRejectFriendRequestMutation();

    const friendRequests = incomingData?.requests ?? [];

    const handleMarkAsRead = (id: string) => {
        setSystemNotis(prev =>
            prev.map(noti => (noti.id === id ? { ...noti, isRead: true } : noti))
        );
    };

    const handleMarkAllAsRead = () => {
        setSystemNotis(prev => prev.map(noti => ({ ...noti, isRead: true })));
    };

    // Filter system notifications based on active tab
    const hasUnreadSystem = systemNotis.some(n => !n.isRead);

    // Rendering Helpers
    const renderFriendRequests = () => {
        if (friendRequests.length === 0) return null;
        return (
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Lời mời kết bạn</Text>
                <View style={styles.listGap}>
                    {friendRequests.map((request) => {
                        const user = request.user ? toViewUser(request.user) : null;
                        if (!user) return null;
                        return (
                            <UserCard
                                key={request.id}
                                user={user}
                                primaryLabel="Chấp nhận"
                                primaryIcon="checkmark"
                                primaryVariant="primary"
                                primaryOnPress={() => acceptRequest(request.id)}
                                secondaryLabel="Từ chối"
                                secondaryIcon="close"
                                secondaryVariant="outline"
                                secondaryOnPress={() => rejectRequest(request.id)}
                            />
                        );
                    })}
                </View>
            </View>
        );
    };

    const renderSystemNotifications = () => {
        if (systemNotis.length === 0) return null;
        return (
            <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionTitle}>Thông báo hệ thống</Text>
                    {hasUnreadSystem && (
                        <TouchableOpacity onPress={handleMarkAllAsRead}>
                            <Text style={styles.headerLink}>Đọc tất cả</Text>
                        </TouchableOpacity>
                    )}
                </View>
                <View style={styles.listGap}>
                    {systemNotis.map((noti) => (
                        <NotificationItem
                            key={noti.id}
                            notification={noti}
                            onMarkAsRead={() => handleMarkAsRead(noti.id)}
                        />
                    ))}
                </View>
            </View>
        );
    };

    return (
        <ScreenShell title="Thông báo" titleColor="#FFFFFF">
            <View style={styles.container}>
                <View style={styles.tabsContainer}>
                    <SegmentTabs
                        tabs={["Tất cả", "Lời mời", "Hệ thống"]}
                        active={activeTab}
                        onChange={(t) => setActiveTab(t as Tab)}
                    />
                </View>

                <ScrollView
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={false}
                >
                    {isLoadingRequests && (
                        <View style={styles.loader}>
                            <ActivityIndicator size="small" color={colors.primary} />
                        </View>
                    )}

                    {!isLoadingRequests && (
                        <>
                            {activeTab === "Tất cả" && (
                                <>
                                    {friendRequests.length === 0 && systemNotis.length === 0 && (
                                        <EmptyState title="Không có thông báo nào." />
                                    )}
                                    {renderFriendRequests()}
                                    {renderSystemNotifications()}
                                </>
                            )}

                            {activeTab === "Lời mời" && (
                                <>
                                    {isErrorRequests && (
                                        <EmptyState
                                            title="Không tải được lời mời kết bạn."
                                            actionLabel="Tải lại"
                                            onAction={refetchRequests}
                                        />
                                    )}
                                    {!isErrorRequests && friendRequests.length === 0 && (
                                        <EmptyState title="Không có lời mời kết bạn nào." />
                                    )}
                                    {!isErrorRequests && renderFriendRequests()}
                                </>
                            )}

                            {activeTab === "Hệ thống" && (
                                <>
                                    {systemNotis.length === 0 && (
                                        <EmptyState title="Không có thông báo hệ thống nào." />
                                    )}
                                    {systemNotis.length > 0 && renderSystemNotifications()}
                                </>
                            )}
                        </>
                    )}
                </ScrollView>
            </View>
        </ScreenShell>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    tabsContainer: {
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 4,
    },
    content: {
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 32,
    },
    loader: {
        paddingVertical: 40,
        alignItems: "center",
    },
    section: {
        marginBottom: 20,
    },
    sectionHeaderRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 10,
    },
    sectionTitle: {
        fontFamily: typography.fonts.bold,
        fontSize: 15,
        color: colors.textPrimary,
        marginBottom: 10,
    },
    headerLink: {
        fontFamily: typography.fonts.semiBold,
        fontSize: 13,
        color: colors.primary,
    },
    listGap: {
        gap: 12,
    },
});
