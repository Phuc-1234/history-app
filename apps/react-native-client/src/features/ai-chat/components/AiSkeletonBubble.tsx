import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated } from "react-native";
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
            <Animated.View style={[styles.skeletonLine, { width: "70%", opacity: opacityAnim }]} />
            <Animated.View style={[styles.skeletonLine, { width: "90%", opacity: opacityAnim }]} />
            <Animated.View style={[styles.skeletonLine, { width: "50%", opacity: opacityAnim }]} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginVertical: 12,
        paddingHorizontal: 4,
        alignItems: "flex-start",
        gap: 8,
    },
    skeletonLine: {
        height: 14,
        borderRadius: 8,
        backgroundColor: colors.surfaceVariant,
    },
});

