import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface FreeFlashcardControlsProps {
    onPrev: () => void;
    onNext: () => void;
    onFlip: () => void;
    isFlipped: boolean;
    hasPrev: boolean;
    hasNext: boolean;
}

export function FreeFlashcardControls({
    onPrev,
    onNext,
    onFlip,
    isFlipped,
    hasPrev,
    hasNext,
}: FreeFlashcardControlsProps) {
    return (
        <View style={styles.container}>
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
                    size={28}
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
                    size={28}
                    color={hasNext ? "#5856D6" : "#C7C7CC"}
                />
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
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 3,
    },
    navButton: {
        backgroundColor: "#FFF",
        borderWidth: 1,
        borderColor: "#E5E5EA",
    },
    disabledButton: {
        opacity: 0.5,
        shadowOpacity: 0,
        elevation: 0,
    },
    flipButton: {
        paddingHorizontal: 36,
        paddingVertical: 14,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: "#AEAEB2",
        backgroundColor: "#FFF",
        justifyContent: "center",
        alignItems: "center",
        minWidth: 120,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
    },
    flipButtonText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#5856D6",
    },
});
