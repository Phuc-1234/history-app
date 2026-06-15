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
                let badge = null;

                if (showCorrect) {
                    if (isSelected && isCorrect) {
                        optStyle.push(styles.optionCorrect);
                        textStyle.push(styles.textCorrect);
                        badge = (
                            <View style={[styles.badge, styles.badgeCorrect]}>
                                <Text style={styles.badgeTextCorrect}>Đúng</Text>
                            </View>
                        );
                    } else if (isSelected && !isCorrect) {
                        optStyle.push(styles.optionWrong);
                        textStyle.push(styles.textWrong);
                        badge = (
                            <View style={[styles.badge, styles.badgeWrong]}>
                                <Text style={styles.badgeTextWrong}>Sai</Text>
                            </View>
                        );
                    } else if (!isSelected && isCorrect) {
                        optStyle.push(styles.optionMissing);
                        textStyle.push(styles.textMissing);
                        badge = (
                            <View style={[styles.badge, styles.badgeMissing]}>
                                <Text style={styles.badgeTextMissing}>Đáp án đúng</Text>
                            </View>
                        );
                    }
                } else if (isSelected) {
                    optStyle.push(single ? styles.optionSelected : styles.optionSelectedMultiple);
                    textStyle.push(single ? styles.textSelected : styles.textSelectedMultiple);
                }

                return (
                    <TouchableOpacity
                        key={idx}
                        style={optStyle}
                        onPress={() => handlePress(idx)}
                        disabled={disabled || (showFeedback && !!evalResult)}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.optionRow, { justifyContent: "space-between" }]}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
                                <View style={[
                                    single ? styles.radio : styles.checkbox,
                                    isSelected && (single ? styles.radioSelected : styles.checkboxSelected),
                                    showCorrect && isSelected && isCorrect && (single ? styles.radioCorrect : styles.checkboxCorrect),
                                    showCorrect && isSelected && !isCorrect && (single ? styles.radioWrong : styles.checkboxWrong),
                                    showCorrect && !isSelected && isCorrect && (single ? styles.radioMissing : styles.checkboxMissing),
                                ]}>
                                    {isSelected && (
                                        <View style={[
                                            single ? styles.radioDot : styles.checkboxInner,
                                            showCorrect && isCorrect && (single ? styles.radioDotCorrect : styles.checkboxInnerCorrect),
                                            showCorrect && !isCorrect && (single ? styles.radioDotWrong : styles.checkboxInnerWrong),
                                        ]} />
                                    )}
                                </View>
                                <Text style={textStyle}>
                                    {String.fromCharCode(65 + idx)}. {option}
                                </Text>
                            </View>
                            {badge}
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
    optionSelectedMultiple: { borderColor: "#2563EB", backgroundColor: "#EFF6FF" },
    optionCorrect: { borderColor: "#10B981", backgroundColor: "#ECFDF5" },
    optionWrong: { borderColor: "#EF4444", backgroundColor: "#FEF2F2" },
    optionMissing: { borderColor: "#F59E0B", backgroundColor: "#FFFBEB", borderStyle: "dashed" },
    optionRow: { flexDirection: "row", alignItems: "center", gap: 10 },
    radio: {
        width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: "#D1D5DB",
        justifyContent: "center", alignItems: "center",
    },
    radioSelected: { borderColor: "#5D45F9" },
    radioCorrect: { borderColor: "#10B981" },
    radioWrong: { borderColor: "#EF4444" },
    radioMissing: { borderColor: "#F59E0B", borderStyle: "dashed" },
    radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#5D45F9" },
    radioDotCorrect: { backgroundColor: "#10B981" },
    radioDotWrong: { backgroundColor: "#EF4444" },
    checkbox: {
        width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: "#D1D5DB",
        justifyContent: "center", alignItems: "center",
    },
    checkboxSelected: { borderColor: "#2563EB" },
    checkboxCorrect: { borderColor: "#10B981" },
    checkboxWrong: { borderColor: "#EF4444" },
    checkboxMissing: { borderColor: "#F59E0B", borderStyle: "dashed" },
    checkboxInner: { width: 10, height: 10, borderRadius: 2, backgroundColor: "#2563EB" },
    checkboxInnerCorrect: { backgroundColor: "#10B981" },
    checkboxInnerWrong: { backgroundColor: "#EF4444" },
    optionText: { fontSize: 14, fontWeight: "600", color: "#4A5568", flex: 1 },
    textSelected: { color: "#5D45F9" },
    textSelectedMultiple: { color: "#2563EB" },
    textCorrect: { color: "#065F46" },
    textWrong: { color: "#991B1B" },
    textMissing: { color: "#B45309" },
    badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginLeft: 8 },
    badgeCorrect: { backgroundColor: "#D1FAE5" },
    badgeWrong: { backgroundColor: "#FEE2E2" },
    badgeMissing: { backgroundColor: "#FEF3C7" },
    badgeTextCorrect: { fontSize: 11, fontWeight: "700", color: "#065F46" },
    badgeTextWrong: { fontSize: 11, fontWeight: "700", color: "#991B1B" },
    badgeTextMissing: { fontSize: 11, fontWeight: "700", color: "#B45309" },
});
