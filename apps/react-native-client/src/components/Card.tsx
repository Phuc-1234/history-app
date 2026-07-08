import React from "react";
import {
    View,
    TouchableOpacity,
    StyleSheet,
    StyleProp,
    ViewStyle,
    GestureResponderEvent,
} from "react-native";
import { colors } from "../theme/colors";

export type CardVariant = "accent" | "soft" | "bordered" | "grayBorder";

export interface CardProps {
    variant?: CardVariant;
    style?: StyleProp<ViewStyle>;
    onPress?: (event: GestureResponderEvent) => void;
    activeOpacity?: number;
    children?: React.ReactNode;
}

export function Card({
    variant,
    style,
    onPress,
    activeOpacity = 0.85,
    children,
    ...props
}: CardProps) {
    const variantStyle = variant ? styles[variant] : null;

    if (onPress) {
        return (
            <TouchableOpacity
                style={[styles.base, variantStyle, style]}
                onPress={onPress}
                activeOpacity={activeOpacity}
                {...props}
            >
                {children}
            </TouchableOpacity>
        );
    }

    return (
        <View style={[styles.base, variantStyle, style]} {...props}>
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    base: {
        borderRadius: 12,
        overflow: "hidden",
    },
    accent: {
        backgroundColor: colors.accent,
        borderWidth: 0,
    },
    soft: {
        backgroundColor: colors.primaryContainer,
        borderWidth: 0,
    },
    bordered: {
        backgroundColor: colors.surface,
        borderWidth: 1.5,
        borderColor: colors.accent,
    },
    grayBorder: {
        backgroundColor: colors.surface,
        borderWidth: 1.5,
        borderColor: colors.borderMedium,
    },
});

export default Card;
