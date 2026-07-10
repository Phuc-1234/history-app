// components/Toast.tsx
// Android-style toast notification — reusable across the app
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, Platform } from "react-native";
import colors from "../theme/colors";
import typography from "../theme/typography";

interface ToastProps {
    message: string;
    visible: boolean;
    duration?: number; // ms — how long it stays visible
    onHide?: () => void;
}

export function Toast({ message, visible, duration = 2500, onHide }: ToastProps) {
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.sequence([
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.delay(duration),
                Animated.timing(opacity, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start(() => {
                onHide?.();
            });
        }
    }, [visible, message]);

    if (!visible) return null;

    return (
        <Animated.View style={[styles.toast, { opacity }]}>
            <Text style={styles.text}>{message}</Text>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    toast: {
        position: "absolute",
        bottom: 80,
        alignSelf: "center",
        backgroundColor: "rgba(43, 29, 18, 0.9)", // Semi-transparent textPrimary
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 30,
        maxWidth: "80%",
        zIndex: 9999,
    },
    text: {
        fontFamily: typography.fonts.medium,
        color: colors.textLight,
        fontSize: 14,
        textAlign: "center",
        lineHeight: 20,
    },
});
