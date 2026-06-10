import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface FlashcardProgressProps {
    total: number;
    completed: number;
}

export function FlashcardProgress({ total, completed }: FlashcardProgressProps) {
    return (
        <View style={styles.container}>
            {/* --- Progress Labels --- */}
            <View style={styles.labelsRow}>
                <Text style={styles.progressLabel}>Tiến độ</Text>
                <Text style={styles.progressCount}>
                    {completed} <Text style={styles.totalCount}>/ {total}</Text>
                </Text>
            </View>

            {/* --- Progress Segments --- */}
            <View style={styles.segmentsContainer}>
                {Array.from({ length: total }).map((_, index) => {
                    const isCompleted = index < completed;
                    return (
                        <View
                            key={index}
                            style={[
                                styles.segment,
                                isCompleted
                                    ? styles.segmentCompleted
                                    : styles.segmentPending,
                            ]}
                        />
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: "100%",
        paddingHorizontal: 20,
        marginVertical: 16,
    },
    labelsRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 10,
    },
    progressLabel: {
        fontSize: 14,
        fontWeight: "500",
        color: "#8E8E93",
    },
    progressCount: {
        fontSize: 16,
        fontWeight: "800",
        color: "#1C1C1E",
    },
    totalCount: {
        color: "#8E8E93",
        fontWeight: "500",
    },
    segmentsContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 3, // Spacing between segments
        width: "100%",
    },
    segment: {
        flex: 1,
        height: 6,
        borderRadius: 3,
    },
    segmentCompleted: {
        backgroundColor: "#5856D6", // Matches brand color (blue/purple)
    },
    segmentPending: {
        backgroundColor: "#E5E5EA", // Light grey
    },
});
