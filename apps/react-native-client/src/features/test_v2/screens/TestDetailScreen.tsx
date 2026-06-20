import React from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useGetAttemptDetailQuery } from "../services/testApi";
import { formatScore } from "../services/scoreEngine";
import type {
    ChooseAnswerData,
    FillAnswerData,
    MatchAnswerData,
    UserChooseAnswer,
    UserFillAnswer,
    UserMatchAnswer,
} from "../types";
import { colors } from "../../../theme/colors";
import Mascot from "@/components/Mascot";
import { Check, X } from "lucide-react-native";

export default function TestDetailScreen() {
    const { logId } = useLocalSearchParams<{ logId: string }>();
    const { data, isLoading, error } = useGetAttemptDetailQuery(
        { logId: logId ?? "" },
        { skip: !logId },
    );

    if (isLoading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (error || !data) {
        return (
            <View style={styles.center}>
                <Text style={styles.errorText}>
                    Không thể tải chi tiết lượt làm bài
                </Text>
            </View>
        );
    }

    const { userTestLog, answerLogs } = data;
    const scoreDisplay =
        userTestLog.maxScore > 0
            ? formatScore(
                  (userTestLog.scoreAwarded / userTestLog.maxScore) * 10,
              )
            : "0";

    const date = new Date(userTestLog.startedAt);
    const dateStr = `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()} ${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;

    return (
        <View style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Result Card */}
                <View style={styles.bannerCard}>
                    <Mascot expression={userTestLog.isPassed ? "happy" : "sad"} />
                    <View style={styles.scoreRow}>
                        <Text style={styles.bannerScore}>{scoreDisplay}</Text>
                        <Text style={styles.bannerScoreMax}>/10</Text> 
                    </View>
                    <Text style={styles.bannerSubtext}>
                        {userTestLog.isPassed
                            ? "Đạt"
                            : "Chưa đạt"}{" "}
                        • Lần {userTestLog.attemptNumber}
                    </Text>
                    <Text style={styles.bannerDate}>{dateStr}</Text>
                </View>

                <Text style={styles.sectionTitle}>Chi tiết câu hỏi</Text>

                {answerLogs.map((log, idx) => {
                    const question = log.question;
                    const isCorrect = log.scoreAwarded >= log.maxScore;

                    return (
                        <View key={idx} style={styles.questionCard}>
                            <View style={styles.qHeader}>
                                <Text style={styles.qIndex}>
                                    CÂU HỎI {idx + 1}
                                </Text>
                                <View
                                    style={[
                                        styles.qBadge,
                                        isCorrect
                                            ? styles.qBadgeCorrect
                                            : styles.qBadgeWrong,
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.qBadgeText,
                                            isCorrect
                                                ? styles.qBadgeTextCorrect
                                                : styles.qBadgeTextWrong,
                                        ]}
                                    >
                                        {isCorrect
                                            ? "ĐÚNG"
                                            : log.userAnswerData === null
                                              ? "CHƯA GHÉP"
                                              : "SAI"}
                                    </Text>
                                </View>
                            </View>

                            <Text style={styles.qPrompt}>
                                {question.promptText}
                            </Text>

                            {/* Render answer details based on type */}
                            {question.type === "CHOOSE" && (
                                <ChooseReview
                                    question={question}
                                    userAnswer={
                                        log.userAnswerData as UserChooseAnswer
                                    }
                                    correctAnswer={
                                        log.correctAnswerData as ChooseAnswerData
                                    }
                                />
                            )}

                            {question.type === "FILL" && (
                                <FillReview
                                    userAnswer={
                                        log.userAnswerData as UserFillAnswer
                                    }
                                    correctAnswer={
                                        log.correctAnswerData as FillAnswerData
                                    }
                                    isCorrect={isCorrect}
                                />
                            )}

                            {question.type === "MATCH" && (
                                <MatchReview
                                    userAnswer={
                                        log.userAnswerData as UserMatchAnswer
                                    }
                                    correctAnswer={
                                        log.correctAnswerData as MatchAnswerData
                                    }
                                />
                            )}

                            {/* Explanation */}
                            {question.explanation && (
                                <View style={styles.explBox}>
                                    <Text style={styles.explLabel}>
                                        GIẢI THÍCH:
                                    </Text>
                                    <Text style={styles.explText}>
                                        {question.explanation}
                                    </Text>
                                </View>
                            )}
                        </View>
                    );
                })}
            </ScrollView>
        </View>
    );
}

// ─── HELPER REVIEW COMPONENTS ────────────────────────────────────────────────

function ChooseReview({
    question,
    userAnswer,
    correctAnswer,
}: {
    question: any;
    userAnswer: UserChooseAnswer | null;
    correctAnswer: ChooseAnswerData;
}) {
    const selected = userAnswer?.selectedOptions ?? [];
    const correct = correctAnswer.correctOption ?? [];
    const single = correct.length <= 1;

    return (
        <View style={styles.optionsList}>
            {correctAnswer.options.map((opt, idx) => {
                const isSelected = selected.includes(idx);
                const isCorrect = correct.includes(idx);

                let itemStyle: any[] = [styles.optItem];
                let textStyle: any[] = [styles.optText];
                let badge = null;

                if (isSelected && isCorrect) {
                    itemStyle.push(styles.optCorrect);
                    textStyle.push(styles.optTextCorrect);
                } else if (isSelected && !isCorrect) {
                    itemStyle.push(styles.optWrong);
                    textStyle.push(styles.optTextWrong);
                } else if (!isSelected && isCorrect) {
                    itemStyle.push(styles.optMissing);
                    textStyle.push(styles.optTextMissing);
                    badge = (
                        <View
                            style={[
                                styles.reviewBadge,
                                styles.reviewBadgeMissing,
                            ]}
                        >
                            <Text style={styles.reviewBadgeTextMissing}>
                                Đáp án đúng bỏ lỡ
                            </Text>
                        </View>
                    );
                }

                return (
                    <View
                        key={idx}
                        style={[
                            itemStyle,
                            {
                                flexDirection: "row",
                                justifyContent: "space-between",
                                alignItems: "center",
                            },
                        ]}
                    >
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
                            <View style={[
                                single ? styles.radio : styles.checkbox,
                                isSelected && (single ? styles.radioSelected : styles.checkboxSelected),
                                isSelected && isCorrect && (single ? styles.radioCorrect : styles.checkboxCorrect),
                                isSelected && !isCorrect && (single ? styles.radioWrong : styles.checkboxWrong),
                                !isSelected && isCorrect && (single ? styles.radioMissing : styles.checkboxMissing),
                            ]}>
                                {isSelected && (
                                    !isCorrect ? (
                                        <X
                                            size={12}
                                            color={colors.textLight}
                                            strokeWidth={4}
                                        />
                                    ) : single ? (
                                        <View style={[
                                            styles.radioDot,
                                            isCorrect && styles.radioDotCorrect,
                                        ]} />
                                    ) : (
                                        <Check
                                            size={12}
                                            color={colors.textLight}
                                            strokeWidth={4}
                                        />
                                    )
                                )}
                            </View>
                            <Text style={[textStyle, { flex: 1 }]}>
                                {String.fromCharCode(65 + idx)}. {opt}
                            </Text>
                        </View>
                        {badge}
                    </View>
                );
            })}
        </View>
    );
}

function FillReview({
    userAnswer,
    correctAnswer,
    isCorrect,
}: {
    userAnswer: UserFillAnswer | null;
    correctAnswer: FillAnswerData;
    isCorrect: boolean;
}) {
    return (
        <View style={styles.fillContainer}>
            <View style={styles.fillRow}>
                <Text style={styles.fillLabel}>Bạn nhập:</Text>
                <Text
                    style={[
                        styles.fillValue,
                        isCorrect ? styles.textGreen : styles.textRed,
                    ]}
                >
                    {userAnswer?.typedAnswer || "(Bỏ trống)"}
                </Text>
            </View>
            {!isCorrect && (
                <View style={styles.fillRow}>
                    <Text style={styles.fillLabel}>Đáp án chấp nhận:</Text>
                    <Text style={[styles.fillValue, styles.textGreen]}>
                        {correctAnswer.acceptedAnswers.join(" / ")}
                    </Text>
                </View>
            )}
        </View>
    );
}

function MatchReview({
    userAnswer,
    correctAnswer,
}: {
    userAnswer: UserMatchAnswer | null;
    correctAnswer: MatchAnswerData;
}) {
    const userPairs = userAnswer?.pairs ?? [];
    const rawCorrectPairs = correctAnswer.pairs ?? [];
    const correctPairs = rawCorrectPairs.map((p: any) => {
        if (!p) return { left: "", right: "" };
        if (typeof p.left === "string" && typeof p.right === "string") return p;
        const keys = Object.keys(p);
        const left = keys[0] ?? "";
        const right = typeof p[left] === "string" ? p[left] : "";
        return { left, right };
    });

    return (
        <View style={styles.matchReviewContainer}>
            {correctPairs.map((pair, idx) => {
                const userPair = userPairs.find(
                    (p) =>
                        p.left?.trim().toLowerCase() ===
                        pair.left.trim().toLowerCase(),
                );
                const isPairCorrect =
                    userPair?.right?.trim().toLowerCase() ===
                    pair.right.trim().toLowerCase();

                return (
                    <View
                        key={idx}
                        style={[
                            styles.matchReviewRow,
                            isPairCorrect
                                ? styles.matchReviewCorrect
                                : styles.matchReviewWrong,
                        ]}
                    >
                        <View style={styles.matchReviewRowTop}>
                            <Text style={[styles.matchReviewLeftText, styles.textLight]}>
                                {pair.left}
                            </Text>
                            <Text style={[styles.matchReviewArrow, styles.textLight]}>→</Text>
                            <Text
                                style={[
                                    styles.matchReviewRightText,
                                    styles.textLight,
                                ]}
                            >
                                {userPair?.right ?? "(Chưa ghép)"}
                            </Text>
                            <View
                                style={[
                                    styles.reviewBadge,
                                    isPairCorrect
                                        ? styles.reviewBadgeCorrect
                                        : styles.reviewBadgeWrong,
                                ]}
                            >
                                <Text
                                    style={
                                        isPairCorrect
                                            ? styles.reviewBadgeTextCorrect
                                            : styles.reviewBadgeTextWrong
                                    }
                                >
                                    {isPairCorrect
                                        ? "Đúng"
                                        : userPair
                                          ? "Sai"
                                          : "Chưa ghép"}
                                </Text>
                            </View>
                        </View>
                        {!isPairCorrect && (
                            <View style={styles.matchReviewCorrectHintRow}>
                                <Text style={styles.matchReviewHintLabel}>
                                    Đáp án đúng:{" "}
                                </Text>
                                <Text style={styles.matchReviewHintValue}>
                                    {pair.right}
                                </Text>
                            </View>
                        )}
                    </View>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { padding: 16, paddingBottom: 40 },
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 40,
    },
    errorText: { fontSize: 15, color: colors.textError, fontWeight: "600" },
    bannerCard: {
        backgroundColor: colors.surface,
        borderRadius: 5,
        padding: 24,
        alignItems: "center",
        borderWidth: 1,
        borderColor: colors.borderMedium,
        marginBottom: 24,
    },
    bannerEmoji: { fontSize: 40, marginBottom: 8 },
    scoreRow: { flexDirection: "row", alignItems: "baseline" },
    bannerScore: { fontSize: 40, fontWeight: "900", color: colors.primary },
    bannerScoreMax: {
        fontSize: 18,
        fontWeight: "700",
        color: colors.textMuted,
        marginLeft: 2,
    },
    bannerSubtext: {
        fontSize: 13,
        color: colors.textMuted,
        fontWeight: "600",
        marginTop: 4,
    },
    bannerDate: { fontSize: 12, color: colors.textPlaceholder, marginTop: 4 },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "800",
        color: colors.textPrimary,
        marginBottom: 14,
    },
    questionCard: {
        backgroundColor: colors.surface,
        borderRadius: 5,
        padding: 16,
        borderWidth: 1,
        borderColor: colors.borderMedium,
        marginBottom: 12,
    },
    qHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 10,
    },
    qIndex: { fontSize: 12, fontWeight: "800", color: colors.textPlaceholder },
    qBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 5 },
    qBadgeCorrect: { backgroundColor: colors.successContainer },
    qBadgeWrong: { backgroundColor: colors.errorContainer },
    qBadgeText: { fontSize: 11, fontWeight: "800" },
    qBadgeTextCorrect: { color: colors.textSuccess },
    qBadgeTextWrong: { color: colors.textError },
    qPrompt: {
        fontSize: 15,
        fontWeight: "700",
        color: colors.textSecondary,
        lineHeight: 22,
        marginBottom: 12,
    },
    optionsList: { gap: 8 },
    optItem: {
        backgroundColor: colors.surface,
        borderWidth: 1.5,
        borderColor: colors.borderMedium,
        borderRadius: 5,
        padding: 12,
    },
    optCorrect: {
        backgroundColor: colors.success,
        borderWidth: 0,
    },
    optWrong: {
        backgroundColor: colors.error,
        borderWidth: 0,
    },
    optMissing: {
        borderColor: colors.warning,
        backgroundColor: colors.warningContainer,
        borderStyle: "dashed",
    },
    optText: { fontSize: 14, fontWeight: "600", color: colors.textSecondary },
    optTextCorrect: { color: colors.textLight },
    optTextWrong: { color: colors.textLight },
    optTextMissing: { color: colors.textWarning },
    fillContainer: {
        backgroundColor: colors.surfaceVariant,
        borderRadius: 5,
        padding: 12,
        gap: 8,
    },
    fillRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    fillLabel: { fontSize: 13, fontWeight: "600", color: colors.textMuted },
    fillValue: { fontSize: 14, fontWeight: "700" },
    textGreen: { color: colors.success },
    textRed: { color: colors.error },
    textLight: { color: colors.textLight },
    reviewBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 5,
        marginLeft: 8,
    },
    reviewBadgeCorrect: { backgroundColor: colors.successContainer },
    reviewBadgeWrong: { backgroundColor: colors.errorContainer },
    reviewBadgeMissing: { backgroundColor: colors.warningContainer },
    reviewBadgeTextCorrect: {
        fontSize: 11,
        fontWeight: "700",
        color: colors.textSuccess,
    },
    reviewBadgeTextWrong: {
        fontSize: 11,
        fontWeight: "700",
        color: colors.textError,
    },
    reviewBadgeTextMissing: {
        fontSize: 11,
        fontWeight: "700",
        color: colors.textWarning,
    },
    matchReviewContainer: { gap: 8, marginTop: 4 },
    matchReviewRow: { borderRadius: 5, padding: 12, borderWidth: 1, gap: 6 },
    matchReviewCorrect: {
        backgroundColor: colors.success,
        borderWidth: 0,
    },
    matchReviewWrong: {
        backgroundColor: colors.error,
        borderWidth: 0,
    },
    matchReviewRowTop: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        flexWrap: "wrap",
    },
    matchReviewLeftText: {
        fontSize: 13,
        fontWeight: "600",
        color: colors.textSecondary,
    },
    matchReviewArrow: { fontSize: 14, color: colors.textMuted },
    matchReviewRightText: { fontSize: 13, fontWeight: "700" },
    matchReviewCorrectHintRow: {
        flexDirection: "row",
        alignItems: "center",
        borderTopWidth: 1,
        borderTopColor: "rgba(255, 255, 255, 0.3)",
        paddingTop: 6,
        marginTop: 4,
    },
    matchReviewHintLabel: {
        fontSize: 11,
        fontWeight: "600",
        color: colors.textLight,
        opacity: 0.8,
    },
    matchReviewHintValue: {
        fontSize: 12,
        fontWeight: "700",
        color: colors.textLight,
    },
    explBox: {
        marginTop: 12,
        borderRadius: 5,
        padding: 12,
        borderWidth: 1,
        borderColor: colors.success,
    },
    explLabel: {
        fontSize: 12,
        fontWeight: "800",
        color: colors.textSuccess,
        marginBottom: 4,
    },
    explText: { fontSize: 13, color: colors.textSuccess, lineHeight: 20 },
    radio: {
        width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.borderDark,
        justifyContent: "center", alignItems: "center",
    },
    radioSelected: { borderColor: colors.textLight },
    radioCorrect: { borderColor: colors.textLight },
    radioWrong: { borderColor: colors.textLight },
    radioMissing: { borderColor: colors.warning, borderStyle: "dashed" },
    radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.textLight },
    radioDotCorrect: { backgroundColor: colors.textLight },
    radioDotWrong: { backgroundColor: colors.textLight },
    checkbox: {
        width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: colors.borderDark,
        justifyContent: "center", alignItems: "center",
    },
    checkboxSelected: { borderColor: colors.textLight },
    checkboxCorrect: { borderColor: colors.textLight },
    checkboxWrong: { borderColor: colors.textLight },
    checkboxMissing: { borderColor: colors.warning, borderStyle: "dashed" },
});
