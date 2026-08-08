import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    useWindowDimensions,
    TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import RenderHtml, { TNodeChildrenRenderer } from "react-native-render-html";
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
import typography from "@/theme/typography";

export default function TestDetailScreen() {
    const router = useRouter();
    const { width } = useWindowDimensions();
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
                    <Mascot
                        expression={userTestLog.isPassed ? "happy" : "sad"}
                    />
                    <View style={styles.scoreRow}>
                        <Text style={styles.bannerScore}>{scoreDisplay}</Text>
                        <Text style={styles.bannerScoreMax}>/10</Text>
                    </View>
                    <Text style={styles.bannerSubtext}>
                        {userTestLog.isPassed ? "Đạt" : "Chưa đạt"} • Lần{" "}
                        {userTestLog.attemptNumber}
                    </Text>
                    <Text style={styles.bannerDate}>{dateStr}</Text>
                </View>

                <Text style={styles.sectionTitle}>Chi tiết câu hỏi</Text>

                {answerLogs.map((log, idx) => {
                    const question = log.question;
                    const isCorrect = log.scoreAwarded >= log.maxScore;

                    return (
                        <View key={idx}>
                            {idx > 0 && <View style={styles.divider} />}
                            <View style={styles.questionCard}>
                                <View style={styles.qHeader}>
                                    <Text style={styles.qIndex}>
                                        Câu hỏi {idx + 1}
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
                                                ? "Chính xác!"
                                                : log.userAnswerData === null
                                                  ? "Chưa ghép!"
                                                  : "Chưa đúng!"}
                                        </Text>
                                    </View>
                                </View>

                                <View style={{ marginBottom: 12 }}>
                                    <RenderHtml
                                        contentWidth={width - 32}
                                        source={{ html: convertHslToHex(question.promptText || "") }}
                                        tagsStyles={promptTagsStyles}
                                        classesStyles={classesStyles}
                                        renderers={renderers}
                                    />
                                </View>

                                {question.document && (
                                    <CollapsibleDocument
                                        text={question.document}
                                    />
                                )}

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
                                        isQuestionCorrect={isCorrect}
                                        maxScore={log.maxScore}
                                    />
                                )}

                                {/* Explanation */}
                                {question.explanation && (
                                    <View style={styles.explBox}>
                                        <Text style={styles.explLabel}>
                                            Giải thích:
                                        </Text>
                                        <RenderHtml
                                            contentWidth={width - 56}
                                            source={{ html: convertHslToHex(question.explanation || "") }}
                                            tagsStyles={explTagsStyles}
                                            classesStyles={classesStyles}
                                            renderers={renderers}
                                        />
                                    </View>
                                )}
                            </View>
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

    const totalOptions = correctAnswer.options.length;
    const maxScore = single ? 0.25 : (totalOptions === 0 ? 0 : Math.max(0.25, Math.floor(totalOptions / 2) * 0.25));
    const correctCount = correct.length;
    const incorrectCount = totalOptions - correctCount;
    const correctScorePerItem = correctCount > 0 ? maxScore / correctCount : 0;
    const incorrectPenaltyPerItem = incorrectCount > 0 ? maxScore / incorrectCount : 0;

    return (
        <View style={styles.optionsList}>
            {correctAnswer.options.map((opt, idx) => {
                const isSelected = selected.includes(idx);
                const isCorrect = correct.includes(idx);

                let itemStyle: any[] = [styles.optItem];
                let textStyle: any[] = [styles.optText];
                let badge = null;

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
                    itemStyle.push(styles.optCorrect);
                    textStyle.push(styles.optTextCorrect);
                    badge = (
                        <View style={[styles.pointsBadge, pointsBadgeStyle]}>
                            <Text style={pointsTextStyle}>{pointsText}</Text>
                        </View>
                    );
                } else if (isSelected && !isCorrect) {
                    itemStyle.push(styles.optWrong);
                    textStyle.push(styles.optTextWrong);
                    badge = (
                        <View style={[styles.pointsBadge, pointsBadgeStyle]}>
                            <Text style={pointsTextStyle}>{pointsText}</Text>
                        </View>
                    );
                } else if (!isSelected && isCorrect) {
                    itemStyle.push(styles.optMissing);
                    textStyle.push(styles.optTextMissing);
                    badge = (
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                            <View style={[styles.pointsBadge, pointsBadgeStyle]}>
                                <Text style={pointsTextStyle}>{pointsText}</Text>
                            </View>
                            <View
                                style={[
                                    styles.reviewBadge,
                                    styles.reviewBadgeMissing,
                                ]}
                            >
                                <Text style={styles.reviewBadgeTextMissing}>
                                    Đáp án đúng
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
                                    isSelected &&
                                        isCorrect &&
                                        (single
                                            ? styles.radioCorrect
                                            : styles.checkboxCorrect),
                                    isSelected &&
                                        !isCorrect &&
                                        (single
                                            ? styles.radioWrong
                                            : styles.checkboxWrong),
                                    !isSelected &&
                                        isCorrect &&
                                        (single
                                            ? styles.radioMissing
                                            : styles.checkboxMissing),
                                ]}
                            >
                                {isSelected &&
                                    (!isCorrect ? (
                                        <X
                                            size={12}
                                            color={colors.textLight}
                                            strokeWidth={4}
                                        />
                                    ) : single ? (
                                        <View
                                            style={[
                                                styles.radioDot,
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
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Text
                        style={[
                            styles.fillValue,
                            isCorrect ? styles.textGreen : styles.textRed,
                        ]}
                    >
                        {userAnswer?.typedAnswer || "(Bỏ trống)"}
                    </Text>
                    <View style={[
                        styles.pointsBadge,
                        isCorrect ? styles.pointsBadgeCorrect : styles.pointsBadgeZero
                    ]}>
                        <Text style={isCorrect ? styles.pointsBadgeTextCorrect : styles.pointsBadgeTextZero}>
                            {isCorrect ? "+0.5đ" : "+0đ"}
                        </Text>
                    </View>
                </View>
            </View>
            <View style={styles.fillRow}>
                <Text style={styles.fillLabel}>Đáp án chấp nhận:</Text>
                <Text style={[styles.fillValue, styles.textGreen]}>
                    {correctAnswer.acceptedAnswers.join(" / ")}
                </Text>
            </View>
        </View>
    );
}

function MatchReview({
    userAnswer,
    correctAnswer,
    isQuestionCorrect,
    maxScore,
}: {
    userAnswer: UserMatchAnswer | null;
    correctAnswer: MatchAnswerData;
    isQuestionCorrect: boolean;
    maxScore: number;
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
                            <Text
                                style={[
                                    styles.matchReviewLeftText,
                                    styles.textLight,
                                ]}
                            >
                                {pair.left}
                            </Text>
                            <Text
                                style={[
                                    styles.matchReviewArrow,
                                    styles.textLight,
                                ]}
                            >
                                →
                            </Text>
                            {userPair?.right ? (
                                <Text
                                    style={[
                                        styles.matchReviewRightText,
                                        styles.textLight,
                                    ]}
                                >
                                    {userPair.right}
                                </Text>
                            ) : null}
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
                                        ? "Chính xác"
                                        : userPair
                                          ? "Chưa đúng"
                                          : "Chưa ghép"}
                                </Text>
                            </View>
                            <View style={[
                                styles.pointsBadge,
                                (isPairCorrect && isQuestionCorrect) ? styles.pointsBadgeCorrect : styles.pointsBadgeZero
                            ]}>
                                <Text style={(isPairCorrect && isQuestionCorrect) ? styles.pointsBadgeTextCorrect : styles.pointsBadgeTextZero}>
                                    {(isPairCorrect && isQuestionCorrect) ? `+${formatScore(maxScore)}đ` : "+0đ"}
                                </Text>
                            </View>
                        </View>
                        {!isPairCorrect && (
                            <View style={styles.matchReviewCorrectHintRow}>
                                <Text style={styles.matchReviewHintLabel}>
                                    Đáp án chính xác:
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

function convertHslToHex(html: string): string {
    if (!html) return "";
    return html.replace(
        /hsla?\(\s*(\d+(?:\.\d+)?)\s*(?:,|\s+)\s*(\d+(?:\.\d+)?)%\s*(?:,|\s+)\s*(\d+(?:\.\d+)?)%\s*(?:(?:,|\/|\s+)\s*(\d+(?:\.\d+)?)\s*)?\)/gi,
        (match, hStr, sStr, lStr, aStr) => {
            const h = parseFloat(hStr);
            const s = parseFloat(sStr) / 100;
            const l = parseFloat(lStr) / 100;
            const a = aStr ? parseFloat(aStr) : 1;

            const k = (n: number) => (n + h / 30) % 12;
            const factor = s * Math.min(l, 1 - l);
            const f = (n: number) =>
                l - factor * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));

            const r = Math.round(255 * f(0));
            const g = Math.round(255 * f(8));
            const b = Math.round(255 * f(4));

            const rHex = r.toString(16).padStart(2, "0");
            const gHex = g.toString(16).padStart(2, "0");
            const bHex = b.toString(16).padStart(2, "0");

            if (aStr !== undefined) {
                const aHex = Math.round(a * 255).toString(16).padStart(2, "0");
                return `#${rHex}${gHex}${bHex}${aHex}`;
            }
            return `#${rHex}${gHex}${bHex}`;
        }
    );
}

const commonTagsStyles = {
    a: {
        color: colors.primary,
        textDecorationLine: "underline" as const,
    },
    strong: {
        fontFamily: typography.fonts.bold,
    },
    b: {
        fontFamily: typography.fonts.bold,
    },
    i: {
        fontFamily: typography.fonts.italic,
    },
    em: {
        fontFamily: typography.fonts.italic,
    },
    u: {
        textDecorationLine: "underline" as const,
    },
    th: {
        fontFamily: typography.fonts.bold,
    },
};

const promptTagsStyles = {
    body: {
        color: colors.textSecondary,
        fontSize: 15,
        fontFamily: typography.fonts.bold,
        lineHeight: 22,
    },
    p: {
        marginTop: 0,
        marginBottom: 8,
    },
    li: {
        color: colors.textSecondary,
        fontSize: 14,
        fontFamily: typography.fonts.regular,
        lineHeight: 20,
    },
    ...commonTagsStyles,
};

const explTagsStyles = {
    body: {
        color: colors.textSuccess,
        fontSize: 13,
        fontFamily: typography.fonts.regular,
        lineHeight: 20,
    },
    p: {
        marginTop: 0,
        marginBottom: 8,
    },
    li: {
        color: colors.textSuccess,
        fontSize: 12,
        fontFamily: typography.fonts.regular,
        lineHeight: 18,
    },
    ...commonTagsStyles,
};

const docTagsStyles = {
    body: {
        color: colors.textSecondary,
        fontSize: 14,
        fontFamily: typography.fonts.regular,
        lineHeight: 22,
    },
    p: {
        marginTop: 0,
        marginBottom: 8,
    },
    li: {
        color: colors.textSecondary,
        fontSize: 13,
        fontFamily: typography.fonts.regular,
        lineHeight: 20,
    },
    ...commonTagsStyles,
};

const classesStyles = {
    "text-tiny": {
        fontSize: 10,
        lineHeight: 14,
        fontFamily: typography.fonts.regular,
    },
    "text-small": {
        fontSize: 13,
        lineHeight: 18,
        fontFamily: typography.fonts.regular,
    },
    "text-big": {
        fontSize: 20,
        lineHeight: 28,
        fontFamily: typography.fonts.regular,
    },
    "text-huge": {
        fontSize: 24,
        lineHeight: 34,
        fontFamily: typography.fonts.regular,
    },
};

const renderers = {
    table: ({ tnode }: any) => (
        <View style={styles.table}>
            <TNodeChildrenRenderer tnode={tnode} />
        </View>
    ),
    tbody: ({ tnode }: any) => (
        <View style={styles.tbody}>
            <TNodeChildrenRenderer tnode={tnode} />
        </View>
    ),
    tr: ({ tnode }: any) => (
        <View style={styles.tr}>
            <TNodeChildrenRenderer tnode={tnode} />
        </View>
    ),
    td: ({ tnode }: any) => (
        <View style={styles.td}>
            <TNodeChildrenRenderer tnode={tnode} />
        </View>
    ),
    th: ({ tnode }: any) => (
        <View style={[styles.td, styles.th]}>
            <TNodeChildrenRenderer tnode={tnode} />
        </View>
    ),
    span: ({ tnode, style, TDefaultRenderer, ...props }: any) => (
        <TDefaultRenderer tnode={tnode} style={style} {...props} />
    ),
};

function CollapsibleDocument({ text }: { text: string }) {
    const [expanded, setExpanded] = useState(false);
    const { width } = useWindowDimensions();
    return (
        <View style={styles.docContainer}>
            <TouchableOpacity
                onPress={() => setExpanded(!expanded)}
                style={styles.docToggle}
            >
                <Text style={styles.docToggleText}>
                    {expanded ? "▼ Ẩn tài liệu" : "▶ Xem tài liệu"}
                </Text>
            </TouchableOpacity>
            {expanded && (
                <View style={styles.docContent}>
                    <RenderHtml
                        contentWidth={width - 56}
                        source={{ html: convertHslToHex(text || "") }}
                        tagsStyles={docTagsStyles}
                        classesStyles={classesStyles}
                        renderers={renderers}
                    />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    docContainer: {
        marginBottom: 16,
        backgroundColor: colors.surface,
        borderRadius: 5,
        borderWidth: 1,
        borderColor: colors.borderMedium,
        overflow: "hidden",
    },
    docToggle: {
        flexDirection: "row",
        alignItems: "center",
        padding: 12,
        backgroundColor: colors.surfaceVariant,
    },
    docToggleText: {
        fontSize: 13,
        fontFamily: typography.fonts.bold,
        color: colors.primary,
    },
    docContent: {
        padding: 12,
        paddingTop: 0,
    },
    table: {
        borderWidth: 1,
        borderColor: colors.borderMedium,
        borderRadius: 4,
        overflow: "hidden",
        marginVertical: 12,
        backgroundColor: colors.surface,
    },
    tbody: {
        flexDirection: "column",
    },
    tr: {
        flexDirection: "row",
        borderBottomWidth: 1,
        borderBottomColor: colors.borderMedium,
    },
    td: {
        flex: 1,
        padding: 10,
        justifyContent: "center",
        borderRightWidth: 1,
        borderRightColor: colors.borderMedium,
    },
    th: {
        backgroundColor: colors.surfaceVariant,
    },
    container: { flex: 1 },
    scrollContent: { padding: 16, paddingBottom: 40 },
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 40,
    },
    errorText: { fontSize: 15, color: colors.textError, fontFamily: typography.fonts.semiBold },
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
    bannerScore: { fontSize: 40, fontFamily: typography.fonts.black, color: colors.primary },
    bannerScoreMax: {
        fontSize: 18,
        fontFamily: typography.fonts.bold,
        color: colors.textMuted,
        marginLeft: 2,
    },
    bannerSubtext: {
        fontSize: 13,
        color: colors.textMuted,
        fontFamily: typography.fonts.semiBold,
        marginTop: 4,
    },
    bannerDate: { fontSize: 12, color: colors.textPlaceholder, fontFamily: typography.fonts.regular, marginTop: 4 },
    sectionTitle: {
        fontSize: 16,
        fontFamily: typography.fonts.extraBold,
        color: colors.textPrimary,
        marginBottom: 14,
    },
    questionCard: {
        paddingVertical: 12,
    },
    divider: {
        height: 1,
        backgroundColor: colors.divider,
        marginVertical: 16,
    },
    qHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 10,
    },
    qIndex: { fontSize: 12, fontFamily: typography.fonts.extraBold, color: colors.textPlaceholder },
    qBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 5 },
    qBadgeCorrect: { backgroundColor: colors.success },
    qBadgeWrong: { backgroundColor: colors.error },
    qBadgeText: { fontSize: 11, fontFamily: typography.fonts.extraBold },
    qBadgeTextCorrect: { color: colors.textLight },
    qBadgeTextWrong: { color: colors.textLight },
    qPrompt: {
        fontSize: 15,
        fontFamily: typography.fonts.bold,
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
    optText: { fontSize: 14, fontFamily: typography.fonts.semiBold, color: colors.textSecondary },
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
    fillLabel: { fontSize: 13, fontFamily: typography.fonts.semiBold, color: colors.textMuted },
    fillValue: { fontSize: 14, fontFamily: typography.fonts.bold },
    textGreen: { color: colors.success },
    textRed: { color: colors.error },
    textLight: { color: colors.textLight },
    reviewBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 5,
        marginLeft: 8,
    },
    reviewBadgeCorrect: { backgroundColor: colors.success },
    reviewBadgeWrong: { backgroundColor: colors.error },
    reviewBadgeMissing: { backgroundColor: colors.warning },
    reviewBadgeTextCorrect: {
        fontSize: 11,
        fontFamily: typography.fonts.bold,
        color: colors.textLight,
    },
    reviewBadgeTextWrong: {
        fontSize: 11,
        fontFamily: typography.fonts.bold,
        color: colors.textLight,
    },
    reviewBadgeTextMissing: {
        fontSize: 11,
        fontFamily: typography.fonts.bold,
        color: colors.textLight,
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
        fontFamily: typography.fonts.semiBold,
        color: colors.textSecondary,
    },
    matchReviewArrow: { fontSize: 14, fontFamily: typography.fonts.regular, color: colors.textMuted },
    matchReviewRightText: { fontSize: 13, fontFamily: typography.fonts.bold },
    matchReviewCorrectHintRow: {
        flexDirection: "column",
        alignItems: "flex-start",
        gap: 2,
        borderTopWidth: 1,
        borderTopColor: "rgba(255, 255, 255, 0.3)",
        paddingTop: 6,
        marginTop: 4,
    },
    matchReviewHintLabel: {
        fontSize: 11,
        fontFamily: typography.fonts.semiBold,
        color: colors.textLight,
        opacity: 0.8,
    },
    matchReviewHintValue: {
        fontSize: 12,
        fontFamily: typography.fonts.bold,
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
        fontFamily: typography.fonts.extraBold,
        color: colors.textSuccess,
        marginBottom: 4,
    },
    explText: { fontSize: 13, fontFamily: typography.fonts.regular, color: colors.textSuccess, lineHeight: 20 },
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
});
