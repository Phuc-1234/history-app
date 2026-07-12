import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../../theme/colors";
import { typography } from "../../../theme/typography";

interface FlashcardControlsProps {
    onNotMemorized: () => void;
    onMemorized: () => void;
    onFlip: () => void;
    isFlipped: boolean;
}

export function FlashcardControls({
    onNotMemorized,
    onMemorized,
    onFlip,
    isFlipped,
}: FlashcardControlsProps) {
    return (
        <View style={styles.container}>
            {/* --- X (Chưa thuộc) Button --- */}
            <TouchableOpacity
                style={[styles.circleButton, styles.notMemorizedButton]}
                onPress={onNotMemorized}
                activeOpacity={0.7}
            >
                <Ionicons name="close" size={28} color={colors.error} />
            </TouchableOpacity>

            {/* --- Lật (Flip) Button --- */}
            <TouchableOpacity
                style={styles.flipButton}
                onPress={onFlip}
                activeOpacity={0.7}
            >
                <Text style={styles.flipButtonText}>
                    {isFlipped ? "Lật lại" : "Lật"}
                </Text>
            </TouchableOpacity>

            {/* --- V (Đã thuộc) Button --- */}
            <TouchableOpacity
                style={[styles.circleButton, styles.memorizedButton]}
                onPress={onMemorized}
                activeOpacity={0.7}
            >
                <Ionicons name="checkmark" size={28} color="#FFF" />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 20,
        marginVertical: 15,
        width: "100%",
        paddingHorizontal: 16,
    },
    circleButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: "center",
        alignItems: "center",
    },
    notMemorizedButton: {
        backgroundColor: colors.errorContainer,
        borderWidth: 1,
        borderColor: colors.error,
    },
    memorizedButton: {
        backgroundColor: colors.success,
    },
    flipButton: {
        paddingHorizontal: 36,
        paddingVertical: 14,
        borderRadius: 30,
        borderWidth: 1,
        borderColor: colors.borderMedium,
        backgroundColor: colors.surface,
        justifyContent: "center",
        alignItems: "center",
        minWidth: 120,
    },
    flipButtonText: {
        ...typography.bodyLargeBold,
        color: colors.primary,
    },
});
