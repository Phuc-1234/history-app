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
            <Animated.View style={[styles.bubble, { opacity: opacityAnim }]}>
                <View style={styles.skeletonLineShort} />
                <View style={styles.skeletonLineLong} />
                <View style={styles.skeletonLineMedium} />
            </Animated.View>
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
        maxWidth: "75%",
        minWidth: 140,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderRadius: 12,
        borderBottomLeftRadius: 4,
        backgroundColor: colors.surfaceVariant,
        gap: 8,
    },
    skeletonLineShort: {
        height: 10,
        width: "50%",
        backgroundColor: colors.borderMedium,
        borderRadius: 4,
    },
    skeletonLineLong: {
        height: 10,
        width: "90%",
        backgroundColor: colors.borderMedium,
        borderRadius: 4,
    },
    skeletonLineMedium: {
        height: 10,
        width: "70%",
        backgroundColor: colors.borderMedium,
        borderRadius: 4,
    },
});
