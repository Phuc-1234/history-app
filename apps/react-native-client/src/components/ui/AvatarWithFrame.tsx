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
    
    const avatarSize = size;
    const avatarRadius = avatarSize / 2;
    
    // Scale the frame up relative to the avatar size, keeping original scale ratio
    const frameSize = hasFrame ? size / 0.82 : size;
    const frameOffset = (size - frameSize) / 2;

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
                            width: frameSize,
                            height: frameSize,
                            top: frameOffset,
                            left: frameOffset,
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
        overflow: "visible",
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
        resizeMode: "contain",
    },
});
