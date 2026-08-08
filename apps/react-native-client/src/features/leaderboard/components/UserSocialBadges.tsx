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
                <Ionicons name="people" size={16} color={colors.socialFriends} />
            )}
            {isFollowing && (
                <Ionicons name="eye" size={16} color={colors.socialFollowing} />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    badgesContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginTop: 2,
    },
});
