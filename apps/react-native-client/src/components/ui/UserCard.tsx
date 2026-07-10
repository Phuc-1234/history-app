import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/theme/colors";
import { typography } from "@/theme/typography";
import { Avatar } from "./Avatar";
import { PrimaryButton, type PrimaryButtonVariant } from "./PrimaryButton";
import type { CardUser } from "./types";

export function UserCard({
    user,
    onPress,
    primaryLabel,
    primaryIcon,
    primaryOnPress,
    primaryVariant = "soft",
    secondaryLabel,
    secondaryIcon,
    secondaryOnPress,
    secondaryVariant = "outline",
    style,
}: {
    user: CardUser;
    onPress?: () => void;
    primaryLabel?: string;
    primaryIcon?: keyof typeof Ionicons.glyphMap;
    primaryOnPress?: () => void;
    primaryVariant?: PrimaryButtonVariant;
    secondaryLabel?: string;
    secondaryIcon?: keyof typeof Ionicons.glyphMap;
    secondaryOnPress?: () => void;
    secondaryVariant?: PrimaryButtonVariant;
    style?: ViewStyle;
}) {
    const isChevron = primaryLabel && primaryIcon === "chevron-forward";
    const hasButtons = primaryLabel && primaryIcon !== "chevron-forward";

    const inlineActions = isChevron ? (
        <Ionicons name="chevron-forward" size={24} color={colors.primary} />
    ) : null;

    const bottomActions = hasButtons ? (
        <View style={styles.cardActionRowBottom}>
            <PrimaryButton
                label={primaryLabel}
                icon={primaryIcon}
                variant={primaryVariant}
                style={styles.cardActionButtonBottom}
                onPress={primaryOnPress}
            />
            {secondaryLabel ? (
                <PrimaryButton
                    label={secondaryLabel}
                    icon={secondaryIcon}
                    variant={secondaryVariant}
                    style={styles.cardActionButtonBottom}
                    onPress={secondaryOnPress}
                />
            ) : null}
        </View>
    ) : null;

    return (
        <TouchableOpacity
            style={[styles.userCard, style]}
            onPress={onPress}
            activeOpacity={0.85}
            disabled={!onPress}
        >
            <View style={styles.userCardHeaderRow}>
                <Avatar user={user} />
                <View style={styles.userInfo}>
                    <View style={styles.rowCenter}>
                        <Text style={styles.userName} numberOfLines={1}>
                            {user.name}
                        </Text>
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
                {inlineActions}
            </View>
            {bottomActions}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    userCard: {
        flexDirection: "column",
        alignItems: "stretch",
        gap: 12,
        backgroundColor: colors.primaryContainer,
        borderRadius: 12,
        padding: 14,
    },
    userCardHeaderRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    cardActionRowBottom: {
        flexDirection: "row",
        gap: 8,
        marginTop: 4,
    },
    cardActionButtonBottom: {
        flex: 1,
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
        fontFamily: typography.fonts.semiBold,
        color: colors.textPrimary,
    },
    userTitle: {
        marginTop: 3,
        ...typography.bodySmall,
        color: colors.textMuted,
    },
    userMeta: {
        marginTop: 4,
        ...typography.caption,
        color: colors.textMuted,
        lineHeight: 17,
    },
    levelPill: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 30,
        borderWidth: 2,
        borderColor: colors.warning,
        backgroundColor: "transparent",
    },
    levelText: {
        fontSize: 11,
        fontFamily: typography.fonts.semiBold,
        color: colors.warning,
    },
});
