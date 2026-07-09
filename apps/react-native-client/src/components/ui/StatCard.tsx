import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "@/theme/colors";

export function StatCard({
    value,
    label,
    backgroundColor,
    variant = "solid",
}: {
    value: string;
    label: string;
    backgroundColor?: string;
    variant?: "solid" | "accent-outline";
}) {
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
        color: "#FFFFFF",
    },
    statLabel: {
        marginTop: 3,
        fontSize: 11,
        fontWeight: "500",
        color: "#FFFFFF",
        textAlign: "center",
    },
});
