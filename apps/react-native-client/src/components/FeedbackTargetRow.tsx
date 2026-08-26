import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import typography from "../theme/typography";

// Ngữ cảnh góp ý (grade/lesson/node/question) có thể dài —
// thu gọn còn 2 dòng, bấm để mở rộng/thu gọn xem hết nội dung
const COLLAPSED_LINES = 2;
const TOGGLE_CHAR_THRESHOLD = 90;

interface FeedbackTargetRowProps {
    targetName: string;
}

export function FeedbackTargetRow({ targetName }: FeedbackTargetRowProps) {
    const [expanded, setExpanded] = useState(false);
    const canToggle = targetName.length > TOGGLE_CHAR_THRESHOLD;

    return (
        <TouchableOpacity
            style={styles.container}
            onPress={() => setExpanded((prev) => !prev)}
            activeOpacity={canToggle ? 0.7 : 1}
            disabled={!canToggle}
        >
            <Ionicons name="flag-outline" size={12} color={colors.primary} style={styles.icon} />
            <Text
                style={styles.text}
                numberOfLines={expanded ? undefined : COLLAPSED_LINES}
            >
                {targetName}
            </Text>
            {canToggle && (
                <Ionicons
                    name={expanded ? "chevron-up" : "chevron-down"}
                    size={14}
                    color={colors.primary}
                    style={styles.chevron}
                />
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "flex-start",
        backgroundColor: colors.primaryContainer,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        marginTop: 12,
        borderWidth: 1,
        borderColor: colors.borderLight,
        gap: 6,
    },
    icon: {
        marginTop: 2,
    },
    text: {
        fontFamily: typography.fonts.semiBold,
        fontSize: 12,
        color: colors.primary,
        flex: 1,
        lineHeight: 16,
    },
    chevron: {
        marginTop: 1,
        flexShrink: 0,
    },
});
