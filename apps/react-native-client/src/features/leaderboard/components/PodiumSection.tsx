import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { DisplayUser } from "../hooks/useLeaderboard";
import { colors } from "../../../theme/colors";
import typography from "../../../theme/typography";
import { AvatarWithFrame } from "../../../components/ui";

interface PodiumSectionProps {
    topUsers: DisplayUser[];
    isSmallDevice: boolean;
    showStreak?: boolean;
}

export const PodiumSection: React.FC<PodiumSectionProps> = ({
    topUsers,
    isSmallDevice,
    showStreak = false,
}) => {
    const styles = createStyles(isSmallDevice);

    return (
        <View style={styles.podiumSection}>
            {/* 2nd Place */}
            <View style={styles.podiumColumn}>
                <View style={styles.avatarWrapper}>
                    <AvatarWithFrame
                        uri={topUsers[1]?.avatar}
                        frameUri={topUsers[1]?.equippedFrameUrl}
                        size={isSmallDevice ? 54 : 58}
                        name={topUsers[1]?.name}
                        borderWidth={2}
                    />
                    <View style={[styles.rankNumberBadge, styles.rank2Badge]}>
                        <Text style={styles.rankNumberText}>2</Text>
                    </View>
                </View>
                <Text style={styles.podiumName} numberOfLines={1}>
                    {topUsers[1]?.name}
                </Text>
                <Text style={styles.rank2Xp}>
                    {showStreak
                        ? `🔥 ${topUsers[1]?.streak} ngày`
                        : `${topUsers[1]?.xp.toLocaleString()} XP`}
                </Text>
                <View style={[styles.podiumBase, styles.rank2Base]} />
            </View>

            {/* 1st Place */}
            <View style={[styles.podiumColumn, styles.centerPodiumColumn]}>
                <Text style={styles.crownIcon}>👑</Text>
                <View style={styles.avatarWrapper}>
                    <AvatarWithFrame
                        uri={topUsers[0]?.avatar}
                        frameUri={topUsers[0]?.equippedFrameUrl}
                        size={isSmallDevice ? 68 : 72}
                        name={topUsers[0]?.name}
                        borderWidth={3}
                        avatarStyle={{ borderColor: colors.secondary }}
                    />
                    <View style={[styles.rankNumberBadge, styles.rank1Badge]}>
                        <Text style={styles.rankNumberText}>1</Text>
                    </View>
                </View>
                <Text
                    style={[styles.podiumName, styles.rank1Name]}
                    numberOfLines={1}
                >
                    {topUsers[0]?.name}
                </Text>
                <Text style={styles.rank1Xp}>
                    {showStreak
                        ? `🔥 ${topUsers[0]?.streak} ngày`
                        : `${topUsers[0]?.xp.toLocaleString()} XP`}
                </Text>
                <View style={[styles.podiumBase, styles.rank1Base]} />
            </View>

            {/* 3rd Place */}
            <View style={styles.podiumColumn}>
                <View style={styles.avatarWrapper}>
                    <AvatarWithFrame
                        uri={topUsers[2]?.avatar}
                        frameUri={topUsers[2]?.equippedFrameUrl}
                        size={isSmallDevice ? 54 : 58}
                        name={topUsers[2]?.name}
                        borderWidth={2}
                    />
                    <View style={[styles.rankNumberBadge, styles.rank3Badge]}>
                        <Text style={styles.rankNumberText}>3</Text>
                    </View>
                </View>
                <Text style={styles.podiumName} numberOfLines={1}>
                    {topUsers[2]?.name}
                </Text>
                <Text style={styles.rank3Xp}>
                    {showStreak
                        ? `🔥 ${topUsers[2]?.streak} ngày`
                        : `${topUsers[2]?.xp.toLocaleString()} XP`}
                </Text>
                <View style={[styles.podiumBase, styles.rank3Base]} />
            </View>
        </View>
    );
};

const createStyles = (isSmallDevice: boolean) =>
    StyleSheet.create({
        podiumSection: {
            marginTop: 18,
            flexDirection: "row",
            alignItems: "flex-end",
            justifyContent: "space-between",
        },
        podiumColumn: {
            flex: 1,
            alignItems: "center",
            justifyContent: "flex-end",
        },
        centerPodiumColumn: { marginHorizontal: 6 },
        crownIcon: {
            fontSize: isSmallDevice ? 20 : 22,
            marginBottom: -2,
            zIndex: 3,
        },
        avatarWrapper: {
            position: "relative",
            alignItems: "center",
            justifyContent: "center",
        },
        podiumAvatar: {
            width: isSmallDevice ? 54 : 58,
            height: isSmallDevice ? 54 : 58,
            borderRadius: isSmallDevice ? 27 : 29,
            borderWidth: 2,
            borderColor: colors.borderDark,
            backgroundColor: colors.surfaceVariant,
        },
        rank1Avatar: {
            width: isSmallDevice ? 68 : 72,
            height: isSmallDevice ? 68 : 72,
            borderRadius: isSmallDevice ? 34 : 36,
            borderColor: colors.secondary,
            borderWidth: 3,
        },
        rankNumberBadge: {
            position: "absolute",
            bottom: -6,
            right: -6,
            width: 24,
            height: 24,
            borderRadius: 12,
            justifyContent: "center",
            alignItems: "center",
            borderWidth: 2,
            borderColor: colors.surface,
        },
        rank1Badge: { backgroundColor: colors.secondary },
        rank2Badge: { backgroundColor: colors.success },
        rank3Badge: { backgroundColor: colors.primary },
        rankNumberText: { 
            fontFamily: typography.fonts.bold,
            color: colors.textLight, 
            fontSize: 11 
        },
        podiumName: {
            fontFamily: typography.fonts.medium,
            marginTop: 10,
            color: colors.textPrimary,
            fontSize: isSmallDevice ? 11 : 12,
            textAlign: "center",
        },
        rank1Name: {
            fontFamily: typography.fonts.medium,
            fontSize: isSmallDevice ? 15 : 16,
            marginTop: 12,
        },
        rank1Xp: {
            fontFamily: typography.fonts.bold,
            fontSize: isSmallDevice ? 13 : 14,
            color: colors.secondary,
            marginTop: 3,
            marginBottom: 8,
            textAlign: "center",
        },
        rank2Xp: {
            fontFamily: typography.fonts.semiBold,
            fontSize: isSmallDevice ? 11 : 12,
            color: colors.success,
            marginTop: 4,
            marginBottom: 8,
            textAlign: "center",
        },
        rank3Xp: {
            fontFamily: typography.fonts.semiBold,
            fontSize: isSmallDevice ? 11 : 12,
            color: colors.primary,
            marginTop: 4,
            marginBottom: 8,
            textAlign: "center",
        },
        podiumBase: {
            width: "92%",
            borderTopLeftRadius: 5,
            borderTopRightRadius: 5,
        },
        rank1Base: {
            height: isSmallDevice ? 96 : 102,
            backgroundColor: colors.secondary,
        },
        rank2Base: {
            height: isSmallDevice ? 62 : 66,
            backgroundColor: colors.success,
        },
        rank3Base: {
            height: isSmallDevice ? 46 : 50,
            backgroundColor: colors.primary,
        },
    });
