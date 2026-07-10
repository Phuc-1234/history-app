import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import type {
    QuestionV2,
    FillAnswerData,
    UserFillAnswer,
    QuestionEvalResult,
} from "../types";
import { colors } from "../../../theme/colors";
import typography from "@/theme/typography";
import { formatScore } from "../services/scoreEngine";

interface Props {
    question: QuestionV2;
    userAnswer: UserFillAnswer | null;
    onAnswer: (questionId: number, typedAnswer: string) => void;
    showFeedback?: boolean;
    evalResult?: QuestionEvalResult | null;
    disabled?: boolean;
}

export default function FillQuestion({
    question,
    userAnswer,
    onAnswer,
    showFeedback,
    evalResult,
    disabled,
}: Props) {
    const data = question.answerData as FillAnswerData;
    const [localText, setLocalText] = useState(userAnswer?.typedAnswer ?? "");

    const handleChange = (text: string) => {
        setLocalText(text);
        onAnswer(question.id, text);
    };

    return (
        <Animated.View
            entering={FadeInDown.duration(300)}
            style={styles.container}
        >
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <Text style={styles.label}>Nhập câu trả lời:</Text>
                {showFeedback && evalResult && (
                    <View style={[
                        styles.pointsBadge,
                        evalResult.isCorrect ? styles.pointsBadgeCorrect : styles.pointsBadgeZero
                    ]}>
                        <Text style={evalResult.isCorrect ? styles.pointsBadgeTextCorrect : styles.pointsBadgeTextZero}>
                            {evalResult.isCorrect ? `+${formatScore(evalResult.scoreAwarded)}đ` : "+0đ"}
                        </Text>
                    </View>
                )}
            </View>
            <TextInput
                style={[
                    styles.input,
                    showFeedback &&
                        evalResult?.isCorrect &&
                        styles.inputCorrect,
                    showFeedback &&
                        evalResult &&
                        !evalResult.isCorrect &&
                        styles.inputWrong,
                ]}
                value={localText}
                onChangeText={handleChange}
                placeholder="Nhập câu trả lời của bạn..."
                placeholderTextColor={colors.textPlaceholder}
                editable={!disabled && !(showFeedback && evalResult)}
                returnKeyType="done"
            />
            {showFeedback && evalResult && (
                <Animated.View
                    entering={FadeInDown.delay(100).duration(300)}
                    style={styles.feedbackContainer}
                >
                    <Text style={styles.feedbackLabel}>Đáp án chính xác:</Text>
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
    label: { fontSize: 13, fontFamily: typography.fonts.semiBold, color: colors.textMuted },
    pointsBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 30,
    },
    pointsBadgeCorrect: {
        backgroundColor: colors.successContainer,
    },
    pointsBadgeZero: {
        backgroundColor: colors.surfaceVariant,
    },
    pointsBadgeTextCorrect: {
        fontSize: 11,
        fontFamily: typography.fonts.medium,
        color: colors.textSuccess,
    },
    pointsBadgeTextZero: {
        fontSize: 11,
        fontFamily: typography.fonts.medium,
        color: colors.textMuted,
    },
    input: {
        backgroundColor: colors.surface,
        borderWidth: 1.5,
        borderColor: colors.borderMedium,
        borderRadius: 5,
        padding: 14,
        fontSize: 15,
        fontFamily: typography.fonts.semiBold,
        color: colors.textPrimary,
    },
    inputCorrect: {
        backgroundColor: colors.success,
        borderWidth: 0,
        color: colors.textLight,
    },
    inputWrong: {
        backgroundColor: colors.error,
        borderWidth: 0,
        color: colors.textLight,
    },
    feedbackContainer: {
        backgroundColor: colors.successContainer,
        borderRadius: 5,
        padding: 12,
        flexDirection: "row",
        gap: 8,
        alignItems: "center",
    },
    feedbackLabel: { fontSize: 13, fontFamily: typography.fonts.semiBold, color: colors.textMuted },
    feedbackValue: {
        fontSize: 14,
        fontFamily: typography.fonts.bold,
        color: colors.textSuccess,
        flex: 1,
    },
});
