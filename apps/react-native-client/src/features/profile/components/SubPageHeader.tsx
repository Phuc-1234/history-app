import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface SubPageHeaderProps {
    title: string;
    onBackPress: () => void;
}

export default function SubPageHeader({
    title,
    onBackPress,
}: SubPageHeaderProps) {
    return (
        <View style={styles.container}>
            <TouchableOpacity
                onPress={onBackPress}
                style={styles.backButton}
                activeOpacity={0.7}
            >
                <Ionicons name="arrow-back" size={24} color="#2D2D3A" />
            </TouchableOpacity>
            <Text style={styles.title}>{title}</Text>
            {/* Spacer to center the title */}
            <View style={styles.spacer} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: "#F8F7FF",
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: "center",
        justifyContent: "center",
    },
    title: {
        flex: 1,
        textAlign: "center",
        fontSize: 18,
        fontWeight: "700",
        color: "#1C1C1E",
    },
    spacer: {
        width: 40,
    },
});
