import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import type { QuestionV2, MatchAnswerData, UserMatchAnswer, QuestionEvalResult } from "../types";

interface Props {
    question: QuestionV2;
    userAnswer: UserMatchAnswer | null;
    onAnswer: (questionId: number, pairs: { left: string; right: string }[]) => void;
    showFeedback?: boolean;
    evalResult?: QuestionEvalResult | null;
    disabled?: boolean;
}

const normalizePairs = (rawPairs: any[]): { left: string; right: string }[] => {
    if (!Array.isArray(rawPairs)) return [];
    return rawPairs.map((p) => {
        if (!p) return { left: "", right: "" };
        if (typeof p.left === "string" && typeof p.right === "string") {
            return { left: p.left, right: p.right };
        }
        const keys = Object.keys(p);
        const left = keys[0] ?? "";
        const right = typeof p[left] === "string" ? p[left] : "";
        return { left, right };
    });
};

const MATCH_COLORS = [
    { bg: "#EFF6FF", border: "#3B82F6", text: "#1E40AF" }, // Blue
    { bg: "#ECFDF5", border: "#10B981", text: "#065F46" }, // Green
    { bg: "#FFFBEB", border: "#F59E0B", text: "#78350F" }, // Yellow/Amber
    { bg: "#FAF5FF", border: "#A855F7", text: "#5B21B6" }, // Purple
    { bg: "#FEF2F2", border: "#EF4444", text: "#991B1B" }, // Red
    { bg: "#FFF7ED", border: "#F97316", text: "#7C2D12" }, // Orange
];

export default function MatchQuestion({ question, userAnswer, onAnswer, showFeedback, evalResult, disabled }: Props) {
    const data = question.answerData as MatchAnswerData;
    const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
    const [selectedRight, setSelectedRight] = useState<string | null>(null);

    const currentPairs = userAnswer?.pairs ?? [];

    const normalizedPairs = React.useMemo(() => normalizePairs(data.pairs), [data.pairs]);
    const leftItems = React.useMemo(() => normalizedPairs.map((p) => p.left), [normalizedPairs]);
    const rightItems = React.useMemo(() => normalizedPairs.map((p) => p.right), [normalizedPairs]);

    const handleLeftPress = (left: string) => {
        if (disabled || (showFeedback && evalResult)) return;

        const pairIndex = currentPairs.findIndex((p) => p.left === left);
        if (pairIndex !== -1) {
            const filtered = currentPairs.filter((p) => p.left !== left);
            onAnswer(question.id, filtered);
            setSelectedLeft(null);
            return;
        }

        if (selectedRight) {
            const right = selectedRight;
            const filtered = currentPairs.filter((p) => p.left !== left && p.right !== right);
            const newPairs = [...filtered, { left, right }];
            setSelectedLeft(null);
            setSelectedRight(null);
            onAnswer(question.id, newPairs);
        } else {
            setSelectedLeft(selectedLeft === left ? null : left);
        }
    };

    const handleRightPress = (right: string) => {
        if (disabled || (showFeedback && evalResult)) return;

        const pairIndex = currentPairs.findIndex((p) => p.right === right);
        if (pairIndex !== -1) {
            const filtered = currentPairs.filter((p) => p.right !== right);
            onAnswer(question.id, filtered);
            setSelectedRight(null);
            return;
        }

        if (selectedLeft) {
            const left = selectedLeft;
            const filtered = currentPairs.filter((p) => p.left !== left && p.right !== right);
            const newPairs = [...filtered, { left, right }];
            setSelectedLeft(null);
            setSelectedRight(null);
            onAnswer(question.id, newPairs);
        } else {
            setSelectedRight(selectedRight === right ? null : right);
        }
    };

    const isCorrectPair = (left: string, right: string | null) => {
        if (!showFeedback || !right) return undefined;
        const correct = normalizedPairs.find(
            (p) => p.left.trim().toLowerCase() === left.trim().toLowerCase(),
        );
        return correct?.right.trim().toLowerCase() === right.trim().toLowerCase();
    };

    const getItemStyle = (item: string, isLeft: boolean) => {
        const pairIndex = currentPairs.findIndex(p => isLeft ? p.left === item : p.right === item);
        
        if (pairIndex !== -1) {
            if (showFeedback && evalResult) {
                const pair = currentPairs[pairIndex];
                const correct = isCorrectPair(pair.left, pair.right);
                if (correct === true) {
                    return {
                        backgroundColor: "#ECFDF5",
                        borderColor: "#10B981",
                    };
                } else if (correct === false) {
                    return {
                        backgroundColor: "#FEF2F2",
                        borderColor: "#EF4444",
                    };
                }
            }
            const color = MATCH_COLORS[pairIndex % MATCH_COLORS.length];
            return {
                backgroundColor: color?.bg,
                borderColor: color?.border,
            };
        }
        
        const isSelected = isLeft ? selectedLeft === item : selectedRight === item;
        if (isSelected) {
            return styles.itemActive;
        }
        
        const hasActivePartner = isLeft ? !!selectedRight : !!selectedLeft;
        if (hasActivePartner) {
            return styles.itemSelectable;
        }
        
        return null;
    };

    const getItemTextStyle = (item: string, isLeft: boolean) => {
        const pairIndex = currentPairs.findIndex(p => isLeft ? p.left === item : p.right === item);
        
        if (pairIndex !== -1) {
            if (showFeedback && evalResult) {
                const pair = currentPairs[pairIndex];
                const correct = isCorrectPair(pair.left, pair.right);
                if (correct === true) {
                    return { color: "#065F46" };
                } else if (correct === false) {
                    return { color: "#991B1B" };
                }
            }
            const color = MATCH_COLORS[pairIndex % MATCH_COLORS.length];
            return {
                color: color?.text,
            };
        }
        
        const isSelected = isLeft ? selectedLeft === item : selectedRight === item;
        if (isSelected) {
            return styles.itemTextActive;
        }
        
        return null;
    };

    return (
        <View style={styles.container}>
            <Text style={styles.label}>Nối các cặp tương ứng:</Text>

            {/* Unmatched items */}
            <View style={styles.columnsRow}>
                <View style={styles.column}>
                    {leftItems.map((left, idx) => (
                        <TouchableOpacity
                            key={idx}
                            style={[
                                styles.item,
                                getItemStyle(left, true),
                            ]}
                            onPress={() => handleLeftPress(left)}
                            disabled={disabled || (showFeedback && !!evalResult)}
                        >
                            <Text style={[
                                styles.itemText,
                                getItemTextStyle(left, true),
                            ]}>
                                {left}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
                <View style={styles.column}>
                    {rightItems.map((right, idx) => (
                        <TouchableOpacity
                            key={idx}
                            style={[
                                styles.item,
                                getItemStyle(right, false),
                            ]}
                            onPress={() => handleRightPress(right)}
                            disabled={disabled || (showFeedback && !!evalResult)}
                        >
                            <Text style={[
                                styles.itemText,
                                getItemTextStyle(right, false),
                            ]}>
                                {right}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Show correct pairs on feedback */}
            {showFeedback && evalResult && !evalResult.isCorrect && (
                <View style={styles.correctContainer}>
                    <Text style={styles.correctTitle}>Đáp án đúng:</Text>
                    {normalizedPairs.map((p, idx) => (
                        <View key={idx} style={styles.correctRow}>
                            <Text style={styles.correctText}>{p.left}</Text>
                            <Text style={styles.correctArrow}>→</Text>
                            <Text style={styles.correctText}>{p.right}</Text>
                        </View>
                    ))}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { gap: 12 },
    label: { fontSize: 13, fontWeight: "600", color: "#718096" },
    columnsRow: { flexDirection: "row", gap: 12 },
    column: { flex: 1, gap: 8 },
    item: {
        backgroundColor: "#FFF", borderWidth: 1.5, borderColor: "#E5E7EB",
        borderRadius: 12, padding: 12, alignItems: "center", justifyContent: "center",
        height: 70,
    },
    itemActive: { borderColor: "#5D45F9", backgroundColor: "#F5F3FF" },
    itemSelectable: { borderColor: "#A78BFA", borderStyle: "dashed" },
    itemText: { fontSize: 13, fontWeight: "600", color: "#4A5568", textAlign: "center" },
    itemTextActive: { color: "#5D45F9" },
    correctContainer: { backgroundColor: "#ECFDF5", borderRadius: 12, padding: 12, gap: 6 },
    correctTitle: { fontSize: 12, fontWeight: "700", color: "#059669" },
    correctRow: { flexDirection: "row", alignItems: "center", gap: 6 },
    correctText: { fontSize: 12, fontWeight: "600", color: "#065F46" },
    correctArrow: { fontSize: 12, color: "#059669" },
});
