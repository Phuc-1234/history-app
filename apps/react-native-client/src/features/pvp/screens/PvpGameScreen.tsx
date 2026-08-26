import React, { useState, useEffect, useRef, useMemo } from "react";
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
    BackHandler,
} from "react-native";
import { AppHtmlRenderer } from "@/components/AppHtmlRenderer";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    Easing,
    LinearTransition,
    FadeInDown,
} from "react-native-reanimated";
import { LogOut } from "lucide-react-native";
import { ScreenWrapper } from "@/components/layout/ScreenWrapper";
import { colors, radii, spacing, typography } from "@/theme";
import type { PvpLeaderboardEntry, PvpParticipant, QuestionV2 } from "../types";
import ChooseQuestion from "../../test_v2/components/ChooseQuestion";
import FillQuestion from "../../test_v2/components/FillQuestion";
import MatchQuestion from "../../test_v2/components/MatchQuestion";
import PracticeFeedbackMascot from "../../test_v2/components/PracticeFeedbackMascot";
import { evaluateQuestion } from "../../test_v2/services/scoreEngine";
import { useSubmitPvpAnswerMutation, useNextPvpStateMutation } from "../services/pvpApi";
import { playPracticeCorrectSound, playPracticeWrongSound } from "@/services/soundService";

interface PvpGameScreenProps {
    roomCode: string;
    timeLimitSeconds: number;
    currentQuestionIndex: number;
    totalQuestions: number;
    question: QuestionV2 | null;
    questionResult: {
        questionIndex?: number;
        correctAnswerData: any;
        explanation: string | null;
        leaderboard: PvpParticipant[];
    } | null;
    finalLeaderboard: PvpLeaderboardEntry[] | null;
    answeredUserIds: string[];
    currentUserId: string;
    showLeaderboard: boolean;
    rankChanges: Record<string, number>;
    isHost: boolean;
    autoNext: boolean;
    transitionInterval: number;
    onExitGame: () => void;
    activeUserIds?: string[];
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
    showLeaderboard,
    rankChanges,
    isHost,
    autoNext,
    transitionInterval,
    onExitGame,
    activeUserIds,
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
    const [nextPvpState, { isLoading: isAdvancingState }] = useNextPvpStateMutation();

    // Reanimated shared value for smooth timer unfill animation
    const timerProgress = useSharedValue(1);

    // Ensure questionResult strictly matches active currentQuestionIndex to prevent stale result leakage
    const activeQuestionResult = useMemo(() => {
        if (!questionResult) return null;
        if (questionResult.questionIndex !== currentQuestionIndex) {
            return null;
        }
        return questionResult;
    }, [questionResult, currentQuestionIndex]);

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
    }, [currentQuestionIndex, question?.id]);

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

    const userAnswerRef = useRef(userAnswer);
    userAnswerRef.current = userAnswer;

    const isSubmittedRef = useRef(isSubmitted);
    isSubmittedRef.current = isSubmitted;

    const handleSubmitAnswer = async () => {
        if (!question || isSubmittedRef.current) return;

        const timeTakenSeconds = Math.min(
            timeLimitSeconds,
            Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000)),
        );

        setIsSubmitted(true);

        const currentAnswer = userAnswerRef.current;
        if (currentAnswer) {
            try {
                await submitAnswerMut({
                    roomCode,
                    questionIndex: currentQuestionIndex,
                    userAnswer: currentAnswer,
                    timeTakenSeconds,
                    activeUserIds,
                }).unwrap();
            } catch (err) {
                console.error("Failed to submit PVP answer:", err);
            }
        }
    };

    const handleSubmitAnswerRef = useRef(handleSubmitAnswer);
    handleSubmitAnswerRef.current = handleSubmitAnswer;

    // Auto-submit saved answer when timer is expiring (<= 1s remaining)
    useEffect(() => {
        if (timeLeft <= 1 && !isSubmittedRef.current && userAnswerRef.current && !activeQuestionResult && !finalLeaderboard) {
            handleSubmitAnswerRef.current();
        }
    }, [timeLeft, activeQuestionResult, finalLeaderboard]);

    useEffect(() => {
        const onHardwareBackPress = () => {
            if (finalLeaderboard) {
                onExitGame();
                return true;
            }
            if (showExitModal) {
                setShowExitModal(false);
                return true;
            }
            setShowExitModal(true);
            return true;
        };

        const subscription = BackHandler.addEventListener("hardwareBackPress", onHardwareBackPress);
        return () => subscription.remove();
    }, [showExitModal, finalLeaderboard, onExitGame]);

    const branchConfig = {
        hierarchy: "PVP",
        title: "Thi đấu PVP",
        hideBack: false,
        hideHome: true,
        onBackPress: () => {
            if (finalLeaderboard) {
                onExitGame();
            } else {
                setShowExitModal(true);
            }
        },
        rightElement: (
            <TouchableOpacity onPress={() => setShowExitModal(true)} style={{ padding: spacing.xs }}>
                <LogOut size={20} color={colors.neutral700} />
            </TouchableOpacity>
        ),
    };

    const handleSelectAnswer = (newAnswer: any) => {
        if (isSubmitted || activeQuestionResult) return;
        setUserAnswer(newAnswer);
    };

    // Combine question prompt with activeQuestionResult.correctAnswerData when result phase starts
    const questionWithAnswers = useMemo(() => {
        if (!question) return null;
        if (!activeQuestionResult?.correctAnswerData) return question;
        const originalOptions = (question.answerData as any)?.options;
        const rawCorrect = activeQuestionResult.correctAnswerData.correctOption;

        let normalizedCorrect: number[] | undefined;
        if (Array.isArray(rawCorrect)) {
            normalizedCorrect = rawCorrect.map((x: any) => Number(x)).filter((x: number) => !isNaN(x));
        } else if (typeof rawCorrect === "number") {
            normalizedCorrect = [rawCorrect];
        } else if (typeof rawCorrect === "string") {
            const parsed = Number(rawCorrect);
            normalizedCorrect = isNaN(parsed) ? [] : [parsed];
        }

        return {
            ...question,
            answerData: {
                ...question.answerData,
                ...activeQuestionResult.correctAnswerData,
                options: originalOptions ?? activeQuestionResult.correctAnswerData?.options,
                correctOption: normalizedCorrect ?? (question.answerData as any)?.correctOption ?? [],
            },
        };
    }, [question, activeQuestionResult]);

    // Local evaluation result for option marking & feedback title
    const evalResult = useMemo(() => {
        if (!activeQuestionResult || !questionWithAnswers) return null;
        return evaluateQuestion(questionWithAnswers, userAnswer);
    }, [activeQuestionResult, questionWithAnswers, userAnswer]);

    // Calculate user's current point gain for mascot feedback
    const myPrevScore = prevScoresRef.current.get(currentUserId) ?? 0;
    const myCurrentScore =
        activeQuestionResult?.leaderboard.find((p) => p.userId === currentUserId)?.score ?? myPrevScore;
    const myPointGain = Math.max(0, myCurrentScore - myPrevScore);
    const isMyAnswerCorrect = evalResult ? evalResult.isCorrect : (myPointGain > 0);

    const lastPlayedQuestionIndex = useRef<number>(-1);

    useEffect(() => {
        if (activeQuestionResult && activeQuestionResult.questionIndex !== undefined) {
            if (lastPlayedQuestionIndex.current !== activeQuestionResult.questionIndex) {
                lastPlayedQuestionIndex.current = activeQuestionResult.questionIndex;
                if (isMyAnswerCorrect) {
                    playPracticeCorrectSound();
                } else {
                    playPracticeWrongSound();
                }
            }
        }
    }, [activeQuestionResult, isMyAnswerCorrect]);

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
                                    <Text style={styles.rankScore}>{item.score}đ</Text>
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
                <ScrollView
                    style={styles.content}
                    contentContainerStyle={activeQuestionResult && !showLeaderboard ? { paddingBottom: 200 } : undefined}
                >
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
                                    <AppHtmlRenderer
                                        contentWidth={width - 64}
                                        html={question.promptText}
                                        baseStyle={{
                                            fontSize: 16,
                                            color: colors.neutral900,
                                            lineHeight: 22,
                                        }}
                                    />
                                </View>
                            ) : null}

                            {/* Render question interaction */}
                            {questionWithAnswers?.type === "CHOOSE" ? (
                                <ChooseQuestion
                                    key={currentQuestionIndex}
                                    question={questionWithAnswers}
                                    userAnswer={userAnswer}
                                    onAnswer={(_, selectedOptions) => handleSelectAnswer({ selectedOptions: selectedOptions.map(Number) })}
                                    showFeedback={!!activeQuestionResult}
                                    evalResult={evalResult}
                                    disabled={isSubmitted || !!activeQuestionResult}
                                    scoreMultiplier={400}
                                />
                            ) : questionWithAnswers?.type === "FILL" ? (
                                <FillQuestion
                                    key={currentQuestionIndex}
                                    question={questionWithAnswers}
                                    userAnswer={userAnswer}
                                    onAnswer={(_, typedAnswer) => handleSelectAnswer({ typedAnswer })}
                                    showFeedback={!!activeQuestionResult}
                                    evalResult={evalResult}
                                    disabled={isSubmitted || !!activeQuestionResult}
                                    scoreMultiplier={400}
                                />
                            ) : questionWithAnswers?.type === "MATCH" ? (
                                <MatchQuestion
                                    key={currentQuestionIndex}
                                    question={questionWithAnswers}
                                    userAnswer={userAnswer}
                                    onAnswer={(_, pairs) => handleSelectAnswer({ pairs })}
                                    showFeedback={!!activeQuestionResult}
                                    evalResult={evalResult}
                                    disabled={isSubmitted || !!activeQuestionResult}
                                    scoreMultiplier={400}
                                />
                            ) : null}
                        </View>
                    )}
                </ScrollView>

                {/* Floating Feedback Box */}
                {activeQuestionResult && !showLeaderboard && (
                    <Animated.View
                        entering={FadeInDown.duration(250)}
                        style={[
                            styles.feedbackDrawer,
                            isMyAnswerCorrect
                                ? styles.feedbackDrawerCorrect
                                : styles.feedbackDrawerWrong,
                        ]}
                    >
                        <View style={styles.feedbackDrawerHeader}>
                            <PracticeFeedbackMascot isCorrect={isMyAnswerCorrect} size={42} />
                            <Text
                                style={[
                                    styles.feedbackDrawerTitle,
                                    isMyAnswerCorrect
                                        ? styles.feedbackDrawerTitleCorrect
                                        : styles.feedbackDrawerTitleWrong,
                                ]}
                            >
                                {isMyAnswerCorrect
                                    ? `Chính xác! (+${myPointGain} điểm)`
                                    : "Chưa chính xác (0 điểm)"}
                            </Text>
                        </View>

                        {activeQuestionResult.explanation ? (
                            <ScrollView
                                style={styles.feedbackDrawerScroll}
                                contentContainerStyle={styles.feedbackDrawerScrollContent}
                                showsVerticalScrollIndicator={true}
                            >
                                <AppHtmlRenderer
                                    contentWidth={width - 64}
                                    html={`💡 Giải thích: ${activeQuestionResult.explanation}`}
                                    baseStyle={{
                                        fontSize: 13,
                                        fontFamily: typography.fonts.regular,
                                        color: isMyAnswerCorrect ? colors.success : colors.error,
                                        lineHeight: 18,
                                    }}
                                />
                            </ScrollView>
                        ) : null}
                    </Animated.View>
                )}

                {/* Submitting / Submitted status bar / Next state progression */}
                <View style={styles.footer}>
                    {activeQuestionResult ? (
                        isHost ? (
                            !showLeaderboard ? (
                                <TouchableOpacity
                                    style={[styles.submitButton, isAdvancingState && styles.buttonDisabled]}
                                    onPress={async () => {
                                        try {
                                            await nextPvpState({ roomCode, targetState: "LEADERBOARD" }).unwrap();
                                        } catch (err) {
                                            console.error("Failed to advance state:", err);
                                        }
                                    }}
                                    disabled={isAdvancingState}
                                >
                                    {isAdvancingState ? (
                                        <ActivityIndicator color="#FFFFFF" />
                                    ) : (
                                        <Text style={styles.submitButtonText}>Tiếp tục (Bảng xếp hạng)</Text>
                                    )}
                                </TouchableOpacity>
                            ) : (
                                <View style={styles.submittedBanner}>
                                    <ActivityIndicator color={colors.primary700} style={{ marginRight: spacing.sm }} />
                                    <Text style={styles.submittedText}>Đang hiển thị bảng xếp hạng...</Text>
                                </View>
                            )
                        ) : (
                            <View style={styles.submittedBanner}>
                                <ActivityIndicator color={colors.primary700} style={{ marginRight: spacing.sm }} />
                                <Text style={styles.submittedText}>
                                    Đang chờ chủ phòng chuyển tiếp...
                                </Text>
                            </View>
                        )
                    ) : isSubmitted ? (
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

                {/* Inter-question Leaderboard Modal */}
                <Modal visible={showLeaderboard} animationType="fade" transparent>
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalCard}>
                            <Text style={styles.modalTitle}>Bảng xếp hạng câu {currentQuestionIndex + 1}</Text>

                            <ScrollView style={{ maxHeight: 280 }} contentContainerStyle={{ gap: spacing.xs }}>
                                {questionResult?.leaderboard?.map((p, idx) => {
                                    const isMe = p.userId === currentUserId;
                                    const prevScore = prevScoresRef.current.get(p.userId) ?? 0;
                                    const gain = Math.max(0, p.score - prevScore);
                                    const diff = rankChanges[p.userId] ?? 0;

                                    return (
                                        <Animated.View
                                            key={p.userId}
                                            layout={LinearTransition.springify().damping(14).stiffness(120)}
                                            style={[styles.modalCardRow, isMe && styles.modalCardRowMe]}
                                        >
                                            <View style={styles.rankBadgeContainer}>
                                                <Text style={styles.modalRankNumber}>#{idx + 1}</Text>
                                                {diff > 0 ? (
                                                    <Text style={styles.rankDiffUp}>+{diff}</Text>
                                                ) : diff < 0 ? (
                                                    <Text style={styles.rankDiffDown}>{diff}</Text>
                                                ) : null}
                                            </View>

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

                            {isHost ? (
                                <TouchableOpacity
                                    style={[styles.submitButton, { marginTop: spacing.md }, isAdvancingState && styles.buttonDisabled]}
                                    onPress={async () => {
                                        try {
                                            await nextPvpState({ roomCode, targetState: "NEXT_QUESTION" }).unwrap();
                                        } catch (err) {
                                            console.error("Failed to advance state:", err);
                                        }
                                    }}
                                    disabled={isAdvancingState}
                                >
                                    {isAdvancingState ? (
                                        <ActivityIndicator color="#FFFFFF" />
                                    ) : (
                                        <Text style={styles.submitButtonText}>Tiếp tục (Câu tiếp theo)</Text>
                                    )}
                                </TouchableOpacity>
                            ) : (
                                <Text style={styles.modalFooterNote}>
                                    Đang chờ chủ phòng chuyển tiếp...
                                </Text>
                            )}
                        </View>
                    </View>
                </Modal>

                {/* Exit Confirmation Modal */}
                <Modal visible={showExitModal} animationType="fade" transparent onRequestClose={() => setShowExitModal(false)}>
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
    inlineResultContainer: {
        marginTop: spacing.md,
        paddingTop: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.neutral200,
    },
    inlineMascotBox: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.neutral100,
        padding: spacing.md,
        borderRadius: radii.container,
        marginBottom: spacing.md,
    },
    gainBadgeTextInline: {
        fontSize: 16,
        fontFamily: typography.fonts.bold,
        marginLeft: spacing.md,
    },
    explanationBoxInline: {
        backgroundColor: colors.neutral100,
        padding: spacing.sm,
        borderRadius: radii.container,
        marginTop: spacing.sm,
    },
    rankBadgeContainer: {
        flexDirection: "row",
        alignItems: "center",
        width: 55,
    },
    rankDiffUp: {
        fontSize: 11,
        fontFamily: typography.fonts.bold,
        color: colors.success,
        marginLeft: spacing.xxs,
    },
    rankDiffDown: {
        fontSize: 11,
        fontFamily: typography.fonts.bold,
        color: colors.error,
        marginLeft: spacing.xxs,
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
    feedbackDrawer: {
        position: "absolute",
        left: spacing.md,
        right: spacing.md,
        bottom: 85,
        borderRadius: radii.container,
        padding: spacing.md,
        maxHeight: 180,
        zIndex: 10,
    },
    feedbackDrawerCorrect: {
        backgroundColor: colors.successContainer,
        borderWidth: 1,
        borderColor: colors.success,
    },
    feedbackDrawerWrong: {
        backgroundColor: colors.errorContainer,
        borderWidth: 1,
        borderColor: colors.error,
    },
    feedbackDrawerHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
        marginBottom: spacing.xs,
    },
    feedbackDrawerTitle: {
        fontSize: 15,
        fontFamily: typography.fonts.bold,
    },
    feedbackDrawerTitleCorrect: {
        color: colors.success,
    },
    feedbackDrawerTitleWrong: {
        color: colors.error,
    },
    feedbackDrawerScroll: {
        flex: 1,
        marginTop: spacing.xxs,
    },
    feedbackDrawerScrollContent: {
        paddingBottom: spacing.xxs,
    },
});
