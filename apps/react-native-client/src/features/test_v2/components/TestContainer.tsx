import React, { useEffect, useState, useRef, useCallback } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    Alert,
    Pressable,
    Modal,
    Dimensions,
    useWindowDimensions,
    Image,
    Platform,
} from "react-native";
import { Grid, Zap, Coins, Flame, Trophy, ArrowLeft, HelpCircle, X, Flag, Package, RotateCcw } from "lucide-react-native";
import { useRouter } from "expo-router";
import { usePreventDoubleTap } from "@/hooks/usePreventDoubleTap";
import { AppHtmlRenderer } from "../../../components/AppHtmlRenderer";
import Animated, {
    FadeIn,
    FadeInDown,
    ZoomIn,
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    Easing,
    withRepeat,
    withSequence,
} from "react-native-reanimated";
import { useAppSelector } from "@/store/storeHook";
import { ScreenWrapper } from "@/components/layout/ScreenWrapper";
import { CustomModal } from "@/components/Modal";
import Mascot from "@/components/Mascot";
import TestIntro, { getScopePlaceholder } from "./TestIntro";
import { ResumeTestPromptModal } from "./ResumeTestPromptModal";
import { useTestRunnerV2 } from "../hooks/useTestRunner";
import { colors } from "@/theme/colors";
import typography from "@/theme/typography";
import { useGetTestInfoQuery } from "../services/testApi";
import { useGetUserActiveEffectsQuery } from "@/features/inventory/services/itemApi";
import ChooseQuestion from "./ChooseQuestion";
import FillQuestion from "./FillQuestion";
import MatchQuestion from "./MatchQuestion";
import {
    isSingleChoice,
    evaluateQuestion,
    formatScore,
    getQuestionPointsRange,
} from "../services/scoreEngine";
import FeedbackModal from "@/components/FeedbackModal";
import PracticeFeedbackMascot from "./PracticeFeedbackMascot";
import { playTestPassSound, playTestFailSound, playPracticeCorrectSound, playPracticeWrongSound } from "@/services/soundService";
import { hapticSuccess, hapticError } from "@/services/hapticsService";
import { stripHtml } from "@/utils/htmlUtils";

import type {
    StartTestV2Request,
    QuestionV2,
    UserChooseAnswer,
    UserFillAnswer,
    UserMatchAnswer,
    ChooseAnswerData,
    FillAnswerData,
    MatchAnswerData,
    DraftAnswerEntry,
    UserAnswer,
    QuestionEvalResult,
} from "../types";

// Animated Progress Bar component
function AnimatedProgressBar({
    currentIndex,
    totalCount,
}: {
    currentIndex: number;
    totalCount: number;
}) {
    const progressVal = useSharedValue(0);

    useEffect(() => {
        progressVal.value = withTiming((currentIndex + 1) / totalCount, {
            duration: 350,
            easing: Easing.out(Easing.quad),
        });
    }, [currentIndex, totalCount]);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            width: `${progressVal.value * 100}%`,
        };
    });

    return (
        <View style={styles.progressBar}>
            <Animated.View style={[styles.progressFill, animatedStyle]} />
        </View>
    );
}

// Animated Timer Badge component
function AnimatedTimerBadge({
    timeLeft,
    formattedTime,
}: {
    timeLeft: number;
    formattedTime: string;
}) {
    const scale = useSharedValue(1);

    useEffect(() => {
        if (timeLeft < 60 && timeLeft > 0) {
            scale.value = withRepeat(
                withTiming(1.1, {
                    duration: 500,
                    easing: Easing.inOut(Easing.quad),
                }),
                -1,
                true,
            );
        } else {
            scale.value = 1;
        }
    }, [timeLeft < 60]);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: scale.value }],
        };
    });

    return (
        <Animated.View
            style={[
                styles.timerBadge,
                timeLeft < 60 && styles.timerWarning,
                animatedStyle,
            ]}
        >
            <Text
                style={[
                    styles.timerText,
                    timeLeft < 60 && styles.timerTextWarning,
                ]}
            >
                ⏱ {formattedTime}
            </Text>
        </Animated.View>
    );
}

// Animated Ripple Pill Button for Redo actions
function RipplePillButton({
    onPress,
    icon,
    text,
    style,
    textStyle,
    rippleColor = colors.warning,
}: {
    onPress: () => void;
    icon?: React.ReactNode;
    text: string;
    style?: any;
    textStyle?: any;
    rippleColor?: string;
}) {
    const scale = useSharedValue(1);
    const waveScale1 = useSharedValue(1);
    const waveOpacity1 = useSharedValue(0.7);
    const waveScale2 = useSharedValue(1);
    const waveOpacity2 = useSharedValue(0.7);

    useEffect(() => {
        // Shrinking and expanding button pulse
        scale.value = withRepeat(
            withSequence(
                withTiming(1.03, { duration: 800, easing: Easing.inOut(Easing.ease) }),
                withTiming(0.97, { duration: 800, easing: Easing.inOut(Easing.ease) }),
            ),
            -1,
            true,
        );

        // Infinite growing and disappearing outer ripple waves
        waveScale1.value = withRepeat(
            withTiming(1.28, { duration: 1600, easing: Easing.out(Easing.quad) }),
            -1,
            false,
        );
        waveOpacity1.value = withRepeat(
            withTiming(0, { duration: 1600, easing: Easing.out(Easing.quad) }),
            -1,
            false,
        );

        const timeout = setTimeout(() => {
            waveScale2.value = withRepeat(
                withTiming(1.28, { duration: 1600, easing: Easing.out(Easing.quad) }),
                -1,
                false,
            );
            waveOpacity2.value = withRepeat(
                withTiming(0, { duration: 1600, easing: Easing.out(Easing.quad) }),
                -1,
                false,
            );
        }, 800);

        return () => clearTimeout(timeout);
    }, []);

    const animatedBtnStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const animatedWaveStyle1 = useAnimatedStyle(() => ({
        transform: [{ scale: waveScale1.value }],
        opacity: waveOpacity1.value,
    }));

    const animatedWaveStyle2 = useAnimatedStyle(() => ({
        transform: [{ scale: waveScale2.value }],
        opacity: waveOpacity2.value,
    }));

    return (
        <View style={{ alignItems: "center", justifyContent: "center", position: "relative", width: "100%", marginVertical: 4 }}>
            {/* Ripple Wave 1 */}
            <Animated.View
                pointerEvents="none"
                style={[
                    StyleSheet.absoluteFill,
                    {
                        borderRadius: 30,
                        borderWidth: 2,
                        borderColor: rippleColor,
                    },
                    animatedWaveStyle1,
                ]}
            />
            {/* Ripple Wave 2 */}
            <Animated.View
                pointerEvents="none"
                style={[
                    StyleSheet.absoluteFill,
                    {
                        borderRadius: 30,
                        borderWidth: 1.5,
                        borderColor: rippleColor,
                    },
                    animatedWaveStyle2,
                ]}
            />
            {/* Main Pulsing Button */}
            <Animated.View style={[{ width: "100%" }, animatedBtnStyle]}>
                <TouchableOpacity
                    style={[
                        {
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 8,
                            paddingVertical: 14,
                            paddingHorizontal: 20,
                            borderRadius: 30,
                            backgroundColor: colors.warning,
                        },
                        style,
                    ]}
                    onPress={onPress}
                    activeOpacity={0.85}
                >
                    {icon}
                    <Text
                        style={[
                            {
                                fontSize: 14,
                                fontFamily: typography.fonts.bold,
                                color: colors.textLight,
                            },
                            textStyle,
                        ]}
                    >
                        {text}
                    </Text>
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
}

interface TestContainerV2Props {
    params: StartTestV2Request;
    onExit?: () => void;
    skipIntro?: boolean;
}

export default function TestContainerV2({
    params,
    onExit,
    skipIntro,
}: TestContainerV2Props) {
    const { width } = useWindowDimensions();
    const runner = useTestRunnerV2(params);
    const router = useRouter();
    const preventDoubleTap = usePreventDoubleTap();
    const profile = useAppSelector((state) => state.auth.profile);
    const [wasInitiallyLoggedIn] = useState(!!profile);
    const { data: testInfo, isLoading: isInfoLoading } = useGetTestInfoQuery(
        params,
        {
            skip: runner.status !== "idle" || !!params.isResume,
        },
    );
    const { data: activeEffectsData } = useGetUserActiveEffectsQuery();
    const xpMultiplier = activeEffectsData?.xpMultiplier ?? 1;
    const goldMultiplier = activeEffectsData?.goldMultiplier ?? 1;

    useEffect(() => {
        if (testInfo) {
            console.log("Test Info (/info) response:", JSON.stringify(testInfo, null, 2));
        }
    }, [testInfo]);

    const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);

    const {
        session,
        questions,
        purposeType,
        status,
        error,
        currentIndex,
        totalCount,
        currentQuestion,
        draftAnswers,
        evaluations,
        timeLeft,
        formattedTime,
        result,
        conflictResumable,
        isAbandoningConflict,
        resolveConflictResume,
        resolveConflictAbandon,
        actions,
        isQuestionAnswered,
        getAnswerForQuestion,
        getEvalForQuestion,
    } = runner;

    useEffect(() => {
        if ((skipIntro || params.isResume) && status === "idle") {
            actions.start();
        }
    }, [skipIntro, params.isResume, status, actions.start]);

    useEffect(() => {
        if (status === "completed" && result?.userTestLog) {
            if (result.userTestLog.isPassed) {
                playTestPassSound();
                hapticSuccess();
            } else {
                playTestFailSound();
                hapticError();
            }
        }
    }, [status, result?.userTestLog?.isPassed]);

    const practiceEarned = React.useMemo(() => {
        return Object.values(evaluations).reduce(
            (sum, ev) => sum + ev.scoreAwarded,
            0,
        );
    }, [evaluations]);

    const practiceTotal = React.useMemo(() => {
        return questions.reduce((sum, q) => {
            const ev = evaluateQuestion(q, null);
            return sum + ev.maxScore;
        }, 0);
    }, [questions]);

    const currentMaxScore = React.useMemo(() => {
        if (!currentQuestion) return 0;
        return evaluateQuestion(currentQuestion, null).maxScore;
    }, [currentQuestion]);

    const prevEarnedRef = useRef(practiceEarned);
    const [pointsDiff, setPointsDiff] = useState<number | null>(null);

    const animOpacity = useSharedValue(0);
    const animTranslateY = useSharedValue(0);

    const animStyle = useAnimatedStyle(() => {
        return {
            opacity: animOpacity.value,
            transform: [{ translateY: animTranslateY.value }],
            position: "absolute",
            left: -45,
            top: 6,
        };
    });

    useEffect(() => {
        const diff = practiceEarned - prevEarnedRef.current;
        prevEarnedRef.current = practiceEarned;

        if (diff > 0) {
            setPointsDiff(diff);
            animOpacity.value = 0;
            animTranslateY.value = 0;

            animOpacity.value = withTiming(1, { duration: 150 });
            animTranslateY.value = withTiming(
                -24,
                { duration: 850 },
                (finished) => {
                    if (finished) {
                        animOpacity.value = withTiming(0, { duration: 200 });
                    }
                },
            );
        }
    }, [practiceEarned]);

    const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
    const [showPracticeConfirm, setShowPracticeConfirm] = useState(false);
    const [isListModalVisible, setIsListModalVisible] = useState(false);
    const [showExplanationTooltip, setShowExplanationTooltip] = useState(false);
    const [milestoneQueue, setMilestoneQueue] = useState<any[]>([]);
    const [activeMilestone, setActiveMilestone] = useState<any | null>(null);

    // ─── Immediate Redo Wrong Local State ───
    const [isRedoWrongMode, setIsRedoWrongMode] = useState(false);
    const [initialRedoWrongQuestions, setInitialRedoWrongQuestions] = useState<QuestionV2[]>([]);
    const [redoWrongQuestions, setRedoWrongQuestions] = useState<QuestionV2[]>([]);
    const [redoWrongIndex, setRedoWrongIndex] = useState(0);
    const [redoWrongAnswers, setRedoWrongAnswers] = useState<DraftAnswerEntry[]>([]);
    const [redoWrongEvaluations, setRedoWrongEvaluations] = useState<Record<number, QuestionEvalResult>>({});
    const [isRedoWrongCompleted, setIsRedoWrongCompleted] = useState(false);
    const [showExitRedoConfirm, setShowExitRedoConfirm] = useState(false);

    const startImmediateRedoWrong = useCallback(() => {
        if (!result) return;
        const wrongQs = questions.filter((q) => {
            const log = result.answerLogs?.find((a) => a.questionId === q.id);
            if (log) {
                return log.scoreAwarded < log.maxScore;
            }
            const ev = evaluations[q.id];
            return ev ? !ev.isCorrect : false;
        });

        if (wrongQs.length === 0) return;

        setInitialRedoWrongQuestions(wrongQs);
        setRedoWrongQuestions(wrongQs);
        setRedoWrongIndex(0);
        setRedoWrongAnswers([]);
        setRedoWrongEvaluations({});
        setIsRedoWrongCompleted(false);
        setIsRedoWrongMode(true);
    }, [result, questions, evaluations]);

    const handleRedoSetAnswer = useCallback((questionId: number, type: string, answerData: UserAnswer) => {
        const entry: DraftAnswerEntry = {
            questionId,
            type: type as any,
            answerData,
            answeredAt: new Date().toISOString(),
        };
        setRedoWrongAnswers((prev) => {
            const filtered = prev.filter((d) => d.questionId !== questionId);
            return [...filtered, entry];
        });

        const currentQ = redoWrongQuestions[redoWrongIndex];
        if (currentQ && currentQ.id === questionId && currentQ.type === "CHOOSE" && isSingleChoice(currentQ)) {
            const evalRes = evaluateQuestion(currentQ, answerData);
            setRedoWrongEvaluations((prev) => ({ ...prev, [questionId]: evalRes }));
            if (evalRes.isCorrect) {
                playPracticeCorrectSound();
                hapticSuccess();
            } else {
                playPracticeWrongSound();
                hapticError();
            }
        }
    }, [redoWrongQuestions, redoWrongIndex]);

    const handleRedoAnswerChoose = useCallback((questionId: number, selectedOptions: number[]) => {
        handleRedoSetAnswer(questionId, "CHOOSE", { selectedOptions } as UserChooseAnswer);
    }, [handleRedoSetAnswer]);

    const handleRedoAnswerFill = useCallback((questionId: number, typedAnswer: string) => {
        handleRedoSetAnswer(questionId, "FILL", { typedAnswer } as UserFillAnswer);
    }, [handleRedoSetAnswer]);

    const handleRedoAnswerMatch = useCallback((questionId: number, pairs: { left: string; right: string }[]) => {
        handleRedoSetAnswer(questionId, "MATCH", { pairs } as UserMatchAnswer);
    }, [handleRedoSetAnswer]);

    const handleRedoConfirm = useCallback(() => {
        const currentQ = redoWrongQuestions[redoWrongIndex];
        if (!currentQ) return;
        const questionId = currentQ.id;
        const draft = redoWrongAnswers.find((d) => d.questionId === questionId);
        const userAnswer = draft?.answerData ?? null;
        const evalRes = evaluateQuestion(currentQ, userAnswer);
        setRedoWrongEvaluations((prev) => ({ ...prev, [questionId]: evalRes }));

        if (evalRes.isCorrect) {
            playPracticeCorrectSound();
            hapticSuccess();
        } else {
            playPracticeWrongSound();
            hapticError();
        }
    }, [redoWrongQuestions, redoWrongIndex, redoWrongAnswers]);

    const handleRedoNext = useCallback(() => {
        if (redoWrongIndex < redoWrongQuestions.length - 1) {
            setRedoWrongIndex((prev) => prev + 1);
        } else {
            setIsRedoWrongCompleted(true);
        }
    }, [redoWrongIndex, redoWrongQuestions.length]);

    const handleRedoStillWrong = useCallback((stillWrongQuestions: QuestionV2[]) => {
        setRedoWrongQuestions(stillWrongQuestions);
        setRedoWrongIndex(0);
        setRedoWrongAnswers([]);
        setRedoWrongEvaluations({});
        setIsRedoWrongCompleted(false);
    }, []);

    const handleRedoAllInitialWrong = useCallback(() => {
        setRedoWrongQuestions(initialRedoWrongQuestions);
        setRedoWrongIndex(0);
        setRedoWrongAnswers([]);
        setRedoWrongEvaluations({});
        setIsRedoWrongCompleted(false);
    }, [initialRedoWrongQuestions]);

    const handleRedoRestartAll = useCallback(() => {
        setIsRedoWrongMode(false);
        setIsRedoWrongCompleted(false);
        setInitialRedoWrongQuestions([]);
        setRedoWrongQuestions([]);
        actions.restart();
    }, [actions]);

    useEffect(() => {
        if (status === "completed" && result?.consequences) {
            const milestones = result.consequences.filter(
                (c) => c.eventType === "STREAK_MILESTONE" || c.eventType === "TIER_GAINED"
            );
            if (milestones.length > 0) {
                setMilestoneQueue(milestones);
                setActiveMilestone(milestones[0]);
            }
        }
    }, [status, result]);

    useEffect(() => {
        setShowExplanationTooltip(false);
    }, [currentIndex]);

    const handleBack = () => {
        if (status === "running") {
            if (purposeType === "EXAM") {
                setShowSubmitConfirm(true);
            } else {
                setShowPracticeConfirm(true);
            }
        } else {
            if (onExit) {
                onExit();
            } else {
                router.back();
            }
        }
    };

    const displayTitle =
        session?.testTitle ||
        testInfo?.title ||
        getScopePlaceholder(params.scopeType, params.purposeType, params.autoPickStrategy);
    const branchConfig = {
        hierarchy:
            params.purposeType === "EXAM"
                ? "KIỂM TRA"
                : params.autoPickStrategy === "WRONG"
                    ? "LÀM LẠI CÂU SAI"
                    : "LUYỆN TẬP",
        title: displayTitle,
        onBackPress: handleBack,
    };

    // ── Auth check ───────────────────────────────────────────────────
    if (!profile) {
        if (wasInitiallyLoggedIn) {
            return null;
        }
        return (
            <ScreenWrapper branchConfig={branchConfig} showTopBar={false} showHistoricalBackground={false}>
                <CustomModal
                    visible={true}
                    title="Yêu cầu đăng nhập"
                    message="Bạn cần đăng nhập để làm bài kiểm tra. Đăng nhập ngay?"
                    confirmText="Đăng nhập"
                    cancelText="Hủy"
                    onConfirm={() => router.push("/(1_auth)/1_1_login")}
                    onCancel={handleBack}
                    showMascot={true}
                    mascotExpression="thinking"
                />
            </ScreenWrapper>
        );
    }

    // ── Exam Intro state ──────────────────────────────────────────────
    if (status === "idle") {
        if (skipIntro) {
            return (
                <>
                    <CustomModal
                        visible={status === "idle" && !!error}
                        title="Lỗi bắt đầu"
                        message={error || ""}
                        confirmText="Thử lại"
                        cancelText="Hủy"
                        onConfirm={() => {
                            actions.clearError();
                            actions.start();
                        }}
                        onCancel={() => {
                            actions.clearError();
                            handleBack();
                        }}
                        showMascot={true}
                        mascotExpression="sad"
                    />
                </>
            );
        }
        return (
            <>
                <TestIntro
                    testId={params.testId}
                    scopeId={params.scopeId}
                    title={testInfo?.title}
                    questionCount={testInfo?.questionCount}
                    timeLimit={testInfo?.timeLimit}
                    loading={isInfoLoading}
                    onStart={actions.start}
                    onBack={handleBack}
                    purposeType={params.purposeType}
                    xpReward={testInfo?.xpReward}
                    goldReward={testInfo?.goldReward}
                    xpMultiplier={testInfo?.xpMultiplier}
                    goldMultiplier={testInfo?.goldMultiplier}
                    attemptNumber={testInfo?.attemptNumber}
                    passThreshold={testInfo?.passThreshold}
                    attemptCount={testInfo?.attemptCount}
                    passCount={testInfo?.passCount}
                    scopeType={params.scopeType}
                    itemsReward={testInfo?.itemsReward}
                />
                <CustomModal
                    visible={status === "idle" && !!error}
                    title="Lỗi bắt đầu"
                    message={error || ""}
                    confirmText="Thử lại"
                    cancelText="Hủy"
                    onConfirm={() => {
                        actions.clearError();
                        actions.start();
                    }}
                    onCancel={() => {
                        actions.clearError();
                    }}
                    showMascot={true}
                    mascotExpression="sad"
                />
                <ResumeTestPromptModal
                    visible={!!conflictResumable}
                    testLog={conflictResumable?.resumable ?? null}
                    onResume={resolveConflictResume}
                    onAbandon={resolveConflictAbandon}
                    isAbandoning={isAbandoningConflict}
                />
            </>
        );
    }

    // ── Loading state ────────────────────────────────────────────────
    if (status === "loading") {
        return null;
    }

    // ─── Immediate Redo Wrong Flow ──────────────────────────────────
    if (isRedoWrongMode) {
        if (isRedoWrongCompleted) {
            const correctCount = Object.values(redoWrongEvaluations).filter((e) => e.isCorrect).length;
            const totalRedoCount = redoWrongQuestions.length;
            const stillWrongQuestions = redoWrongQuestions.filter((q) => {
                const ev = redoWrongEvaluations[q.id];
                return !ev || !ev.isCorrect;
            });
            const stillWrongCount = stillWrongQuestions.length;
            const initialTotalWrongCount = initialRedoWrongQuestions.length;
            const isAllCorrect = stillWrongCount === 0;

            const redoBranchConfig = {
                hierarchy: "LÀM LẠI CÂU SAI",
                title: "Kết quả làm lại",
                onBackPress: preventDoubleTap(onExit || (() => router.back())),
            };

            return (
                <ScreenWrapper branchConfig={redoBranchConfig} showTopBar={false} showHistoricalBackground={false}>
                    <ScrollView
                        style={styles.container}
                        contentContainerStyle={styles.scrollContent}
                    >
                        <Animated.View
                            entering={ZoomIn.duration(400)}
                            style={styles.resultCard}
                        >
                            <Mascot
                                expression={isAllCorrect ? "happy" : "sad"}
                                event={{
                                    type: "finish-test",
                                    score: totalRedoCount > 0 ? (correctCount / totalRedoCount) * 10 : 0,
                                }}
                                width={150}
                                height={150}
                                style={{ marginBottom: 16 }}
                            />
                            <Text style={styles.resultTitle}>
                                {isAllCorrect ? "Hoàn thành xuất sắc!" : "Vẫn chưa đúng hết!"}
                            </Text>
                            <View style={styles.scoreRow}>
                                <Text style={styles.scoreValue}>
                                    {correctCount}
                                </Text>
                                <Text style={styles.scoreMax}>/{totalRedoCount} câu đúng</Text>
                            </View>
                            <Text style={styles.resultSubtext}>
                                Luyện tập lại các câu sai của bài kiểm tra
                            </Text>
                        </Animated.View>

                        {/* Action buttons */}
                        <Animated.View
                            entering={FadeInDown.delay(150).duration(450)}
                            style={styles.resultActions}
                        >
                            {stillWrongCount > 0 && stillWrongCount < initialTotalWrongCount && (
                                <RipplePillButton
                                    icon={<RotateCcw size={16} color={colors.textLight} />}
                                    text={`Làm lại ${stillWrongCount} câu còn sai`}
                                    onPress={() => handleRedoStillWrong(stillWrongQuestions)}
                                />
                            )}

                            {stillWrongCount > 0 && stillWrongCount < initialTotalWrongCount ? (
                                <TouchableOpacity
                                    style={styles.redoBtn}
                                    onPress={handleRedoAllInitialWrong}
                                    activeOpacity={0.8}
                                >
                                    <RotateCcw size={16} color={colors.textLight} />
                                    <Text style={styles.redoBtnText}>
                                        {`Làm lại tất cả ${initialTotalWrongCount} câu sai`}
                                    </Text>
                                </TouchableOpacity>
                            ) : (
                                <RipplePillButton
                                    icon={<RotateCcw size={16} color={colors.textLight} />}
                                    text={initialTotalWrongCount > 1 ? `Làm lại tất cả ${initialTotalWrongCount} câu sai` : "Làm lại câu sai"}
                                    onPress={handleRedoAllInitialWrong}
                                />
                            )}

                            <TouchableOpacity
                                style={styles.viewDetailsBtn}
                                onPress={handleRedoRestartAll}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.viewDetailsBtnText}>
                                    Làm lại tất cả
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.exitBtn}
                                onPress={preventDoubleTap(onExit || (() => router.back()))}
                                activeOpacity={0.8}
                            >
                                <ArrowLeft size={16} color={colors.primary} />
                                <Text style={styles.exitBtnText}>Thoát</Text>
                            </TouchableOpacity>
                        </Animated.View>
                    </ScrollView>
                </ScreenWrapper>
            );
        }

        const currentRedoQuestion = redoWrongQuestions[redoWrongIndex];
        const redoTotalCount = redoWrongQuestions.length;
        const redoEvalResult = currentRedoQuestion
            ? redoWrongEvaluations[currentRedoQuestion.id] ?? null
            : null;
        const redoAnswerEntry = currentRedoQuestion
            ? redoWrongAnswers.find((d) => d.questionId === currentRedoQuestion.id)
            : null;
        const redoAnswered = !!redoAnswerEntry;
        const redoShowFeedback = !!redoEvalResult;

        const redoRunnerBranchConfig = {
            hierarchy: "LÀM LẠI CÂU SAI",
            title: displayTitle,
            hideBack: true,
            hideHome: true,
            rightElement: (
                <TouchableOpacity
                    style={{
                        backgroundColor: "rgba(255, 255, 255, 0.2)",
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        borderRadius: 30,
                    }}
                    onPress={() => setShowExitRedoConfirm(true)}
                >
                    <Text style={{ color: "#FFFFFF", fontFamily: typography.fonts.bold, fontSize: 13 }}>
                        Thoát
                    </Text>
                </TouchableOpacity>
            ),
        };

        return (
            <ScreenWrapper branchConfig={redoRunnerBranchConfig} showTopBar={false} showHistoricalBackground={false}>
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerLeft}>
                            <Text style={styles.headerProgress}>
                                {redoWrongIndex + 1}/{redoTotalCount}
                            </Text>
                            <AnimatedProgressBar
                                currentIndex={redoWrongIndex}
                                totalCount={redoTotalCount}
                            />
                        </View>
                        <View style={styles.scoreBadge}>
                            <Text style={styles.scoreBadgeText}>
                                Làm lại câu sai
                            </Text>
                        </View>
                    </View>

                    {/* Question content */}
                    <ScrollView
                        style={styles.questionScroll}
                        contentContainerStyle={[
                            styles.questionContent,
                            redoShowFeedback && { paddingBottom: 220 },
                        ]}
                    >
                        {currentRedoQuestion && (
                            <Animated.View
                                key={`redo-${redoWrongIndex}`}
                                entering={FadeIn.duration(250)}
                            >
                                <View style={styles.promptHeader}>
                                    <View style={{ flex: 1 }}>
                                        <AppHtmlRenderer
                                            contentWidth={width - 100}
                                            html={currentRedoQuestion.promptText || ""}
                                            baseStyle={{
                                                color: colors.textPrimary,
                                                fontSize: 16,
                                                fontFamily: typography.fonts.bold,
                                                lineHeight: 24,
                                            }}
                                        />
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => setFeedbackModalVisible(true)}
                                        style={{ padding: 4 }}
                                        activeOpacity={0.7}
                                    >
                                        <Flag size={18} color={colors.textSecondary} />
                                    </TouchableOpacity>
                                </View>

                                {currentRedoQuestion.document && (
                                    <CollapsibleDocument
                                        text={currentRedoQuestion.document}
                                    />
                                )}

                                {currentRedoQuestion.type === "CHOOSE" && (
                                    <ChooseQuestion
                                        key={`redo-${currentRedoQuestion.id}`}
                                        question={currentRedoQuestion}
                                        userAnswer={
                                            redoAnswerEntry?.answerData as UserChooseAnswer | null
                                        }
                                        onAnswer={handleRedoAnswerChoose}
                                        showFeedback={redoShowFeedback}
                                        evalResult={redoEvalResult}
                                        disabled={false}
                                    />
                                )}
                                {currentRedoQuestion.type === "FILL" && (
                                    <FillQuestion
                                        key={`redo-${currentRedoQuestion.id}`}
                                        question={currentRedoQuestion}
                                        userAnswer={
                                            redoAnswerEntry?.answerData as UserFillAnswer | null
                                        }
                                        onAnswer={handleRedoAnswerFill}
                                        showFeedback={redoShowFeedback}
                                        evalResult={redoEvalResult}
                                        disabled={false}
                                    />
                                )}
                                {currentRedoQuestion.type === "MATCH" && (
                                    <MatchQuestion
                                        key={`redo-${currentRedoQuestion.id}`}
                                        question={currentRedoQuestion}
                                        userAnswer={
                                            redoAnswerEntry?.answerData as UserMatchAnswer | null
                                        }
                                        onAnswer={handleRedoAnswerMatch}
                                        showFeedback={redoShowFeedback}
                                        evalResult={redoEvalResult}
                                        disabled={false}
                                    />
                                )}
                            </Animated.View>
                        )}
                    </ScrollView>

                    {/* Feedback Drawer */}
                    {redoShowFeedback && redoEvalResult && (
                        <Animated.View
                            entering={FadeInDown.duration(250)}
                            style={[
                                styles.feedbackDrawer,
                                redoEvalResult.isCorrect
                                    ? styles.feedbackDrawerCorrect
                                    : styles.feedbackDrawerWrong,
                            ]}
                        >
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 4 }}>
                                <PracticeFeedbackMascot isCorrect={redoEvalResult.isCorrect} size={42} />
                                <Text
                                    style={[
                                        styles.feedbackDrawerTitle,
                                        redoEvalResult.isCorrect
                                            ? styles.feedbackDrawerTitleCorrect
                                            : styles.feedbackDrawerTitleWrong,
                                    ]}
                                >
                                    {redoEvalResult.isCorrect ? "Chính xác!" : "Chưa đúng!"}
                                </Text>
                            </View>
                            {currentRedoQuestion?.explanation ? (
                                <ScrollView
                                    style={styles.feedbackDrawerScroll}
                                    contentContainerStyle={styles.feedbackDrawerScrollContent}
                                    showsVerticalScrollIndicator={true}
                                >
                                    <AppHtmlRenderer
                                        contentWidth={width - 64}
                                        html={currentRedoQuestion.explanation || ""}
                                        baseStyle={{
                                            color: redoEvalResult.isCorrect ? colors.textSuccess : colors.textError,
                                            fontSize: 14,
                                            lineHeight: 20,
                                        }}
                                    />
                                </ScrollView>
                            ) : null}
                        </Animated.View>
                    )}

                    {/* Footer */}
                    <View style={styles.footer}>
                        <TouchableOpacity
                            style={[
                                styles.nextBtn,
                                !redoShowFeedback &&
                                    !redoAnswered &&
                                    styles.nextBtnDisabled,
                            ]}
                            onPress={() => {
                                if (!redoShowFeedback) {
                                    handleRedoConfirm();
                                } else {
                                    handleRedoNext();
                                }
                            }}
                            disabled={!redoShowFeedback && !redoAnswered}
                        >
                            <Text style={styles.nextBtnText}>
                                {!redoShowFeedback
                                    ? "Xác nhận"
                                    : redoWrongIndex < redoTotalCount - 1
                                      ? "Tiếp theo →"
                                      : "Hoàn thành"}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Exit confirmation */}
                    <CustomModal
                        visible={showExitRedoConfirm}
                        title="Thoát làm lại"
                        message="Bạn có chắc chắn muốn thoát khỏi phần làm lại câu sai?"
                        confirmText="Thoát"
                        cancelText="Ở lại"
                        onConfirm={() => {
                            setShowExitRedoConfirm(false);
                            setIsRedoWrongMode(false);
                            setIsRedoWrongCompleted(false);
                        }}
                        onCancel={() => setShowExitRedoConfirm(false)}
                    />

                    {/* Context Feedback Modal */}
                    {currentRedoQuestion && (
                        <FeedbackModal
                            visible={feedbackModalVisible}
                            onClose={() => setFeedbackModalVisible(false)}
                            targetType="QUESTION"
                            targetId={currentRedoQuestion.id}
                            targetTitle={`Câu hỏi: ${stripHtml(currentRedoQuestion.promptText).substring(0, 55)}...`}
                        />
                    )}
                </View>
            </ScreenWrapper>
        );
    }

    // ── Completed state ──────────────────────────────────────────────
    if (status === "completed" && result) {
        const { userTestLog, answerLogs, consequences } = result;
        const scoreDisplay =
            userTestLog.maxScore > 0
                ? formatScore(
                      (userTestLog.scoreAwarded / userTestLog.maxScore) * 10,
                  )
                : "0";
        const hasWrongAnswers = answerLogs.some(
            (a) => a.scoreAwarded < a.maxScore,
        );

        return (
            <ScreenWrapper branchConfig={branchConfig} showTopBar={false} showHistoricalBackground={false}>
                <ScrollView
                    style={styles.container}
                    contentContainerStyle={styles.scrollContent}
                >
                    <Animated.View
                        entering={ZoomIn.duration(400)}
                        style={styles.resultCard}
                    >
                        <Mascot
                            expression={!userTestLog.isPassed ? "sad" : undefined}
                            event={{
                                type: "finish-test",
                                score: parseFloat(scoreDisplay),
                            }}
                            width={150}
                            height={150}
                            style={{ marginBottom: 16 }}
                        />
                        <Text style={styles.resultTitle}>
                            {userTestLog.isPassed ? "Chúc mừng!" : "Chưa đạt"}
                        </Text>
                        <View style={styles.scoreRow}>
                            <Text style={styles.scoreValue}>
                                {scoreDisplay}
                            </Text>
                            <Text style={styles.scoreMax}>/10</Text>
                        </View>
                        <Text style={styles.resultSubtext}>
                            {formatScore(userTestLog.scoreAwarded)}/
                            {formatScore(userTestLog.maxScore)} điểm
                        </Text>

                        {/* Reward consequences */}
                        {consequences.length > 0 && (
                            <View style={styles.consequencesBlock}>
                                {consequences.map((c, i) => {
                                    if (c.eventType === "REWARD_EARNED") {
                                        return (
                                            <View key={i}>
                                                <View style={styles.rewardRow}>
                                                    {(c.xpGained ?? 0) > 0 && (
                                                        <View style={[
                                                            styles.rewardChip,
                                                            styles.rewardChipXp,
                                                            xpMultiplier > 1 && { borderWidth: 2, borderColor: "#007AFF" },
                                                        ]}>
                                                            <Zap size={13} color="#FFF" />
                                                            <Text style={styles.rewardChipText}>+{c.xpGained} XP</Text>
                                                            {xpMultiplier > 1 && (
                                                                <View style={[styles.multiplierBadge, { borderColor: "#007AFF" }]}>
                                                                    <Text style={[styles.multiplierText, { color: "#007AFF" }]}>x{xpMultiplier}</Text>
                                                                </View>
                                                            )}
                                                        </View>
                                                    )}
                                                    {(c.goldGained ?? 0) > 0 && (
                                                        <View style={[
                                                            styles.rewardChip,
                                                            styles.rewardChipGold,
                                                            goldMultiplier > 1 && { borderWidth: 2, borderColor: "#FFB800" },
                                                        ]}>
                                                            <Coins size={13} color="#4A3B00" />
                                                            <Text style={[styles.rewardChipText, { color: "#4A3B00" }]}>+{c.goldGained} vàng</Text>
                                                            {goldMultiplier > 1 && (
                                                                <View style={[styles.multiplierBadge, { borderColor: "#FFB800" }]}>
                                                                    <Text style={[styles.multiplierText, { color: "#FFB800" }]}>x{goldMultiplier}</Text>
                                                                </View>
                                                            )}
                                                        </View>
                                                    )}
                                                </View>
                                                {c.itemsGained && c.itemsGained.length > 0 && (
                                                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8, justifyContent: "center" }}>
                                                        {c.itemsGained.map((item: any, idx: number) => (
                                                            <View key={idx} style={{ flexDirection: "row", alignItems: "center", backgroundColor: colors.surfaceVariant, borderWidth: 1, borderColor: colors.borderMedium, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6, gap: 6 }}>
                                                                {item.imgUrl ? (
                                                                    <Image source={{ uri: item.imgUrl }} style={{ width: 16, height: 16, resizeMode: "contain" }} />
                                                                ) : (
                                                                    <Package size={13} color={colors.textPrimary} />
                                                                )}
                                                                <Text style={{ fontSize: 12, fontFamily: typography.fonts.medium, color: colors.textPrimary }}>
                                                                    {item.name} x{item.quantity}
                                                                </Text>
                                                            </View>
                                                        ))}
                                                    </View>
                                                )}
                                            </View>
                                        );
                                    }
                                    if (c.eventType === "STREAK_UPDATED") {
                                        return (
                                            <View
                                                key={i}
                                                style={styles.streakRow}
                                            >
                                                <Flame
                                                    size={13}
                                                    color={colors.warning}
                                                />
                                                <Text style={styles.streakText}>
                                                    {c.message}
                                                </Text>
                                            </View>
                                        );
                                    }
                                    return null;
                                })}
                            </View>
                        )}
                    </Animated.View>

                    {/* Action buttons */}
                    <Animated.View
                        entering={FadeInDown.delay(150).duration(450)}
                        style={styles.resultActions}
                    >
                        {hasWrongAnswers && (
                            <RipplePillButton
                                icon={<RotateCcw size={16} color={colors.textLight} />}
                                text="Làm lại câu sai"
                                onPress={startImmediateRedoWrong}
                            />
                        )}

                        <TouchableOpacity
                            style={styles.restartBtn}
                            onPress={actions.restart}
                        >
                            <Text style={styles.restartBtnText}>Làm lại</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.viewDetailsBtn}
                            onPress={preventDoubleTap(() => {
                                router.push({
                                    pathname: "/(10_proflie)/10_5_test_detail",
                                    params: { logId: String(userTestLog.id) },
                                });
                            })}
                        >
                            <Text style={styles.viewDetailsBtnText}>
                                Xem chi tiết bài làm
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.exitBtn}
                            onPress={preventDoubleTap(onExit || (() => router.back()))}
                        >
                            <ArrowLeft size={16} color={colors.primary} />
                            <Text style={styles.exitBtnText}>Về bài học</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </ScrollView>

                {activeMilestone && (
                    <Modal
                        visible={true}
                        transparent={true}
                        animationType="fade"
                        onRequestClose={() => {}}
                    >
                        <Pressable style={{
                            flex: 1,
                            backgroundColor: "rgba(0, 0, 0, 0.45)",
                            justifyContent: "center",
                            alignItems: "center",
                            padding: 24,
                        }}>
                            <Pressable style={{
                                backgroundColor: colors.surface,
                                borderRadius: 12,
                                padding: 24,
                                width: "100%",
                                maxWidth: 340,
                                alignItems: "center",
                                borderWidth: 1,
                                borderColor: colors.borderMedium,
                            }} onPress={(e) => e.stopPropagation()}>
                                <Mascot
                                    expression="very-happy"
                                    width={100}
                                    height={100}
                                    style={{ marginBottom: 16 }}
                                />
                                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 }}>
                                    {activeMilestone.eventType === "STREAK_MILESTONE" ? (
                                        <Flame size={20} color={colors.warning} />
                                    ) : (
                                        <Trophy size={20} color={colors.secondary} />
                                    )}
                                    <Text style={{
                                        fontFamily: typography.fonts.bold,
                                        fontSize: 18,
                                        color: colors.textDark,
                                        textAlign: "center",
                                    }}>
                                        {activeMilestone.eventType === "STREAK_MILESTONE" ? "Chuỗi Ngày Mới!" : "Hạng Mới!"}
                                    </Text>
                                </View>
                                <Text style={{
                                    fontFamily: typography.fonts.medium,
                                    fontSize: 14,
                                    color: colors.textSecondary,
                                    textAlign: "center",
                                    marginBottom: 16,
                                    lineHeight: 20,
                                }}>
                                    {activeMilestone.message}
                                </Text>

                                {/* Rewards inside modal */}
                                <View style={{ flexDirection: "row", justifyContent: "center", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
                                    {(activeMilestone.xpGained ?? 0) > 0 && (
                                        <View style={[
                                            styles.rewardChip,
                                            styles.rewardChipXp,
                                            { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
                                            xpMultiplier > 1 && { borderWidth: 2, borderColor: "#007AFF" },
                                        ]}>
                                            <Zap size={13} color="#FFF" />
                                            <Text style={styles.rewardChipText}>+{activeMilestone.xpGained} XP</Text>
                                            {xpMultiplier > 1 && (
                                                <View style={[styles.multiplierBadge, { borderColor: "#007AFF" }]}>
                                                    <Text style={[styles.multiplierText, { color: "#007AFF" }]}>x{xpMultiplier}</Text>
                                                </View>
                                            )}
                                        </View>
                                    )}
                                    {(activeMilestone.goldGained ?? 0) > 0 && (
                                        <View style={[
                                            styles.rewardChip,
                                            styles.rewardChipGold,
                                            { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
                                            goldMultiplier > 1 && { borderWidth: 2, borderColor: "#FFB800" },
                                        ]}>
                                            <Coins size={13} color="#4A3B00" />
                                            <Text style={[styles.rewardChipText, { color: "#4A3B00" }]}>+{activeMilestone.goldGained} vàng</Text>
                                            {goldMultiplier > 1 && (
                                                <View style={[styles.multiplierBadge, { borderColor: "#FFB800" }]}>
                                                    <Text style={[styles.multiplierText, { color: "#FFB800" }]}>x{goldMultiplier}</Text>
                                                </View>
                                            )}
                                        </View>
                                    )}
                                </View>

                                {activeMilestone.itemsGained && activeMilestone.itemsGained.length > 0 && (
                                    <View style={{ width: "100%", alignItems: "center", marginBottom: 20 }}>
                                        <Text style={{ fontSize: 12, fontFamily: typography.fonts.bold, color: colors.textSecondary, marginBottom: 8 }}>
                                            Vật phẩm nhận được:
                                            </Text>
                                        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
                                            {activeMilestone.itemsGained.map((item: any, idx: number) => (
                                                <View key={idx} style={{ flexDirection: "row", alignItems: "center", backgroundColor: colors.surfaceVariant, borderWidth: 1, borderColor: colors.borderMedium, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6, gap: 6 }}>
                                                    {item.imgUrl ? (
                                                        <Image source={{ uri: item.imgUrl }} style={{ width: 16, height: 16, resizeMode: "contain" }} />
                                                    ) : (
                                                        <Package size={13} color={colors.textPrimary} />
                                                    )}
                                                    <Text style={{ fontSize: 12, fontFamily: typography.fonts.medium, color: colors.textPrimary }}>
                                                        {item.name} x{item.quantity}
                                                    </Text>
                                                </View>
                                            ))}
                                        </View>
                                    </View>
                                )}

                                <View style={{ width: "100%" }}>
                                    <TouchableOpacity
                                        style={{
                                            paddingVertical: 14,
                                            borderRadius: 12,
                                            backgroundColor: colors.primary,
                                            alignItems: "center",
                                            justifyContent: "center",
                                        }}
                                        onPress={() => {
                                            const nextQueue = milestoneQueue.slice(1);
                                            setMilestoneQueue(nextQueue);
                                            if (nextQueue.length > 0) {
                                                setActiveMilestone(nextQueue[0]);
                                            } else {
                                                setActiveMilestone(null);
                                            }
                                        }}
                                        activeOpacity={0.8}
                                    >
                                        <Text style={{
                                            fontFamily: typography.fonts.bold,
                                            fontSize: 15,
                                            color: colors.textLight,
                                        }}>
                                            Tuyệt vời
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </Pressable>
                        </Pressable>
                    </Modal>
                )}
            </ScreenWrapper>
        );
    }

    // ── Running state ────────────────────────────────────────────────
    if (status !== "running" && status !== "submitting") return null;

    const evalResult = currentQuestion
        ? getEvalForQuestion(currentQuestion.id)
        : null;
    const answered = currentQuestion
        ? isQuestionAnswered(currentQuestion.id)
        : false;
    const showFeedback = purposeType === "PRACTICE" && !!evalResult;

    const runningBranchConfig = {
        ...branchConfig,
        hideBack: true,
        hideHome: true,
        rightElement: (
            <TouchableOpacity
                style={{
                    backgroundColor: "rgba(255, 255, 255, 0.2)",
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 30,
                    opacity: status === "submitting" ? 0.5 : 1,
                }}
                onPress={() => {
                    if (status === "submitting") return;
                    if (purposeType === "EXAM") {
                        setShowSubmitConfirm(true);
                    } else {
                        setShowPracticeConfirm(true);
                    }
                }}
                disabled={status === "submitting"}
                activeOpacity={0.7}
            >
                <Text style={{ color: "#FFFFFF", fontFamily: typography.fonts.bold, fontSize: 14 }}>
                    Nộp bài
                </Text>
            </TouchableOpacity>
        ),
    };

    return (
        <ScreenWrapper branchConfig={runningBranchConfig} showTopBar={false} showHistoricalBackground={false}>
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <Text style={styles.headerProgress}>
                            {currentIndex + 1}/{totalCount}
                        </Text>
                        {purposeType === "PRACTICE" && (
                            <AnimatedProgressBar
                                currentIndex={currentIndex}
                                totalCount={totalCount}
                            />
                        )}
                    </View>
                    {purposeType === "PRACTICE" && (
                        <View style={{ position: "relative" }}>
                            {pointsDiff !== null && (
                                <Animated.View style={animStyle}>
                                    <Text style={styles.diffPointsText}>
                                        +{formatScore(pointsDiff)}
                                    </Text>
                                </Animated.View>
                            )}
                            <View style={styles.scoreBadge}>
                                <Text style={styles.scoreBadgeText}>
                                    Điểm: {formatScore(practiceEarned)}/
                                    {formatScore(practiceTotal)}
                                </Text>
                            </View>
                        </View>
                    )}
                    {purposeType === "EXAM" && timeLeft > 0 && (
                        <AnimatedTimerBadge
                            timeLeft={timeLeft}
                            formattedTime={formattedTime}
                        />
                    )}
                </View>

                {/* Question content */}
                <ScrollView
                    style={styles.questionScroll}
                    contentContainerStyle={[
                        styles.questionContent,
                        showFeedback && { paddingBottom: 220 },
                    ]}
                >
                    {currentQuestion && (
                        <Animated.View
                            key={currentIndex}
                            entering={FadeIn.duration(250)}
                        >
                            <View style={styles.promptHeader}>
                                <View style={{ flex: 1 }}>
                                    <AppHtmlRenderer
                                        contentWidth={width - 100}
                                        html={currentQuestion.promptText || ""}
                                        baseStyle={{
                                            color: colors.textPrimary,
                                            fontSize: 16,
                                            fontFamily: typography.fonts.bold,
                                            lineHeight: 24,
                                        }}
                                    />
                                </View>
                                <View style={{ flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                                    <TouchableOpacity
                                        onPress={() => setFeedbackModalVisible(true)}
                                        style={{ padding: 4 }}
                                        activeOpacity={0.7}
                                    >
                                        <Flag size={18} color={colors.textSecondary} />
                                    </TouchableOpacity>
                                    <View style={[styles.pointPill, { flexDirection: "row", alignItems: "center", gap: 4 }]}>
                                        <Text style={styles.pointPillText}>
                                            {(() => {
                                                const range =
                                                    getQuestionPointsRange(
                                                        currentQuestion,
                                                    );
                                                const isChooseMulti =
                                                    currentQuestion.type === "CHOOSE" &&
                                                    !isSingleChoice(currentQuestion);
                                                if (isChooseMulti) {
                                                    return `Tối đa ${formatScore(range.max)}đ`;
                                                }
                                                if (range.isRange) {
                                                    return `${formatScore(range.min)} - ${formatScore(range.max)}đ`;
                                                }
                                                return `${formatScore(range.max)}đ`;
                                            })()}
                                        </Text>
                                        {currentQuestion.type === "CHOOSE" &&
                                            !isSingleChoice(currentQuestion) && (
                                                <TouchableOpacity
                                                    onPress={() => setShowExplanationTooltip(!showExplanationTooltip)}
                                                    style={styles.helpIconContainer}
                                                    activeOpacity={0.7}
                                                >
                                                    <HelpCircle size={13} color={colors.textSuccess} />
                                                </TouchableOpacity>
                                            )}
                                    </View>
                                </View>
                            </View>


                            {showExplanationTooltip && (
                                <View style={styles.tooltipBubble}>
                                    <View style={styles.tooltipHeader}>
                                        <Text style={styles.tooltipTitle}>Cách tính điểm chọn nhiều đáp án:</Text>
                                        <TouchableOpacity
                                            onPress={() => setShowExplanationTooltip(false)}
                                            style={styles.tooltipCloseBtn}
                                            activeOpacity={0.7}
                                        >
                                            <X size={14} color={colors.textSecondary} />
                                        </TouchableOpacity>
                                    </View>
                                    <Text style={styles.tooltipText}>
                                        • Chọn đúng mỗi đáp án: cộng điểm (+Điểm tối đa / số đáp án đúng).{"\n"}
                                        • Chọn sai mỗi đáp án: trừ điểm (-Điểm tối đa / số đáp án sai) để hạn chế đoán mò.{"\n"}
                                        • Điểm tối thiểu cho câu hỏi là 0 điểm.
                                    </Text>
                                </View>
                            )}

                            {/* Document (collapsible) */}
                            {currentQuestion.document && (
                                <CollapsibleDocument
                                    text={currentQuestion.document}
                                />
                            )}

                            {/* Question component by type */}
                            {currentQuestion.type === "CHOOSE" && (
                                <ChooseQuestion
                                    key={`${session?.id || "new"}-${currentQuestion.id}`}
                                    question={currentQuestion}
                                    userAnswer={
                                        getAnswerForQuestion(
                                            currentQuestion.id,
                                        ) as UserChooseAnswer | null
                                    }
                                    onAnswer={actions.answerChoose}
                                    showFeedback={showFeedback}
                                    evalResult={evalResult}
                                    disabled={status === "submitting"}
                                />
                            )}
                            {currentQuestion.type === "FILL" && (
                                <FillQuestion
                                    key={`${session?.id || "new"}-${currentQuestion.id}`}
                                    question={currentQuestion}
                                    userAnswer={
                                        getAnswerForQuestion(
                                            currentQuestion.id,
                                        ) as UserFillAnswer | null
                                    }
                                    onAnswer={actions.answerFill}
                                    showFeedback={showFeedback}
                                    evalResult={evalResult}
                                    disabled={status === "submitting"}
                                />
                            )}
                            {currentQuestion.type === "MATCH" && (
                                <MatchQuestion
                                    key={`${session?.id || "new"}-${currentQuestion.id}`}
                                    question={currentQuestion}
                                    userAnswer={
                                        getAnswerForQuestion(
                                            currentQuestion.id,
                                        ) as UserMatchAnswer | null
                                    }
                                    onAnswer={actions.answerMatch}
                                    showFeedback={showFeedback}
                                    evalResult={evalResult}
                                    disabled={status === "submitting"}
                                />
                            )}
                        </Animated.View>
                    )}
                </ScrollView>

                {/* Feedback Drawer (Option B) */}
                {showFeedback && evalResult && (
                    <Animated.View
                        entering={FadeInDown.duration(250)}
                        style={[
                            styles.feedbackDrawer,
                            evalResult.isCorrect
                                ? styles.feedbackDrawerCorrect
                                : styles.feedbackDrawerWrong,
                        ]}
                    >
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 4 }}>
                            <PracticeFeedbackMascot isCorrect={evalResult.isCorrect} size={42} />
                            <Text
                                style={[
                                    styles.feedbackDrawerTitle,
                                    evalResult.isCorrect
                                        ? styles.feedbackDrawerTitleCorrect
                                        : styles.feedbackDrawerTitleWrong,
                                ]}
                            >
                                {evalResult.isCorrect ? "Chính xác!" : "Chưa đúng!"}
                            </Text>
                        </View>
                        {currentQuestion?.explanation ? (
                            <ScrollView
                                style={styles.feedbackDrawerScroll}
                                contentContainerStyle={styles.feedbackDrawerScrollContent}
                                showsVerticalScrollIndicator={true}
                            >
                                <AppHtmlRenderer
                                    contentWidth={width - 64}
                                    html={currentQuestion.explanation || ""}
                                    baseStyle={{
                                        color: evalResult.isCorrect ? colors.textSuccess : colors.textError,
                                        fontSize: 14,
                                        lineHeight: 20,
                                    }}
                                />
                            </ScrollView>
                        ) : null}
                    </Animated.View>
                )}

                {/* Footer navigation */}
                <View style={styles.footer}>
                    {purposeType === "EXAM" ? (
                        <View style={{ width: "100%" }}>
                            {/* Indicators representing all questions under options */}
                            {(() => {
                                const ITEM_WIDTH = 15;
                                const GAP = 5;
                                const maxItemsPerRow = Math.max(
                                    1,
                                    Math.floor((width - 32 + GAP) / (ITEM_WIDTH + GAP)),
                                );
                                const indicatorsContainerWidth =
                                    totalCount > 0
                                        ? Math.min(totalCount, maxItemsPerRow) *
                                              (ITEM_WIDTH + GAP) -
                                          GAP
                                        : 0;

                                return (
                                    <View
                                        style={[
                                            styles.blockIndicatorsRow,
                                            { maxWidth: indicatorsContainerWidth },
                                        ]}
                                    >
                                        {Array.from(
                                            { length: totalCount },
                                            (_, idx) => {
                                                const q = questions[idx];
                                                const isActive = idx === currentIndex;
                                                const isAnswered = q
                                                    ? isQuestionAnswered(q.id)
                                                    : false;

                                                return (
                                                    <TouchableOpacity
                                                        key={idx}
                                                        style={[
                                                            styles.blockIndicator,
                                                            isAnswered &&
                                                                styles.blockIndicatorAnswered,
                                                            isActive &&
                                                                styles.blockIndicatorActive,
                                                        ]}
                                                        onPress={() =>
                                                            actions.jumpTo(idx)
                                                        }
                                                        activeOpacity={0.7}
                                                    />
                                                );
                                            },
                                        )}
                                    </View>
                                );
                            })()}

                            <View style={styles.navButtonsRow}>
                                <TouchableOpacity
                                    style={[
                                        styles.navBtn,
                                        currentIndex === 0 &&
                                            styles.navBtnDisabled,
                                    ]}
                                    onPress={actions.goPrev}
                                    disabled={currentIndex === 0}
                                >
                                    <Text style={styles.navBtnText}>
                                        ← Trước
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.navBtn}
                                    onPress={() => setIsListModalVisible(true)}
                                    activeOpacity={0.7}
                                >
                                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                                        <Grid size={14} color={colors.textSecondary} />
                                        <Text style={styles.navBtnText}>
                                            Danh sách
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[
                                        styles.navBtn,
                                        currentIndex === totalCount - 1 &&
                                            styles.navBtnDisabled,
                                    ]}
                                    onPress={actions.goNext}
                                    disabled={currentIndex === totalCount - 1}
                                >
                                    <Text style={styles.navBtnText}>Sau →</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : (
                        // Practice: confirm first, then next/submit
                        <TouchableOpacity
                            style={[
                                styles.nextBtn,
                                !showFeedback &&
                                    !answered &&
                                    styles.nextBtnDisabled,
                            ]}
                            onPress={() => {
                                if (!showFeedback) {
                                    actions.confirmAnswer();
                                } else {
                                    if (currentIndex < totalCount - 1) {
                                        actions.goNext();
                                    } else {
                                        actions.submit();
                                    }
                                }
                            }}
                            disabled={!showFeedback && !answered}
                        >
                            <Text style={styles.nextBtnText}>
                                {!showFeedback
                                    ? "Xác nhận"
                                    : currentIndex < totalCount - 1
                                      ? "Tiếp theo →"
                                      : "Hoàn thành"}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Confirmation Modals */}
                <CustomModal
                    visible={showSubmitConfirm}
                    title="Nộp bài"
                    message="Bạn có chắc chắn muốn nộp bài làm của mình?"
                    confirmText="Nộp"
                    cancelText="Hủy"
                    onConfirm={() => {
                        setShowSubmitConfirm(false);
                        actions.submit();
                    }}
                    onCancel={() => setShowSubmitConfirm(false)}
                />

                <CustomModal
                    visible={showPracticeConfirm}
                    title="Nộp bài luyện tập"
                    message="Bạn có chắc chắn muốn nộp bài làm và kết thúc luyện tập?"
                    confirmText="Nộp bài"
                    cancelText="Hủy"
                    onConfirm={() => {
                        setShowPracticeConfirm(false);
                        actions.submit();
                    }}
                    onCancel={() => setShowPracticeConfirm(false)}
                />

                {/* Submitting Status Modal Overlay */}
                {status === "submitting" && (
                    <View style={styles.modalOverlay}>
                        <ActivityIndicator
                            size="large"
                            color={colors.primary}
                        />
                    </View>
                )}

                {/* List of questions Modal (Drawer style) */}
                <Modal
                    visible={isListModalVisible}
                    transparent={true}
                    animationType="slide"
                    onRequestClose={() => setIsListModalVisible(false)}
                >
                    <View style={styles.drawerOverlay}>
                        <View style={styles.modalDrawerContainer}>
                            <View style={styles.modalDragIndicator} />

                            <View style={styles.modalDrawerHeader}>
                                <Text style={styles.modalDrawerTitle}>
                                    Danh sách câu hỏi
                                </Text>
                                <TouchableOpacity
                                    style={styles.modalCloseButton}
                                    onPress={() => setIsListModalVisible(false)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.modalCloseText}>
                                        Đóng
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            <ScrollView
                                contentContainerStyle={styles.modalDrawerGrid}
                            >
                                {Array.from(
                                    { length: totalCount },
                                    (_, idx) => {
                                        const q = questions[idx];
                                        const isActive = idx === currentIndex;
                                        const isAnswered = q
                                            ? isQuestionAnswered(q.id)
                                            : false;

                                        return (
                                            <TouchableOpacity
                                                key={idx}
                                                style={[
                                                    styles.gridItemDrawer,
                                                    isAnswered &&
                                                        styles.gridItemAnsweredDrawer,
                                                    isActive &&
                                                        styles.gridItemActiveDrawer,
                                                ]}
                                                onPress={() => {
                                                    actions.jumpTo(idx);
                                                    setIsListModalVisible(
                                                        false,
                                                    );
                                                }}
                                                activeOpacity={0.7}
                                            >
                                                <Text
                                                    style={[
                                                        styles.gridItemTextDrawer,
                                                        isAnswered &&
                                                            styles.gridItemTextAnsweredDrawer,
                                                        isActive &&
                                                            styles.gridItemTextActiveDrawer,
                                                    ]}
                                                >
                                                    {idx + 1}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    },
                                )}
                            </ScrollView>
                        </View>
                    </View>
                </Modal>
                {/* Context Feedback Modal */}
                {currentQuestion && (
                    <FeedbackModal
                        visible={feedbackModalVisible}
                        onClose={() => setFeedbackModalVisible(false)}
                        targetType="QUESTION"
                        targetId={currentQuestion.id}
                        targetTitle={`Câu hỏi số ${currentIndex + 1}: ${stripHtml(currentQuestion.promptText).substring(0, 55)}...`}
                    />
                )}
            </View>
        </ScreenWrapper>
    );
}


// ── Collapsible document component ──────────────────────────────────
function CollapsibleDocument({ text }: { text: string }) {
    const [expanded, setExpanded] = useState(true);
    const { width } = useWindowDimensions();
    return (
        <View style={styles.docContainer}>
            <TouchableOpacity
                onPress={() => setExpanded(!expanded)}
                style={styles.docToggle}
            >
                <Text style={styles.docToggleText}>
                    {expanded ? "▼ Tư liệu" : "▶ Tư liệu"}
                </Text>
            </TouchableOpacity>
            {expanded && (
                <View style={styles.docContent}>
                    <AppHtmlRenderer
                        contentWidth={width - 56}
                        html={text || ""}
                        baseStyle={{
                            color: colors.textSecondary,
                            fontSize: 14,
                            fontFamily: typography.fonts.regular,
                            lineHeight: 22,
                        }}
                    />
                </View>
            )}
        </View>
    );
}

const { height: screenHeight } = Dimensions.get("window");

const styles = StyleSheet.create({
    docContent: {
        padding: 12,
        paddingTop: 0,
    },
    container: { flex: 1 },
    centerContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 40,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 15,
        color: colors.textMuted,
        fontFamily: typography.fonts.semiBold,
    },
    errorText: {
        fontSize: 15,
        color: colors.textError,
        fontFamily: typography.fonts.semiBold,
        textAlign: "center",
        marginBottom: 16,
    },
    retryBtn: {
        backgroundColor: colors.primary,
        borderRadius: 5,
        paddingHorizontal: 24,
        paddingVertical: 12,
    },
    retryBtnText: { color: colors.textLight, fontFamily: typography.fonts.bold, fontSize: 14 },
    scrollContent: { padding: 16, paddingBottom: 40 },

    // Header
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 16,
        paddingBottom: 8,
    },
    headerLeft: { flex: 1, gap: 6 },
    headerProgress: { fontSize: 13, fontFamily: typography.fonts.extraBold, color: colors.primary },
    progressBar: {
        height: 4,
        backgroundColor: colors.borderMedium,
        borderRadius: 2,
    },
    progressFill: {
        height: "100%",
        backgroundColor: colors.primary,
        borderRadius: 2,
    },
    timerBadge: {
        backgroundColor: colors.primaryContainer,
        borderRadius: 5,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    timerWarning: { backgroundColor: colors.errorContainer },
    timerText: { fontSize: 13, fontFamily: typography.fonts.extraBold, color: colors.primary },
    timerTextWarning: { color: colors.textError },

    // Question
    questionScroll: { flex: 1 },
    questionContent: { padding: 16 },
    questionPrompt: {
        fontSize: 16,
        fontFamily: typography.fonts.bold,
        color: colors.textPrimary,
        lineHeight: 24,
        marginBottom: 16,
    },

    // Document
    docContainer: {
        marginBottom: 16,
        backgroundColor: colors.surface,
        borderRadius: 5,
        borderWidth: 1,
        borderColor: colors.borderMedium,
        overflow: "hidden",
    },
    docToggle: { padding: 12 },
    docToggleText: { fontSize: 13, fontFamily: typography.fonts.bold, color: colors.primary },
    docText: {
        fontSize: 14,
        color: colors.textSecondary,
        lineHeight: 22,
        padding: 12,
        paddingTop: 0,
        fontFamily: typography.fonts.regular,
    },

    // Explanation
    explanationBox: {
        marginTop: 16,
        borderRadius: 5,
        padding: 14,
        borderWidth: 1,
        borderColor: colors.success,
    },
    explanationLabel: {
        fontSize: 12,
        fontFamily: typography.fonts.extraBold,
        color: colors.textSuccess,
        marginBottom: 4,
    },
    explanationText: {
        fontSize: 14,
        color: colors.textSuccess,
        lineHeight: 20,
        fontFamily: typography.fonts.regular,
    },

    // Footer
    footer: {
        flexDirection: "row",
        padding: 16,
        gap: 10,
        borderTopWidth: 1,
        borderTopColor: colors.borderMedium,
    },
    navBtn: {
        flex: 1,
        backgroundColor: colors.surface,
        borderRadius: 5,
        paddingVertical: 14,
        alignItems: "center",
        borderWidth: 1.5,
        borderColor: colors.borderMedium,
    },
    navBtnDisabled: { opacity: 0.4 },
    navBtnText: {
        fontSize: 14,
        fontFamily: typography.fonts.bold,
        color: colors.textSecondary,
    },
    submitBtn: {
        flex: 1,
        backgroundColor: colors.primary,
        borderRadius: 5,
        paddingVertical: 14,
        alignItems: "center",
    },
    submitBtnText: { fontSize: 14, fontFamily: typography.fonts.bold, color: colors.textLight },
    nextBtn: {
        flex: 1,
        backgroundColor: colors.primary,
        borderRadius: 5,
        paddingVertical: 14,
        alignItems: "center",
    },
    nextBtnDisabled: { opacity: 0.4 },
    nextBtnText: { fontSize: 14, fontFamily: typography.fonts.bold, color: colors.textLight },
    blockIndicatorsRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "flex-start",
        alignSelf: "center",
        gap: 5,
        marginTop: 4,
        marginBottom: 12,
    },
    blockIndicator: {
        width: 15,
        height: 3,
        borderRadius: 100,
        backgroundColor: colors.borderMedium,
    },
    blockIndicatorAnswered: {
        backgroundColor: colors.info,
    },
    blockIndicatorActive: {
        backgroundColor: colors.primary,
    },
    navButtonsRow: {
        flexDirection: "row",
        gap: 12,
        marginTop: 12,
    },
    listLink: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
    },
    listLinkText: {
        fontSize: 13,
        fontFamily: typography.fonts.bold,
        color: colors.textMuted,
    },
    drawerOverlay: {
        flex: 1,
        backgroundColor: "rgba(15, 12, 38, 0.45)",
        justifyContent: "flex-end",
    },
    modalDrawerContainer: {
        backgroundColor: colors.surface,
        borderTopLeftRadius: 5,
        borderTopRightRadius: 5,
        maxHeight: screenHeight * 0.7,
        paddingBottom: 32,
    },
    modalDragIndicator: {
        width: 36,
        height: 5,
        backgroundColor: colors.borderMedium,
        borderRadius: 100,
        alignSelf: "center",
        marginTop: 10,
        marginBottom: 10,
    },
    modalDrawerHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 24,
        paddingBottom: 18,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderLight,
    },
    modalDrawerTitle: {
        fontSize: 18,
        fontFamily: typography.fonts.extraBold,
        color: colors.textPrimary,
    },
    modalCloseButton: {
        paddingVertical: 6,
        paddingHorizontal: 14,
        borderRadius: 5,
        backgroundColor: colors.surfaceVariant,
        borderWidth: 1,
        borderColor: colors.borderMedium,
    },
    modalCloseText: {
        fontSize: 12,
        fontFamily: typography.fonts.bold,
        color: colors.textMuted,
    },
    modalDrawerGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
        padding: 24,
    },
    gridItemDrawer: {
        width: 56,
        height: 56,
        borderRadius: 5,
        borderWidth: 1.5,
        borderColor: colors.borderMedium,
        backgroundColor: colors.surface,
        alignItems: "center",
        justifyContent: "center",
    },
    gridItemAnsweredDrawer: {
        backgroundColor: colors.primaryContainer,
        borderColor: colors.borderMedium,
    },
    gridItemActiveDrawer: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    gridItemTextDrawer: {
        fontSize: 16,
        fontFamily: typography.fonts.extraBold,
        color: colors.textMuted,
    },
    gridItemTextAnsweredDrawer: {
        color: colors.primary,
    },
    gridItemTextActiveDrawer: {
        color: colors.textLight,
    }, // Result screen
    resultCard: {
        backgroundColor: colors.surface,
        borderRadius: 5,
        padding: 24,
        alignItems: "center",
        borderWidth: 1,
        borderColor: colors.borderMedium,
        marginBottom: 20,
    },
    resultEmoji: { fontSize: 48, marginBottom: 8 },
    resultTitle: {
        fontSize: 22,
        fontFamily: typography.fonts.black,
        color: colors.textPrimary,
        marginBottom: 8,
    },
    scoreRow: { flexDirection: "row", alignItems: "baseline" },
    scoreValue: { fontSize: 48, fontFamily: typography.fonts.black, color: colors.primary },
    scoreMax: {
        fontSize: 20,
        fontFamily: typography.fonts.bold,
        color: colors.textMuted,
        marginLeft: 2,
    },
    resultSubtext: {
        fontSize: 14,
        color: colors.textMuted,
        fontFamily: typography.fonts.semiBold,
        marginTop: 4,
    },
    consequencesBlock: {
        marginTop: 12,
        gap: 8,
        alignItems: "center",
    },
    rewardRow: {
        flexDirection: "row",
        gap: 8,
        justifyContent: "center",
        flexWrap: "wrap",
    },
    rewardChip: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        borderRadius: 30,
        paddingHorizontal: 12,
        paddingVertical: 6,
        position: "relative",
    },
    rewardChipXp: { backgroundColor: colors.primary },
    rewardChipGold: { backgroundColor: colors.gold },
    rewardChipText: { fontSize: 12, fontFamily: typography.fonts.bold, color: "#FFFFFF" },
    multiplierBadge: {
        position: "absolute",
        top: -8,
        right: -8,
        backgroundColor: "#FFFFFF",
        paddingHorizontal: 4,
        paddingVertical: 1,
        borderRadius: 30,
        borderWidth: 1.5,
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10,
    },
    multiplierText: {
        fontSize: 9,
        fontFamily: typography.fonts.bold,
    },
    milestoneRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: colors.warningContainer,
        borderRadius: 30,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    milestoneText: {
        fontSize: 12,
        fontFamily: typography.fonts.bold,
        color: colors.textWarning,
    },
    streakRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    streakText: { fontSize: 12, fontFamily: typography.fonts.semiBold, color: colors.textMuted },
    resultActions: { gap: 10, marginBottom: 24 },
    redoBtn: {
        backgroundColor: colors.warning,
        borderRadius: 30,
        paddingVertical: 14,
        paddingHorizontal: 20,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        gap: 8,
    },
    redoBtnText: { fontSize: 14, fontFamily: typography.fonts.bold, color: colors.textLight },
    restartBtn: {
        backgroundColor: colors.primary,
        borderRadius: 30,
        paddingVertical: 14,
        alignItems: "center",
    },
    restartBtnText: {
        fontSize: 14,
        fontFamily: typography.fonts.bold,
        color: colors.textLight,
    },
    exitBtn: {
        backgroundColor: colors.surface,
        borderRadius: 30,
        paddingVertical: 14,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        gap: 6,
        borderWidth: 1.5,
        borderColor: colors.primary,
    },
    exitBtnText: { fontSize: 14, fontFamily: typography.fonts.bold, color: colors.primary },
    viewDetailsBtn: {
        backgroundColor: colors.surface,
        borderRadius: 30,
        paddingVertical: 14,
        alignItems: "center",
        borderWidth: 1.5,
        borderColor: colors.primary,
    },
    viewDetailsBtnText: {
        fontSize: 14,
        fontFamily: typography.fonts.bold,
        color: colors.primary,
    },

    // Review
    sectionTitle: {
        fontSize: 16,
        fontFamily: typography.fonts.extraBold,
        color: colors.textPrimary,
        marginBottom: 12,
    },
    reviewCard: {
        backgroundColor: colors.surface,
        borderRadius: 5,
        padding: 14,
        borderWidth: 1,
        borderColor: colors.borderMedium,
        marginBottom: 10,
    },
    reviewHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 6,
    },
    reviewIndex: {
        fontSize: 12,
        fontFamily: typography.fonts.extraBold,
        color: colors.textPlaceholder,
    },
    reviewBadge: {
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 5,
    },
    badgeCorrect: { backgroundColor: colors.successContainer },
    badgeWrong: { backgroundColor: colors.errorContainer },
    reviewBadgeText: { fontSize: 11, fontFamily: typography.fonts.extraBold },
    badgeTextCorrect: { color: colors.textSuccess },
    badgeTextWrong: { color: colors.textError },
    reviewQuestion: {
        fontSize: 14,
        fontFamily: typography.fonts.semiBold,
        color: colors.textSecondary,
        lineHeight: 20,
        textAlign: (Platform.OS === "ios" ? "justify" : "left") as "justify" | "left",
    },
    modalOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.4)",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
    },
    modalCard: {
        backgroundColor: colors.surface,
        borderRadius: 5,
        padding: 24,
        width: "85%",
        maxWidth: 400,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 18,
        fontFamily: typography.fonts.extraBold,
        color: colors.textPrimary,
        marginBottom: 10,
    },
    modalMessage: {
        fontSize: 14,
        color: colors.textMuted,
        textAlign: "center",
        marginBottom: 20,
        lineHeight: 20,
    },
    modalButtons: {
        flexDirection: "row",
        width: "100%",
        gap: 12,
    },
    modalCancelBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 5,
        backgroundColor: colors.surfaceVariant,
        alignItems: "center",
    },
    modalCancelText: {
        fontSize: 15,
        fontFamily: typography.fonts.bold,
        color: colors.textSecondary,
    },
    modalConfirmBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 5,
        backgroundColor: colors.primary,
        alignItems: "center",
    },
    modalConfirmText: {
        fontSize: 15,
        fontFamily: typography.fonts.bold,
        color: colors.textLight,
    },
    optionsList: { gap: 8, marginTop: 8 },
    optItem: {
        backgroundColor: colors.surface,
        borderWidth: 1.5,
        borderColor: colors.borderMedium,
        borderRadius: 5,
        padding: 12,
    },
    optCorrect: {
        borderColor: colors.success,
        backgroundColor: colors.successContainer,
    },
    optWrong: {
        borderColor: colors.error,
        backgroundColor: colors.errorContainer,
    },
    optText: { fontSize: 14, fontFamily: typography.fonts.semiBold, color: colors.textSecondary, textAlign: (Platform.OS === "ios" ? "justify" : "left") as "justify" | "left" },
    optTextCorrect: { color: colors.textSuccess },
    optTextWrong: { color: colors.textError },
    fillContainer: {
        backgroundColor: colors.surfaceVariant,
        borderRadius: 5,
        padding: 12,
        gap: 8,
        marginTop: 8,
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
    matchContainer: { gap: 8, marginTop: 8 },
    matchRow: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.surfaceVariant,
        borderRadius: 5,
        padding: 10,
        borderWidth: 1,
        gap: 6,
        flexWrap: "wrap",
    },
    matchCorrect: { borderColor: colors.success },
    matchWrong: { borderColor: colors.error },
    matchText: { fontSize: 13, fontFamily: typography.fonts.semiBold, color: colors.textSecondary },
    matchArrow: { fontSize: 14, fontFamily: typography.fonts.regular, color: colors.textMuted },
    matchCorrectHint: {
        fontSize: 11,
        color: colors.success,
        fontFamily: typography.fonts.semiBold,
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
    explText: { fontSize: 13, fontFamily: typography.fonts.regular, color: colors.textSuccess, lineHeight: 20, textAlign: (Platform.OS === "ios" ? "justify" : "left") as "justify" | "left" },
    scoreBadge: {
        backgroundColor: colors.successContainer,
        borderRadius: 5,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    scoreBadgeText: {
        fontSize: 13,
        fontFamily: typography.fonts.extraBold,
        color: colors.textSuccess,
    },
    possiblePointsText: {
        fontSize: 13,
        fontFamily: typography.fonts.semiBold,
        color: colors.textMuted,
        marginBottom: 16,
    },
    diffPointsText: {
        fontSize: 14,
        fontFamily: typography.fonts.black,
        color: colors.success,
    },
    promptHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 12,
        marginBottom: 12,
    },
    pointPill: {
        backgroundColor: colors.successContainer,
        borderRadius: 5,
        paddingHorizontal: 8,
        paddingVertical: 4,
        alignSelf: "flex-start",
    },
    pointPillText: {
        fontSize: 11,
        fontFamily: typography.fonts.bold,
        color: colors.textSuccess,
    },
    helpIconContainer: {
        justifyContent: "center",
        alignItems: "center",
    },
    tooltipBubble: {
        backgroundColor: colors.primaryContainer,
        borderRadius: 12,
        padding: 12,
        marginTop: 8,
        marginBottom: 12,
    },
    tooltipHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    tooltipTitle: {
        fontSize: 13,
        fontFamily: typography.fonts.medium,
        color: colors.primary,
    },
    tooltipText: {
        fontSize: 12,
        color: colors.textSecondary,
        lineHeight: 18,
        fontFamily: typography.fonts.light,
    },
    tooltipCloseBtn: {
        padding: 2,
    },
    feedbackDrawer: {
        position: "absolute",
        left: 16,
        right: 16,
        bottom: 85,
        borderRadius: 12,
        padding: 16,
        maxHeight: 180,
    },
    feedbackDrawerCorrect: {
        backgroundColor: colors.successContainer,
    },
    feedbackDrawerWrong: {
        backgroundColor: colors.errorContainer,
    },
    feedbackDrawerTitle: {
        fontSize: 16,
        fontFamily: typography.fonts.medium,
        textAlign: "center",
        marginBottom: 8,
    },
    feedbackDrawerTitleCorrect: {
        color: colors.textSuccess,
    },
    feedbackDrawerTitleWrong: {
        color: colors.textError,
    },
    feedbackDrawerScroll: {
        flex: 1,
    },
    feedbackDrawerScrollContent: {
        paddingBottom: 4,
    },
    feedbackDrawerText: {
        fontSize: 14,
        fontFamily: typography.fonts.light,
        lineHeight: 20,
    },
    feedbackDrawerTextCorrect: {
        color: colors.textSuccess,
    },
    feedbackDrawerTextWrong: {
        color: colors.textError,
    },
});

// ── Sub-components for review ────────────────────────────────────────

function ChooseReview({
    answerData,
    userAnswer,
}: {
    answerData: ChooseAnswerData;
    userAnswer: UserChooseAnswer | null;
}) {
    const selected = userAnswer?.selectedOptions ?? [];
    return (
        <View style={styles.optionsList}>
            {answerData.options.map((opt, idx) => {
                const isSelected = selected.includes(idx);
                const isCorrect = answerData.correctOption.includes(idx);
                return (
                    <View
                        key={idx}
                        style={[
                            styles.optItem,
                            isCorrect && styles.optCorrect,
                            isSelected && !isCorrect && styles.optWrong,
                        ]}
                    >
                        <Text
                            style={[
                                styles.optText,
                                isCorrect && styles.optTextCorrect,
                                isSelected && !isCorrect && styles.optTextWrong,
                            ]}
                        >
                            {String.fromCharCode(65 + idx)}. {opt}
                        </Text>
                    </View>
                );
            })}
        </View>
    );
}

function FillReview({
    answerData,
    userAnswer,
}: {
    answerData: FillAnswerData;
    userAnswer: UserFillAnswer | null;
}) {
    const userText = userAnswer?.typedAnswer ?? "(Chưa trả lời)";
    const isCorrect = answerData.acceptedAnswers.some(
        (a) => a.trim().toLowerCase() === userText.trim().toLowerCase(),
    );
    return (
        <View style={styles.fillContainer}>
            <View style={styles.fillRow}>
                <Text style={styles.fillLabel}>Bạn trả lời:</Text>
                <Text
                    style={[
                        styles.fillValue,
                        isCorrect ? styles.textGreen : styles.textRed,
                    ]}
                >
                    {userText}
                </Text>
            </View>
            {!isCorrect && (
                <View style={styles.fillRow}>
                    <Text style={styles.fillLabel}>Đáp án chính xác:</Text>
                    <Text style={[styles.fillValue, styles.textGreen]}>
                        {answerData.acceptedAnswers.join(" / ")}
                    </Text>
                </View>
            )}
        </View>
    );
}

function MatchReview({
    answerData,
    userAnswer,
}: {
    answerData: MatchAnswerData;
    userAnswer: UserMatchAnswer | null;
}) {
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
        <View style={styles.matchContainer}>
            {normalizedPairs.map((correct, idx) => {
                const userPair = userPairs.find(
                    (p) =>
                        p.left?.trim().toLowerCase() ===
                        correct.left.trim().toLowerCase(),
                );
                const isPairCorrect =
                    userPair?.right?.trim().toLowerCase() ===
                    correct.right.trim().toLowerCase();
                return (
                    <View
                        key={idx}
                        style={[
                            styles.matchRow,
                            isPairCorrect
                                ? styles.matchCorrect
                                : styles.matchWrong,
                        ]}
                    >
                        <Text style={styles.matchText}>{correct.left}</Text>
                        <Text style={styles.matchArrow}>→</Text>
                        <Text style={styles.matchText}>
                            {userPair?.right ?? "(Không ghép)"}
                        </Text>
                        {!isPairCorrect && (
                            <Text style={styles.matchCorrectHint}>
                                {" "}
                                (Chính xác: {correct.right})
                            </Text>
                        )}
                    </View>
                );
            })}
        </View>
    );
}
