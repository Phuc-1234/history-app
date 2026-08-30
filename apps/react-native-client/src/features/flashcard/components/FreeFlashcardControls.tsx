import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../../theme/colors";
import { typography } from "../../../theme/typography";

interface FreeFlashcardControlsProps {
    onPrev: () => void;
    onNext: () => void;
    onFlip: () => void;
    onMarkMemorized: () => void;
    onMarkNotMemorized: () => void;
    isFlipped: boolean;
    hasPrev: boolean;
    hasNext: boolean;
    isMemorized: boolean;
}

export function FreeFlashcardControls({
    onPrev,
    onNext,
    onFlip,
    onMarkMemorized,
    onMarkNotMemorized,
    isFlipped,
    hasPrev,
    hasNext,
    isMemorized,
}: FreeFlashcardControlsProps) {
    return (
        <View style={styles.container}>
            {/* --- Memorize row (above nav, flanking sides) --- */}
            <View style={styles.memorizeRow}>
                {/* --- X (Chưa thuộc) Button --- */}
                <TouchableOpacity
                    style={[
                        styles.circleButton,
                        isMemorized
                            ? styles.notMemorizedButton
                            : styles.notMemorizedButtonInactive,
                    ]}
                    onPress={onMarkNotMemorized}
                    activeOpacity={0.7}
                    disabled={!isMemorized}
                >
                    <Ionicons
                        name="close"
                        size={24}
                        color={isMemorized ? colors.error : colors.textPlaceholder}
                    />
                </TouchableOpacity>

                {/* --- ✓ (Đã thuộc) Button --- */}
                <TouchableOpacity
                    style={[
                        styles.circleButton,
                        isMemorized
                            ? styles.memorizedButtonActive
                            : styles.memorizedButton,
                    ]}
                    onPress={onMarkMemorized}
                    activeOpacity={0.7}
                    disabled={isMemorized}
                >
                    <Ionicons
                        name="checkmark"
                        size={24}
                        color={isMemorized ? "#FFF" : colors.success}
                    />
                </TouchableOpacity>
            </View>

            {/* --- Navigation row (below memorize row) --- */}
            <View style={styles.navRow}>
                {/* --- Previous Button --- */}
                <TouchableOpacity
                    style={[
                        styles.circleButton,
                        styles.navButton,
                        !hasPrev && styles.disabledButton,
                    ]}
                    onPress={onPrev}
                    activeOpacity={0.7}
                    disabled={!hasPrev}
                >
                    <Ionicons
                        name="chevron-back"
                        size={24}
                        color={hasPrev ? colors.primary : colors.textPlaceholder}
                    />
                </TouchableOpacity>

                {/* --- Flip Button --- */}
                <TouchableOpacity
                    style={styles.flipButton}
                    onPress={onFlip}
                    activeOpacity={0.7}
                >
                    <Text style={styles.flipButtonText}>
                        {isFlipped ? "Lật lại" : "Lật"}
                    </Text>
                </TouchableOpacity>

                {/* --- Next Button --- */}
                <TouchableOpacity
                    style={[
                        styles.circleButton,
                        styles.navButton,
                        !hasNext && styles.disabledButton,
                    ]}
                    onPress={onNext}
                    activeOpacity={0.7}
                    disabled={!hasNext}
                >
                    <Ionicons
                        name="chevron-forward"
                        size={24}
                        color={hasNext ? colors.primary : colors.textPlaceholder}
                    />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: "100%",
        paddingHorizontal: 24,
        alignItems: "center",
        gap: 8,
        marginVertical: 4,
    },
    memorizeRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        width: "100%",
        paddingHorizontal: 20,
        marginTop: 8,
    },
    navRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
    },
    circleButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: "center",
        alignItems: "center",
    },
    navButton: {
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.borderMedium,
    },
    disabledButton: {
        opacity: 0.5,
    },
    notMemorizedButton: {
        backgroundColor: colors.errorContainer,
        borderWidth: 1,
        borderColor: colors.error,
    },
    notMemorizedButtonInactive: {
        backgroundColor: colors.surfaceVariant,
        borderWidth: 1,
        borderColor: colors.borderMedium,
        opacity: 0.5,
    },
    memorizedButton: {
        backgroundColor: colors.successContainer,
        borderWidth: 1,
        borderColor: colors.success,
    },
    memorizedButtonActive: {
        backgroundColor: colors.success,
    },
    flipButton: {
        paddingHorizontal: 28,
        paddingVertical: 12,
        borderRadius: 30,
        borderWidth: 1,
        borderColor: colors.borderMedium,
        backgroundColor: colors.surface,
        justifyContent: "center",
        alignItems: "center",
        minWidth: 100,
    },
    flipButtonText: {
        ...typography.bodyMediumBold,
        color: colors.primary,
    },
});

