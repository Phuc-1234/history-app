import React from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import type { ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/theme/colors";

export type PrimaryButtonVariant = "primary" | "outline" | "soft" | "danger";

export function PrimaryButton({
    label,
    icon,
    onPress,
    variant = "primary",
    style,
    iconOnly = false,
}: {
    label: string;
    icon?: keyof typeof Ionicons.glyphMap;
    onPress?: () => void;
    variant?: PrimaryButtonVariant;
    style?: ViewStyle;
    iconOnly?: boolean;
}) {
    const isPrimary = variant === "primary";
    const isDanger = variant === "danger";
    return (
        <TouchableOpacity
            style={[
                styles.button,
                isPrimary && styles.buttonPrimary,
                variant === "outline" && styles.buttonOutline,
                variant === "soft" && styles.buttonSoft,
                isDanger && styles.buttonDanger,
                iconOnly && styles.buttonIconOnly,
                style,
            ]}
            onPress={onPress}
            activeOpacity={0.82}
            accessibilityLabel={label}
        >
            {icon ? (
                <Ionicons
                    name={icon}
                    size={17}
                    color={isPrimary || isDanger ? "#FFFFFF" : colors.primary}
                />
            ) : null}
            {iconOnly ? null : (
                <Text
                    style={[
                        styles.buttonText,
                        (isPrimary || isDanger) && styles.buttonTextPrimary,
                    ]}
                    numberOfLines={1}
                >
                    {label}
                </Text>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        minHeight: 42,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 30,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 7,
    },
    buttonPrimary: {
        flex: 1,
        backgroundColor: colors.primary,
    },
    buttonOutline: {
        flex: 1,
        borderWidth: 2,
        borderColor: colors.primary,
        backgroundColor: "transparent",
    },
    buttonSoft: {
        flex: 1,
        borderWidth: 2,
        borderColor: colors.primary,
        backgroundColor: "transparent",
    },
    buttonDanger: {
        flex: 1,
        backgroundColor: colors.error,
    },
    buttonText: {
        fontSize: 13,
        fontWeight: "600",
        color: colors.primary,
        textAlign: "center",
    },
    buttonTextPrimary: {
        color: "#FFFFFF",
    },
    buttonIconOnly: {
        paddingHorizontal: 0,
        width: 40,
        minHeight: 40,
        height: 40,
        borderRadius: 30,
    },
});
