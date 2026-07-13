// components/Toast.tsx
// Beautiful pill-shaped toast notification floating at the top
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import typography from "../theme/typography";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ToastProps {
    message: string;
    visible: boolean;
    duration?: number; // ms — how long it stays visible
    onHide?: () => void;
    type?: "success" | "error" | "info";
}

export function Toast({ message, visible, duration = 2500, onHide, type = "success" }: ToastProps) {
    const opacity = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(-100)).current;
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const insets = useSafeAreaInsets();

    const hideToast = () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        Animated.parallel([
            Animated.timing(opacity, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.timing(translateY, {
                toValue: -50,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start(() => {
            onHide?.();
        });
    };

    useEffect(() => {
        if (visible) {
            if (timerRef.current) clearTimeout(timerRef.current);
            opacity.setValue(0);
            translateY.setValue(-50);

            Animated.parallel([
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 250,
                    useNativeDriver: true,
                }),
                Animated.timing(translateY, {
                    toValue: 0,
                    duration: 250,
                    useNativeDriver: true,
                }),
            ]).start(() => {
                timerRef.current = setTimeout(() => {
                    hideToast();
                }, duration);
            });
        }

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [visible, message]);

    if (!visible) return null;

    // Design configurations based on toast type
    let bgColor = "rgba(235, 251, 242, 0.95)"; // Pale green
    let borderColor = "#c3f6e3"; // Light green border
    let textColor = "#2b8a3e"; // Dark green text
    let iconName: keyof typeof Ionicons.glyphMap = "checkmark-circle";
    let iconColor = "#2b8a3e";

    if (type === "error") {
        bgColor = "rgba(255, 239, 239, 0.95)"; // Pale red
        borderColor = "#ffd8d8";
        textColor = "#dc3545";
        iconName = "alert-circle";
        iconColor = "#dc3545";
    } else if (type === "info") {
        bgColor = "rgba(250, 240, 230, 0.96)"; // Soft warm cream
        borderColor = "rgba(195, 121, 56, 0.25)"; // Light copper border
        textColor = colors.primary; // Copper text
        iconName = "notifications-circle-outline";
        iconColor = colors.primary;
    }

    const topPosition = Math.max(insets.top + 2, 10);

    return (
        <Animated.View
            style={[
                styles.toast,
                {
                    opacity,
                    transform: [{ translateY }],
                    top: topPosition,
                    backgroundColor: bgColor,
                    borderColor: borderColor,
                },
            ]}
        >
            <Ionicons name={iconName} size={22} color={iconColor} style={styles.icon} />
            <Text style={[styles.text, { color: textColor }]}>{message}</Text>
            <TouchableOpacity onPress={hideToast} activeOpacity={0.7} style={styles.closeBtn}>
                <Ionicons name="close-outline" size={18} color={textColor} />
            </TouchableOpacity>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    toast: {
        position: "absolute",
        left: 16,
        right: 16,
        alignSelf: "center",
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 30,
        borderWidth: 1.5,
        zIndex: 99999,
    },
    icon: {
        marginRight: 10,
    },
    text: {
        fontFamily: typography.fonts.semiBold,
        fontSize: 13,
        flex: 1,
        lineHeight: 16,
    },
    closeBtn: {
        padding: 4,
        marginLeft: 8,
    },
});
