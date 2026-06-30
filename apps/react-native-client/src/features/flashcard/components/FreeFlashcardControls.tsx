import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

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
                        color={isMemorized ? "#E53E3E" : "#C7C7CC"}
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
                        color={isMemorized ? "#FFF" : "#0A7E56"}
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
                        color={hasPrev ? "#5856D6" : "#C7C7CC"}
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
                        color={hasNext ? "#5856D6" : "#C7C7CC"}
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
        gap: 16,
        marginVertical: 12,
    },
    memorizeRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        width: "100%",
        paddingHorizontal: 16,
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
        backgroundColor: "#FFF",
        borderWidth: 1,
        borderColor: "#E5E5EA",
    },
    disabledButton: {
        opacity: 0.5,
    },
    notMemorizedButton: {
        backgroundColor: "#FEE2E2",
        borderWidth: 1,
        borderColor: "#FCA5A5",
    },
    notMemorizedButtonInactive: {
        backgroundColor: "#F3F4F6",
        borderWidth: 1,
        borderColor: "#E5E5EA",
        opacity: 0.5,
    },
    memorizedButton: {
        backgroundColor: "#D1FAE5",
        borderWidth: 1,
        borderColor: "#6EE7B7",
    },
    memorizedButtonActive: {
        backgroundColor: "#0A7E56",
    },
    flipButton: {
        paddingHorizontal: 28,
        paddingVertical: 12,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: "#AEAEB2",
        backgroundColor: "#FFF",
        justifyContent: "center",
        alignItems: "center",
        minWidth: 100,
    },
    flipButtonText: {
        fontSize: 15,
        fontWeight: "600",
        color: "#5856D6",
    },
});

