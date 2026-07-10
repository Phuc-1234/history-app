import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/theme/colors";
import { PrimaryButton } from "./PrimaryButton";

export function EmptyState({
    title,
    actionLabel,
    onAction,
}: {
    title: string;
    actionLabel?: string;
    onAction?: () => void;
}) {
    return (
        <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={30} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>{title}</Text>
            {actionLabel && onAction ? (
                <PrimaryButton label={actionLabel} icon="refresh" variant="soft" onPress={onAction} />
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    emptyState: {
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.inputBackground,
        borderRadius: 12,
        padding: 20,
        gap: 10,
    },
    emptyTitle: {
        fontSize: 14,
        fontWeight: "500",
        color: colors.textPrimary,
        lineHeight: 20,
        textAlign: "center",
    },
});
