import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "@/theme/colors";

export function StatCard({
    value,
    label,
    backgroundColor,
    tintBackgroundColor,
    variant = "solid",
}: {
    value: string;
    label: string;
    backgroundColor?: string;
    /** Nền pastel nhẹ cho variant `social-outline` (thay cho viền cũ). */
    tintBackgroundColor?: string;
    variant?: "solid" | "accent-outline" | "social-outline";
}) {
    // accent-outline: viền + chữ dùng primary (đồng) — dùng cho "Thắng"
    if (variant === "accent-outline") {
        return (
            <View
                style={[
                    styles.statCard,
                    {
                        backgroundColor: "transparent",
                        borderWidth: 2,
                        borderColor: colors.primary,
                    },
                ]}
            >
                <Text style={[styles.statValue, { color: colors.primary }]}>{value}</Text>
                <Text style={[styles.statLabel, { color: colors.primary }]}>{label}</Text>
            </View>
        );
    }

    // social-outline: nền tint pastel + chữ màu social, KHÔNG viền — mềm,
    // hòa với bảng màu ấm của app (thay cho viền 2px cũ gây chói/gây "viền viền").
    if (variant === "social-outline") {
        const accent = backgroundColor ?? colors.primary;
        return (
            <View
                style={[
                    styles.statCard,
                    {
                        backgroundColor: tintBackgroundColor ?? colors.primaryContainer,
                        borderWidth: 0,
                    },
                ]}
            >
                <Text style={[styles.statValue, { color: accent }]}>{value}</Text>
                <Text style={[styles.statLabel, { color: accent }]}>{label}</Text>
            </View>
        );
    }

    return (
        <View style={[styles.statCard, backgroundColor ? { backgroundColor } : null]}>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    statCard: {
        flex: 1,
        backgroundColor: colors.primary,
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: "center",
        borderWidth: 0,
    },
    statValue: {
        fontSize: 18,
        fontWeight: "600",
        color: colors.textLight,
    },
    statLabel: {
        marginTop: 3,
        fontSize: 11,
        fontWeight: "500",
        color: colors.textLight,
        textAlign: "center",
    },
});
