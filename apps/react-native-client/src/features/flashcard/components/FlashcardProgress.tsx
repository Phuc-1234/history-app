import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../../../theme/colors";
import { typography } from "../../../theme/typography";

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
        ...typography.bodyMediumMedium,
        color: colors.textMuted,
    },
    progressCount: {
        ...typography.bodyLargeBold,
        color: colors.textPrimary,
    },
    totalCount: {
        ...typography.bodyMedium,
        color: colors.textMuted,
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
        backgroundColor: colors.primary,
    },
    segmentPending: {
        backgroundColor: colors.borderMedium,
    },
});
