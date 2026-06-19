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
import TestIntro from "../../test/components/TestIntro";
import { useTestRunnerV2 } from "../hooks/useTestRunner";
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
            <ScreenWrapper showTopBar={true}>
                <TestIntro
                    title={testInfo?.title}
                    questionCount={testInfo?.questionCount}
                    timeLimit={testInfo?.timeLimit}
                    loading={isInfoLoading}
                    onStart={actions.start}
                    onBack={handleBack}
                />
            </ScreenWrapper>
        );
    }

    // ── Loading state ────────────────────────────────────────────────
    if (status === "loading") {
        return (
            <ScreenWrapper branchConfig={branchConfig}>
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#5D45F9" />
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
            <ScreenWrapper branchConfig={branchConfig}>
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
                            <Text style={styles.exitBtnText}>Thoát</Text>
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
        <ScreenWrapper branchConfig={branchConfig}>
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
                            <Grid size={16} color="#718096" />
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
                        <ActivityIndicator size="large" color="#5D45F9" />
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
    container: { flex: 1, backgroundColor: "#F8F7FF" },
    centerContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 40,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 15,
        color: "#718096",
        fontWeight: "600",
    },
    errorText: {
        fontSize: 15,
        color: "#DC2626",
        fontWeight: "600",
        textAlign: "center",
        marginBottom: 16,
    },
    retryBtn: {
        backgroundColor: "#5D45F9",
        borderRadius: 12,
        paddingHorizontal: 24,
        paddingVertical: 12,
    },
    retryBtnText: { color: "#FFF", fontWeight: "700", fontSize: 14 },
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
    headerProgress: { fontSize: 13, fontWeight: "800", color: "#5D45F9" },
    progressBar: { height: 4, backgroundColor: "#EAE7FA", borderRadius: 2 },
    progressFill: {
        height: "100%",
        backgroundColor: "#5D45F9",
        borderRadius: 2,
    },
    timerBadge: {
        backgroundColor: "#F5F3FF",
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    timerWarning: { backgroundColor: "#FEF2F2" },
    timerText: { fontSize: 13, fontWeight: "800", color: "#5D45F9" },
    timerTextWarning: { color: "#DC2626" },

    // Question
    questionScroll: { flex: 1 },
    questionContent: { padding: 16 },
    questionPrompt: {
        fontSize: 16,
        fontWeight: "700",
        color: "#1C1C1E",
        lineHeight: 24,
        marginBottom: 16,
    },

    // Document
    docContainer: {
        marginBottom: 16,
        backgroundColor: "#FFF",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#EAE7FA",
        overflow: "hidden",
    },
    docToggle: { padding: 12 },
    docToggleText: { fontSize: 13, fontWeight: "700", color: "#5D45F9" },
    docText: {
        fontSize: 14,
        color: "#4A5568",
        lineHeight: 22,
        padding: 12,
        paddingTop: 0,
    },

    // Explanation
    explanationBox: {
        marginTop: 16,
        backgroundColor: "#F0FDF4",
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: "#BBF7D0",
    },
    explanationLabel: {
        fontSize: 12,
        fontWeight: "800",
        color: "#059669",
        marginBottom: 4,
    },
    explanationText: { fontSize: 14, color: "#065F46", lineHeight: 20 },

    // Footer
    footer: {
        flexDirection: "row",
        padding: 16,
        gap: 10,
        borderTopWidth: 1,
        borderTopColor: "#EAE7FA",
    },
    navBtn: {
        flex: 1,
        backgroundColor: "#FFF",
        borderRadius: 14,
        paddingVertical: 14,
        alignItems: "center",
        borderWidth: 1.5,
        borderColor: "#E5E7EB",
    },
    navBtnDisabled: { opacity: 0.4 },
    navBtnText: { fontSize: 14, fontWeight: "700", color: "#4A5568" },
    submitBtn: {
        flex: 1,
        backgroundColor: "#5D45F9",
        borderRadius: 14,
        paddingVertical: 14,
        alignItems: "center",
    },
    submitBtnText: { fontSize: 14, fontWeight: "700", color: "#FFF" },
    nextBtn: {
        flex: 1,
        backgroundColor: "#5D45F9",
        borderRadius: 14,
        paddingVertical: 14,
        alignItems: "center",
    },
    nextBtnDisabled: { opacity: 0.4 },
    nextBtnText: { fontSize: 14, fontWeight: "700", color: "#FFF" },
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
        backgroundColor: "#E2E8F0",
    },
    blockIndicatorAnswered: {
        backgroundColor: "#818CF8",
    },
    blockIndicatorActive: {
        backgroundColor: "#5D45F9",
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
        color: "#718096",
    },
    drawerOverlay: {
        flex: 1,
        backgroundColor: "rgba(15, 12, 38, 0.45)",
        justifyContent: "flex-end",
    },
    modalDrawerContainer: {
        backgroundColor: "#FFFFFF",
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        maxHeight: screenHeight * 0.7,
        paddingBottom: 32,
    },
    modalDragIndicator: {
        width: 36,
        height: 5,
        backgroundColor: "#E2E8F0",
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
        borderBottomColor: "#F1F5F9",
    },
    modalDrawerTitle: {
        fontSize: 18,
        fontWeight: "800",
        color: "#1A202C",
    },
    modalCloseButton: {
        paddingVertical: 6,
        paddingHorizontal: 14,
        borderRadius: 100,
        backgroundColor: "#F7FAFC",
        borderWidth: 1,
        borderColor: "#E2E8F0",
    },
    modalCloseText: {
        fontSize: 12,
        fontWeight: "700",
        color: "#718096",
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
        borderRadius: 100,
        borderWidth: 1.5,
        borderColor: "#E2E8F0",
        backgroundColor: "#FFFFFF",
        alignItems: "center",
        justifyContent: "center",
    },
    gridItemAnsweredDrawer: {
        backgroundColor: "#EEF2FF",
        borderColor: "#C7D2FE",
    },
    gridItemActiveDrawer: {
        backgroundColor: "#5D45F9",
        borderColor: "#5D45F9",
    },
    gridItemTextDrawer: {
        fontSize: 16,
        fontWeight: "800",
        color: "#718096",
    },
    gridItemTextAnsweredDrawer: {
        color: "#5D45F9",
    },
    gridItemTextActiveDrawer: {
        color: "#FFFFFF",
    },    // Result screen
    resultCard: {
        backgroundColor: "#FFF",
        borderRadius: 24,
        padding: 24,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#EAE7FA",
        marginBottom: 20,
    },
    resultEmoji: { fontSize: 48, marginBottom: 8 },
    resultTitle: {
        fontSize: 22,
        fontWeight: "900",
        color: "#1C1C1E",
        marginBottom: 8,
    },
    scoreRow: { flexDirection: "row", alignItems: "baseline" },
    scoreValue: { fontSize: 48, fontWeight: "900", color: "#5D45F9" },
    scoreMax: {
        fontSize: 20,
        fontWeight: "700",
        color: "#718096",
        marginLeft: 2,
    },
    resultSubtext: {
        fontSize: 14,
        color: "#718096",
        fontWeight: "600",
        marginTop: 4,
    },
    consequenceText: {
        fontSize: 13,
        color: "#059669",
        fontWeight: "600",
        marginTop: 6,
    },
    resultActions: { gap: 10, marginBottom: 24 },
    redoBtn: {
        backgroundColor: "#F59E0B",
        borderRadius: 14,
        paddingVertical: 14,
        alignItems: "center",
    },
    redoBtnText: { fontSize: 14, fontWeight: "700", color: "#FFF" },
    restartBtn: {
        backgroundColor: "#5D45F9",
        borderRadius: 14,
        paddingVertical: 14,
        alignItems: "center",
    },
    restartBtnText: { fontSize: 14, fontWeight: "700", color: "#FFF" },
    exitBtn: {
        backgroundColor: "#FFF",
        borderRadius: 14,
        paddingVertical: 14,
        alignItems: "center",
        borderWidth: 1.5,
        borderColor: "#E5E7EB",
    },
    exitBtnText: { fontSize: 14, fontWeight: "700", color: "#4A5568" },
    viewDetailsBtn: {
        backgroundColor: "#FFF",
        borderRadius: 14,
        paddingVertical: 14,
        alignItems: "center",
        borderWidth: 1.5,
        borderColor: "#5D45F9",
    },
    viewDetailsBtnText: { fontSize: 14, fontWeight: "700", color: "#5D45F9" },

    // Review
    sectionTitle: {
        fontSize: 16,
        fontWeight: "800",
        color: "#1C1C1E",
        marginBottom: 12,
    },
    reviewCard: {
        backgroundColor: "#FFF",
        borderRadius: 16,
        padding: 14,
        borderWidth: 1,
        borderColor: "#EAE7FA",
        marginBottom: 10,
    },
    reviewHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 6,
    },
    reviewIndex: { fontSize: 12, fontWeight: "800", color: "#A0AEC0" },
    reviewBadge: {
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 100,
    },
    badgeCorrect: { backgroundColor: "#ECFDF5" },
    badgeWrong: { backgroundColor: "#FEF2F2" },
    reviewBadgeText: { fontSize: 11, fontWeight: "800" },
    badgeTextCorrect: { color: "#059669" },
    badgeTextWrong: { color: "#DC2626" },
    reviewQuestion: {
        fontSize: 14,
        fontWeight: "600",
        color: "#4A5568",
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
        backgroundColor: "#FFF",
        borderRadius: 24,
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
        color: "#1C1C1E",
        marginBottom: 10,
    },
    modalMessage: {
        fontSize: 14,
        color: "#718096",
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
        borderRadius: 16,
        backgroundColor: "#F3F4F6",
        alignItems: "center",
    },
    modalCancelText: {
        fontSize: 15,
        fontWeight: "700",
        color: "#4B5563",
    },
    modalConfirmBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 16,
        backgroundColor: "#5D45F9",
        alignItems: "center",
    },
    modalConfirmText: {
        fontSize: 15,
        fontWeight: "700",
        color: "#FFF",
    },
    optionsList: { gap: 8, marginTop: 8 },
    optItem: { backgroundColor: "#FFF", borderWidth: 1.5, borderColor: "#E5E7EB", borderRadius: 14, padding: 12 },
    optCorrect: { borderColor: "#10B981", backgroundColor: "#ECFDF5" },
    optWrong: { borderColor: "#EF4444", backgroundColor: "#FEF2F2" },
    optText: { fontSize: 14, fontWeight: "600", color: "#4A5568" },
    optTextCorrect: { color: "#065F46" },
    optTextWrong: { color: "#991B1B" },
    fillContainer: { backgroundColor: "#F8FAFC", borderRadius: 14, padding: 12, gap: 8, marginTop: 8 },
    fillRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    fillLabel: { fontSize: 13, fontWeight: "600", color: "#718096" },
    fillValue: { fontSize: 14, fontWeight: "700" },
    textGreen: { color: "#059669" },
    textRed: { color: "#DC2626" },
    matchContainer: { gap: 8, marginTop: 8 },
    matchRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#F8FAFC", borderRadius: 12, padding: 10, borderWidth: 1, gap: 6, flexWrap: "wrap" },
    matchCorrect: { borderColor: "#10B981" },
    matchWrong: { borderColor: "#EF4444" },
    matchText: { fontSize: 13, fontWeight: "600", color: "#4A5568" },
    matchArrow: { fontSize: 14, color: "#718096" },
    matchCorrectHint: { fontSize: 11, color: "#059669", fontWeight: "600" },
    explBox: { marginTop: 12, backgroundColor: "#F0FDF4", borderRadius: 12, padding: 12, borderWidth: 1, borderColor: "#BBF7D0" },
    explLabel: { fontSize: 12, fontWeight: "800", color: "#059669", marginBottom: 4 },
    explText: { fontSize: 13, color: "#065F46", lineHeight: 20 },
    scoreBadge: {
        backgroundColor: "#E0F2FE",
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    scoreBadgeText: {
        fontSize: 13,
        fontWeight: "800",
        color: "#0369A1",
    },
    possiblePointsText: {
        fontSize: 13,
        fontWeight: "600",
        color: "#718096",
        marginBottom: 16,
    },
    diffPointsText: {
        fontSize: 14,
        fontWeight: "900",
        color: "#10B981",
    },
    promptHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 12,
        marginBottom: 12,
    },
    pointPill: {
        backgroundColor: "#F3F4F6",
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 4,
        alignSelf: "flex-start",
    },
    pointPillText: {
        fontSize: 11,
        fontWeight: "700",
        color: "#6B7280",
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
