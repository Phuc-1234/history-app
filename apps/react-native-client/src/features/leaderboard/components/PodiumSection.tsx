import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { DisplayUser } from "../hooks/useLeaderboard";
import { colors } from "../../../theme/colors";
import typography from "../../../theme/typography";
import { AvatarWithFrame } from "../../../components/ui";
import { Ionicons } from "@expo/vector-icons";
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
                    <Text style={[styles.podiumName, isMe2 && { fontFamily: typography.fonts.bold, color: "#EA580C" }]} numberOfLines={1}>
                        {user2.name}
                    </Text>
                    {isMe2 && (
                        <View style={[styles.meTag, { marginTop: 4 }]}>
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
                                <Ionicons name="flame" size={12} color="#EA580C" />
                                <Text> {user2.streak} ngày</Text>
                            </>
                        ) : (
                            `${user2.xp.toLocaleString()} XP`
                        )}
                    </Text>
                    <View style={[styles.podiumBase, styles.rank2Base]} />
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
                        style={{ marginBottom: 10, zIndex: 3 }}
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
                    <Text style={[styles.podiumName, styles.rank1Name, isMe1 && { fontFamily: typography.fonts.bold, color: "#EA580C" }]} numberOfLines={1}>
                        {user1.name}
                    </Text>
                    {isMe1 && (
                        <View style={[styles.meTag, { marginTop: 4 }]}>
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
                                <Ionicons name="flame" size={14} color="#EA580C" />
                                <Text> {user1.streak} ngày</Text>
                            </>
                        ) : (
                            `${user1.xp.toLocaleString()} XP`
                        )}
                    </Text>
                    <View style={[styles.podiumBase, styles.rank1Base]} />
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
                    <Text style={[styles.podiumName, isMe3 && { fontFamily: typography.fonts.bold, color: "#EA580C" }]} numberOfLines={1}>
                        {user3.name}
                    </Text>
                    {isMe3 && (
                        <View style={[styles.meTag, { marginTop: 4 }]}>
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
                                <Ionicons name="flame" size={12} color="#EA580C" />
                                <Text> {user3.streak} ngày</Text>
                            </>
                        ) : (
                            `${user3.xp.toLocaleString()} XP`
                        )}
                    </Text>
                    <View style={[styles.podiumBase, styles.rank3Base]} />
                </TouchableOpacity>
            ) : (
                <View style={styles.podiumColumn} />
            )}
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
        centerBadges: {
            justifyContent: "center",
            marginTop: 2,
            marginBottom: 2,
        },
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
        meTag: {
            backgroundColor: "#EA580C",
            paddingHorizontal: 6,
            paddingVertical: 1,
            borderRadius: 12,
        },
        meTagText: {
            fontFamily: typography.fonts.bold,
            fontSize: 9,
            color: "#FFFFFF",
        },
    });

