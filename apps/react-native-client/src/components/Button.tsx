import React from "react";
import { TouchableOpacity, Text, StyleSheet, StyleProp, ViewStyle, TextStyle } from "react-native";
import colors from "../theme/colors";

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: "primary" | "secondary" | "outline";
    style?: StyleProp<ViewStyle>;
    textStyle?: StyleProp<TextStyle>;
    disabled?: boolean;
}

export default function Button({
    title,
    onPress,
    variant = "primary",
    style,
    textStyle,
    disabled = false,
}: ButtonProps) {
    const isPrimary = variant === "primary";
    const isSecondary = variant === "secondary";
    const isOutline = variant === "outline";

    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.8}
            disabled={disabled}
            style={[
                styles.button,
                isPrimary && styles.btnPrimary,
                isSecondary && styles.btnSecondary,
                isOutline && styles.btnOutline,
                disabled && styles.disabled,
                style,
            ]}
        >
            <Text
                style={[
                    styles.text,
                    isPrimary && styles.textPrimary,
                    isSecondary && styles.textSecondary,
                    isOutline && styles.textOutline,
                    textStyle,
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
        paddingVertical: 15,
        borderRadius: 28,
        alignItems: "center",
        justifyContent: "center",
        marginVertical: 10,
        height: 56,
    },
    btnPrimary: {
        backgroundColor: colors.primary,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 4,
    },
    btnSecondary: {
        backgroundColor: colors.secondary,
        shadowColor: colors.secondary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 4,
    },
    btnOutline: {
        backgroundColor: "transparent",
        borderWidth: 1,
        borderColor: colors.borderDark,
    },
    disabled: {
        opacity: 0.6,
    },
    text: {
        fontSize: 16,
        fontWeight: "700",
    },
    textPrimary: {
        color: colors.textLight,
    },
    textSecondary: {
        color: colors.textDark,
    },
    textOutline: {
        color: colors.textDark,
    },
});
