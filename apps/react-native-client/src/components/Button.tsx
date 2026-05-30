import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: "primary" | "outline";
}

export default function Button({
    title,
    onPress,
    variant = "primary",
}: ButtonProps) {
    const isPrimary = variant === "primary";

    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.8}
            style={[
                styles.button,
                isPrimary ? styles.btnPrimary : styles.btnOutline,
            ]}
        >
            <Text
                style={[
                    styles.text,
                    isPrimary ? styles.textPrimary : styles.textOutline,
                ]}
            >
                {title}
            </Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        width: "100%",
        paddingVertical: 14,
        borderRadius: 100,
        alignItems: "center",
        justifyContent: "center",
        marginVertical: 10,
    },
    btnPrimary: {
        backgroundColor: "#5D45F9",
        shadowColor: "#5D45F9",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 4,
    },
    btnOutline: {
        backgroundColor: "transparent",
        borderWidth: 1,
        borderColor: "#E2E8F0",
    },
    text: {
        fontSize: 15,
        fontWeight: "600",
    },
    textPrimary: {
        color: "#FFFFFF",
    },
    textOutline: {
        color: "#4A5568",
    },
});
