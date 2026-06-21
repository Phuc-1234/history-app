import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../../theme/colors";

interface ProfileMenuItemProps {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    onPress: () => void;
}

export default function ProfileMenuItem({
    icon,
    label,
    onPress,
}: ProfileMenuItemProps) {
    return (
        <TouchableOpacity
            style={styles.container}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <Ionicons name={icon} size={22} color={colors.primary} style={styles.icon} />
            <Text style={styles.label}>{label}</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 14,
        paddingHorizontal: 16,
    },
    icon: {
        marginRight: 14,
    },
    label: {
        flex: 1,
        fontSize: 15,
        fontWeight: "600",
        color: colors.textPrimary,
    },
});
