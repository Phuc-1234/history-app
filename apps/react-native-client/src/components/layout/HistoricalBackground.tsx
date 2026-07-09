import React, { useEffect, useRef } from "react";
import { StyleSheet, View, Animated, Easing, Image } from "react-native";
import { colors } from "../../theme/colors";

const TRONG_DONG_IMG = require("../../../assets/images/trong_dong.png");

export default function HistoricalBackground() {
    // Animation drivers
    const rotateAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Slow, infinite rotation for the Dong Son Drum
        Animated.loop(
            Animated.timing(rotateAnim, {
                toValue: 1,
                duration: 40000, // seconds per full turn
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();
    }, [rotateAnim]);

    // Interpolate rotation
    const rotation = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ["0deg", "360deg"],
    });

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {/* 1. Rotating Dong Son Drum in Top-Left (faint Crimson) */}
            <Animated.View
                style={[
                    styles.trongDongTopLeft,
                    {
                        transform: [{ rotate: rotation }],
                    },
                ]}
            >
                <Image
                    source={TRONG_DONG_IMG}
                    style={{ width: 260, height: 260, tintColor: colors.primary, opacity: 0.18 }}
                    resizeMode="contain"
                />
            </Animated.View>

            {/* 2. Rotating Dong Son Drum in Bottom-Right (faint Gold) */}
            <Animated.View
                style={[
                    styles.trongDongBottomRight,
                    {
                        transform: [{ rotate: rotation }],
                    },
                ]}
            >
                <Image
                    source={TRONG_DONG_IMG}
                    style={{ width: 380, height: 380, tintColor: colors.secondary, opacity: 0.15 }}
                    resizeMode="contain"
                />
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    trongDongTopLeft: {
        position: "absolute",
        top: -50,
        left: -70,
    },
    trongDongBottomRight: {
        position: "absolute",
        bottom: -80,
        right: -100,
    },
});
