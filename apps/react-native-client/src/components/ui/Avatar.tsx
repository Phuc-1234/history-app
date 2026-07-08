import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { colors } from "@/theme/colors";
import type { CardUser } from "./types";

/** Lấy chữ cái đầu (và cuối) của tên để làm avatar dự phòng. */
export function getInitials(name: string) {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "?";
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export function Avatar({ user, size = 52 }: { user: Pick<CardUser, "name" | "avatar">; size?: number }) {
    if (!user.avatar) {
        return (
            <View
                style={[
                    styles.fallback,
                    {
                        width: size,
                        height: size,
                        borderRadius: size / 2,
                        borderWidth: 2,
                        borderColor: colors.borderMedium,
                    },
                ]}
            >
                <Text style={[styles.fallbackText, { fontSize: size * 0.4 }]}>
                    {getInitials(user.name)}
                </Text>
            </View>
        );
    }
    return (
        <Image
            source={{ uri: user.avatar }}
            style={{
                width: size,
                height: size,
                borderRadius: size / 2,
                borderWidth: 2,
                borderColor: colors.borderMedium,
            }}
        />
    );
}

const styles = StyleSheet.create({
    fallback: {
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.primaryContainer,
    },
    fallbackText: {
        fontWeight: "600",
        color: colors.primary,
    },
});
