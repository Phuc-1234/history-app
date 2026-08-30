import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { DisplayUser } from "../hooks/useLeaderboard";
import { colors } from "../../../theme/colors";
import typography from "../../../theme/typography";
import { AvatarWithFrame } from "../../../components/ui";
import { Ionicons } from "@expo/vector-icons";
import { Flame } from "lucide-react-native";
import { UserSocialBadges } from "./UserSocialBadges";

interface PodiumSectionProps {
    topUsers: DisplayUser[];
    isSmallDevice: boolean;
    showStreak?: boolean;
    onUserPress?: (userId: string) => void;
    myUserId?: string | number;
}

export const PodiumSection: React.FC<PodiumSectionProps> = ({
    topUsers,
    isSmallDevice,
    showStreak = false,
    onUserPress,
    myUserId,
}) => {
    const styles = createStyles(isSmallDevice);

    const user1 = topUsers[0];
    const user2 = topUsers[1];
    const user3 = topUsers[2];

    const isMe1 = user1 && String(user1.id) === String(myUserId);
    const isMe2 = user2 && String(user2.id) === String(myUserId);
    const isMe3 = user3 && String(user3.id) === String(myUserId);

    return (
        <View style={styles.podiumSection}>
            {/* 2nd Place */}
            {user2 ? (
                <TouchableOpacity
                    style={styles.podiumColumn}
                    onPress={() => onUserPress?.(user2.id)}
                    activeOpacity={0.8}
                >
                    <View style={styles.avatarWrapper}>
                        <AvatarWithFrame
                            uri={user2.avatar}
                            frameUri={user2.equippedFrameUrl}
                            size={isSmallDevice ? 54 : 58}
                            name={user2.name}
                            borderWidth={2}
                        />
                        <View style={[styles.rankNumberBadge, styles.rank2Badge]}>
                            <Text style={styles.rankNumberText}>{user2.rank || 2}</Text>
                        </View>
                    </View>

                    <View style={[styles.podiumBase, styles.rank2Base, isMe2 && styles.mePodiumBase]}>
                        {user2.equippedLeaderboardBgUrl ? (
                            <>
                                <Image
                                    source={{ uri: user2.equippedLeaderboardBgUrl }}
                                    style={styles.rank2BgImage}
                                    resizeMode="cover"
                                />
                                <View
                                    style={[
                                        StyleSheet.absoluteFill,
                                        {
                                            backgroundColor: isMe2
                                                ? "rgba(255, 255, 255, 0.72)"
                                                : "rgba(255, 255, 255, 0.78)",
                                        },
                                    ]}
                                />
                            </>
                        ) : (
                            <LinearGradient
                                colors={["rgba(22, 163, 74, 0.03)", "rgba(22, 163, 74, 0.3)", colors.success]}
                                locations={[0, 0.5, 1]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 0, y: 1 }}
                                style={StyleSheet.absoluteFill}
                            />
                        )}

                        <View style={styles.podiumContent}>
                            <Text style={[styles.podiumName, isMe2 && { fontFamily: typography.fonts.bold, color: "#EA580C" }]} numberOfLines={1}>
                                {user2.name}
                            </Text>
                            {isMe2 && (
                                <View style={styles.meTag}>
                                    <Text style={styles.meTagText}>Tôi</Text>
                                </View>
                            )}
                            <UserSocialBadges
                                isFriend={user2.isFriend}
                                isFollowing={user2.isFollowing}
                                style={styles.centerBadges}
                            />
                            <Text style={styles.rank2Xp}>
                                {showStreak ? (
                                    <>
                                        <Flame size={13} color={user2.hasCompletedToday ? "#FF4500" : "#98A2B3"} />
                                        <Text> {user2.streak} ngày</Text>
                                    </>
                                ) : (
                                    `${user2.xp.toLocaleString()} XP`
                                )}
                            </Text>
                        </View>
                    </View>
                </TouchableOpacity>
            ) : (
                <View style={styles.podiumColumn} />
            )}

            {/* 1st Place */}
            {user1 ? (
                <TouchableOpacity
                    style={[styles.podiumColumn, styles.centerPodiumColumn]}
                    onPress={() => onUserPress?.(user1.id)}
                    activeOpacity={0.8}
                >
                    <Ionicons
                        name="trophy"
                        size={isSmallDevice ? 20 : 24}
                        color={colors.secondary}
                        style={{ marginBottom: 6, zIndex: 3 }}
                    />
                    <View style={styles.avatarWrapper}>
                        <AvatarWithFrame
                            uri={user1.avatar}
                            frameUri={user1.equippedFrameUrl}
                            size={isSmallDevice ? 68 : 72}
                            name={user1.name}
                            borderWidth={3}
                            avatarStyle={{ borderColor: colors.secondary }}
                        />
                        <View style={[styles.rankNumberBadge, styles.rank1Badge]}>
                            <Text style={styles.rankNumberText}>{user1.rank || 1}</Text>
                        </View>
                    </View>

                    <View style={[styles.podiumBase, styles.rank1Base, isMe1 && styles.mePodiumBase]}>
                        {user1.equippedLeaderboardBgUrl ? (
                            <>
                                <Image
                                    source={{ uri: user1.equippedLeaderboardBgUrl }}
                                    style={styles.rank1BgImage}
                                    resizeMode="cover"
                                />
                                <View
                                    style={[
                                        StyleSheet.absoluteFill,
                                        {
                                            backgroundColor: isMe1
                                                ? "rgba(255, 255, 255, 0.72)"
                                                : "rgba(255, 255, 255, 0.78)",
                                        },
                                    ]}
                                />
                            </>
                        ) : (
                            <LinearGradient
                                colors={["rgba(229, 169, 59, 0.03)", "rgba(229, 169, 59, 0.35)", colors.secondary]}
                                locations={[0, 0.5, 1]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 0, y: 1 }}
                                style={StyleSheet.absoluteFill}
                            />
                        )}

                        <View style={styles.podiumContent}>
                            <Text style={[styles.podiumName, styles.rank1Name, isMe1 && { fontFamily: typography.fonts.bold, color: "#EA580C" }]} numberOfLines={1}>
                                {user1.name}
                            </Text>
                            {isMe1 && (
                                <View style={styles.meTag}>
                                    <Text style={styles.meTagText}>Tôi</Text>
                                </View>
                            )}
                            <UserSocialBadges
                                isFriend={user1.isFriend}
                                isFollowing={user1.isFollowing}
                                style={styles.centerBadges}
                            />
                            <Text style={styles.rank1Xp}>
                                {showStreak ? (
                                    <>
                                        <Flame size={15} color={user1.hasCompletedToday ? "#FF4500" : "#98A2B3"} />
                                        <Text> {user1.streak} ngày</Text>
                                    </>
                                ) : (
                                    `${user1.xp.toLocaleString()} XP`
                                )}
                            </Text>
                        </View>
                    </View>
                </TouchableOpacity>
            ) : (
                <View style={[styles.podiumColumn, styles.centerPodiumColumn]} />
            )}

            {/* 3rd Place */}
            {user3 ? (
                <TouchableOpacity
                    style={styles.podiumColumn}
                    onPress={() => onUserPress?.(user3.id)}
                    activeOpacity={0.8}
                >
                    <View style={styles.avatarWrapper}>
                        <AvatarWithFrame
                            uri={user3.avatar}
                            frameUri={user3.equippedFrameUrl}
                            size={isSmallDevice ? 54 : 58}
                            name={user3.name}
                            borderWidth={2}
                        />
                        <View style={[styles.rankNumberBadge, styles.rank3Badge]}>
                            <Text style={styles.rankNumberText}>{user3.rank || 3}</Text>
                        </View>
                    </View>

                    <View style={[styles.podiumBase, styles.rank3Base, isMe3 && styles.mePodiumBase]}>
                        {user3.equippedLeaderboardBgUrl ? (
                            <>
                                <Image
                                    source={{ uri: user3.equippedLeaderboardBgUrl }}
                                    style={styles.rank3BgImage}
                                    resizeMode="cover"
                                />
                                <View
                                    style={[
                                        StyleSheet.absoluteFill,
                                        {
                                            backgroundColor: isMe3
                                                ? "rgba(255, 255, 255, 0.72)"
                                                : "rgba(255, 255, 255, 0.78)",
                                        },
                                    ]}
                                />
                            </>
                        ) : (
                            <LinearGradient
                                colors={["rgba(195, 121, 56, 0.03)", "rgba(195, 121, 56, 0.3)", colors.primary]}
                                locations={[0, 0.5, 1]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 0, y: 1 }}
                                style={StyleSheet.absoluteFill}
                            />
                        )}

                        <View style={styles.podiumContent}>
                            <Text style={[styles.podiumName, isMe3 && { fontFamily: typography.fonts.bold, color: "#EA580C" }]} numberOfLines={1}>
                                {user3.name}
                            </Text>
                            {isMe3 && (
                                <View style={styles.meTag}>
                                    <Text style={styles.meTagText}>Tôi</Text>
                                </View>
                            )}
                            <UserSocialBadges
                                isFriend={user3.isFriend}
                                isFollowing={user3.isFollowing}
                                style={styles.centerBadges}
                            />
                            <Text style={styles.rank3Xp}>
                                {showStreak ? (
                                    <>
                                        <Flame size={13} color={user3.hasCompletedToday ? "#FF4500" : "#98A2B3"} />
                                        <Text> {user3.streak} ngày</Text>
                                    </>
                                ) : (
                                    `${user3.xp.toLocaleString()} XP`
                                )}
                            </Text>
                        </View>
                    </View>
                </TouchableOpacity>
            ) : (
                <View style={styles.podiumColumn} />
            )}
        </View>
    );
};

const createStyles = (isSmallDevice: boolean) => {
    const { width: windowWidth } = Dimensions.get("window");
    const rowWidth = isSmallDevice ? Math.min(windowWidth - 44, 300) : (windowWidth - 44);
    const rank1Height = Math.round((rowWidth / 2) * 1.15);
    const rank2Height = rank1Height - (isSmallDevice ? 34 : 36);
    const rank3Height = rank1Height - (isSmallDevice ? 50 : 52);
    const podiumWidth = Math.round(((rowWidth - 12) / 3) * 0.94);

    const bleed = 30;

    return StyleSheet.create({
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
        centerBadges: {
            justifyContent: "center",
            marginTop: 2,
            marginBottom: 2,
        },
        avatarWrapper: {
            position: "relative",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 8,
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
        podiumBase: {
            width: "94%",
            borderTopLeftRadius: 12,
            borderTopRightRadius: 12,
            overflow: "hidden",
            position: "relative",
            alignItems: "center",
            borderWidth: 1,
            borderColor: colors.borderLight,
        },
        podiumContent: {
            width: "100%",
            alignItems: "center",
            paddingTop: 8,
            paddingHorizontal: 4,
            zIndex: 2,
        },
        rank1Base: {
            height: rank1Height,
        },
        rank2Base: {
            height: rank2Height,
        },
        rank3Base: {
            height: rank3Height,
        },
        rank1BgImage: {
            position: "absolute",
            width: rank1Height + bleed,
            height: podiumWidth + bleed,
            top: (rank1Height - (podiumWidth + bleed)) / 2,
            left: (podiumWidth - (rank1Height + bleed)) / 2,
            transform: [{ rotate: "90deg" }],
        },
        rank2BgImage: {
            position: "absolute",
            width: rank2Height + bleed,
            height: podiumWidth + bleed,
            top: (rank2Height - (podiumWidth + bleed)) / 2,
            left: (podiumWidth - (rank2Height + bleed)) / 2,
            transform: [{ rotate: "90deg" }],
        },
        rank3BgImage: {
            position: "absolute",
            width: rank3Height + bleed,
            height: podiumWidth + bleed,
            top: (rank3Height - (podiumWidth + bleed)) / 2,
            left: (podiumWidth - (rank3Height + bleed)) / 2,
            transform: [{ rotate: "90deg" }],
        },
        mePodiumBase: {
            borderWidth: 2,
            borderColor: colors.primary,
        },
        podiumName: {
            fontFamily: typography.fonts.bold,
            color: colors.textPrimary,
            fontSize: isSmallDevice ? 11 : 12,
            textAlign: "center",
        },
        rank1Name: {
            fontSize: isSmallDevice ? 13 : 14,
        },
        rank1Xp: {
            fontFamily: typography.fonts.bold,
            fontSize: isSmallDevice ? 12 : 13,
            color: colors.secondaryHover,
            marginTop: 2,
            textAlign: "center",
        },
        rank2Xp: {
            fontFamily: typography.fonts.semiBold,
            fontSize: isSmallDevice ? 11 : 12,
            color: colors.success,
            marginTop: 2,
            textAlign: "center",
        },
        rank3Xp: {
            fontFamily: typography.fonts.semiBold,
            fontSize: isSmallDevice ? 11 : 12,
            color: colors.primary,
            marginTop: 2,
            textAlign: "center",
        },
        meTag: {
            backgroundColor: "#EA580C",
            paddingHorizontal: 6,
            paddingVertical: 1,
            borderRadius: 12,
            marginTop: 2,
        },
        meTagText: {
            fontFamily: typography.fonts.bold,
            fontSize: 9,
            color: "#FFFFFF",
        },
    });
};

