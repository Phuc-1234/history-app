import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

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
                <Ionicons name="close" size={28} color="#E53E3E" />
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
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 3,
    },
    notMemorizedButton: {
        backgroundColor: "#FEE2E2", // Light pink/red background
        borderWidth: 1,
        borderColor: "#FCA5A5",
    },
    memorizedButton: {
        backgroundColor: "#0A7E56", // Dark green/teal background
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
        color: "#5856D6", // Matches brand color
    },
});
