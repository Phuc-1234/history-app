import React from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useGetAttemptDetailQuery } from "../services/testApi";
import type { ChooseAnswerData, FillAnswerData, MatchAnswerData, UserChooseAnswer, UserFillAnswer, UserMatchAnswer } from "../types";

export default function TestDetailScreen() {
    const { logId } = useLocalSearchParams<{ logId: string }>();
    const { data, isLoading, error } = useGetAttemptDetailQuery({ logId: logId ?? "" }, { skip: !logId });

    if (isLoading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#5D45F9" />
            </View>
        );
    }

    if (error || !data) {
        return (
            <View style={styles.center}>
                <Text style={styles.errorText}>Không thể tải chi tiết lượt làm bài</Text>
            </View>
        );
    }

    const { userTestLog, answerLogs } = data;
    const scoreDisplay = userTestLog.maxScore > 0
        ? ((userTestLog.scoreAwarded / userTestLog.maxScore) * 10).toFixed(2)
        : "0.00";

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Summary banner */}
            <View style={styles.bannerCard}>
                <Text style={styles.bannerEmoji}>{userTestLog.isPassed ? "🎉" : "📝"}</Text>
                <View style={styles.scoreRow}>
                    <Text style={styles.bannerScore}>{scoreDisplay}</Text>
                    <Text style={styles.bannerScoreMax}>/10</Text>
                </View>
                <Text style={styles.bannerSubtext}>
                    {userTestLog.scoreAwarded.toFixed(2)}/{userTestLog.maxScore.toFixed(2)} điểm • Lần {userTestLog.attemptNumber}
                </Text>
                <Text style={styles.bannerDate}>
                    {new Date(userTestLog.startedAt).toLocaleString("vi-VN")}
                </Text>
            </View>

            {/* Questions */}
            <Text style={styles.sectionTitle}>Chi tiết câu hỏi</Text>
            {answerLogs.map((log, idx) => (
                <View key={log.questionId} style={styles.questionCard}>
                    <View style={styles.qHeader}>
                        <Text style={styles.qIndex}>Câu {idx + 1}</Text>
                        <View style={[styles.qBadge, log.scoreAwarded >= log.maxScore ? styles.qBadgeCorrect : styles.qBadgeWrong]}>
                            <Text style={[styles.qBadgeText, log.scoreAwarded >= log.maxScore ? styles.qBadgeTextCorrect : styles.qBadgeTextWrong]}>
                                {log.scoreAwarded.toFixed(2)}/{log.maxScore.toFixed(2)}
                            </Text>
                        </View>
                    </View>
                    <Text style={styles.qPrompt}>{log.question.promptText}</Text>

                    {/* Render based on type */}
                    {log.type === "CHOOSE" && (
                        <ChooseReview
                            answerData={log.correctAnswerData as ChooseAnswerData}
                            userAnswer={log.userAnswerData as UserChooseAnswer | null}
                        />
                    )}
                    {log.type === "FILL" && (
                        <FillReview
                            answerData={log.correctAnswerData as FillAnswerData}
                            userAnswer={log.userAnswerData as UserFillAnswer | null}
                        />
                    )}
                    {log.type === "MATCH" && (
                        <MatchReview
                            answerData={log.correctAnswerData as MatchAnswerData}
                            userAnswer={log.userAnswerData as UserMatchAnswer | null}
                        />
                    )}

                    {log.question.explanation && (
                        <View style={styles.explBox}>
                            <Text style={styles.explLabel}>Giải thích:</Text>
                            <Text style={styles.explText}>{log.question.explanation}</Text>
                        </View>
                    )}
                </View>
            ))}
        </ScrollView>
    );
}

// ── Sub-components for review ────────────────────────────────────────

function ChooseReview({ answerData, userAnswer }: { answerData: ChooseAnswerData; userAnswer: UserChooseAnswer | null }) {
    const selected = userAnswer?.selectedOptions ?? [];
    return (
        <View style={styles.optionsList}>
            {answerData.options.map((opt, idx) => {
                const isSelected = selected.includes(idx);
                const isCorrect = answerData.correctOption.includes(idx);

                let optStyle: any[] = [styles.optItem];
                let textStyle: any[] = [styles.optText];
                let badge = null;

                if (isSelected && isCorrect) {
                    optStyle.push(styles.optCorrect);
                    textStyle.push(styles.optTextCorrect);
                    badge = (
                        <View style={[styles.reviewBadge, styles.reviewBadgeCorrect]}>
                            <Text style={styles.reviewBadgeTextCorrect}>Đúng</Text>
                        </View>
                    );
                } else if (isSelected && !isCorrect) {
                    optStyle.push(styles.optWrong);
                    textStyle.push(styles.optTextWrong);
                    badge = (
                        <View style={[styles.reviewBadge, styles.reviewBadgeWrong]}>
                            <Text style={styles.reviewBadgeTextWrong}>Sai</Text>
                        </View>
                    );
                } else if (!isSelected && isCorrect) {
                    optStyle.push(styles.optMissing);
                    textStyle.push(styles.optTextMissing);
                    badge = (
                        <View style={[styles.reviewBadge, styles.reviewBadgeMissing]}>
                            <Text style={styles.reviewBadgeTextMissing}>Đáp án đúng</Text>
                        </View>
                    );
                }

                return (
                    <View key={idx} style={[...optStyle, { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }]}>
                        <Text style={[...textStyle, { flex: 1 }]}>
                            {String.fromCharCode(65 + idx)}. {opt}
                        </Text>
                        {badge}
                    </View>
                );
            })}
        </View>
    );
}

function FillReview({ answerData, userAnswer }: { answerData: FillAnswerData; userAnswer: UserFillAnswer | null }) {
    const userText = userAnswer?.typedAnswer ?? "(Chưa trả lời)";
    const isCorrect = answerData.acceptedAnswers.some((a) => a.trim().toLowerCase() === userText.trim().toLowerCase());
    return (
        <View style={styles.fillContainer}>
            <View style={styles.fillRow}>
                <Text style={styles.fillLabel}>Bạn trả lời:</Text>
                <Text style={[styles.fillValue, isCorrect ? styles.textGreen : styles.textRed]}>{userText}</Text>
            </View>
            {!isCorrect && (
                <View style={styles.fillRow}>
                    <Text style={styles.fillLabel}>Đáp án đúng:</Text>
                    <Text style={[styles.fillValue, styles.textGreen]}>{answerData.acceptedAnswers.join(" / ")}</Text>
                </View>
            )}
        </View>
    );
}

function MatchReview({ answerData, userAnswer }: { answerData: MatchAnswerData; userAnswer: UserMatchAnswer | null }) {
    const userPairs = userAnswer?.pairs ?? [];
    const normalizedPairs = React.useMemo(() => {
        if (!Array.isArray(answerData.pairs)) return [];
        return answerData.pairs.map((p: any) => {
            if (!p) return { left: "", right: "" };
            if (typeof p.left === "string" && typeof p.right === "string") {
                return { left: p.left, right: p.right };
            }
            const keys = Object.keys(p);
            const left = keys[0] ?? "";
            const right = typeof p[left] === "string" ? p[left] : "";
            return { left, right };
        });
    }, [answerData.pairs]);

    return (
        <View style={styles.matchReviewContainer}>
            {normalizedPairs.map((correct, idx) => {
                const userPair = userPairs.find((p) => p.left?.trim().toLowerCase() === correct.left.trim().toLowerCase());
                const isPairCorrect = userPair?.right?.trim().toLowerCase() === correct.right.trim().toLowerCase();

                return (
                    <View key={idx} style={[styles.matchReviewRow, isPairCorrect ? styles.matchReviewCorrect : styles.matchReviewWrong]}>
                        <View style={styles.matchReviewRowTop}>
                            <Text style={styles.matchReviewLeftText}>{correct.left}</Text>
                            <Text style={styles.matchReviewArrow}>→</Text>
                            <Text style={[styles.matchReviewRightText, isPairCorrect ? styles.textGreen : styles.textRed]}>
                                {userPair?.right ?? "(Chưa ghép)"}
                            </Text>
                            <View style={[styles.reviewBadge, isPairCorrect ? styles.reviewBadgeCorrect : styles.reviewBadgeWrong]}>
                                <Text style={isPairCorrect ? styles.reviewBadgeTextCorrect : styles.reviewBadgeTextWrong}>
                                    {isPairCorrect ? "Đúng" : userPair ? "Sai" : "Chưa ghép"}
                                </Text>
                            </View>
                        </View>
                        {!isPairCorrect && (
                            <View style={styles.matchReviewCorrectHintRow}>
                                <Text style={styles.matchReviewHintLabel}>Đáp án đúng: </Text>
                                <Text style={styles.matchReviewHintValue}>{correct.right}</Text>
                            </View>
                        )}
                    </View>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#F8F7FF" },
    scrollContent: { padding: 16, paddingBottom: 40 },
    center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40 },
    errorText: { fontSize: 15, color: "#DC2626", fontWeight: "600" },
    bannerCard: { backgroundColor: "#FFF", borderRadius: 24, padding: 24, alignItems: "center", borderWidth: 1, borderColor: "#EAE7FA", marginBottom: 24 },
    bannerEmoji: { fontSize: 40, marginBottom: 8 },
    scoreRow: { flexDirection: "row", alignItems: "baseline" },
    bannerScore: { fontSize: 40, fontWeight: "900", color: "#5D45F9" },
    bannerScoreMax: { fontSize: 18, fontWeight: "700", color: "#718096", marginLeft: 2 },
    bannerSubtext: { fontSize: 13, color: "#718096", fontWeight: "600", marginTop: 4 },
    bannerDate: { fontSize: 12, color: "#A0AEC0", marginTop: 4 },
    sectionTitle: { fontSize: 16, fontWeight: "800", color: "#1C1C1E", marginBottom: 14 },
    questionCard: { backgroundColor: "#FFF", borderRadius: 20, padding: 16, borderWidth: 1, borderColor: "#EAE7FA", marginBottom: 12 },
    qHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
    qIndex: { fontSize: 12, fontWeight: "800", color: "#A0AEC0" },
    qBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 100 },
    qBadgeCorrect: { backgroundColor: "#ECFDF5" },
    qBadgeWrong: { backgroundColor: "#FEF2F2" },
    qBadgeText: { fontSize: 11, fontWeight: "800" },
    qBadgeTextCorrect: { color: "#059669" },
    qBadgeTextWrong: { color: "#DC2626" },
    qPrompt: { fontSize: 15, fontWeight: "700", color: "#2D3748", lineHeight: 22, marginBottom: 12 },
    optionsList: { gap: 8 },
    optItem: { backgroundColor: "#FFF", borderWidth: 1.5, borderColor: "#E5E7EB", borderRadius: 14, padding: 12 },
    optCorrect: { borderColor: "#10B981", backgroundColor: "#ECFDF5" },
    optWrong: { borderColor: "#EF4444", backgroundColor: "#FEF2F2" },
    optMissing: { borderColor: "#F59E0B", backgroundColor: "#FFFBEB", borderStyle: "dashed" },
    optText: { fontSize: 14, fontWeight: "600", color: "#4A5568" },
    optTextCorrect: { color: "#065F46" },
    optTextWrong: { color: "#991B1B" },
    optTextMissing: { color: "#B45309" },
    fillContainer: { backgroundColor: "#F8FAFC", borderRadius: 14, padding: 12, gap: 8 },
    fillRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    fillLabel: { fontSize: 13, fontWeight: "600", color: "#718096" },
    fillValue: { fontSize: 14, fontWeight: "700" },
    textGreen: { color: "#059669" },
    textRed: { color: "#DC2626" },
    reviewBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginLeft: 8 },
    reviewBadgeCorrect: { backgroundColor: "#D1FAE5" },
    reviewBadgeWrong: { backgroundColor: "#FEE2E2" },
    reviewBadgeMissing: { backgroundColor: "#FEF3C7" },
    reviewBadgeTextCorrect: { fontSize: 11, fontWeight: "700", color: "#065F46" },
    reviewBadgeTextWrong: { fontSize: 11, fontWeight: "700", color: "#991B1B" },
    reviewBadgeTextMissing: { fontSize: 11, fontWeight: "700", color: "#B45309" },
    matchReviewContainer: { gap: 8, marginTop: 4 },
    matchReviewRow: { borderRadius: 12, padding: 12, borderWidth: 1, gap: 6 },
    matchReviewCorrect: { borderColor: "#10B981", backgroundColor: "#ECFDF5" },
    matchReviewWrong: { borderColor: "#EF4444", backgroundColor: "#FEF2F2" },
    matchReviewRowTop: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
    matchReviewLeftText: { fontSize: 13, fontWeight: "600", color: "#4A5568" },
    matchReviewArrow: { fontSize: 14, color: "#718096" },
    matchReviewRightText: { fontSize: 13, fontWeight: "700" },
    matchReviewCorrectHintRow: { flexDirection: "row", alignItems: "center", borderTopWidth: 1, borderTopColor: "#FEE2E2", paddingTop: 6, marginTop: 4 },
    matchReviewHintLabel: { fontSize: 11, fontWeight: "600", color: "#B91C1C" },
    matchReviewHintValue: { fontSize: 12, fontWeight: "700", color: "#065F46" },
    explBox: { marginTop: 12, backgroundColor: "#F0FDF4", borderRadius: 12, padding: 12, borderWidth: 1, borderColor: "#BBF7D0" },
    explLabel: { fontSize: 12, fontWeight: "800", color: "#059669", marginBottom: 4 },
    explText: { fontSize: 13, color: "#065F46", lineHeight: 20 },
});
