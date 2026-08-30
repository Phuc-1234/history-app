import React, { useRef } from "react";
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    ActivityIndicator,
    Animated,
    PanResponder,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/theme/colors";
import { typography } from "@/theme/typography";
import type { SystemNotification } from "../types";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { AvatarWithFrame } from "@/components/ui/AvatarWithFrame";

interface NotificationItemProps {
    notification: SystemNotification;
    onMarkAsRead: () => void;
    onPress?: () => void;
    onAccept?: () => void;
    onReject?: () => void;
    onToggleHide?: () => void;
    isProcessingAction?: boolean;
}

const SWIPE_THRESHOLD = 80;

export function NotificationItem({
    notification,
    onMarkAsRead,
    onPress,
    onAccept,
    onReject,
    onToggleHide,
    isProcessingAction = false,
}: NotificationItemProps) {
    const isFriendRequest = notification.type === "FRIEND_REQUEST";
    const isFriendAccept = notification.type === "FRIEND_ACCEPT";
    const isPvpInvite = notification.type === "PVP_INVITE";

    const isPending =
        notification.requestStatus === "PENDING" ||
        (!notification.requestStatus && !!notification.targetId);
    const isAccepted = notification.requestStatus === "ACCEPTED";
    const isRejected = notification.requestStatus === "REJECTED";
    const isHidden = !!notification.isHidden;

    const senderName = notification.sender?.name || "";
    const senderAvatar = notification.sender?.profileImgUrl || null;
    const senderFrame = notification.sender?.equippedFrameUrl || null;

    const translateX = useRef(new Animated.Value(0)).current;

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => false,
            onMoveShouldSetPanResponder: (_, gestureState) => {
                // Only allow right-to-left swipe (dx < -10)
                return (
                    gestureState.dx < -10 &&
                    Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.5
                );
            },
            onPanResponderMove: (_, gestureState) => {
                // Clamp so it cannot be swiped right
                const clampedDx = Math.min(0, gestureState.dx);
                translateX.setValue(clampedDx);
            },
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dx <= -SWIPE_THRESHOLD && onToggleHide) {
                    Animated.timing(translateX, {
                        toValue: -500,
                        duration: 180,
                        useNativeDriver: true,
                    }).start(() => {
                        onToggleHide();
                    });
                } else {
                    Animated.spring(translateX, {
                        toValue: 0,
                        bounciness: 6,
                        useNativeDriver: true,
                    }).start();
                }
            },
            onPanResponderTerminate: () => {
                Animated.spring(translateX, {
                    toValue: 0,
                    bounciness: 6,
                    useNativeDriver: true,
                }).start();
            },
        })
    ).current;

    // Square opacity: transparent at 0, becoming bolder as user swipes further
    const squareOpacity = translateX.interpolate({
        inputRange: [-90, -45, 0],
        outputRange: [1, 0.6, 0],
        extrapolate: "clamp",
    });

    const squareScale = translateX.interpolate({
        inputRange: [-80, 0],
        outputRange: [1, 0.75],
        extrapolate: "clamp",
    });

    const renderAvatar = () => {
        if (notification.sender || isFriendRequest || isFriendAccept || isPvpInvite) {
            return (
                <AvatarWithFrame
                    uri={senderAvatar}
                    frameUri={senderFrame}
                    size={44}
                    name={senderName || notification.title}
                />
            );
        }

        let iconName: keyof typeof Ionicons.glyphMap = "notifications-outline";
        let iconBgColor = colors.primaryContainer;
        let iconColor = colors.primary;

        if (notification.type.startsWith("STUDY_REMINDER") || notification.type.startsWith("REMINDER")) {
            iconName = "alarm-outline";
            iconBgColor = colors.primaryContainer;
            iconColor = colors.primary;
        } else if (notification.type === "reward") {
            iconName = "gift-outline";
            iconBgColor = "#FFF9EE";
            iconColor = colors.secondary;
        } else if (notification.type === "achievement") {
            iconName = "trophy-outline";
            iconBgColor = "#F4F0FA";
            iconColor = "#8C6BAF";
        }

        return (
            <View style={[styles.fallbackIconContainer, { backgroundColor: iconBgColor }]}>
                <Ionicons name={iconName} size={22} color={iconColor} />
            </View>
        );
    };

    const actionIconName = isHidden ? "eye-outline" : "eye-off-outline";
    const actionLabel = isHidden ? "Hiện" : "Ẩn";
    const actionColor = isHidden ? colors.primary : colors.error;

    return (
        <View style={styles.swipeContainer}>
            {/* Right Square Action Button behind the card */}
            <Animated.View
                style={[
                    styles.rightActionSquare,
                    isHidden ? styles.squareBgUnhide : styles.squareBgHide,
                    {
                        opacity: squareOpacity,
                        transform: [{ scale: squareScale }],
                    },
                ]}
            >
                <Ionicons name={actionIconName} size={22} color={actionColor} />
                <Text style={[styles.actionText, { color: actionColor }]}>
                    {actionLabel}
                </Text>
            </Animated.View>

            {/* Foreground Card */}
            <Animated.View
                style={[styles.animatedCardWrapper, { transform: [{ translateX }] }]}
                {...panResponder.panHandlers}
            >
                <TouchableOpacity
                    style={[
                        styles.notificationCard,
                        !notification.isRead && styles.unreadCard,
                    ]}
                    onPress={onPress}
                    activeOpacity={0.88}
                >
                    <View style={styles.avatarWrapper}>{renderAvatar()}</View>

                    <View style={styles.contentContainer}>
                        <View style={styles.titleRow}>
                            <Text style={styles.notificationTitle} numberOfLines={1}>
                                {notification.title}
                            </Text>
                            {!notification.isRead && <View style={styles.unreadDot} />}
                        </View>
                        <Text style={styles.notificationBody}>
                            {notification.body}
                        </Text>

                        {/* Friend Request Action Section */}
                        {isFriendRequest && (
                            <View style={styles.actionSection}>
                                {isProcessingAction ? (
                                    <View style={styles.actionLoading}>
                                        <ActivityIndicator size="small" color={colors.primary} />
                                    </View>
                                ) : isPending && onAccept && onReject ? (
                                    <View style={styles.actionButtonsRow}>
                                        <PrimaryButton
                                            label="Chấp nhận"
                                            icon="checkmark"
                                            variant="primary"
                                            style={styles.actionButton}
                                            onPress={onAccept}
                                        />
                                        <PrimaryButton
                                            label="Từ chối"
                                            icon="close"
                                            variant="outline"
                                            style={styles.actionButton}
                                            onPress={onReject}
                                        />
                                    </View>
                                ) : isAccepted ? (
                                    <View style={styles.statusRow}>
                                        <Ionicons
                                            name="checkmark-circle"
                                            size={16}
                                            color={colors.success}
                                        />
                                        <Text style={styles.statusTextAccepted}>
                                            Đã chấp nhận kết bạn
                                        </Text>
                                    </View>
                                ) : isRejected ? (
                                    <View style={styles.statusRow}>
                                        <Ionicons
                                            name="close-circle"
                                            size={16}
                                            color={colors.textMuted}
                                        />
                                        <Text style={styles.statusTextRejected}>
                                            Đã từ chối
                                        </Text>
                                    </View>
                                ) : null}
                            </View>
                        )}

                        {/* PVP Invite Action Section */}
                        {isPvpInvite && (
                            <View style={styles.actionSection}>
                                {isProcessingAction ? (
                                    <View style={styles.actionLoading}>
                                        <ActivityIndicator size="small" color={colors.primary} />
                                    </View>
                                ) : isAccepted || notification.pvpRoomStatus === "ALREADY_JOINED" ? (
                                    <View style={styles.statusRow}>
                                        <Ionicons
                                            name="checkmark-circle"
                                            size={16}
                                            color={colors.success}
                                        />
                                        <Text style={styles.statusTextAccepted}>
                                            Đã tham gia phòng thi đấu
                                        </Text>
                                    </View>
                                ) : isRejected ? (
                                    <View style={styles.statusRow}>
                                        <Ionicons
                                            name="close-circle"
                                            size={16}
                                            color={colors.textMuted}
                                        />
                                        <Text style={styles.statusTextRejected}>
                                            Đã từ chối lời mời
                                        </Text>
                                    </View>
                                ) : notification.pvpRoomStatus === "FULL" ? (
                                    <View style={styles.statusRow}>
                                        <Ionicons
                                            name="alert-circle"
                                            size={16}
                                            color={colors.error}
                                        />
                                        <Text style={[styles.statusTextRejected, { color: colors.error }]}>
                                            Phòng thi đấu đã đầy (8/8)
                                        </Text>
                                    </View>
                                ) : notification.pvpRoomStatus === "IN_PROGRESS" ? (
                                    <View style={styles.statusRow}>
                                        <Ionicons
                                            name="time-outline"
                                            size={16}
                                            color={colors.secondary}
                                        />
                                        <Text style={[styles.statusTextRejected, { color: colors.secondary }]}>
                                            Trận đấu đã bắt đầu
                                        </Text>
                                    </View>
                                ) : notification.pvpRoomStatus === "EXPIRED" ||
                                  notification.pvpRoomStatus === "NOT_FOUND" ? (
                                    <View style={styles.statusRow}>
                                        <Ionicons
                                            name="close-circle"
                                            size={16}
                                            color={colors.textMuted}
                                        />
                                        <Text style={styles.statusTextRejected}>
                                            Phòng đã kết thúc hoặc bị hủy
                                        </Text>
                                    </View>
                                ) : onAccept && onReject ? (
                                    <View style={styles.actionButtonsRow}>
                                        <PrimaryButton
                                            label="Tham gia"
                                            icon="play"
                                            variant="primary"
                                            style={styles.actionButton}
                                            onPress={onAccept}
                                        />
                                        <PrimaryButton
                                            label="Từ chối"
                                            icon="close"
                                            variant="outline"
                                            style={styles.actionButton}
                                            onPress={onReject}
                                        />
                                    </View>
                                ) : null}
                            </View>
                        )}

                        <View style={styles.footerRow}>
                            <Text style={styles.timestampText}>{notification.timestamp}</Text>
                            {!notification.isRead && (
                                <TouchableOpacity
                                    onPress={onMarkAsRead}
                                    activeOpacity={0.7}
                                    style={styles.markReadHitbox}
                                    hitSlop={{ top: 12, bottom: 12, left: 16, right: 16 }}
                                >
                                    <Text style={styles.markReadText}>Đánh dấu đã đọc</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    swipeContainer: {
        position: "relative",
        borderRadius: 12,
        overflow: "hidden",
    },
    rightActionSquare: {
        position: "absolute",
        right: 0,
        top: 0,
        bottom: 0,
        width: 80,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
    },
    squareBgHide: {
        backgroundColor: colors.errorContainer,
    },
    squareBgUnhide: {
        backgroundColor: colors.primaryContainer,
    },
    actionText: {
        fontFamily: typography.fonts.semiBold,
        fontSize: 12,
    },
    animatedCardWrapper: {
        width: "100%",
    },
    notificationCard: {
        flexDirection: "row",
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 14,
        borderWidth: 1.5,
        borderColor: colors.borderMedium,
        gap: 12,
        alignItems: "flex-start",
    },
    unreadCard: {
        backgroundColor: colors.primaryContainer,
        borderColor: "rgba(195, 121, 56, 0.15)",
    },
    avatarWrapper: {
        alignItems: "center",
        justifyContent: "center",
        paddingTop: 2,
    },
    fallbackIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: "center",
        justifyContent: "center",
    },
    contentContainer: {
        flex: 1,
        gap: 4,
    },
    titleRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    notificationTitle: {
        fontFamily: typography.fonts.bold,
        fontSize: 14,
        color: colors.textPrimary,
        flex: 1,
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.secondary,
        marginLeft: 8,
    },
    notificationBody: {
        fontFamily: typography.fonts.regular,
        fontSize: 13,
        color: colors.textSecondary,
        lineHeight: 18,
    },
    actionSection: {
        marginTop: 8,
        marginBottom: 2,
    },
    actionButtonsRow: {
        flexDirection: "row",
        gap: 8,
    },
    actionButton: {
        flex: 1,
        minHeight: 36,
        paddingVertical: 6,
        paddingHorizontal: 10,
    },
    actionLoading: {
        paddingVertical: 8,
        alignItems: "center",
    },
    statusRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingVertical: 2,
    },
    statusTextAccepted: {
        fontFamily: typography.fonts.semiBold,
        fontSize: 12,
        color: colors.success,
    },
    statusTextRejected: {
        fontFamily: typography.fonts.regular,
        fontSize: 12,
        color: colors.textMuted,
    },
    footerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 6,
    },
    timestampText: {
        fontFamily: typography.fonts.regular,
        fontSize: 11,
        color: colors.textMuted,
    },
    markReadHitbox: {
        paddingVertical: 8,
        paddingHorizontal: 10,
        marginVertical: -6,
        marginHorizontal: -8,
        justifyContent: "center",
        alignItems: "center",
    },
    markReadText: {
        fontFamily: typography.fonts.semiBold,
        fontSize: 11,
        color: colors.primary,
    },
});
