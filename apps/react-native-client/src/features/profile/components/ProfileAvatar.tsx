import React from "react";
import { View, TouchableOpacity, StyleSheet, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../../theme/colors";

interface ProfileAvatarProps {
    uri?: string | null;
    size?: number;
    onEditPress?: () => void;
    showEditButton?: boolean;
}

export default function ProfileAvatar({
    uri,
    size = 120,
    onEditPress,
    showEditButton = true,
}: ProfileAvatarProps) {
    const avatarRadius = size / 2;
    const badgeSize = size * 0.3;
    const badgeRadius = badgeSize / 2;
    const iconSize = badgeSize * 0.55;

    return (
        <View style={[styles.container, { width: size, height: size }]}>
            {/* Avatar circle with placeholder icon or image */}
            <View
                style={[
                    styles.avatarCircle,
                    {
                        width: size,
                        height: size,
                        borderRadius: avatarRadius,
                    },
                ]}
            >
                {uri && uri.trim() !== "" ? (
                    <Image
                        source={{ uri }}
                        style={{
                            width: "100%",
                            height: "100%",
                        }}
                    />
                ) : (
                    <Ionicons
                        name="person"
                        size={size * 0.45}
                        color={colors.borderDark}
                    />
                )}
            </View>

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
