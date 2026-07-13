import React from "react";
import { View, Image, StyleSheet, Text } from "react-native";
import { colors } from "@/theme/colors";

interface AvatarWithFrameProps {
    uri?: string | null;
    frameUri?: string | null;
    size?: number;
    name?: string;
    avatarStyle?: any;
    frameStyle?: any;
    borderWidth?: number;
    style?: any;
}

export default function AvatarWithFrame({
    uri,
    frameUri,
    size = 40,
    name = "?",
    avatarStyle,
    frameStyle,
    borderWidth = 2,
    style,
}: AvatarWithFrameProps) {
    const hasAvatar = uri && uri.trim() !== "";
    const hasFrame = frameUri && frameUri.trim() !== "";
    
    // Scale the avatar down slightly if there is a frame to make sure the frame overlaps properly
    const avatarScale = hasFrame ? 0.82 : 1.0;
    const avatarSize = size * avatarScale;
    const avatarRadius = avatarSize / 2;

    return (
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
                            {name ? name.charAt(0).toUpperCase() : "?"}
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
                            width: size,
                            height: size,
                        },
                        frameStyle,
                    ]}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: "relative",
        alignItems: "center",
        justifyContent: "center",
    },
    avatarCircle: {
        backgroundColor: colors.primaryContainer,
        alignItems: "center",
        justifyContent: "center",
        borderColor: colors.borderDark,
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
        fontWeight: "600",
        color: colors.primary,
    },
    frame: {
        position: "absolute",
        top: 0,
        left: 0,
        resizeMode: "contain",
    },
});
