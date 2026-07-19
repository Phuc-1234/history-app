import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/theme/colors";
import typography from "@/theme/typography";

interface UserSocialBadgesProps {
    isFriend?: boolean;
    isFollowing?: boolean;
    style?: any;
}

export const UserSocialBadges: React.FC<UserSocialBadgesProps> = ({
    isFriend,
    isFollowing,
    style,
}) => {
    if (!isFriend && !isFollowing) return null;

    return (
        <View style={[styles.badgesContainer, style]}>
            {isFriend && (
                <View style={[styles.badgePill, styles.friendBadge]}>
                    <Ionicons name="people" size={10} color={colors.socialFriends} />
                    <Text style={[styles.badgeText, { color: colors.socialFriends }]}>Bạn bè</Text>
                </View>
            )}
            {isFollowing && (
                <View style={[styles.badgePill, styles.followingBadge]}>
                    <Ionicons name="eye" size={10} color={colors.socialFollowing} />
                    <Text style={[styles.badgeText, { color: colors.socialFollowing }]}>Đang theo dõi</Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    badgesContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        marginTop: 2,
        flexWrap: "wrap",
    },
    badgePill: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 10,
        gap: 3,
    },
    friendBadge: {
        backgroundColor: "rgba(49, 130, 206, 0.12)",
    },
    followingBadge: {
        backgroundColor: "rgba(16, 185, 129, 0.12)",
    },
    badgeText: {
        fontFamily: typography.fonts.medium,
        fontSize: 10,
    },
});
