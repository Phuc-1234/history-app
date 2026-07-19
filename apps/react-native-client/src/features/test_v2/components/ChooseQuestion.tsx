import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native";
import Animated, {
    FadeInLeft,
    useSharedValue,
    useAnimatedStyle,
    withTiming,
} from "react-native-reanimated";
import { Check, X } from "lucide-react-native";
import type {
    QuestionV2,
    ChooseAnswerData,
    UserChooseAnswer,
    QuestionEvalResult,
} from "../types";
import { isSingleChoice, formatScore } from "../services/scoreEngine";
import { colors } from "../../../theme/colors";
import typography from "@/theme/typography";

interface Props {
    question: QuestionV2;
    userAnswer: UserChooseAnswer | null;
    onAnswer: (questionId: number, selectedOptions: number[]) => void;
    showFeedback?: boolean;
    evalResult?: QuestionEvalResult | null;
    disabled?: boolean;
}

function ChooseOptionItem({
    idx,
    originalIdx,
    option,
    isSelected,
    isCorrect,
    showCorrect,
    single,
    disabled,
    handlePress,
    optStyle,
    textStyle,
    badge,
}: {
    idx: number;
    originalIdx: number;
    option: string;
    isSelected: boolean;
    isCorrect: boolean;
    showCorrect: boolean;
    single: boolean;
    disabled: boolean;
    handlePress: (index: number) => void;
    optStyle: any[];
    textStyle: any[];
    badge: React.ReactNode;
}) {
    const scale = useSharedValue(1);

    const handlePressIn = () => {
        scale.value = withTiming(0.96, { duration: 100 });
    };

    const handlePressOut = () => {
        scale.value = withTiming(1.0, { duration: 150 });
    };

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: scale.value }],
        };
    });

    return (
        <Animated.View
            entering={FadeInLeft.delay(idx * 60).duration(300)}
            style={animatedStyle}
        >
            <TouchableOpacity
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                style={optStyle}
                onPress={() => handlePress(originalIdx)}
                disabled={disabled}
                activeOpacity={0.9}
            >
                <View
                    style={[
                        styles.optionRow,
                        { justifyContent: "space-between" },
                    ]}
                >
                    <View
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 10,
                            flex: 1,
                        }}
                    >
                        <View
                            style={[
                                single ? styles.radio : styles.checkbox,
                                isSelected &&
                                    (single
                                        ? styles.radioSelected
                                        : styles.checkboxSelected),
                                showCorrect &&
                                    isSelected &&
                                    isCorrect &&
                                    (single
                                        ? styles.radioCorrect
                                        : styles.checkboxCorrect),
                                showCorrect &&
                                    isSelected &&
                                    !isCorrect &&
                                    (single
                                        ? styles.radioWrong
                                        : styles.checkboxWrong),
                                showCorrect &&
                                    !isSelected &&
                                    isCorrect &&
                                    (single
                                        ? styles.radioMissing
                                        : styles.checkboxMissing),
                            ]}
                        >
                            {isSelected &&
                                (showCorrect && !isCorrect ? (
                                    <X
                                        size={12}
                                        color={colors.textLight}
                                        strokeWidth={4}
                                    />
                                ) : single ? (
                                    <View
                                        style={[
                                            styles.radioDot,
                                            showCorrect &&
                                                isCorrect &&
                                                styles.radioDotCorrect,
                                        ]}
                                    />
                                ) : (
                                    <Check
                                        size={12}
                                        color={colors.textLight}
                                        strokeWidth={4}
                                    />
                                ))}
                        </View>
                        <Text style={textStyle}>
                            {String.fromCharCode(65 + idx)}. {option}
                        </Text>
                    </View>
                    {badge}
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
}

export default function ChooseQuestion({
    question,
    userAnswer,
    onAnswer,
    showFeedback,
    evalResult,
    disabled,
}: Props) {
    const data = question.answerData as ChooseAnswerData;
    const single = isSingleChoice(question);
    const selectedOptions = userAnswer?.selectedOptions ?? [];

    const displayOrder = React.useMemo(() => {
        const indices = data.options.map((_, i) => i);
        for (let i = indices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [indices[i], indices[j]] = [indices[j], indices[i]];
        }
        return indices;
    }, [data.options, question.id]);

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
                {single ? "Chọn một đáp án:" : "Chọn 1-4 đáp án:"}
            </Text>
            {displayOrder.map((originalIdx, displayIdx) => {
                const option = data.options[originalIdx];
                const isSelected = selectedOptions.includes(originalIdx);
                const isCorrect = data.correctOption.includes(originalIdx);
                const showCorrect = !!(showFeedback && evalResult);

                let optStyle: any[] = [styles.option];
                let textStyle: any[] = [styles.optionText];
                let badge = null;

                const correctCount = data.correctOption.length;
                const totalOptions = data.options.length;
                const maxScore = single ? 0.25 : (totalOptions === 0 ? 0 : Math.max(0.25, Math.floor(totalOptions / 2) * 0.25));
                const incorrectCount = totalOptions - correctCount;
                const correctScorePerItem = correctCount > 0 ? maxScore / correctCount : 0;
                const incorrectPenaltyPerItem = incorrectCount > 0 ? maxScore / incorrectCount : 0;

                if (showCorrect) {
                    let pointsText = "";
                    let pointsBadgeStyle = styles.pointsBadgeZero;
                    let pointsTextStyle = styles.pointsBadgeTextZero;

                    if (isSelected) {
                        if (isCorrect) {
                            pointsText = `+${formatScore(correctScorePerItem)}đ`;
                            pointsBadgeStyle = styles.pointsBadgeCorrect;
                            pointsTextStyle = styles.pointsBadgeTextCorrect;
                        } else {
                            const penalty = single ? 0 : incorrectPenaltyPerItem;
                            if (penalty > 0) {
                                pointsText = `-${formatScore(penalty)}đ`;
                                pointsBadgeStyle = styles.pointsBadgeWrong;
                                pointsTextStyle = styles.pointsBadgeTextWrong;
                            } else {
                                pointsText = "+0đ";
                            }
                        }
                    } else {
                        pointsText = "+0đ";
                    }

                    if (isSelected && isCorrect) {
                        optStyle.push(styles.optionCorrect);
                        textStyle.push(styles.textCorrect);
                        badge = (
                            <View style={[styles.pointsBadge, pointsBadgeStyle]}>
                                <Text style={pointsTextStyle}>{pointsText}</Text>
                            </View>
                        );
                    } else if (isSelected && !isCorrect) {
                        optStyle.push(styles.optionWrong);
                        textStyle.push(styles.textWrong);
                        badge = (
                            <View style={[styles.pointsBadge, pointsBadgeStyle]}>
                                <Text style={pointsTextStyle}>{pointsText}</Text>
                            </View>
                        );
                    } else if (!isSelected && isCorrect) {
                        optStyle.push(styles.optionMissing);
                        textStyle.push(styles.textMissing);
                        badge = (
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                                <View style={[styles.pointsBadge, pointsBadgeStyle]}>
                                    <Text style={pointsTextStyle}>{pointsText}</Text>
                                </View>
                                <View style={[styles.badge, styles.badgeMissing]}>
                                    <Text style={styles.badgeTextMissing}>
                                        Bỏ lỡ
                                    </Text>
                                </View>
                            </View>
                        );
                    } else {
                        badge = (
                            <View style={[styles.pointsBadge, pointsBadgeStyle]}>
                                <Text style={pointsTextStyle}>{pointsText}</Text>
                            </View>
                        );
                    }
                } else if (isSelected) {
                    optStyle.push(
                        single
                            ? styles.optionSelected
                            : styles.optionSelectedMultiple,
                    );
                    textStyle.push(
                        single
                            ? styles.textSelected
                            : styles.textSelectedMultiple,
                    );
                }

                return (
                    <ChooseOptionItem
                        key={originalIdx}
                        idx={displayIdx}
                        originalIdx={originalIdx}
                        option={option}
                        isSelected={isSelected}
                        isCorrect={isCorrect}
                        showCorrect={showCorrect}
                        single={single}
                        disabled={!!disabled || !!(showFeedback && evalResult)}
                        handlePress={handlePress}
                        optStyle={optStyle}
                        textStyle={textStyle}
                        badge={badge}
                    />
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { gap: 10 },
    label: {
        fontSize: 13,
        fontFamily: typography.fonts.semiBold,
        color: colors.textMuted,
        marginBottom: 4,
    },
    option: {
        backgroundColor: colors.surface,
        borderWidth: 1.5,
        borderColor: colors.borderMedium,
        borderRadius: 5,
        padding: 14,
    },
    optionSelected: { backgroundColor: colors.primary, borderWidth: 0 },
    optionSelectedMultiple: { backgroundColor: colors.primary, borderWidth: 0 },
    optionCorrect: { backgroundColor: colors.success, borderWidth: 0 },
    optionWrong: { backgroundColor: colors.error, borderWidth: 0 },
    optionMissing: {
        borderColor: colors.warning,
        backgroundColor: colors.warningContainer,
        borderStyle: "dashed",
    },
    optionRow: { flexDirection: "row", alignItems: "center", gap: 10 },
    radio: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: colors.borderDark,
        justifyContent: "center",
        alignItems: "center",
    },
    radioSelected: { borderColor: colors.textLight },
    radioCorrect: { borderColor: colors.textLight },
    radioWrong: { borderColor: colors.textLight },
    radioMissing: { borderColor: colors.warning, borderStyle: "dashed" },
    radioDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: colors.textLight,
    },
    radioDotCorrect: { backgroundColor: colors.textLight },
    radioDotWrong: { backgroundColor: colors.textLight },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: colors.borderDark,
        justifyContent: "center",
        alignItems: "center",
    },
    checkboxSelected: { borderColor: colors.textLight },
    checkboxCorrect: { borderColor: colors.textLight },
    checkboxWrong: { borderColor: colors.textLight },
    checkboxMissing: { borderColor: colors.warning, borderStyle: "dashed" },
    checkboxInner: {
        width: 10,
        height: 10,
        borderRadius: 2,
        backgroundColor: colors.info,
    },
    checkboxInnerCorrect: { backgroundColor: colors.success },
    checkboxInnerWrong: { backgroundColor: colors.error },
    optionText: {
        fontSize: 14,
        fontFamily: typography.fonts.semiBold,
        color: colors.textSecondary,
        flex: 1,
        textAlign: (Platform.OS === "ios" ? "justify" : "left") as "justify" | "left",
    },
    textSelected: { color: colors.textLight },
    textSelectedMultiple: { color: colors.textLight },
    textCorrect: { color: colors.textLight },
    textWrong: { color: colors.textLight },
    textMissing: { color: colors.textWarning },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 5,
        marginLeft: 8,
    },
    pointsBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 30,
        marginLeft: 8,
    },
    pointsBadgeCorrect: {
        backgroundColor: colors.successContainer,
    },
    pointsBadgeWrong: {
        backgroundColor: colors.errorContainer,
    },
    pointsBadgeZero: {
        backgroundColor: colors.surfaceVariant,
    },
    pointsBadgeTextCorrect: {
        fontSize: 11,
        fontFamily: typography.fonts.medium,
        color: colors.textSuccess,
    },
    pointsBadgeTextWrong: {
        fontSize: 11,
        fontFamily: typography.fonts.medium,
        color: colors.textError,
    },
    pointsBadgeTextZero: {
        fontSize: 11,
        fontFamily: typography.fonts.medium,
        color: colors.textMuted,
    },
    badgeCorrect: { backgroundColor: colors.successContainer },
    badgeWrong: { backgroundColor: colors.errorContainer },
    badgeMissing: { backgroundColor: colors.warningContainer },
    badgeTextCorrect: {
        fontSize: 11,
        fontFamily: typography.fonts.bold,
        color: colors.textSuccess,
    },
    badgeTextWrong: {
        fontSize: 11,
        fontFamily: typography.fonts.bold,
        color: colors.textError,
    },
    badgeTextMissing: {
        fontSize: 11,
        fontFamily: typography.fonts.bold,
        color: colors.textWarning,
    },
});
