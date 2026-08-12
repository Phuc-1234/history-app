import React from "react";
import { View, Image, StyleSheet, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors } from "@/theme/colors";
import typography from "@/theme/typography";

export function getInitials(name: string) {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "?";
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export interface AvatarWithFrameProps {
    uri?: string | null;
    frameUri?: string | null;
    size?: number;
    name?: string;
    avatarStyle?: any;
    frameStyle?: any;
    borderWidth?: number;
    style?: any;
    /** Variation for TopBar/Header: shows shiny PRO badge chip */
    isPro?: boolean;
    showProBadge?: boolean;
    /** Variation for Profile screen: shows edit pencil button overlay */
    showEditButton?: boolean;
    onEditPress?: () => void;
    /** Optional press handler for the entire avatar wrapper */
    onPress?: () => void;
}

export function AvatarWithFrame({
    uri,
    frameUri,
    size = 40,
    name = "",
    avatarStyle,
    frameStyle,
    borderWidth = 2,
    style,
    isPro = false,
    showProBadge = false,
    showEditButton = false,
    onEditPress,
    onPress,
}: AvatarWithFrameProps) {
    const router = useRouter();
    const hasAvatar = !!(uri && uri.trim() !== "");
    const hasFrame = !!(frameUri && frameUri.trim() !== "");
    const displayProBadge = isPro || showProBadge;

    const avatarSize = size;
    const avatarRadius = avatarSize / 2;

    const frameSize = hasFrame ? size / 0.75 : size;
    const frameOffset = (size - frameSize) / 2;

    const badgeSize = Math.max(18, size * 0.3);
    const badgeRadius = badgeSize / 2;
    const iconSize = badgeSize * 0.55;

    const handleEditPress = () => {
        if (onEditPress) {
            onEditPress();
        } else {
            router.push("/(10_proflie)/10_2_profile_edit?triggerImagePicker=true" as never);
        }
    };

    const avatarContent = (
        <View style={[styles.container, { width: size, height: size }, style]}>
            {/* Inner Avatar Image / Fallback */}
            <View
                style={[
                    styles.avatarCircle,
                    {
                        width: avatarSize,
                        height: avatarSize,
                        borderRadius: avatarRadius,
                        borderWidth: hasFrame ? 0 : borderWidth,
                    },
                    avatarStyle,
                ]}
            >
                {hasAvatar ? (
                    <Image
                        source={{ uri }}
                        style={{
                            width: "100%",
                            height: "100%",
                            borderRadius: avatarRadius,
                        }}
                    />
                ) : (
                    <View style={[styles.fallback, { borderRadius: avatarRadius }]}>
                        <Text style={[styles.fallbackText, { fontSize: avatarSize * 0.4 }]}>
                            {getInitials(name)}
                        </Text>
                    </View>
                )}
            </View>

            {/* Frame Overlay */}
            {hasFrame && (
                <Image
                    source={{ uri: frameUri }}
                    style={[
                        styles.frame,
                        {
                            width: frameSize,
                            height: frameSize,
                            top: frameOffset,
                            left: frameOffset,
                        },
                        frameStyle,
                    ]}
                />
            )}

            {/* Variation: TopBar PRO badge */}
            {displayProBadge && (
                <View style={styles.proBadgeChip}>
                    <Text style={styles.proBadgeText}>PRO</Text>
                </View>
            )}

            {/* Variation: Profile Edit pencil button */}
            {showEditButton && (
                <TouchableOpacity
                    onPress={handleEditPress}
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

    if (onPress) {
        return (
            <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
                {avatarContent}
            </TouchableOpacity>
        );
    }

    return avatarContent;
}

export default AvatarWithFrame;

const styles = StyleSheet.create({
    container: {
        position: "relative",
        alignItems: "center",
        justifyContent: "center",
        overflow: "visible",
    },
    avatarCircle: {
        backgroundColor: colors.primaryContainer,
        alignItems: "center",
        justifyContent: "center",
        borderColor: colors.borderMedium || colors.primary,
        overflow: "hidden",
    },
    fallback: {
        width: "100%",
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.primaryContainer,
    },
    fallbackText: {
        fontFamily: typography.fonts.bold,
        color: colors.primary,
    },
    frame: {
        position: "absolute",
        resizeMode: "contain",
    },
    proBadgeChip: {
        position: "absolute",
        bottom: -4,
        right: -6,
        backgroundColor: "#E5A93B",
        paddingHorizontal: 5,
        paddingVertical: 1,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#FFFFFF",
        alignItems: "center",
        justifyContent: "center",
    },
    proBadgeText: {
        fontFamily: typography.fonts.bold,
        fontSize: 8,
        color: "#2B1D12",
    },
    editBadge: {
        position: "absolute",
        backgroundColor: colors.primary,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 2,
        borderColor: "#FFFFFF",
    },
});
