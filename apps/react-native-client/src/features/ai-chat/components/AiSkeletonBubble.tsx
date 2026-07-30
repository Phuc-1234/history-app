import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/theme/colors";

export const AiSkeletonBubble: React.FC = () => {
    const opacityAnim = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(opacityAnim, {
                    toValue: 1,
                    duration: 600,
                    useNativeDriver: true,
                }),
                Animated.timing(opacityAnim, {
                    toValue: 0.3,
                    duration: 600,
                    useNativeDriver: true,
                }),
            ])
        );
        animation.start();

        return () => animation.stop();
    }, [opacityAnim]);

    return (
        <View style={styles.container}>
            <View style={styles.aiAvatar}>
                <Ionicons name="sparkles" size={14} color="#FFF" />
            </View>
            <Animated.View style={[styles.bubble, { opacity: opacityAnim }]} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        marginVertical: 6,
        alignItems: "flex-end",
        justifyContent: "flex-start",
    },
    aiAvatar: {
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: colors.primary,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 8,
        marginBottom: 2,
    },
    bubble: {
        width: 60,
        height: 36,
        borderRadius: 12,
        borderBottomLeftRadius: 4,
        backgroundColor: colors.surfaceVariant,
    },
});
