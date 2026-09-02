import React from "react";
import { Animated, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/theme/colors";
import { useAiChatFab } from "../hooks/useAiChatFab";
import { MascotRotator } from "./MascotRotator";
import { TwinklingStars } from "./TwinklingStars";

interface AiChatFabProps {
    onPress: () => void;
    onDismiss?: () => void;
}

export const AiChatFab: React.FC<AiChatFabProps> = ({ onPress, onDismiss }) => {
    const {
        pan,
        fabScale,
        fabOpacity,
        targetAnim,
        targetHoverScale,
        isDragging,
        isCaptured,
        panResponder,
        insets,
        FAB_SIZE,
        TARGET_SIZE,
        BOTTOM_OFFSET,
        TARGET_BOTTOM_SPACING,
    } = useAiChatFab({ onPress, onDismiss });

    return (
        <>
            {/* Dismiss Target Circle (Messenger-style bottom target) */}
            <Animated.View
                pointerEvents="none"
                style={[
                    styles.dismissTargetContainer,
                    {
                        bottom: insets.bottom + TARGET_BOTTOM_SPACING,
                        width: TARGET_SIZE,
                        height: TARGET_SIZE,
                        borderRadius: TARGET_SIZE / 2,
                        opacity: targetAnim,
                        transform: [
                            {
                                translateY: targetAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [30, 0],
                                }),
                            },
                            { scale: targetHoverScale },
                        ],
                    },
                ]}
            >
                <View
                    style={[
                        styles.dismissCircle,
                        {
                            width: TARGET_SIZE,
                            height: TARGET_SIZE,
                            borderRadius: TARGET_SIZE / 2,
                        },
                        isCaptured && styles.dismissCircleCaptured,
                    ]}
                >
                    <Ionicons
                        name="close"
                        size={28}
                        color="#FFFFFF"
                    />
                </View>
            </Animated.View>

            {/* Floating AI Chat FAB */}
            <Animated.View
                {...panResponder.panHandlers}
                style={[
                    styles.fabContainer,
                    {
                        bottom: BOTTOM_OFFSET + insets.bottom,
                        width: FAB_SIZE,
                        height: FAB_SIZE,
                        borderRadius: FAB_SIZE / 2,
                        opacity: fabOpacity,
                        transform: [
                            { translateX: pan.x },
                            { translateY: pan.y },
                            { scale: fabScale },
                        ],
                    },
                ]}
            >
                <View style={styles.fabInner}>
                    <MascotRotator size={42} />
                    <TwinklingStars mode="fab" />
                </View>
            </Animated.View>
        </>
    );
};

const styles = StyleSheet.create({
    fabContainer: {
        position: "absolute",
        right: 20,
        borderWidth: 2,
        borderColor: colors.textLight,
        backgroundColor: colors.primary,
        justifyContent: "center",
        alignItems: "center",
        zIndex: 999,
        overflow: "visible",
    },
    fabInner: {
        width: "100%",
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
        overflow: "visible",
    },
    dismissTargetContainer: {
        position: "absolute",
        alignSelf: "center",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 998,
    },
    dismissCircle: {
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(30, 30, 30, 0.78)",
        borderWidth: 1.5,
        borderColor: "rgba(255, 255, 255, 0.35)",
    },
    dismissCircleCaptured: {
        backgroundColor: "#EF4444",
        borderColor: "rgba(255, 255, 255, 0.8)",
    },
});
