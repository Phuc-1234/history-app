import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Animated, {
    FadeInLeft,
    FadeInRight,
    FadeInDown,
    useSharedValue,
    useAnimatedStyle,
    withTiming,
} from "react-native-reanimated";
import type {
    QuestionV2,
    MatchAnswerData,
    UserMatchAnswer,
    QuestionEvalResult,
} from "../types";
import { colors } from "../../../theme/colors";
import typography from "@/theme/typography";
import { formatScore } from "../services/scoreEngine";

interface Props {
    question: QuestionV2;
    userAnswer: UserMatchAnswer | null;
    onAnswer: (
        questionId: number,
        pairs: { left: string; right: string }[],
    ) => void;
    showFeedback?: boolean;
    evalResult?: QuestionEvalResult | null;
    disabled?: boolean;
    scoreMultiplier?: number;
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
    { bg: "#3B82F6", border: "#3B82F6", text: "#FFFFFF" }, // Blue
    { bg: "#10B981", border: "#10B981", text: "#FFFFFF" }, // Green
    { bg: "#F59E0B", border: "#F59E0B", text: "#FFFFFF" }, // Yellow/Amber
    { bg: "#A855F7", border: "#A855F7", text: "#FFFFFF" }, // Purple
    { bg: "#EF4444", border: "#EF4444", text: "#FFFFFF" }, // Red
    { bg: "#F97316", border: "#F97316", text: "#FFFFFF" }, // Orange
];

function MatchItem({
    idx,
    item,
    isLeft,
    itemStyle,
    itemTextStyle,
    onPress,
    disabled,
}: {
    idx: number;
    item: string;
    isLeft: boolean;
    itemStyle: any;
    itemTextStyle: any;
    onPress: () => void;
    disabled: boolean;
}) {
    const scale = useSharedValue(1);

    const handlePressIn = () => {
        scale.value = withTiming(0.95, { duration: 100 });
    };

    const handlePressOut = () => {
        scale.value = withTiming(1.0, { duration: 150 });
    };

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: scale.value }],
        };
    });

    const enteringAnim = isLeft
        ? FadeInLeft.delay(idx * 60).duration(300)
        : FadeInRight.delay(idx * 60).duration(300);

    return (
        <Animated.View entering={enteringAnim} style={[animatedStyle, { flex: 1 }]}>
            <TouchableOpacity
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                style={[styles.item, itemStyle]}
                onPress={onPress}
                disabled={disabled}
                activeOpacity={0.9}
            >
                <Text style={[styles.itemText, itemTextStyle]}>{item}</Text>
            </TouchableOpacity>
        </Animated.View>
    );
}

export default function MatchQuestion({
    question,
    userAnswer,
    onAnswer,
    showFeedback,
    evalResult,
    disabled,
    scoreMultiplier = 1,
}: Props) {
    const data = question.answerData as MatchAnswerData;
    const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
    const [selectedRight, setSelectedRight] = useState<string | null>(null);

    const currentPairs = userAnswer?.pairs ?? [];

    const normalizedPairs = React.useMemo(
        () => normalizePairs(data.pairs),
        [data.pairs],
    );
    const leftItems = React.useMemo(
        () => normalizedPairs.map((p) => p.left),
        [normalizedPairs],
    );
    const rightItems = React.useMemo(
        () => normalizedPairs.map((p) => p.right),
        [normalizedPairs],
    );

    const shuffledLeftItems = React.useMemo(() => {
        const items = [...leftItems];
        for (let i = items.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [items[i], items[j]] = [items[j], items[i]];
        }
        return items;
    }, [leftItems, question.id]);

    const shuffledRightItems = React.useMemo(() => {
        const items = [...rightItems];
        for (let i = items.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [items[i], items[j]] = [items[j], items[i]];
        }
        return items;
    }, [rightItems, question.id]);

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
            const filtered = currentPairs.filter(
                (p) => p.left !== left && p.right !== right,
            );
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
            const filtered = currentPairs.filter(
                (p) => p.left !== left && p.right !== right,
            );
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
        return (
            correct?.right.trim().toLowerCase() === right.trim().toLowerCase()
        );
    };

    const getItemStyle = (item: string, isLeft: boolean) => {
        const pairIndex = currentPairs.findIndex((p) =>
            isLeft ? p.left === item : p.right === item,
        );

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

        const isSelected = isLeft
            ? selectedLeft === item
            : selectedRight === item;
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
        const pairIndex = currentPairs.findIndex((p) =>
            isLeft ? p.left === item : p.right === item,
        );

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

        const isSelected = isLeft
            ? selectedLeft === item
            : selectedRight === item;
        if (isSelected) {
            return styles.itemTextActive;
        }

        return null;
    };

    return (
        <View style={styles.container}>
            <Text style={styles.label}>Nối các cặp tương ứng:</Text>

            {/* Unmatched items */}
            <View style={styles.rowsContainer}>
                {Array.from({ length: shuffledLeftItems.length }).map(
                    (_, idx) => (
                        <View key={idx} style={styles.rowWrapper}>
                            <View style={styles.cellContainer}>
                                <MatchItem
                                    idx={idx}
                                    item={shuffledLeftItems[idx]}
                                    isLeft={true}
                                    itemStyle={getItemStyle(
                                        shuffledLeftItems[idx],
                                        true,
                                    )}
                                    itemTextStyle={getItemTextStyle(
                                        shuffledLeftItems[idx],
                                        true,
                                    )}
                                    onPress={() =>
                                        handleLeftPress(shuffledLeftItems[idx])
                                    }
                                    disabled={
                                        !!disabled ||
                                        !!(showFeedback && evalResult)
                                    }
                                />
                            </View>
                            <View style={styles.cellContainer}>
                                <MatchItem
                                    idx={idx}
                                    item={shuffledRightItems[idx]}
                                    isLeft={false}
                                    itemStyle={getItemStyle(
                                        shuffledRightItems[idx],
                                        false,
                                    )}
                                    itemTextStyle={getItemTextStyle(
                                        shuffledRightItems[idx],
                                        false,
                                    )}
                                    onPress={() =>
                                        handleRightPress(
                                            shuffledRightItems[idx],
                                        )
                                    }
                                    disabled={
                                        !!disabled ||
                                        !!(showFeedback && evalResult)
                                    }
                                />
                            </View>
                        </View>
                    ),
                )}
            </View>

            {/* Show correct pairs on feedback */}
            {showFeedback && evalResult && (
                <View style={styles.feedbackContainer}>
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                        <Text style={styles.feedbackTitle}>Kết quả ghép cặp:</Text>
                        <View style={[
                            styles.pointsBadge,
                            evalResult.scoreAwarded > 0 ? styles.pointsBadgeCorrect : styles.pointsBadgeZero
                        ]}>
                            <Text style={evalResult.scoreAwarded > 0 ? styles.pointsBadgeTextCorrect : styles.pointsBadgeTextZero}>
                                {evalResult.scoreAwarded > 0 ? `+${formatScore(evalResult.scoreAwarded * scoreMultiplier)}đ` : "+0đ (Cần đúng tất cả)"}
                            </Text>
                        </View>
                    </View>
                    {normalizedPairs.map((correct, idx) => {
                        const userPair = currentPairs.find(
                            (p) =>
                                p.left?.trim().toLowerCase() ===
                                correct.left.trim().toLowerCase(),
                        );
                        const isPairCorrect =
                            userPair?.right?.trim().toLowerCase() ===
                            correct.right.trim().toLowerCase();

                        return (
                            <Animated.View
                                entering={FadeInDown.delay(idx * 50).duration(
                                    300,
                                )}
                                key={idx}
                                style={[
                                    styles.feedbackRow,
                                    isPairCorrect
                                        ? styles.feedbackCorrect
                                        : styles.feedbackWrong,
                                ]}
                            >
                                <View style={styles.feedbackRowTop}>
                                    <Text style={styles.feedbackLeftText}>
                                        {correct.left}
                                    </Text>
                                    <Text style={styles.feedbackArrow}>→</Text>
                                    {userPair?.right ? (
                                        <Text
                                            style={[
                                                styles.feedbackRightText,
                                                isPairCorrect
                                                    ? styles.textGreen
                                                    : styles.textRed,
                                            ]}
                                        >
                                            {userPair.right}
                                        </Text>
                                    ) : null}
                                    <View
                                        style={[
                                            styles.feedbackBadge,
                                            isPairCorrect
                                                ? styles.badgeCorrect
                                                : styles.badgeWrong,
                                        ]}
                                    >
                                        <Text
                                            style={
                                                isPairCorrect
                                                    ? styles.badgeTextCorrect
                                                    : styles.badgeTextWrong
                                            }
                                        >
                                            {isPairCorrect
                                                ? "Chính xác"
                                                : userPair
                                                  ? "Chưa đúng"
                                                  : "Chưa ghép"}
                                        </Text>
                                    </View>
                                    <View style={[
                                        styles.pointsBadge,
                                        (isPairCorrect && evalResult.scoreAwarded > 0) ? styles.pointsBadgeCorrect : styles.pointsBadgeZero
                                    ]}>
                                        <Text style={(isPairCorrect && evalResult.scoreAwarded > 0) ? styles.pointsBadgeTextCorrect : styles.pointsBadgeTextZero}>
                                            {(isPairCorrect && evalResult.scoreAwarded > 0) ? `+${formatScore(evalResult.scoreAwarded * scoreMultiplier)}đ` : "+0đ"}
                                        </Text>
                                    </View>
                                </View>
                                {!isPairCorrect && (
                                    <View style={styles.feedbackCorrectHintRow}>
                                        <Text style={styles.feedbackHintLabel}>
                                            Đáp án chính xác:{" "}
                                        </Text>
                                        <Text style={styles.feedbackHintValue}>
                                            {correct.right}
                                        </Text>
                                    </View>
                                )}
                            </Animated.View>
                        );
                    })}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { gap: 12 },
    label: { fontSize: 13, fontFamily: typography.fonts.semiBold, color: "#718096" },
    rowsContainer: { gap: 8 },
    rowWrapper: {
        flexDirection: "row",
        alignItems: "stretch",
        gap: 12,
    },
    cellContainer: {
        flex: 1,
    },
    item: {
        flex: 1,
        backgroundColor: "#FFF",
        borderWidth: 1.5,
        borderColor: "#E5E7EB",
        borderRadius: 12,
        padding: 12,
        alignItems: "center",
        justifyContent: "center",
    },
    itemActive: { borderColor: "#5D45F9", backgroundColor: "#F5F3FF" },
    itemSelectable: { borderColor: "#A78BFA", borderStyle: "dashed" },
    itemText: {
        fontSize: 13,
        fontFamily: typography.fonts.semiBold,
        color: "#4A5568",
        textAlign: "center",
    },
    itemTextActive: { color: "#5D45F9" },
    feedbackContainer: {
        backgroundColor: "#FFF",
        borderRadius: 16,
        padding: 16,
        gap: 10,
        borderWidth: 1,
        borderColor: "#EAE7FA",
        marginTop: 12,
    },
    feedbackTitle: {
        fontSize: 14,
        fontFamily: typography.fonts.bold,
        color: "#1C1C1E",
        marginBottom: 6,
    },
    feedbackRow: { borderRadius: 12, padding: 12, borderWidth: 1, gap: 6 },
    feedbackCorrect: { borderColor: "#10B981", backgroundColor: "#ECFDF5" },
    feedbackWrong: { borderColor: "#EF4444", backgroundColor: "#FEF2F2" },
    feedbackRowTop: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        flexWrap: "wrap",
    },
    feedbackLeftText: { fontSize: 13, fontFamily: typography.fonts.semiBold, color: "#4A5568" },
    feedbackArrow: { fontSize: 14, fontFamily: typography.fonts.regular, color: "#718096" },
    feedbackRightText: { fontSize: 13, fontFamily: typography.fonts.bold },
    feedbackBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        marginLeft: "auto",
    },
    feedbackCorrectHintRow: {
        flexDirection: "row",
        alignItems: "center",
        borderTopWidth: 1,
        borderTopColor: "#FEE2E2",
        paddingTop: 6,
        marginTop: 4,
    },
    feedbackHintLabel: { fontSize: 11, fontFamily: typography.fonts.semiBold, color: "#B91C1C" },
    feedbackHintValue: { fontSize: 12, fontFamily: typography.fonts.bold, color: "#065F46" },
    textGreen: { color: "#059669" },
    textRed: { color: "#DC2626" },
    badgeCorrect: { backgroundColor: "#D1FAE5" },
    badgeWrong: { backgroundColor: "#FEE2E2" },
    badgeTextCorrect: { fontSize: 11, fontFamily: typography.fonts.bold, color: "#065F46" },
    badgeTextWrong: { fontSize: 11, fontFamily: typography.fonts.bold, color: "#991B1B" },
    pointsBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 30,
        marginLeft: 8,
    },
    pointsBadgeCorrect: {
        backgroundColor: "#D1FAE5",
    },
    pointsBadgeZero: {
        backgroundColor: "#F3F4F6",
    },
    pointsBadgeTextCorrect: {
        fontSize: 11,
        fontFamily: typography.fonts.medium,
        color: "#065F46",
    },
    pointsBadgeTextZero: {
        fontSize: 11,
        fontFamily: typography.fonts.medium,
        color: "#4B5563",
    },
});
