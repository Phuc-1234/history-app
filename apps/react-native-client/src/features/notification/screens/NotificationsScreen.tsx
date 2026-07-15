import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator, AppState, AppStateStatus } from "react-native";
import { useNavigation } from "expo-router";
import { ScreenShell, EmptyState, UserCard, SegmentTabs } from "@/components/ui";
import {
    useGetIncomingFriendRequestsQuery,
    useAcceptFriendRequestMutation,
    useRejectFriendRequestMutation,
} from "@/features/social/services/socialApi";
import {
    useGetNotificationsQuery,
    useMarkNotificationAsReadMutation,
    useMarkAllNotificationsAsReadMutation,
} from "../services/notificationApi";
import { toViewUser } from "@/features/social/utils/socialView";
import { colors } from "@/theme/colors";
import { typography } from "@/theme/typography";
import type { SystemNotification } from "../types";
import { NotificationItem } from "../components/NotificationItem";

type Tab = "Tất cả" | "Lời mời" | "Hệ thống";

function formatRelativeTime(dateString: string): string {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Vừa xong";
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays === 1) return "Hôm qua";
    if (diffDays < 7) return `${diffDays} ngày trước`;

    return date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    });
}

export function NotificationsScreen() {
    const [activeTab, setActiveTab] = useState<Tab>("Tất cả");
    const navigation = useNavigation();

    // Queries & Mutations for real friend requests
    const { data: incomingData, isLoading: isLoadingRequests, isError: isErrorRequests, refetch: refetchRequests } = useGetIncomingFriendRequestsQuery();
    const [acceptRequest] = useAcceptFriendRequestMutation();
    const [rejectRequest] = useRejectFriendRequestMutation();

    // Queries & Mutations for DB notifications
    const { data: notificationData, isLoading: isLoadingNotis, isError: isErrorNotis, refetch: refetchNotis } = useGetNotificationsQuery();
    const [markAsRead] = useMarkNotificationAsReadMutation();
    const [markAllAsRead] = useMarkAllNotificationsAsReadMutation();

    useEffect(() => {
        // Refetch queries when screen comes into focus
        const unsubscribeFocus = navigation.addListener("focus", () => {
            refetchRequests();
            refetchNotis();
        });

        // Refetch queries when app returns from background to foreground
        const handleAppStateChange = (nextAppState: AppStateStatus) => {
            if (nextAppState === "active") {
                refetchRequests();
                refetchNotis();
            }
        };

        const appStateSubscription = AppState.addEventListener("change", handleAppStateChange);

        return () => {
            unsubscribeFocus();
            appStateSubscription.remove();
        };
    }, [navigation, refetchRequests, refetchNotis]);

    const friendRequests = incomingData?.requests ?? [];
    
    // Map DB notifications to include calculated timestamp
    const systemNotis: SystemNotification[] = (notificationData?.notifications ?? []).map(noti => ({
        ...noti,
        timestamp: formatRelativeTime(noti.createdAt)
    }));

    const handleMarkAsRead = async (id: string) => {
        try {
            await markAsRead(id).unwrap();
        } catch (error) {
            console.error("Failed to mark notification as read:", error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await markAllAsRead().unwrap();
        } catch (error) {
            console.error("Failed to mark all notifications as read:", error);
        }
    };

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

    const isLoading = isLoadingRequests || isLoadingNotis;
    const isError = isErrorRequests || isErrorNotis;

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
                    {isLoading && (
                        <View style={styles.loader}>
                            <ActivityIndicator size="small" color={colors.primary} />
                        </View>
                    )}

                    {!isLoading && (
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
                                    {isErrorNotis && (
                                        <EmptyState
                                            title="Không tải được thông báo hệ thống."
                                            actionLabel="Tải lại"
                                            onAction={refetchNotis}
                                        />
                                    )}
                                    {!isErrorNotis && systemNotis.length === 0 && (
                                        <EmptyState title="Không có thông báo hệ thống nào." />
                                    )}
                                    {!isErrorNotis && systemNotis.length > 0 && renderSystemNotifications()}
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
