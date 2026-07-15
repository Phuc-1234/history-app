import React from "react";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/theme/colors";
import { typography } from "@/theme/typography";
import type { SystemNotification } from "../types";

export function NotificationItem({
    notification,
    onMarkAsRead,
}: {
    notification: SystemNotification;
    onMarkAsRead: () => void;
}) {
    let iconName: keyof typeof Ionicons.glyphMap = "notifications-outline";
    let iconBgColor = colors.primaryContainer;
    let iconColor = colors.primary;

    if (notification.type === "push") {
        iconName = "notifications-circle-outline";
        iconBgColor = "#EBF5F0";
        iconColor = colors.success;
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
        <View style={[styles.notificationCard, !notification.isRead && styles.unreadCard]}>
            <View style={[styles.iconContainer, { backgroundColor: iconBgColor }]}>
                <Ionicons name={iconName} size={20} color={iconColor} />
            </View>
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
                <View style={styles.footerRow}>
                    <Text style={styles.timestampText}>{notification.timestamp}</Text>
                    {!notification.isRead && (
                        <TouchableOpacity onPress={onMarkAsRead} activeOpacity={0.7}>
                            <Text style={styles.markReadText}>Đánh dấu đã đọc</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    notificationCard: {
        flexDirection: "row",
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 14,
        borderWidth: 1.5,
        borderColor: colors.borderMedium,
        gap: 12,
    },
    unreadCard: {
        backgroundColor: colors.primaryContainer,
        borderColor: "rgba(195, 121, 56, 0.15)",
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
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
    markReadText: {
        fontFamily: typography.fonts.semiBold,
        fontSize: 11,
        color: colors.primary,
    },
});
