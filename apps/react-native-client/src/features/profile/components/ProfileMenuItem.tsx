import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

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
            <View style={styles.iconContainer}>
                <Ionicons name={icon} size={22} color="#5856D6" />
            </View>
            <Text style={styles.label}>{label}</Text>
            <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#F0EEF6",
        marginBottom: 12,
        shadowColor: "#5856D6",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 1,
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: "#F3F1FC",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 14,
    },
    label: {
        flex: 1,
        fontSize: 15,
        fontWeight: "600",
        color: "#2D2D3A",
    },
});
