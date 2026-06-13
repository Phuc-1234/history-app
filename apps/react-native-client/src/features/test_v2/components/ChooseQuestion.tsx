import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import type { QuestionV2, ChooseAnswerData, UserChooseAnswer, QuestionEvalResult } from "../types";
import { isSingleChoice } from "../services/scoreEngine";

interface Props {
    question: QuestionV2;
    userAnswer: UserChooseAnswer | null;
    onAnswer: (questionId: number, selectedOptions: number[]) => void;
    showFeedback?: boolean;
    evalResult?: QuestionEvalResult | null;
    disabled?: boolean;
}

export default function ChooseQuestion({ question, userAnswer, onAnswer, showFeedback, evalResult, disabled }: Props) {
    const data = question.answerData as ChooseAnswerData;
    const single = isSingleChoice(question);
    const selectedOptions = userAnswer?.selectedOptions ?? [];

    const handlePress = (index: number) => {
        if (disabled) return;
        if (single) {
            onAnswer(question.id, [index]);
        } else {
            const newSelected = selectedOptions.includes(index)
                ? selectedOptions.filter((i) => i !== index)
                : [...selectedOptions, index].sort();
            onAnswer(question.id, newSelected);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.label}>
                {single ? "Chọn một đáp án:" : "Chọn nhiều đáp án:"}
            </Text>
            {data.options.map((option, idx) => {
                const isSelected = selectedOptions.includes(idx);
                const isCorrect = data.correctOption.includes(idx);
                const showCorrect = showFeedback && evalResult;

                let optStyle: any[] = [styles.option];
                let textStyle: any[] = [styles.optionText];

                if (showCorrect) {
                    if (isCorrect) {
                        optStyle.push(styles.optionCorrect);
                        textStyle.push(styles.textCorrect);
                    } else if (isSelected && !isCorrect) {
                        optStyle.push(styles.optionWrong);
                        textStyle.push(styles.textWrong);
                    }
                } else if (isSelected) {
                    optStyle.push(styles.optionSelected);
                    textStyle.push(styles.textSelected);
                }

                return (
                    <TouchableOpacity
                        key={idx}
                        style={optStyle}
                        onPress={() => handlePress(idx)}
                        disabled={disabled || (showFeedback && !!evalResult)}
                        activeOpacity={0.7}
                    >
                        <View style={styles.optionRow}>
                            <View style={[styles.radio, isSelected && styles.radioSelected]}>
                                {isSelected && <View style={styles.radioDot} />}
                            </View>
                            <Text style={textStyle}>
                                {String.fromCharCode(65 + idx)}. {option}
                            </Text>
                        </View>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { gap: 10 },
    label: { fontSize: 13, fontWeight: "600", color: "#718096", marginBottom: 4 },
    option: {
        backgroundColor: "#FFF",
        borderWidth: 1.5,
        borderColor: "#E5E7EB",
        borderRadius: 16,
        padding: 14,
    },
    optionSelected: { borderColor: "#5D45F9", backgroundColor: "#F5F3FF" },
    optionCorrect: { borderColor: "#10B981", backgroundColor: "#ECFDF5" },
    optionWrong: { borderColor: "#EF4444", backgroundColor: "#FEF2F2" },
    optionRow: { flexDirection: "row", alignItems: "center", gap: 10 },
    radio: {
        width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: "#D1D5DB",
        justifyContent: "center", alignItems: "center",
    },
    radioSelected: { borderColor: "#5D45F9" },
    radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#5D45F9" },
    optionText: { fontSize: 14, fontWeight: "600", color: "#4A5568", flex: 1 },
    textSelected: { color: "#5D45F9" },
    textCorrect: { color: "#065F46" },
    textWrong: { color: "#991B1B" },
});
