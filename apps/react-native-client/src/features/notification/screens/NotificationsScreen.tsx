import React, { useState, useEffect } from "react";
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    AppState,
    AppStateStatus,
    RefreshControl,
} from "react-native";
import { useNavigation, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ScreenShell, EmptyState } from "@/components/ui";
import {
    useAcceptFriendRequestMutation,
    useRejectFriendRequestMutation,
} from "@/features/social/services/socialApi";
import { useJoinPvpRoomMutation } from "@/features/pvp/services/pvpApi";
import {
    useGetNotificationsQuery,
    useMarkNotificationAsReadMutation,
    useMarkAllNotificationsAsReadMutation,
    useToggleHideNotificationMutation,
} from "../services/notificationApi";
import { toastService } from "@/services/toastService";
import { usePreventDoubleTap } from "@/hooks/usePreventDoubleTap";
import { colors } from "@/theme/colors";
import { typography } from "@/theme/typography";
import type { SystemNotification } from "../types";
import { NotificationItem } from "../components/NotificationItem";

type NotificationFilterType = "all" | "FRIEND_REQUEST" | "FRIEND_ACCEPT" | "HIDDEN";

interface FilterOption {
    id: NotificationFilterType;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
}

const FILTER_OPTIONS: FilterOption[] = [
    { id: "all", label: "Tất cả", icon: "layers-outline" },
    { id: "FRIEND_REQUEST", label: "Lời mời kết bạn", icon: "person-add-outline" },
    { id: "FRIEND_ACCEPT", label: "Chấp nhận kết bạn", icon: "people-outline" },
    { id: "HIDDEN", label: "Đã ẩn", icon: "eye-off-outline" },
];

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
        year: "numeric",
    });
}

export function NotificationsScreen() {
    const [selectedFilter, setSelectedFilter] = useState<NotificationFilterType>("all");
    const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);
    const [localStatusOverrides, setLocalStatusOverrides] = useState<
        Record<string, "ACCEPTED" | "REJECTED">
    >({});
    const [localHiddenOverrides, setLocalHiddenOverrides] = useState<
        Record<string, boolean>
    >({});
    const [localReadOverrides, setLocalReadOverrides] = useState<
        Record<string, boolean>
    >({});

    const navigation = useNavigation();
    const router = useRouter();
    const preventDoubleTap = usePreventDoubleTap();

    const {
        data: notificationData,
        isLoading,
        isFetching,
        isError,
        refetch,
    } = useGetNotificationsQuery();

    const [markAsRead] = useMarkNotificationAsReadMutation();
    const [markAllAsRead] = useMarkAllNotificationsAsReadMutation();
    const [acceptRequest] = useAcceptFriendRequestMutation();
    const [rejectRequest] = useRejectFriendRequestMutation();
    const [joinPvpRoomMut] = useJoinPvpRoomMutation();
    const [toggleHideNotification] = useToggleHideNotificationMutation();

    useEffect(() => {
        const unsubscribeFocus = navigation.addListener("focus", () => {
            refetch();
        });

        const handleAppStateChange = (nextAppState: AppStateStatus) => {
            if (nextAppState === "active") {
                refetch();
            }
        };

        const appStateSubscription = AppState.addEventListener("change", handleAppStateChange);

        return () => {
            unsubscribeFocus();
            appStateSubscription.remove();
        };
    }, [navigation, refetch]);

    const handleMarkAsRead = async (id: string) => {
        setLocalReadOverrides((prev) => ({ ...prev, [id]: true }));
        try {
            await markAsRead(id).unwrap();
        } catch (error) {
            console.error("Failed to mark notification as read:", error);
            setLocalReadOverrides((prev) => {
                const next = { ...prev };
                delete next[id];
                return next;
            });
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await markAllAsRead().unwrap();
        } catch (error) {
            console.error("Failed to mark all notifications as read:", error);
        }
    };

    const handleNavigateToUserProfile = preventDoubleTap((targetUserId: string) => {
        router.push(`/(social)/profile?userId=${targetUserId}` as never);
    });

    const handleNavigateToPvpRoom = preventDoubleTap((roomCode: string) => {
        router.push(`/pvp?roomCode=${roomCode}` as never);
    });

    const handleCardPress = async (notification: SystemNotification) => {
        // Mark as read when tapping anywhere on the card
        if (!notification.isRead) {
            handleMarkAsRead(notification.id);
        }

        // If friend request or friend accept, navigate to profile
        if (
            notification.type === "FRIEND_REQUEST" ||
            notification.type === "FRIEND_ACCEPT"
        ) {
            const targetUserId = notification.senderId || notification.sender?.id;
            if (targetUserId) {
                handleNavigateToUserProfile(targetUserId);
            }
            return;
        }

        // If Study Reminder, deep link to relevant content
        if (notification.type.startsWith("STUDY_REMINDER") || notification.type.startsWith("REMINDER")) {
            if ((notification.type === "STUDY_REMINDER_LESSON" || notification.type === "REMINDER_LESSON") && notification.targetId) {
                router.push(`/(3_4_lessons)/lesson/${notification.targetId}` as never);
            } else if (notification.type === "STUDY_REMINDER_STREAK" || notification.type === "REMINDER_STREAK") {
                router.push("/(tabs)/home" as never);
            } else if (notification.type === "STUDY_REMINDER_TIER" || notification.type === "REMINDER_TIER") {
                router.push("/(tabs)/9_1_leaderboard" as never);
            } else if ((notification.type === "STUDY_REMINDER_TEST" || notification.type === "REMINDER_TEST") && notification.targetId) {
                router.push(`/(6_tests)/6_2_ques_choose?testId=${notification.targetId}` as never);
            } else {
                router.push("/(tabs)/home" as never);
            }
            return;
        }

        // If PVP invite, if still joinable, attempt to join
        if (notification.type === "PVP_INVITE") {
            const isRejected =
                localStatusOverrides[notification.id] === "REJECTED" ||
                notification.requestStatus === "REJECTED";
            if (!isRejected && notification.pvpRoomStatus === "LOBBY") {
                handleAccept(notification);
            }
        }
    };

    const handleToggleHide = async (notification: SystemNotification) => {
        const nextHiddenState = !notification.isHidden;
        // Optimistic UI state
        setLocalHiddenOverrides((prev) => ({
            ...prev,
            [notification.id]: nextHiddenState,
        }));

        if (nextHiddenState) {
            toastService.show("Đã ẩn thông báo", "info");
        } else {
            toastService.show("Đã bỏ ẩn thông báo", "success");
        }

        try {
            await toggleHideNotification({
                id: notification.id,
                isHidden: nextHiddenState,
            }).unwrap();
        } catch (error) {
            console.error("Failed to toggle notification hidden state:", error);
            // Revert on error
            setLocalHiddenOverrides((prev) => {
                const next = { ...prev };
                delete next[notification.id];
                return next;
            });
            toastService.show("Không thể cập nhật trạng thái thông báo", "error");
        }
    };

    const handleAccept = async (notification: SystemNotification) => {
        if (notification.type === "PVP_INVITE") {
            const roomCode = notification.targetId;
            if (!roomCode) return;

            setProcessingRequestId(notification.id);
            setLocalStatusOverrides((prev) => ({ ...prev, [notification.id]: "ACCEPTED" }));
            setLocalReadOverrides((prev) => ({ ...prev, [notification.id]: true }));

            try {
                await joinPvpRoomMut({ roomCode }).unwrap();
                if (!notification.isRead) {
                    await markAsRead(notification.id).unwrap();
                }
                handleNavigateToPvpRoom(roomCode);
            } catch (err: any) {
                console.error("Failed to join PVP room from invite:", err);
                const msg = err?.data?.error ?? err?.message ?? "Không thể tham gia phòng thi đấu";
                toastService.show(msg, "error");
                setLocalStatusOverrides((prev) => {
                    const next = { ...prev };
                    delete next[notification.id];
                    return next;
                });
                refetch();
            } finally {
                setProcessingRequestId(null);
            }
            return;
        }

        if (notification.type === "FRIEND_REQUEST") {
            if (!notification.targetId) return;
            const reqId = notification.targetId;
            setProcessingRequestId(reqId);
            setLocalStatusOverrides((prev) => ({ ...prev, [reqId]: "ACCEPTED" }));
            setLocalReadOverrides((prev) => ({ ...prev, [notification.id]: true }));

            try {
                await acceptRequest(reqId).unwrap();
                if (!notification.isRead) {
                    await markAsRead(notification.id).unwrap();
                }
            } catch (error) {
                console.error("Failed to accept friend request:", error);
                setLocalStatusOverrides((prev) => {
                    const next = { ...prev };
                    delete next[reqId];
                    return next;
                });
            } finally {
                setProcessingRequestId(null);
            }
        }
    };

    const handleReject = async (notification: SystemNotification) => {
        if (notification.type === "PVP_INVITE") {
            setLocalStatusOverrides((prev) => ({ ...prev, [notification.id]: "REJECTED" }));
            setLocalReadOverrides((prev) => ({ ...prev, [notification.id]: true }));

            try {
                if (!notification.isRead) {
                    await markAsRead(notification.id).unwrap();
                }
                toastService.show("Đã từ chối lời mời thách đấu", "info");
            } catch (error) {
                console.error("Failed to mark rejected PVP invite as read:", error);
            }
            return;
        }

        if (notification.type === "FRIEND_REQUEST") {
            if (!notification.targetId) return;
            const reqId = notification.targetId;
            setProcessingRequestId(reqId);
            setLocalStatusOverrides((prev) => ({ ...prev, [reqId]: "REJECTED" }));
            setLocalReadOverrides((prev) => ({ ...prev, [notification.id]: true }));

            try {
                await rejectRequest(reqId).unwrap();
                if (!notification.isRead) {
                    await markAsRead(notification.id).unwrap();
                }
            } catch (error) {
                console.error("Failed to reject friend request:", error);
                setLocalStatusOverrides((prev) => {
                    const next = { ...prev };
                    delete next[reqId];
                    return next;
                });
            } finally {
                setProcessingRequestId(null);
            }
        }
    };

    const allNotifications: SystemNotification[] = (
        notificationData?.notifications ?? []
    ).map((noti) => {
        const overrideStatus =
            (noti.targetId ? localStatusOverrides[noti.targetId] : undefined) ??
            localStatusOverrides[noti.id];
        const overrideHidden =
            localHiddenOverrides[noti.id] !== undefined
                ? localHiddenOverrides[noti.id]
                : noti.isHidden;
        const overrideRead =
            localReadOverrides[noti.id] !== undefined
                ? localReadOverrides[noti.id]
                : noti.isRead;

        return {
            ...noti,
            isRead: !!overrideRead,
            isHidden: !!overrideHidden,
            requestStatus: overrideStatus ?? noti.requestStatus,
            timestamp: formatRelativeTime(noti.createdAt),
        };
    });

    const filteredNotifications = allNotifications.filter((noti) => {
        if (selectedFilter === "HIDDEN") {
            return noti.isHidden;
        }
        if (noti.isHidden) {
            return false;
        }
        if (selectedFilter === "all") {
            return true;
        }
        return noti.type === selectedFilter;
    });

    const hasUnread = allNotifications.some((n) => !n.isRead && !n.isHidden);

    return (
        <ScreenShell title="Thông báo" titleColor="#FFFFFF">
            <View style={styles.container}>
                {/* Horizontal single-select filter bar */}
                <View style={styles.filterBarContainer}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.filterScrollContent}
                    >
                        {FILTER_OPTIONS.map((opt) => {
                            const isSelected = selectedFilter === opt.id;
                            return (
                                <TouchableOpacity
                                    key={opt.id}
                                    style={[
                                        styles.filterChip,
                                        isSelected && styles.filterChipActive,
                                    ]}
                                    onPress={() => setSelectedFilter(opt.id)}
                                    activeOpacity={0.75}
                                >
                                    <Ionicons
                                        name={opt.icon}
                                        size={16}
                                        color={isSelected ? "#FFFFFF" : colors.primary}
                                    />
                                    <Text
                                        style={[
                                            styles.filterChipText,
                                            isSelected && styles.filterChipTextActive,
                                        ]}
                                    >
                                        {opt.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>

                {/* Sub-header row for unread actions */}
                {hasUnread && !isLoading && selectedFilter !== "HIDDEN" && (
                    <View style={styles.subHeaderRow}>
                        <Text style={styles.countText}>
                            {filteredNotifications.length} thông báo
                        </Text>
                        <TouchableOpacity onPress={handleMarkAllAsRead} activeOpacity={0.7}>
                            <Text style={styles.markAllReadText}>Đọc tất cả</Text>
                        </TouchableOpacity>
                    </View>
                )}

                <ScrollView
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={isFetching}
                            onRefresh={refetch}
                            colors={[colors.primary]}
                            tintColor={colors.primary}
                        />
                    }
                >
                    {isLoading && (
                        <View style={styles.loader}>
                            <ActivityIndicator size="small" color={colors.primary} />
                        </View>
                    )}

                    {!isLoading && isError && (
                        <EmptyState
                            title="Không thể tải thông báo."
                            actionLabel="Thử lại"
                            onAction={refetch}
                        />
                    )}

                    {!isLoading && !isError && filteredNotifications.length === 0 && (
                        <EmptyState
                            title={
                                selectedFilter === "FRIEND_REQUEST"
                                    ? "Không có lời mời kết bạn nào."
                                    : selectedFilter === "FRIEND_ACCEPT"
                                    ? "Không có thông báo chấp nhận kết bạn nào."
                                    : selectedFilter === "HIDDEN"
                                    ? "Không có thông báo nào bị ẩn."
                                    : "Không có thông báo nào."
                            }
                        />
                    )}

                    {!isLoading && !isError && filteredNotifications.length > 0 && (
                        <View style={styles.listGap}>
                            {filteredNotifications.map((noti) => (
                                <NotificationItem
                                    key={noti.id}
                                    notification={noti}
                                    onPress={() => handleCardPress(noti)}
                                    onMarkAsRead={() => handleMarkAsRead(noti.id)}
                                    onAccept={() => handleAccept(noti)}
                                    onReject={() => handleReject(noti)}
                                    onToggleHide={() => handleToggleHide(noti)}
                                    isProcessingAction={
                                        (!!noti.targetId && processingRequestId === noti.targetId) ||
                                        processingRequestId === noti.id
                                    }
                                />
                            ))}
                        </View>
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
    filterBarContainer: {
        paddingVertical: 12,
        backgroundColor: colors.background,
    },
    filterScrollContent: {
        paddingHorizontal: 16,
        gap: 8,
    },
    filterChip: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 30,
        backgroundColor: colors.surface,
        borderWidth: 1.5,
        borderColor: colors.borderMedium,
    },
    filterChipActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    filterChipText: {
        fontFamily: typography.fonts.semiBold,
        fontSize: 13,
        color: colors.textPrimary,
    },
    filterChipTextActive: {
        color: "#FFFFFF",
    },
    subHeaderRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingBottom: 8,
    },
    countText: {
        fontFamily: typography.fonts.regular,
        fontSize: 12,
        color: colors.textMuted,
    },
    markAllReadText: {
        fontFamily: typography.fonts.semiBold,
        fontSize: 12,
        color: colors.primary,
    },
    content: {
        paddingHorizontal: 16,
        paddingTop: 4,
        paddingBottom: 32,
    },
    loader: {
        paddingVertical: 40,
        alignItems: "center",
    },
    listGap: {
        gap: 12,
    },
});
