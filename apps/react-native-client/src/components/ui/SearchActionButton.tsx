import React from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/theme/colors";
import type { CardAction } from "./types";

/**
 * Nút hành động dùng trong thẻ tìm bạn (SearchUserCard).
 *
 * Hai chế độ:
 * - Mặc định (icon-only): nút vuông 40×40, chỉ icon.
 * - Có `showLabel`: hiển thị chữ + icon (pill), dùng cho nút "Theo dõi"
 *   để rõ nghĩa (theo chuẩn Twitter/Instagram) thay vì chỉ icon.
 *
 * `type="outline"` vẽ viền, `type="filled"` đổ màu nền.
 */
export function SearchActionButton({
    action,
    onPress,
    type,
    showLabel = false,
}: {
    action: CardAction;
    onPress?: () => void;
    type: "outline" | "filled";
    /** Bật để render nút dạng pill có chữ (mặc định tắt để giữ backward-compatible). */
    showLabel?: boolean;
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

    const contentColor =
        type === "outline"
            ? colors.primary
            : disabled
              ? colors.textMuted
              : colors.textLight;

    return (
        <TouchableOpacity
            style={[styles.searchBtn, showLabel && styles.searchBtnLabeled, btnStyle]}
            onPress={onPress}
            activeOpacity={disabled ? 1 : 0.85}
            disabled={disabled}
        >
            {showLabel ? (
                <Text
                    style={[styles.label, { color: contentColor }]}
                    numberOfLines={1}
                >
                    {action.label}
                </Text>
            ) : (
                action.icon && (
                    <Ionicons name={action.icon} size={17} color={contentColor} />
                )
            )}
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
    searchBtnLabeled: {
        width: null,
        height: 36,
        minWidth: 92,
        paddingHorizontal: 14,
        borderRadius: 4,
    },
    label: {
        fontSize: 13,
        fontWeight: "600",
    },
});
