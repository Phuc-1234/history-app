import React, { useState, useEffect, useRef } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    ScrollView,
    Modal,
    Image,
    useWindowDimensions,
} from "react-native";
import RenderHtml from "react-native-render-html";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    Easing,
    LinearTransition,
} from "react-native-reanimated";
import { LogOut } from "lucide-react-native";
import { ScreenWrapper } from "@/components/layout/ScreenWrapper";
import { colors, radii, spacing, typography } from "@/theme";
import type { PvpLeaderboardEntry, PvpParticipant, QuestionV2 } from "../types";
import ChooseQuestion from "../../test_v2/components/ChooseQuestion";
import FillQuestion from "../../test_v2/components/FillQuestion";
import MatchQuestion from "../../test_v2/components/MatchQuestion";
import PracticeFeedbackMascot from "../../test_v2/components/PracticeFeedbackMascot";
import { useSubmitPvpAnswerMutation } from "../services/pvpApi";

interface PvpGameScreenProps {
    roomCode: string;
    timeLimitSeconds: number;
    currentQuestionIndex: number;
    totalQuestions: number;
    question: QuestionV2 | null;
    questionResult: {
        correctAnswerData: any;
        explanation: string | null;
        leaderboard: PvpParticipant[];
    } | null;
    finalLeaderboard: PvpLeaderboardEntry[] | null;
    answeredUserIds: string[];
    currentUserId: string;
    onExitGame: () => void;
}

export function PvpGameScreen({
    roomCode,
    timeLimitSeconds,
    currentQuestionIndex,
    totalQuestions,
    question,
    questionResult,
    finalLeaderboard,
    answeredUserIds,
    currentUserId,
    onExitGame,
}: PvpGameScreenProps) {
    const { width } = useWindowDimensions();
    const [userAnswer, setUserAnswer] = useState<any>(null);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [timeLeft, setTimeLeft] = useState(timeLimitSeconds);
    const [showExitModal, setShowExitModal] = useState(false);
    const startTimeRef = useRef(Date.now());

    // Map to track previous scores for calculating per-question point gain
    const prevScoresRef = useRef<Map<string, number>>(new Map());

    const [submitAnswerMut, { isLoading: isSubmitting }] = useSubmitPvpAnswerMutation();

    // Reanimated shared value for smooth timer unfill animation
    const timerProgress = useSharedValue(1);

    // Reset local answer state & smooth timer when question index changes
    useEffect(() => {
        setUserAnswer(null);
        setIsSubmitted(false);
        setTimeLeft(timeLimitSeconds);
        startTimeRef.current = Date.now();

        if (!questionResult && !finalLeaderboard) {
            timerProgress.value = 1;
            timerProgress.value = withTiming(0, {
                duration: timeLimitSeconds * 1000,
                easing: Easing.linear,
            });
        }
    }, [currentQuestionIndex, question?.id, timeLimitSeconds, questionResult, finalLeaderboard]);

    // Countdown timer display tick
    useEffect(() => {
        if (isSubmitted || questionResult || finalLeaderboard) return;

        const interval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
            const remaining = Math.max(0, timeLimitSeconds - elapsed);
            setTimeLeft(remaining);
            if (remaining <= 0) {
                clearInterval(interval);
            }
        }, 500);

        return () => clearInterval(interval);
    }, [isSubmitted, questionResult, finalLeaderboard, timeLimitSeconds]);

    // Update prevScoresRef when questionResult updates
    useEffect(() => {
        if (questionResult?.leaderboard) {
            // Update ref after reading gains
            const nextMap = new Map<string, number>();
            questionResult.leaderboard.forEach((p) => nextMap.set(p.userId, p.score));
            // Keep previous map accessible during current render, update after delay
            const timeout = setTimeout(() => {
                prevScoresRef.current = nextMap;
            }, 3500);
            return () => clearTimeout(timeout);
        }
    }, [questionResult]);

    const timerBarStyle = useAnimatedStyle(() => ({
        width: `${Math.max(0, Math.min(1, timerProgress.value)) * 100}%`,
    }));

    const handleSubmitAnswer = async () => {
        if (!question || isSubmitted) return;

        const timeTakenSeconds = Math.min(
            timeLimitSeconds,
            Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000)),
        );

        setIsSubmitted(true);

        try {
            await submitAnswerMut({
                roomCode,
                questionIndex: currentQuestionIndex,
                userAnswer,
                timeTakenSeconds,
            }).unwrap();
        } catch (err) {
            console.error("Failed to submit PVP answer:", err);
        }
    };

    const branchConfig = {
        hierarchy: "PVP",
        title: "Thi đấu PVP",
        hideBack: true,
        hideHome: true,
        rightElement: (
            <TouchableOpacity onPress={() => setShowExitModal(true)} style={{ padding: spacing.xs }}>
                <LogOut size={20} color={colors.neutral700} />
            </TouchableOpacity>
        ),
    };

    // Calculate user's current point gain for mascot feedback
    const myPrevScore = prevScoresRef.current.get(currentUserId) ?? 0;
    const myCurrentScore =
        questionResult?.leaderboard.find((p) => p.userId === currentUserId)?.score ?? myPrevScore;
    const myPointGain = Math.max(0, myCurrentScore - myPrevScore);
    const isMyAnswerCorrect = myPointGain > 0;

    // ── Final GameOver View ──
    if (finalLeaderboard) {
        const myRank = finalLeaderboard.find((p) => p.userId === currentUserId)?.rank ?? 1;
        const isWinner = myRank === 1;

        return (
            <ScreenWrapper showTopBar={false} branchConfig={branchConfig} showHistoricalBackground={false}>
                <View style={styles.gameOverContainer}>
                    <Text style={styles.gameOverTitle}>
                        {isWinner ? "🏆 Bạn đã chiến thắng!" : `Hạng #${myRank}`}
                    </Text>
                    <Text style={styles.gameOverSubtitle}>Bảng xếp hạng chung cuộc</Text>

                    <ScrollView style={styles.leaderboardList}>
                        {finalLeaderboard.map((item) => {
                            const isMe = item.userId === currentUserId;
                            return (
                                <Animated.View
                                    key={item.userId}
                                    layout={LinearTransition.springify().damping(14).stiffness(120)}
                                    style={[styles.rankRow, isMe && styles.rankRowMe]}
                                >
                                    <Text style={styles.rankNumber}>#{item.rank}</Text>
                                    {item.profileImgUrl ? (
                                        <Image source={{ uri: item.profileImgUrl }} style={styles.rankAvatar} />
                                    ) : (
                                        <View style={styles.rankAvatarPlaceholder}>
                                            <Text style={styles.rankInitials}>{item.name[0]?.toUpperCase()}</Text>
                                        </View>
                                    )}
                                    <Text style={styles.rankName} numberOfLines={1}>
                                        {item.name} {isMe ? "(Bạn)" : ""}
                                    </Text>
                                    <Text style={styles.rankScore}>{item.score} điểm</Text>
                                </Animated.View>
                            );
                        })}
                    </ScrollView>

                    <TouchableOpacity style={styles.exitButton} onPress={onExitGame}>
                        <Text style={styles.exitButtonText}>Về phòng chờ</Text>
                    </TouchableOpacity>
                </View>
            </ScreenWrapper>
        );
    }

    return (
        <ScreenWrapper showTopBar={false} branchConfig={branchConfig} showHistoricalBackground={false}>
            <View style={styles.container}>
                {/* Header progress & timer */}
                <View style={styles.header}>
                    <Text style={styles.progressText}>
                        Câu {currentQuestionIndex + 1} / {totalQuestions}
                    </Text>

                    <View style={styles.timerBadge}>
                        <Text style={[styles.timerText, timeLeft <= 5 && styles.timerTextWarning]}>
                            ⏱ {timeLeft}s
                        </Text>
                    </View>
                </View>

                {/* Rounded Smooth Unfill Timer Bar with Side Margin */}
                <View style={styles.timerBarTrack}>
                    <Animated.View
                        style={[
                            styles.timerBarFill,
                            timerBarStyle,
                            timeLeft <= 5 && { backgroundColor: colors.error500 },
                        ]}
                    />
                </View>

                {/* Question body */}
                <ScrollView style={styles.content}>
                    {!question ? (
                        <View style={styles.loadingBox}>
                            <ActivityIndicator size="large" color={colors.primary600} />
                            <Text style={styles.loadingText}>Đang tải câu hỏi...</Text>
                        </View>
                    ) : (
                        <View style={styles.questionWrapper}>
                            {/* Render prompt HTML */}
                            {question.promptText ? (
                                <View style={styles.promptHtmlBox}>
                                    <RenderHtml
                                        contentWidth={width - 64}
                                        source={{ html: question.promptText }}
                                        baseStyle={{
                                            fontSize: 16,
                                            color: colors.neutral900,
                                            lineHeight: 22,
                                        }}
                                    />
                                </View>
                            ) : null}

                            {/* Render question interaction */}
                            {question.type === "CHOOSE" ? (
                                <ChooseQuestion
                                    question={question}
                                    userAnswer={userAnswer}
                                    onAnswer={(_, selectedOptions) => !isSubmitted && setUserAnswer({ selectedOptions })}
                                    disabled={isSubmitted}
                                />
                            ) : question.type === "FILL" ? (
                                <FillQuestion
                                    question={question}
                                    userAnswer={userAnswer}
                                    onAnswer={(_, typedAnswer) => !isSubmitted && setUserAnswer({ typedAnswer })}
                                    disabled={isSubmitted}
                                />
                            ) : question.type === "MATCH" ? (
                                <MatchQuestion
                                    question={question}
                                    userAnswer={userAnswer}
                                    onAnswer={(_, pairs) => !isSubmitted && setUserAnswer({ pairs })}
                                    disabled={isSubmitted}
                                />
                            ) : null}
                        </View>
                    )}
                </ScrollView>

                {/* Submitting / Submitted status bar */}
                <View style={styles.footer}>
                    {isSubmitted ? (
                        <View style={styles.submittedBanner}>
                            <ActivityIndicator color={colors.primary700} style={{ marginRight: spacing.sm }} />
                            <Text style={styles.submittedText}>
                                Đã nộp! Đang chờ đối thủ... ({answeredUserIds.length} người đã trả lời)
                            </Text>
                        </View>
                    ) : (
                        <TouchableOpacity
                            style={[styles.submitButton, (!userAnswer || isSubmitting) && styles.buttonDisabled]}
                            onPress={handleSubmitAnswer}
                            disabled={!userAnswer || isSubmitting}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text style={styles.submitButtonText}>Xác nhận câu trả lời</Text>
                            )}
                        </TouchableOpacity>
                    )}
                </View>

                {/* Inter-question Result Modal with Mascot + Animated Cards */}
                <Modal visible={!!questionResult} animationType="fade" transparent>
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalCard}>
                            {/* Mascot Feedback Header */}
                            <View style={styles.mascotBox}>
                                <PracticeFeedbackMascot isCorrect={isMyAnswerCorrect} size={64} />
                                <Text
                                    style={[
                                        styles.gainBadgeText,
                                        isMyAnswerCorrect ? styles.gainBadgeSuccess : styles.gainBadgeMuted,
                                    ]}
                                >
                                    {isMyAnswerCorrect
                                        ? `+${myPointGain} điểm!`
                                        : "Chưa chính xác (0 điểm)"}
                                </Text>
                            </View>

                            <Text style={styles.modalTitle}>Kết quả câu {currentQuestionIndex + 1}</Text>

                            {/* Correct Answer Display */}
                            {(() => {
                                if (!questionResult?.correctAnswerData) return null;
                                const data = questionResult.correctAnswerData;
                                if (data.options && Array.isArray(data.correctOption)) {
                                    const correctTexts = data.correctOption
                                        .map((idx: number) => data.options[idx])
                                        .filter(Boolean);
                                    if (correctTexts.length > 0) {
                                        return (
                                            <View style={styles.correctAnswerBox}>
                                                <Text style={styles.correctAnswerTitle}>🎯 Đáp án đúng:</Text>
                                                {correctTexts.map((text: string, i: number) => (
                                                    <Text key={i} style={styles.correctAnswerText}>• {text}</Text>
                                                ))}
                                            </View>
                                        );
                                    }
                                }
                                if (Array.isArray(data.acceptedAnswers)) {
                                    return (
                                        <View style={styles.correctAnswerBox}>
                                            <Text style={styles.correctAnswerTitle}>🎯 Đáp án đúng:</Text>
                                            <Text style={styles.correctAnswerText}>• {data.acceptedAnswers.join(" / ")}</Text>
                                        </View>
                                    );
                                }
                                if (Array.isArray(data.correctPairs) && data.leftItems && data.rightItems) {
                                    return (
                                        <View style={styles.correctAnswerBox}>
                                            <Text style={styles.correctAnswerTitle}>🎯 Nối đúng:</Text>
                                            {data.correctPairs.map((pair: { left: number; right: number }, i: number) => (
                                                <Text key={i} style={styles.correctAnswerText}>
                                                    • {data.leftItems[pair.left]} ➔ {data.rightItems[pair.right]}
                                                </Text>
                                            ))}
                                        </View>
                                    );
                                }
                                return null;
                            })()}

                            {questionResult?.explanation ? (
                                <View style={styles.explanationBox}>
                                    <RenderHtml
                                        contentWidth={width - 80}
                                        source={{ html: `💡 Giải thích: ${questionResult.explanation}` }}
                                        baseStyle={{
                                            fontSize: 14,
                                            color: colors.neutral700,
                                        }}
                                    />
                                </View>
                            ) : null}

                            <Text style={styles.modalSectionTitle}>Bảng xếp hạng hiện tại</Text>

                            <ScrollView style={{ maxHeight: 260 }} contentContainerStyle={{ gap: spacing.xs }}>
                                {questionResult?.leaderboard?.map((p, idx) => {
                                    const isMe = p.userId === currentUserId;
                                    const prevScore = prevScoresRef.current.get(p.userId) ?? 0;
                                    const gain = Math.max(0, p.score - prevScore);

                                    return (
                                        <Animated.View
                                            key={p.userId}
                                            layout={LinearTransition.springify().damping(14).stiffness(120)}
                                            style={[styles.modalCardRow, isMe && styles.modalCardRowMe]}
                                        >
                                            <Text style={styles.modalRankNumber}>#{idx + 1}</Text>
                                            {p.profileImgUrl ? (
                                                <Image source={{ uri: p.profileImgUrl }} style={styles.cardAvatar} />
                                            ) : (
                                                <View style={styles.cardAvatarPlaceholder}>
                                                    <Text style={styles.cardInitials}>
                                                        {p.name[0]?.toUpperCase()}
                                                    </Text>
                                                </View>
                                            )}
                                            <Text style={styles.modalRankName} numberOfLines={1}>
                                                {p.name} {isMe ? "(Bạn)" : ""}
                                            </Text>
                                            {gain > 0 ? (
                                                <View style={styles.pointGainPill}>
                                                    <Text style={styles.pointGainPillText}>+{gain}</Text>
                                                </View>
                                            ) : null}
                                            <Text style={styles.modalRankScore}>{p.score} pt</Text>
                                        </Animated.View>
                                    );
                                })}
                            </ScrollView>

                            <Text style={styles.modalFooterNote}>Đang chuyển sang câu tiếp theo...</Text>
                        </View>
                    </View>
                </Modal>

                {/* Exit Confirmation Modal */}
                <Modal visible={showExitModal} animationType="fade" transparent>
                    <View style={styles.modalOverlay}>
                        <View style={styles.confirmModalCard}>
                            <Text style={styles.confirmModalTitle}>Rời khỏi phòng thi đấu?</Text>
                            <Text style={styles.confirmModalBody}>
                                Bạn có chắc chắn muốn rời khỏi trận đấu đang diễn ra?
                            </Text>

                            <View style={styles.confirmModalButtons}>
                                <TouchableOpacity
                                    style={styles.cancelModalButton}
                                    onPress={() => setShowExitModal(false)}
                                >
                                    <Text style={styles.cancelModalButtonText}>Ở lại</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.confirmModalButton}
                                    onPress={() => {
                                        setShowExitModal(false);
                                        onExitGame();
                                    }}
                                >
                                    <Text style={styles.confirmModalButtonText}>Rời phòng</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            </View>
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.neutral50,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
    },
    progressText: {
        fontSize: 16,
        fontFamily: typography.fonts.bold,
        color: colors.neutral900,
    },
    timerBadge: {
        backgroundColor: colors.primary100,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: radii.pill,
    },
    timerText: {
        fontSize: 16,
        fontFamily: typography.fonts.bold,
        color: colors.primary700,
    },
    timerTextWarning: {
        color: colors.error600,
    },
    timerBarTrack: {
        height: 10,
        backgroundColor: colors.neutral200,
        marginHorizontal: spacing.lg,
        borderRadius: radii.pill,
        overflow: "hidden",
        marginVertical: spacing.xs,
    },
    timerBarFill: {
        height: "100%",
        backgroundColor: colors.primary600,
        borderRadius: radii.pill,
    },
    content: {
        flex: 1,
        padding: spacing.md,
    },
    loadingBox: {
        alignItems: "center",
        justifyContent: "center",
        marginTop: 60,
    },
    loadingText: {
        fontSize: 14,
        fontFamily: typography.fonts.regular,
        color: colors.neutral600,
        marginTop: spacing.sm,
    },
    questionWrapper: {
        backgroundColor: "#FFFFFF",
        borderRadius: radii.container,
        padding: spacing.md,
    },
    promptHtmlBox: {
        marginBottom: spacing.md,
        paddingBottom: spacing.xs,
        borderBottomWidth: 1,
        borderBottomColor: colors.neutral200,
    },
    footer: {
        padding: spacing.md,
        backgroundColor: "#FFFFFF",
        borderTopWidth: 1,
        borderTopColor: colors.neutral200,
    },
    submitButton: {
        backgroundColor: colors.primary600,
        borderRadius: radii.pill,
        paddingVertical: spacing.md,
        alignItems: "center",
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    submitButtonText: {
        fontSize: 15,
        fontFamily: typography.fonts.medium,
        color: "#FFFFFF",
    },
    submittedBanner: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: spacing.md,
        backgroundColor: colors.primary50,
        borderRadius: radii.pill,
    },
    submittedText: {
        fontSize: 14,
        fontFamily: typography.fonts.medium,
        color: colors.primary800,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.6)",
        justifyContent: "center",
        alignItems: "center",
        padding: spacing.lg,
    },
    modalCard: {
        width: "100%",
        backgroundColor: "#FFFFFF",
        borderRadius: radii.container,
        padding: spacing.lg,
    },
    mascotBox: {
        alignItems: "center",
        marginBottom: spacing.sm,
    },
    gainBadgeText: {
        fontSize: 16,
        fontFamily: typography.fonts.bold,
        marginTop: spacing.xs,
    },
    gainBadgeSuccess: {
        color: colors.success,
    },
    gainBadgeMuted: {
        color: colors.neutral600,
    },
    modalTitle: {
        fontSize: 18,
        fontFamily: typography.fonts.bold,
        color: colors.primary700,
        textAlign: "center",
        marginBottom: spacing.xs,
    },
    correctAnswerBox: {
        backgroundColor: colors.successContainer,
        padding: spacing.sm,
        borderRadius: radii.container,
        marginBottom: spacing.xs,
    },
    correctAnswerTitle: {
        fontSize: 14,
        fontFamily: typography.fonts.bold,
        color: colors.success,
        marginBottom: spacing.xxs,
    },
    correctAnswerText: {
        fontSize: 14,
        fontFamily: typography.fonts.medium,
        color: colors.neutral900,
        marginLeft: spacing.xs,
    },
    explanationBox: {
        backgroundColor: colors.neutral100,
        padding: spacing.sm,
        borderRadius: radii.container,
        marginBottom: spacing.md,
    },
    modalSectionTitle: {
        fontSize: 15,
        fontFamily: typography.fonts.bold,
        color: colors.neutral900,
        marginBottom: spacing.xs,
    },
    modalCardRow: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.neutral50,
        borderRadius: radii.container,
        padding: spacing.sm,
        borderWidth: 1,
        borderColor: colors.neutral200,
    },
    modalCardRowMe: {
        borderColor: colors.primary500,
        backgroundColor: colors.primary50,
    },
    modalRankNumber: {
        fontSize: 14,
        fontFamily: typography.fonts.bold,
        color: colors.primary700,
        width: 28,
        textAlign: "center",
    },
    cardAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        marginRight: spacing.sm,
    },
    cardAvatarPlaceholder: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.primary200,
        alignItems: "center",
        justifyContent: "center",
        marginRight: spacing.sm,
    },
    cardInitials: {
        fontSize: 14,
        fontFamily: typography.fonts.bold,
        color: colors.primary800,
    },
    modalRankName: {
        flex: 1,
        fontSize: 14,
        fontFamily: typography.fonts.regular,
        color: colors.neutral900,
    },
    pointGainPill: {
        backgroundColor: colors.successContainer,
        paddingHorizontal: spacing.xs,
        paddingVertical: spacing.xxs,
        borderRadius: radii.pill,
        marginRight: spacing.xs,
    },
    pointGainPillText: {
        fontSize: 12,
        fontFamily: typography.fonts.bold,
        color: colors.success,
    },
    modalRankScore: {
        fontSize: 14,
        fontFamily: typography.fonts.bold,
        color: colors.primary700,
    },
    modalFooterNote: {
        fontSize: 13,
        fontFamily: typography.fonts.regular,
        color: colors.neutral500,
        textAlign: "center",
        marginTop: spacing.md,
    },
    gameOverContainer: {
        flex: 1,
        padding: spacing.lg,
        alignItems: "center",
    },
    gameOverTitle: {
        fontSize: 26,
        fontFamily: typography.fonts.bold,
        color: colors.primary700,
        marginTop: spacing.md,
    },
    gameOverSubtitle: {
        fontSize: 16,
        fontFamily: typography.fonts.medium,
        color: colors.neutral600,
        marginBottom: spacing.lg,
    },
    leaderboardList: {
        width: "100%",
        flex: 1,
    },
    rankRow: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        borderRadius: radii.container,
        padding: spacing.md,
        marginBottom: spacing.sm,
        borderWidth: 1,
        borderColor: colors.neutral200,
    },
    rankRowMe: {
        borderColor: colors.primary500,
        backgroundColor: colors.primary50,
    },
    rankNumber: {
        fontSize: 18,
        fontFamily: typography.fonts.bold,
        color: colors.primary700,
        width: 36,
    },
    rankAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        marginRight: spacing.md,
    },
    rankAvatarPlaceholder: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.primary200,
        alignItems: "center",
        justifyContent: "center",
        marginRight: spacing.md,
    },
    rankInitials: {
        fontSize: 14,
        fontFamily: typography.fonts.bold,
        color: colors.primary800,
    },
    rankName: {
        flex: 1,
        fontSize: 16,
        fontFamily: typography.fonts.regular,
        color: colors.neutral900,
    },
    rankScore: {
        fontSize: 16,
        fontFamily: typography.fonts.bold,
        color: colors.primary700,
    },
    exitButton: {
        backgroundColor: colors.primary600,
        borderRadius: radii.pill,
        paddingVertical: spacing.md,
        width: "100%",
        alignItems: "center",
        marginTop: spacing.md,
    },
    exitButtonText: {
        fontSize: 15,
        fontFamily: typography.fonts.medium,
        color: "#FFFFFF",
    },
    confirmModalCard: {
        width: "100%",
        backgroundColor: "#FFFFFF",
        borderRadius: radii.container,
        padding: spacing.lg,
    },
    confirmModalTitle: {
        fontSize: 22,
        fontFamily: typography.fonts.bold,
        color: colors.neutral900,
        marginBottom: spacing.xs,
    },
    confirmModalBody: {
        fontSize: 14,
        fontFamily: typography.fonts.regular,
        color: colors.neutral600,
        marginBottom: spacing.lg,
    },
    confirmModalButtons: {
        flexDirection: "row",
        gap: spacing.md,
    },
    cancelModalButton: {
        flex: 1,
        paddingVertical: spacing.sm,
        borderRadius: radii.pill,
        borderWidth: 1,
        borderColor: colors.neutral300,
        alignItems: "center",
    },
    cancelModalButtonText: {
        fontSize: 15,
        fontFamily: typography.fonts.medium,
        color: colors.neutral700,
    },
    confirmModalButton: {
        flex: 1,
        paddingVertical: spacing.sm,
        borderRadius: radii.pill,
        backgroundColor: colors.error600,
        alignItems: "center",
    },
    confirmModalButtonText: {
        fontSize: 15,
        fontFamily: typography.fonts.medium,
        color: "#FFFFFF",
    },
});
