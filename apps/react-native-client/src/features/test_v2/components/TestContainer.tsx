import React, { useEffect, useState, useRef } from "react";
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
} from "react-native";
import { Grid } from "lucide-react-native";
import { useRouter } from "expo-router";
import Animated, {
    FadeIn,
    FadeInDown,
    ZoomIn,
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    Easing,
    withRepeat,
} from "react-native-reanimated";
import { ScreenWrapper } from "@/components/layout/ScreenWrapper";
import { CustomModal } from "@/components/Modal";
import Mascot from "@/components/Mascot";
import TestIntro from "./TestIntro";
import { useTestRunnerV2 } from "../hooks/useTestRunner";
import { colors } from "@/theme/colors";
import { useGetTestInfoQuery } from "../services/testApi";
import ChooseQuestion from "./ChooseQuestion";
import FillQuestion from "./FillQuestion";
import MatchQuestion from "./MatchQuestion";
import { isSingleChoice, evaluateQuestion, formatScore, getQuestionPointsRange } from "../services/scoreEngine";
import type {
    StartTestV2Request,
    QuestionV2,
    UserChooseAnswer,
    UserFillAnswer,
    UserMatchAnswer,
    ChooseAnswerData,
    FillAnswerData,
    MatchAnswerData,
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
                withTiming(1.1, { duration: 500, easing: Easing.inOut(Easing.quad) }),
                -1,
                true
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

interface TestContainerV2Props {
    params: StartTestV2Request;
    onExit?: () => void;
}

export default function TestContainerV2({
    params,
    onExit,
}: TestContainerV2Props) {
    const runner = useTestRunnerV2(params);
    const router = useRouter();
    const { data: testInfo, isLoading: isInfoLoading } = useGetTestInfoQuery(params, {
        skip: runner.status !== "idle" || params.purposeType !== "EXAM"
    });
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
        actions,
        isQuestionAnswered,
        getAnswerForQuestion,
        getEvalForQuestion,
    } = runner;

    const practiceEarned = React.useMemo(() => {
        return Object.values(evaluations).reduce((sum, ev) => sum + ev.scoreAwarded, 0);
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
            animTranslateY.value = withTiming(-24, { duration: 850 }, (finished) => {
                if (finished) {
                    animOpacity.value = withTiming(0, { duration: 200 });
                }
            });
        }
    }, [practiceEarned]);

    const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
    const [showPracticeConfirm, setShowPracticeConfirm] = useState(false);
    const [isListModalVisible, setIsListModalVisible] = useState(false);

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

    const displayTitle = session?.testTitle || (params.purposeType === "EXAM" ? "Bài thi tự do" : "Luyện tập");
    const branchConfig = {
        hierarchy: params.purposeType === "EXAM" ? "KIỂM TRA > BÀI THI" : "KIỂM TRA > LUYỆN TẬP",
        title: displayTitle,
        onBackPress: handleBack,
        onHomePress: handleBack,
    };

    // Auto-start on mount only if not EXAM
    useEffect(() => {
        if (status === "idle" && params.purposeType !== "EXAM") {
            actions.start();
        }
    }, []);

    // ── Exam Intro state ──────────────────────────────────────────────
    if (status === "idle" && params.purposeType === "EXAM") {
        return (
            <TestIntro
                title={testInfo?.title}
                questionCount={testInfo?.questionCount}
                timeLimit={testInfo?.timeLimit}
                loading={isInfoLoading}
                onStart={actions.start}
                onBack={handleBack}
                purposeType={params.purposeType}
            />
        );
    }

    // ── Loading state ────────────────────────────────────────────────
    if (status === "loading") {
        return (
            <ScreenWrapper branchConfig={branchConfig}>
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={styles.loadingText}>Đang tải bài kiểm tra...</Text>
                </View>
            </ScreenWrapper>
        );
    }

    // ── Error state ──────────────────────────────────────────────────
    if (status === "idle" && error) {
        return (
            <ScreenWrapper branchConfig={branchConfig}>
                <View style={styles.centerContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity
                        style={styles.retryBtn}
                        onPress={actions.start}
                    >
                        <Text style={styles.retryBtnText}>Thử lại</Text>
                    </TouchableOpacity>
                </View>
            </ScreenWrapper>
        );
    }

    // ── Completed state ──────────────────────────────────────────────
    if (status === "completed" && result) {
        const { userTestLog, answerLogs, consequences } = result;
        const scoreDisplay =
            userTestLog.maxScore > 0
                ? formatScore((userTestLog.scoreAwarded / userTestLog.maxScore) * 10)
                : "0";
        const hasWrongAnswers = answerLogs.some(
            (a) => a.scoreAwarded < a.maxScore,
        );

        return (
            <ScreenWrapper branchConfig={branchConfig} >
                <ScrollView
                    style={styles.container}
                    contentContainerStyle={styles.scrollContent}
                >
                    <Animated.View entering={ZoomIn.duration(400)} style={styles.resultCard}>
                        <Mascot
                            event={{ type: "finish-test", score: parseFloat(scoreDisplay) }}
                            width={150}
                            height={150}
                            style={{ marginBottom: 16 }}
                        />
                        <Text style={styles.resultTitle}>
                            {userTestLog.isPassed ? "Chúc mừng!" : "Chưa đạt"}
                        </Text>
                        <View style={styles.scoreRow}>
                            <Text style={styles.scoreValue}>{scoreDisplay}</Text>
                            <Text style={styles.scoreMax}>/10</Text>
                        </View>
                        <Text style={styles.resultSubtext}>
                            {formatScore(userTestLog.scoreAwarded)}/
                            {formatScore(userTestLog.maxScore)} điểm
                        </Text>
                        {consequences.map((c, i) => (
                            <Text key={i} style={styles.consequenceText}>
                                {c.message}
                            </Text>
                        ))}
                    </Animated.View>

                    {/* Action buttons */}
                    <Animated.View entering={FadeInDown.delay(150).duration(450)} style={styles.resultActions}>
                        <TouchableOpacity
                            style={styles.exitBtn}
                            onPress={onExit || (() => router.back())}
                        >
                            <Text style={styles.exitBtnText}>Quay lại</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.viewDetailsBtn}
                            onPress={() => {
                                router.push({
                                    pathname: "/(10_proflie)/10_5_test_detail",
                                    params: { logId: String(userTestLog.id) },
                                });
                            }}
                        >
                            <Text style={styles.viewDetailsBtnText}>
                                Xem chi tiết bài làm
                            </Text>
                        </TouchableOpacity>

                        {/* {purposeType === "PRACTICE" && hasWrongAnswers && (
                            <TouchableOpacity
                                style={styles.redoBtn}
                                onPress={actions.redoWrong}
                            >
                                <Text style={styles.redoBtnText}>
                                    Làm lại câu sai
                                </Text>
                            </TouchableOpacity>
                        )} */}
                        <TouchableOpacity
                            style={styles.restartBtn}
                            onPress={actions.restart}
                        >
                            <Text style={styles.restartBtnText}>Làm lại</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </ScrollView>
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

    return (
        <ScreenWrapper branchConfig={branchConfig} showTopBar={false}>
            <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Text style={styles.headerProgress}>
                        {currentIndex + 1}/{totalCount}
                    </Text>
                    {purposeType === "PRACTICE" && (
                        <AnimatedProgressBar currentIndex={currentIndex} totalCount={totalCount} />
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
                                Điểm: {formatScore(practiceEarned)}/{formatScore(practiceTotal)}
                            </Text>
                        </View>
                    </View>
                )}
                {purposeType === "EXAM" && timeLeft > 0 && (
                    <AnimatedTimerBadge timeLeft={timeLeft} formattedTime={formattedTime} />
                )}
            </View>



            {/* Question content */}
            <ScrollView
                style={styles.questionScroll}
                contentContainerStyle={styles.questionContent}
            >
                {currentQuestion && (
                    <Animated.View key={currentIndex} entering={FadeIn.duration(250)}>
                        <View style={styles.promptHeader}>
                            <Text style={styles.questionPrompt}>
                                {currentQuestion.promptText}
                            </Text>
                            <View style={styles.pointPill}>
                                <Text style={styles.pointPillText}>
                                    {(() => {
                                        const range = getQuestionPointsRange(currentQuestion);
                                        if (range.isRange) {
                                            return `${formatScore(range.min)} - ${formatScore(range.max)}đ`;
                                        }
                                        return `${formatScore(range.max)}đ`;
                                    })()}
                                </Text>
                            </View>
                        </View>

                        {/* Document (collapsible) */}
                        {currentQuestion.document && (
                            <CollapsibleDocument
                                text={currentQuestion.document}
                            />
                        )}

                        {/* Question component by type */}
                        {currentQuestion.type === "CHOOSE" && (
                            <ChooseQuestion
                                key={currentQuestion.id}
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
                                key={currentQuestion.id}
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
                                key={currentQuestion.id}
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

                        {/* Practice feedback: explanation */}
                        {showFeedback && currentQuestion.explanation && (
                            <View style={styles.explanationBox}>
                                <Text style={styles.explanationLabel}>
                                    Giải thích:
                                </Text>
                                <Text style={styles.explanationText}>
                                    {currentQuestion.explanation}
                                </Text>
                            </View>
                        )}
                    </Animated.View>
                )}
            </ScrollView>

            {/* Footer navigation */}
            <View style={styles.footer}>
                {purposeType === "EXAM" ? (
                    <View style={{ width: "100%" }}>
                        {/* Indicators representing all questions under options */}
                        <View style={styles.blockIndicatorsRow}>
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

                        <TouchableOpacity
                            style={styles.listLink}
                            onPress={() => setIsListModalVisible(true)}
                            activeOpacity={0.7}
                        >
                            <Grid size={16} color={colors.textMuted} />
                            <Text style={styles.listLinkText}>
                                Xem danh sách {totalCount} câu hỏi
                            </Text>
                        </TouchableOpacity>

                        <View style={styles.navButtonsRow}>
                            <TouchableOpacity
                                style={[
                                    styles.navBtn,
                                    currentIndex === 0 && styles.navBtnDisabled,
                                ]}
                                onPress={actions.goPrev}
                                disabled={currentIndex === 0}
                            >
                                <Text style={styles.navBtnText}>← Trước</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.submitBtn}
                                onPress={() => setShowSubmitConfirm(true)}
                            >
                                <Text style={styles.submitBtnText}>Nộp bài</Text>
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
                            !showFeedback && !answered && styles.nextBtnDisabled,
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
                    <View style={[styles.modalCard, { paddingVertical: 30, width: 250 }]}>
                        <ActivityIndicator size="large" color={colors.primary} />
                        <Text style={[styles.modalTitle, { marginTop: 16, marginBottom: 0 }]}>Đang nộp bài...</Text>
                    </View>
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

                        <ScrollView contentContainerStyle={styles.modalDrawerGrid}>
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
                                                setIsListModalVisible(false);
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
        </View>
        </ScreenWrapper>
    );
}

// ── Collapsible document component ──────────────────────────────────
function CollapsibleDocument({ text }: { text: string }) {
    const [expanded, setExpanded] = useState(false);
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
            {expanded && <Text style={styles.docText}>{text}</Text>}
        </View>
    );
}

const { height: screenHeight } = Dimensions.get("window");

const styles = StyleSheet.create({
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
        fontWeight: "600",
    },
    errorText: {
        fontSize: 15,
        color: colors.textError,
        fontWeight: "600",
        textAlign: "center",
        marginBottom: 16,
    },
    retryBtn: {
        backgroundColor: colors.primary,
        borderRadius: 5,
        paddingHorizontal: 24,
        paddingVertical: 12,
    },
    retryBtnText: { color: colors.textLight, fontWeight: "700", fontSize: 14 },
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
    headerProgress: { fontSize: 13, fontWeight: "800", color: colors.primary },
    progressBar: { height: 4, backgroundColor: colors.borderMedium, borderRadius: 2 },
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
    timerText: { fontSize: 13, fontWeight: "800", color: colors.primary },
    timerTextWarning: { color: colors.textError },

    // Question
    questionScroll: { flex: 1 },
    questionContent: { padding: 16 },
    questionPrompt: {
        fontSize: 16,
        fontWeight: "700",
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
    docToggleText: { fontSize: 13, fontWeight: "700", color: colors.primary },
    docText: {
        fontSize: 14,
        color: colors.textSecondary,
        lineHeight: 22,
        padding: 12,
        paddingTop: 0,
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
        fontWeight: "800",
        color: colors.textSuccess,
        marginBottom: 4,
    },
    explanationText: { fontSize: 14, color: colors.textSuccess, lineHeight: 20 },

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
    navBtnText: { fontSize: 14, fontWeight: "700", color: colors.textSecondary },
    submitBtn: {
        flex: 1,
        backgroundColor: colors.primary,
        borderRadius: 5,
        paddingVertical: 14,
        alignItems: "center",
    },
    submitBtnText: { fontSize: 14, fontWeight: "700", color: colors.textLight },
    nextBtn: {
        flex: 1,
        backgroundColor: colors.primary,
        borderRadius: 5,
        paddingVertical: 14,
        alignItems: "center",
    },
    nextBtnDisabled: { opacity: 0.4 },
    nextBtnText: { fontSize: 14, fontWeight: "700", color: colors.textLight },
    blockIndicatorsRow: {
        flexDirection: "row",
        justifyContent: "center",
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
        width: 28,
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
        fontWeight: "700",
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
        fontWeight: "800",
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
        fontWeight: "700",
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
        fontWeight: "800",
        color: colors.textMuted,
    },
    gridItemTextAnsweredDrawer: {
        color: colors.primary,
    },
    gridItemTextActiveDrawer: {
        color: colors.textLight,
    },    // Result screen
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
        fontWeight: "900",
        color: colors.textPrimary,
        marginBottom: 8,
    },
    scoreRow: { flexDirection: "row", alignItems: "baseline" },
    scoreValue: { fontSize: 48, fontWeight: "900", color: colors.primary },
    scoreMax: {
        fontSize: 20,
        fontWeight: "700",
        color: colors.textMuted,
        marginLeft: 2,
    },
    resultSubtext: {
        fontSize: 14,
        color: colors.textMuted,
        fontWeight: "600",
        marginTop: 4,
    },
    consequenceText: {
        fontSize: 13,
        color: colors.textSuccess,
        fontWeight: "600",
        marginTop: 6,
    },
    resultActions: { gap: 10, marginBottom: 24 },
    redoBtn: {
        backgroundColor: colors.warning,
        borderRadius: 5,
        paddingVertical: 14,
        alignItems: "center",
    },
    redoBtnText: { fontSize: 14, fontWeight: "700", color: colors.textLight },
    restartBtn: {
        backgroundColor: colors.primary,
        borderRadius: 5,
        paddingVertical: 14,
        alignItems: "center",
    },
    restartBtnText: { fontSize: 14, fontWeight: "700", color: colors.textLight },
    exitBtn: {
        backgroundColor: colors.surface,
        borderRadius: 5,
        paddingVertical: 14,
        alignItems: "center",
        borderWidth: 1.5,
        borderColor: colors.borderMedium,
    },
    exitBtnText: { fontSize: 14, fontWeight: "700", color: colors.textSecondary },
    viewDetailsBtn: {
        backgroundColor: colors.surface,
        borderRadius: 5,
        paddingVertical: 14,
        alignItems: "center",
        borderWidth: 1.5,
        borderColor: colors.primary,
    },
    viewDetailsBtnText: { fontSize: 14, fontWeight: "700", color: colors.primary },

    // Review
    sectionTitle: {
        fontSize: 16,
        fontWeight: "800",
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
    reviewIndex: { fontSize: 12, fontWeight: "800", color: colors.textPlaceholder },
    reviewBadge: {
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 5,
    },
    badgeCorrect: { backgroundColor: colors.successContainer },
    badgeWrong: { backgroundColor: colors.errorContainer },
    reviewBadgeText: { fontSize: 11, fontWeight: "800" },
    badgeTextCorrect: { color: colors.textSuccess },
    badgeTextWrong: { color: colors.textError },
    reviewQuestion: {
        fontSize: 14,
        fontWeight: "600",
        color: colors.textSecondary,
        lineHeight: 20,
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
        fontWeight: "800",
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
        fontWeight: "700",
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
        fontWeight: "700",
        color: colors.textLight,
    },
    optionsList: { gap: 8, marginTop: 8 },
    optItem: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.borderMedium, borderRadius: 5, padding: 12 },
    optCorrect: { borderColor: colors.success, backgroundColor: colors.successContainer },
    optWrong: { borderColor: colors.error, backgroundColor: colors.errorContainer },
    optText: { fontSize: 14, fontWeight: "600", color: colors.textSecondary },
    optTextCorrect: { color: colors.textSuccess },
    optTextWrong: { color: colors.textError },
    fillContainer: { backgroundColor: colors.surfaceVariant, borderRadius: 5, padding: 12, gap: 8, marginTop: 8 },
    fillRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    fillLabel: { fontSize: 13, fontWeight: "600", color: colors.textMuted },
    fillValue: { fontSize: 14, fontWeight: "700" },
    textGreen: { color: colors.success },
    textRed: { color: colors.error },
    matchContainer: { gap: 8, marginTop: 8 },
    matchRow: { flexDirection: "row", alignItems: "center", backgroundColor: colors.surfaceVariant, borderRadius: 5, padding: 10, borderWidth: 1, gap: 6, flexWrap: "wrap" },
    matchCorrect: { borderColor: colors.success },
    matchWrong: { borderColor: colors.error },
    matchText: { fontSize: 13, fontWeight: "600", color: colors.textSecondary },
    matchArrow: { fontSize: 14, color: colors.textMuted },
    matchCorrectHint: { fontSize: 11, color: colors.success, fontWeight: "600" },
    explBox: { marginTop: 12, borderRadius: 5, padding: 12, borderWidth: 1, borderColor: colors.success },
    explLabel: { fontSize: 12, fontWeight: "800", color: colors.textSuccess, marginBottom: 4 },
    explText: { fontSize: 13, color: colors.textSuccess, lineHeight: 20 },
    scoreBadge: {
        backgroundColor: colors.successContainer,
        borderRadius: 5,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    scoreBadgeText: {
        fontSize: 13,
        fontWeight: "800",
        color: colors.textSuccess,
    },
    possiblePointsText: {
        fontSize: 13,
        fontWeight: "600",
        color: colors.textMuted,
        marginBottom: 16,
    },
    diffPointsText: {
        fontSize: 14,
        fontWeight: "900",
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
        fontWeight: "700",
        color: colors.textSuccess,
    },
});

// ── Sub-components for review ────────────────────────────────────────

function ChooseReview({ answerData, userAnswer }: { answerData: ChooseAnswerData; userAnswer: UserChooseAnswer | null }) {
    const selected = userAnswer?.selectedOptions ?? [];
    return (
        <View style={styles.optionsList}>
            {answerData.options.map((opt, idx) => {
                const isSelected = selected.includes(idx);
                const isCorrect = answerData.correctOption.includes(idx);
                return (
                    <View key={idx} style={[styles.optItem, isCorrect && styles.optCorrect, isSelected && !isCorrect && styles.optWrong]}>
                        <Text style={[styles.optText, isCorrect && styles.optTextCorrect, isSelected && !isCorrect && styles.optTextWrong]}>
                            {String.fromCharCode(65 + idx)}. {opt}
                        </Text>
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
        <View style={styles.matchContainer}>
            {normalizedPairs.map((correct, idx) => {
                const userPair = userPairs.find((p) => p.left?.trim().toLowerCase() === correct.left.trim().toLowerCase());
                const isPairCorrect = userPair?.right?.trim().toLowerCase() === correct.right.trim().toLowerCase();
                return (
                    <View key={idx} style={[styles.matchRow, isPairCorrect ? styles.matchCorrect : styles.matchWrong]}>
                        <Text style={styles.matchText}>{correct.left}</Text>
                        <Text style={styles.matchArrow}>→</Text>
                        <Text style={styles.matchText}>{userPair?.right ?? "(Không ghép)"}</Text>
                        {!isPairCorrect && (
                            <Text style={styles.matchCorrectHint}> (Đúng: {correct.right})</Text>
                        )}
                    </View>
                );
            })}
        </View>
    );
}
