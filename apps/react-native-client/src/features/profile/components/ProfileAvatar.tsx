import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface ProfileAvatarProps {
    size?: number;
    onEditPress?: () => void;
    showEditButton?: boolean;
}

export default function ProfileAvatar({
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
            {/* Avatar circle with placeholder icon */}
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
                <Ionicons
                    name="person"
                    size={size * 0.45}
                    color="#B8B0D8"
                />
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
                    <Ionicons name="pencil" size={iconSize} color="#FFFFFF" />
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
        backgroundColor: "#E8E4F4",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 3,
        borderColor: "#D6D0EE",
    },
    editBadge: {
        position: "absolute",
        backgroundColor: "#5856D6",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 2,
        borderColor: "#FFFFFF",
    },
});
