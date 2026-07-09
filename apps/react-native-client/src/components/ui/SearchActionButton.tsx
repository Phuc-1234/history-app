import React from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/theme/colors";
import type { CardAction } from "./types";

/**
 * Nút hành động hình vuông (chỉ icon) dùng trong thẻ tìm bạn (SearchUserCard).
 * `type="outline"` vẽ viền, `type="filled"` đổ màu nền.
 */
export function SearchActionButton({
    action,
    onPress,
    type,
}: {
    action: CardAction;
    onPress?: () => void;
    type: "outline" | "filled";
}) {
    const disabled = action.variant === "disabled";

    const btnStyle =
        type === "outline"
            ? {
                  backgroundColor: "transparent" as const,
                  borderWidth: 2,
                  borderColor: colors.primary,
              }
            : {
                  backgroundColor: disabled ? colors.inputBackground : colors.primary,
              };

    const iconColor =
        type === "outline"
            ? colors.primary
            : disabled
              ? colors.textMuted
              : "#FFFFFF";

    return (
        <TouchableOpacity
            style={[styles.searchBtn, btnStyle]}
            onPress={onPress}
            activeOpacity={disabled ? 1 : 0.85}
            disabled={disabled}
        >
            <Ionicons name={action.icon} size={17} color={iconColor} />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    searchBtn: {
        width: 40,
        height: 40,
        borderRadius: 4,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.primary,
    },
});
