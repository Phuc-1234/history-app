import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View, ScrollView } from "react-native";
import { Link2, Unlink } from "lucide-react-native";
import { MatchingQuestion as MatchingQuestionType } from "../types";

interface Props {
    question: MatchingQuestionType;
    selectedPairs: Record<string, string> | undefined; // leftId -> rightId
    onMatch: (leftId: string, rightId: string) => void;
    onRemoveMatch: (leftId: string) => void;
    disabled?: boolean;
}

const PAIR_COLORS = [
    { bg: "#EEF2FF", border: "#818CF8", text: "#4F46E5", label: "Cặp 1" },
    { bg: "#ECFDF5", border: "#34D399", text: "#059669", label: "Cặp 2" },
    { bg: "#FFFBEB", border: "#FBBF24", text: "#D97706", label: "Cặp 3" },
    { bg: "#FDF2F8", border: "#F472B6", text: "#DB2777", label: "Cặp 4" }
];

export default function MatchingQuestion({
    question,
    selectedPairs = {},
    onMatch,
    onRemoveMatch,
    disabled = false
}: Props) {
    const [activeLeftId, setActiveLeftId] = useState<string | null>(null);

    const handleLeftPress = (leftId: string) => {
        if (disabled) return;
        
        // If already matched, we unmatch it when clicked
        if (selectedPairs[leftId]) {
            onRemoveMatch(leftId);
            return;
        }

        // Toggle selection
        if (activeLeftId === leftId) {
            setActiveLeftId(null);
        } else {
            setActiveLeftId(leftId);
        }
    };

    const handleRightPress = (rightId: string) => {
        if (disabled || !activeLeftId) return;

        // Make the match
        onMatch(activeLeftId, rightId);
        setActiveLeftId(null);
    };

    // Helper to get pair color styles
    const getPairStyle = (leftId: string, rightId?: string) => {
        const matchedRightId = rightId || selectedPairs[leftId];
        if (!matchedRightId) return null;

        // Find match index to assign a unique color
        const leftKeys = Object.keys(selectedPairs);
        const matchIndex = leftKeys.indexOf(leftId);
        
        return PAIR_COLORS[matchIndex % PAIR_COLORS.length];
    };

    // Check if right item is matched to any left item
    const getLeftIdForRight = (rightId: string) => {
        return Object.keys(selectedPairs).find((key) => selectedPairs[key] === rightId);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.questionText}>{question.text}</Text>

            <View style={styles.guidelineBox}>
                <Link2 size={16} color="#7B4FFF" />
                <Text style={styles.guidelineText}>
                    Chọn một mục ở cột trái, sau đó chọn mục tương ứng ở cột phải để ghép đôi. Nhấp lại vào mục đã nối để hủy.
                </Text>
            </View>

            <View style={styles.headersRow}>
                <Text style={styles.columnHeader}>Cột vế A</Text>
                <Text style={styles.columnHeader}>Cột vế B</Text>
            </View>

            <View style={styles.rowsContainer}>
                {Array.from({ length: Math.max(question.leftOptions.length, question.rightOptions.length) }).map((_, index) => {
                    const leftItem = question.leftOptions[index];
                    const rightItem = question.rightOptions[index];

                    // Left card states
                    const leftIsSelected = leftItem ? activeLeftId === leftItem.id : false;
                    const leftIsMatched = leftItem ? !!selectedPairs[leftItem.id] : false;
                    const leftPairStyle = leftItem ? getPairStyle(leftItem.id) : null;

                    // Right card states
                    const rightMatchedLeftId = rightItem ? getLeftIdForRight(rightItem.id) : undefined;
                    const rightIsMatched = !!rightMatchedLeftId;
                    const rightPairStyle = (rightItem && rightMatchedLeftId) ? getPairStyle(rightMatchedLeftId, rightItem.id) : null;
                    const rightCanMatch = !!activeLeftId && !rightIsMatched;

                    return (
                        <View key={index} style={styles.row}>
                            {leftItem ? (
                                <TouchableOpacity
                                    style={[
                                        styles.card,
                                        leftIsSelected && styles.cardActive,
                                        leftIsMatched && leftPairStyle && {
                                            borderColor: leftPairStyle.border,
                                            backgroundColor: leftPairStyle.bg
                                        },
                                        disabled && styles.cardDisabled
                                    ]}
                                    activeOpacity={0.7}
                                    onPress={() => handleLeftPress(leftItem.id)}
                                    disabled={disabled}
                                >
                                    <Text
                                        style={[
                                            styles.cardText,
                                            leftIsMatched && leftPairStyle && { color: leftPairStyle.text },
                                            leftIsSelected && styles.cardTextActive
                                        ]}
                                    >
                                        {leftItem.text}
                                    </Text>

                                    {leftIsMatched && leftPairStyle && (
                                        <View style={[styles.pairIndicator, { backgroundColor: leftPairStyle.border }]}>
                                            <Text style={styles.pairIndicatorText}>{leftPairStyle.label}</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            ) : (
                                <View style={{ flex: 1 }} />
                            )}

                            {rightItem ? (
                                <TouchableOpacity
                                    style={[
                                        styles.card,
                                        rightCanMatch && styles.cardCanMatch,
                                        rightIsMatched && rightPairStyle && {
                                            borderColor: rightPairStyle.border,
                                            backgroundColor: rightPairStyle.bg
                                        },
                                        disabled && styles.cardDisabled
                                    ]}
                                    activeOpacity={0.7}
                                    onPress={() => handleRightPress(rightItem.id)}
                                    disabled={disabled || !activeLeftId || rightIsMatched}
                                >
                                    <Text
                                        style={[
                                            styles.cardText,
                                            rightIsMatched && rightPairStyle && { color: rightPairStyle.text }
                                        ]}
                                    >
                                        {rightItem.text}
                                    </Text>

                                    {rightIsMatched && rightPairStyle && (
                                        <View style={[styles.pairIndicator, { backgroundColor: rightPairStyle.border }]}>
                                            <Text style={styles.pairIndicatorText}>{rightPairStyle.label}</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            ) : (
                                <View style={{ flex: 1 }} />
                            )}
                        </View>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: "100%",
        paddingVertical: 10,
    },
    questionText: {
        fontSize: 18,
        fontWeight: "700",
        color: "#1A202C",
        lineHeight: 26,
        marginBottom: 16,
    },
    guidelineBox: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F5F3FF",
        borderWidth: 1,
        borderColor: "#E0DBFF",
        borderRadius: 14,
        padding: 12,
        gap: 10,
        marginBottom: 24,
    },
    guidelineText: {
        flex: 1,
        fontSize: 12,
        color: "#5D45F9",
        lineHeight: 18,
        fontWeight: "600",
    },
    headersRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 14,
        width: "100%",
    },
    columnHeader: {
        flex: 1,
        fontSize: 14,
        fontWeight: "800",
        color: "#A0AEC0",
        textTransform: "uppercase",
        letterSpacing: 0.5,
        marginBottom: 12,
        paddingLeft: 4,
    },
    rowsContainer: {
        gap: 12,
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 14,
        width: "100%",
        alignItems: "stretch",
    },
    card: {
        flex: 1,
        backgroundColor: "#FFFFFF",
        borderWidth: 1.5,
        borderColor: "#F1F5F9",
        borderRadius: 16,
        paddingHorizontal: 14,
        paddingVertical: 16,
        minHeight: 84,
        justifyContent: "center",
        shadowColor: "#1A202C",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.02,
        shadowRadius: 6,
        elevation: 1,
    },
    cardActive: {
        borderColor: "#5D45F9",
        borderStyle: "dashed",
        backgroundColor: "#FFF",
    },
    cardCanMatch: {
        borderColor: "#8E76FF",
        borderStyle: "dashed",
        backgroundColor: "#FBFBFF",
    },
    cardDisabled: {
        opacity: 0.8,
    },
    cardText: {
        fontSize: 13,
        fontWeight: "600",
        color: "#4A5568",
        lineHeight: 18,
    },
    cardTextActive: {
        color: "#5D45F9",
        fontWeight: "700",
    },
    pairIndicator: {
        alignSelf: "flex-start",
        borderRadius: 100,
        paddingHorizontal: 8,
        paddingVertical: 2,
        marginTop: 8,
    },
    pairIndicatorText: {
        fontSize: 10,
        color: "#FFFFFF",
        fontWeight: "800",
        textTransform: "uppercase",
    },
});
