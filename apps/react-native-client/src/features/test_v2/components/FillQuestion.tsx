import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import type { QuestionV2, FillAnswerData, UserFillAnswer, QuestionEvalResult } from "../types";

interface Props {
    question: QuestionV2;
    userAnswer: UserFillAnswer | null;
    onAnswer: (questionId: number, typedAnswer: string) => void;
    showFeedback?: boolean;
    evalResult?: QuestionEvalResult | null;
    disabled?: boolean;
}

export default function FillQuestion({ question, userAnswer, onAnswer, showFeedback, evalResult, disabled }: Props) {
    const data = question.answerData as FillAnswerData;
    const [localText, setLocalText] = useState(userAnswer?.typedAnswer ?? "");

    const handleChange = (text: string) => {
        setLocalText(text);
        onAnswer(question.id, text);
    };

    return (
        <Animated.View entering={FadeInDown.duration(300)} style={styles.container}>
            <Text style={styles.label}>Nhập câu trả lời:</Text>
            <TextInput
                style={[
                    styles.input,
                    showFeedback && evalResult?.isCorrect && styles.inputCorrect,
                    showFeedback && evalResult && !evalResult.isCorrect && styles.inputWrong,
                ]}
                value={localText}
                onChangeText={handleChange}
                placeholder="Nhập câu trả lời của bạn..."
                placeholderTextColor="#A0AEC0"
                editable={!disabled && !(showFeedback && evalResult)}
                returnKeyType="done"
            />
            {showFeedback && evalResult && !evalResult.isCorrect && (
                <Animated.View entering={FadeInDown.delay(100).duration(300)} style={styles.feedbackContainer}>
                    <Text style={styles.feedbackLabel}>Đáp án đúng:</Text>
                    <Text style={styles.feedbackValue}>
                        {data.acceptedAnswers.join(" / ")}
                    </Text>
                </Animated.View>
            )}
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: { gap: 10 },
    label: { fontSize: 13, fontWeight: "600", color: "#718096" },
    input: {
        backgroundColor: "#FFF",
        borderWidth: 1.5,
        borderColor: "#E5E7EB",
        borderRadius: 16,
        padding: 14,
        fontSize: 15,
        fontWeight: "600",
        color: "#2D3748",
    },
    inputCorrect: { borderColor: "#10B981", backgroundColor: "#ECFDF5" },
    inputWrong: { borderColor: "#EF4444", backgroundColor: "#FEF2F2" },
    feedbackContainer: {
        backgroundColor: "#ECFDF5",
        borderRadius: 12,
        padding: 12,
        flexDirection: "row",
        gap: 8,
        alignItems: "center",
    },
    feedbackLabel: { fontSize: 13, fontWeight: "600", color: "#718096" },
    feedbackValue: { fontSize: 14, fontWeight: "700", color: "#059669", flex: 1 },
});
