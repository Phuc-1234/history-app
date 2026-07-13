import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../../theme/colors";
import { AvatarWithFrame } from "../../../components/ui";

interface ProfileAvatarProps {
    uri?: string | null;
    frameUri?: string | null;
    size?: number;
    onEditPress?: () => void;
    showEditButton?: boolean;
    name?: string;
}

export default function ProfileAvatar({
    uri,
    frameUri,
    size = 120,
    onEditPress,
    showEditButton = true,
    name = "",
}: ProfileAvatarProps) {
    const badgeSize = size * 0.3;
    const badgeRadius = badgeSize / 2;
    const iconSize = badgeSize * 0.55;

    return (
        <View style={[styles.container, { width: size, height: size }]}>
            {/* Avatar circle with placeholder icon or image and frame */}
            <AvatarWithFrame
                uri={uri}
                frameUri={frameUri}
                size={size}
                name={name}
                borderWidth={2}
            />

            {/* Edit badge */}
            {showEditButton && (
                <TouchableOpacity
                    onPress={onEditPress}
                    activeOpacity={0.7}
                    style={[
                        styles.editBadge,
                        {
                            width: badgeSize,
                            height: badgeSize,
                            borderRadius: badgeRadius,
                            bottom: 2,
                            right: 2,
                        },
                    ]}
                >
                    <Ionicons name="pencil" size={iconSize} color={colors.textLight} />
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: "relative",
        alignSelf: "center",
    },
    avatarCircle: {
        backgroundColor: colors.primaryContainer,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 2,
        borderColor: colors.borderDark,
        overflow: "hidden",
    },
    editBadge: {
        position: "absolute",
        backgroundColor: colors.primary,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 2,
        borderColor: colors.borderDark,
    },
});
