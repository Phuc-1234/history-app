import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { DisplayUser } from "../hooks/useLeaderboard";

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
                    <Image
                        source={{ uri: topUsers[0].avatar }}
                        style={styles.podiumAvatar}
                    />
                    <View style={[styles.rankNumberBadge, styles.rank2Badge]}>
                        <Text style={styles.rankNumberText}>2</Text>
                    </View>
                </View>
                <Text style={styles.podiumName} numberOfLines={1}>
                    {topUsers[0].name}
                </Text>
                <Text style={styles.rank2Xp}>
                    {showStreak
                        ? `🔥 ${topUsers[0].streak} ngày`
                        : `${topUsers[0].xp.toLocaleString()} XP`}
                </Text>
                <View style={[styles.podiumBase, styles.rank2Base]} />
            </View>

            {/* 1st Place */}
            <View style={[styles.podiumColumn, styles.centerPodiumColumn]}>
                <Text style={styles.crownIcon}>👑</Text>
                <View style={styles.avatarWrapper}>
                    <Image
                        source={{ uri: topUsers[1].avatar }}
                        style={[styles.podiumAvatar, styles.rank1Avatar]}
                    />
                    <View style={[styles.rankNumberBadge, styles.rank1Badge]}>
                        <Text style={styles.rankNumberText}>1</Text>
                    </View>
                </View>
                <Text
                    style={[styles.podiumName, styles.rank1Name]}
                    numberOfLines={1}
                >
                    {topUsers[1].name}
                </Text>
                <Text style={styles.rank1Xp}>
                    {showStreak
                        ? `🔥 ${topUsers[1].streak} ngày`
                        : `${topUsers[1].xp.toLocaleString()} XP`}
                </Text>
                <View style={[styles.podiumBase, styles.rank1Base]} />
            </View>

            {/* 3rd Place */}
            <View style={styles.podiumColumn}>
                <View style={styles.avatarWrapper}>
                    <Image
                        source={{ uri: topUsers[2].avatar }}
                        style={styles.podiumAvatar}
                    />
                    <View style={[styles.rankNumberBadge, styles.rank3Badge]}>
                        <Text style={styles.rankNumberText}>3</Text>
                    </View>
                </View>
                <Text style={styles.podiumName} numberOfLines={1}>
                    {topUsers[2].name}
                </Text>
                <Text style={styles.rank3Xp}>
                    {showStreak
                        ? `🔥 ${topUsers[2].streak} ngày`
                        : `${topUsers[2].xp.toLocaleString()} XP`}
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
            borderColor: "#B7B7B7",
            backgroundColor: "#DDD",
        },
        rank1Avatar: {
            width: isSmallDevice ? 68 : 72,
            height: isSmallDevice ? 68 : 72,
            borderRadius: isSmallDevice ? 34 : 36,
            borderColor: "#F5A000",
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
            borderColor: "#FFFFFF",
        },
        rank1Badge: { backgroundColor: "#F5A000" },
        rank2Badge: { backgroundColor: "#B4B4B4" },
        rank3Badge: { backgroundColor: "#D98B35" },
        rankNumberText: { color: "#FFFFFF", fontSize: 11, fontWeight: "700" },
        podiumName: {
            marginTop: 10,
            color: "#202020",
            fontSize: isSmallDevice ? 11 : 12,
            fontWeight: "500",
            textAlign: "center",
        },
        rank1Name: {
            fontSize: isSmallDevice ? 15 : 16,
            fontWeight: "500",
            marginTop: 12,
        },
        rank1Xp: {
            fontSize: isSmallDevice ? 13 : 14,
            fontWeight: "700",
            color: "#F29B00",
            marginTop: 3,
            marginBottom: 8,
            textAlign: "center",
        },
        rank2Xp: {
            fontSize: isSmallDevice ? 11 : 12,
            fontWeight: "600",
            color: "#4E3FE0",
            marginTop: 4,
            marginBottom: 8,
            textAlign: "center",
        },
        rank3Xp: {
            fontSize: isSmallDevice ? 11 : 12,
            fontWeight: "600",
            color: "#4E3FE0",
            marginTop: 4,
            marginBottom: 8,
            textAlign: "center",
        },
        podiumBase: {
            width: "92%",
            borderTopLeftRadius: 8,
            borderTopRightRadius: 8,
        },
        rank1Base: {
            height: isSmallDevice ? 96 : 102,
            backgroundColor: "#4B37DB",
        },
        rank2Base: {
            height: isSmallDevice ? 62 : 66,
            backgroundColor: "#6A58EB",
        },
        rank3Base: {
            height: isSmallDevice ? 46 : 50,
            backgroundColor: "#9183EA",
        },
    });
