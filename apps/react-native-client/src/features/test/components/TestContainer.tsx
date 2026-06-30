import React, { useState } from "react";
import { ActivityIndicator } from "react-native";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  Modal,
  Dimensions,
  Image,
} from "react-native";
import {
  ArrowLeft,
  Clock,
  Grid,
  RotateCcw,
  Award,
  CheckCircle2,
  AlertCircle,
  X,
  HelpCircle,
  Check,
  Star,
  Mic,
  Volume2,
  Zap,
  Coins,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { useTestRunner } from "../hooks/useTestRunner";
import { useVoiceTestController } from "../hooks/useVoiceTestController";
import SingleChoiceQuestion from "./SingleChoiceQuestion";
import MultipleChoiceQuestion from "./MultipleChoiceQuestion";
import FillInBlankQuestion from "./FillInBlankQuestion";
import MatchingQuestion from "./MatchingQuestion";
import TestIntro from "./TestIntro";
import Mascot from "../../../components/Mascot";


interface TestContainerProps {
  testId?: string;
}

export default function TestContainer({ testId = "1" }: TestContainerProps) {
  const router = useRouter();
  const testRunner = useTestRunner(testId, 900); // 15 mins
  const {
    questions,
    totalQuestionCount,
    currentQuestionIndex,
    currentQuestion,
    answers,
    formattedTime,
    status,
    result,
    lastAttemptId,
    error,
    actions,
    isQuestionAnswered,
  } = testRunner;

  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const { voiceStatus, spokenText, ttsText } = useVoiceTestController(
    testRunner,
    isVoiceMode,
  );

  const [isListModalVisible, setIsListModalVisible] = useState(false);
  const [viewMode, setViewMode] = useState<"celebration" | "review">(
    "celebration",
  );

  const handleBack = () => {
    router.back();
  };

  const activeQuestionNumber = currentQuestionIndex + 1;
  const totalQuestions = totalQuestionCount || questions.length;
  const progressPercent =
    totalQuestions > 0 ? (activeQuestionNumber / totalQuestions) * 100 : 0;

  // Tính toán % câu đúng cho màn hình chúc mừng
  const successPercent =
    totalQuestions > 0 && result
      ? (result.correctAnswersCount / totalQuestions) * 100
      : 0;

  return (
    <>
      <View style={styles.container}>
        {status === "not-started" ? (
          <TestIntro
            onStart={actions.start}
            onBack={handleBack}
            onStartVoice={() => {
              setIsVoiceMode(true);
              actions.start();
            }}
          />
        ) : status === "loading" ? (
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <ActivityIndicator size="large" color="#5D45F9" />
            <Text
              style={{
                marginTop: 12,
                color: "#718096",
                fontWeight: "600",
              }}
            >
              Đang tải bài kiểm tra...
            </Text>
            {error ? (
              <Text style={{ marginTop: 8, color: "#E53E3E" }}>{error}</Text>
            ) : null}
          </View>
        ) : status === "running" || status === "submitting" ? (
          <>
            {/* Header bar */}
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={handleBack}
                activeOpacity={0.7}
              >
                <ArrowLeft size={20} color="#1A202C" />
              </TouchableOpacity>

              <View style={styles.titleContainer}>
                <Text style={styles.headerTitle}>Kiểm tra Chủ đề 1</Text>
                <View style={styles.timerContainer}>
                  <Clock size={14} color="#5D45F9" />
                  <Text style={styles.timerText}>{formattedTime}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.submitButton}
                onPress={() => actions.submit()}
                activeOpacity={0.8}
              >
                <Text style={styles.submitButtonText}>Nộp bài</Text>
              </TouchableOpacity>
            </View>

            {/* Progress Bar Area */}
            <View style={styles.progressArea}>
              <View style={styles.progressTextRow}>
                <Text style={styles.progressLabel}>Tiến độ</Text>
                <Text style={styles.progressValue}>
                  Câu {activeQuestionNumber}/{totalQuestions}
                </Text>
              </View>
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${progressPercent}%` },
                  ]}
                />
              </View>
            </View>

            {/* Question Content Scroll */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {!currentQuestion ? (
                <View
                  style={{
                    padding: 40,
                    alignItems: "center",
                  }}
                >
                  <ActivityIndicator size="small" color="#5D45F9" />
                </View>
              ) : currentQuestion.type === "single-choice" ? (
                <SingleChoiceQuestion
                  question={currentQuestion}
                  selectedAnswer={answers[currentQuestion.id]}
                  onSelect={(idx) =>
                    actions.answerSingle(currentQuestion.id, idx)
                  }
                />
              ) : currentQuestion.type === "multiple-choice" ? (
                <MultipleChoiceQuestion
                  question={currentQuestion}
                  selectedAnswers={answers[currentQuestion.id]}
                  onSelect={(idx) =>
                    actions.answerMultiple(currentQuestion.id, idx)
                  }
                />
              ) : currentQuestion.type === "fill-in-blank" ? (
                <FillInBlankQuestion
                  question={currentQuestion}
                  value={answers[currentQuestion.id]}
                  onChange={(txt) =>
                    actions.answerFill(currentQuestion.id, txt)
                  }
                />
              ) : currentQuestion.type === "matching" ? (
                <MatchingQuestion
                  question={currentQuestion}
                  selectedPairs={answers[currentQuestion.id]}
                  onMatch={(lId, rId) =>
                    actions.answerMatching(currentQuestion.id, lId, rId)
                  }
                  onRemoveMatch={(lId) =>
                    actions.removeMatch(currentQuestion.id, lId)
                  }
                />
              ) : null}

              {/* Indicators representing all questions under options */}
              <View style={styles.blockIndicatorsRow}>
                {Array.from({ length: totalQuestions }, (_, idx) => {
                  const q = questions[idx];
                  const isActive = idx === currentQuestionIndex;
                  const isAnswered = q ? isQuestionAnswered(q.id) : false;

                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        styles.blockIndicator,
                        isAnswered && styles.blockIndicatorAnswered,
                        isActive && styles.blockIndicatorActive,
                      ]}
                      onPress={() => actions.setQuestionIndex(idx)}
                      activeOpacity={0.7}
                    />
                  );
                })}
              </View>
            </ScrollView>

            {/* Bottom Navigation Footer */}
            <View style={styles.footer}>
              <View style={styles.navButtonsRow}>
                <TouchableOpacity
                  style={[
                    styles.navButton,
                    styles.navButtonPrev,
                    currentQuestionIndex === 0 && styles.navButtonDisabled,
                  ]}
                  onPress={() => actions.goPrev()}
                  disabled={currentQuestionIndex === 0}
                  activeOpacity={0.7}
                >
                  <Text style={styles.navButtonTextPrev}>‹ Câu trước</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.navButton, styles.navButtonNext]}
                  onPress={() => {
                    currentQuestionIndex === totalQuestions - 1
                      ? actions.submit()
                      : actions.goNext(); // <-- Safely invoked without parameters
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.navButtonTextNext}>
                    {currentQuestionIndex === totalQuestions - 1
                      ? "Nộp bài ›"
                      : "Câu tiếp ›"}
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.listLink}
                onPress={() => setIsListModalVisible(true)}
                activeOpacity={0.7}
              >
                <Grid size={16} color="#718096" />
                <Text style={styles.listLinkText}>
                  Xem danh sách {totalQuestions} câu hỏi
                </Text>
              </TouchableOpacity>
            </View>

            {isVoiceMode && (
              <View style={styles.voicePanel}>
                <View style={styles.voiceHeader}>
                  <View style={styles.voiceStatusIndicator}>
                    <View
                      style={[
                        styles.voiceStatusDot,
                        voiceStatus === "listening" &&
                          styles.voiceStatusDotListening,
                        voiceStatus === "speaking" &&
                          styles.voiceStatusDotSpeaking,
                        voiceStatus === "processing" &&
                          styles.voiceStatusDotProcessing,
                        voiceStatus === "submitted" &&
                          styles.voiceStatusDotSubmitted,
                        voiceStatus === "error" && styles.voiceStatusDotError,
                      ]}
                    />
                    <Text style={styles.voiceStatusText}>
                      {voiceStatus === "listening" && "Đang lắng nghe..."}
                      {voiceStatus === "speaking" && "Đang đọc câu hỏi..."}
                      {voiceStatus === "processing" && "Đang xử lý đáp án..."}
                      {voiceStatus === "submitted" && "Đã ghi đáp án ✓"}
                      {voiceStatus === "idle" && "Chờ..."}
                      {voiceStatus === "error" && "Lỗi micro / quyền truy cập"}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.voiceCloseButton}
                    onPress={() => setIsVoiceMode(false)}
                    activeOpacity={0.7}
                  >
                    <X size={12} color="#E53E3E" />
                    <Text style={styles.voiceCloseButtonText}>Tắt</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.voiceBody}>
                  <View
                    style={[
                      styles.voiceIconContainer,
                      voiceStatus === "listening" &&
                        styles.voiceIconContainerListening,
                      voiceStatus === "speaking" &&
                        styles.voiceIconContainerSpeaking,
                      voiceStatus === "submitted" &&
                        styles.voiceIconContainerSubmitted,
                    ]}
                  >
                    {voiceStatus === "listening" ? (
                      <Mic size={18} color="#FFFFFF" />
                    ) : voiceStatus === "speaking" ? (
                      <Volume2 size={18} color="#FFFFFF" />
                    ) : voiceStatus === "processing" ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Mic size={18} color="#A0AEC0" />
                    )}
                  </View>
                  <View style={styles.voiceTextContainer}>
                    <Text style={styles.voiceLabel}>
                      {voiceStatus === "listening"
                        ? "Bạn đang nói:"
                        : "Bạn đã nói:"}
                    </Text>
                    <Text style={styles.voiceSpokenText} numberOfLines={3}>
                      {spokenText
                        ? `"${spokenText}"`
                        : voiceStatus === "speaking"
                          ? "Đang phát âm thanh..."
                          : "Hãy nói đáp án của bạn..."}
                    </Text>
                  </View>
                </View>

                {voiceStatus === "speaking" && ttsText ? (
                  <View style={styles.voiceSubtitles}>
                    <Text style={styles.voiceSubtitlesText} numberOfLines={3}>
                      {ttsText}
                    </Text>
                  </View>
                ) : null}
              </View>
            )}
          </>
        ) : viewMode === "celebration" ? (
          /* Lesson Progress Celebration View */
          <View style={styles.completedContainer}>
            {/* Header bar */}
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={handleBack}
                activeOpacity={0.7}
              >
                <X size={20} color="#1A202C" />
              </TouchableOpacity>

              <Text style={styles.headerTitle}>Lesson Progress</Text>

              <TouchableOpacity style={styles.helpButton} activeOpacity={0.7}>
                <HelpCircle size={20} color="#718096" />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.completedScrollContent}
            >
              {/* Circle Celebration Hero Illustration */}
              <View style={styles.completedHeroOuter}>
                <View style={styles.completedHeroCircle}>
                  <Mascot
                    event={{ type: "finish-test", score: result ? result.score : 0 }}
                    width={132}
                    height={132}
                    style={styles.completedHeroImage}
                  />
                </View>
                {/* Medal Badge Overlay */}
                <View style={styles.completedBadgeOverlay}>
                  <Award size={20} color="#5D45F9" fill="#E8E5FF" />
                </View>
              </View>

              {/* Congratulatory Typography */}
              <Text style={styles.completedTitle}>Tuyệt vời!</Text>
              <Text style={styles.completedSubtitle}>
                Bạn đã hoàn thành bài học.
              </Text>

              {/* Two Stats Cards */}
              <View style={[styles.completedStatsRow, { marginBottom: 16 }]}>
                {/* Score card */}
                <View style={styles.completedStatCard}>
                  <View style={[styles.completedStatIconBg, styles.statBlueBg]}>
                    <Star size={18} color="#3182CE" fill="#90CDF4" />
                  </View>
                  <Text style={styles.completedStatValue}>
                    {result ? result.score : 0}/100
                  </Text>
                  <Text style={styles.completedStatLabel}>ĐIỂM</Text>
                </View>

                {/* Correct answers count card */}
                <View style={styles.completedStatCard}>
                  <View
                    style={[styles.completedStatIconBg, styles.statIndigoBg]}
                  >
                    <Check size={18} color="#5D45F9" strokeWidth={3} />
                  </View>
                  <Text style={styles.completedStatValue}>
                    {result?.correctAnswersCount}/{totalQuestions}
                  </Text>
                  <Text style={styles.completedStatLabel}>CÂU ĐÚNG</Text>
                </View>
              </View>

              {/* XP and Gold Stats Row */}
              <View style={[styles.completedStatsRow, { marginTop: 0 }]}>
                {/* XP Card */}
                <View style={styles.completedStatCard}>
                  <View
                    style={[styles.completedStatIconBg, styles.statOrangeBg]}
                  >
                    <Zap size={18} color="#DD6B20" fill="#FBD38D" />
                  </View>
                  <Text style={styles.completedStatValue}>
                    +{result?.xpEarned ?? 0}
                  </Text>
                  <Text style={styles.completedStatLabel}>
                    KINH NGHIỆM (XP)
                  </Text>
                </View>

                {/* Gold Card */}
                <View style={styles.completedStatCard}>
                  <View
                    style={[styles.completedStatIconBg, styles.statYellowBg]}
                  >
                    <Coins size={18} color="#D69E2E" fill="#F6E05E" />
                  </View>
                  <Text style={styles.completedStatValue}>
                    +{result?.goldEarned ?? 0}
                  </Text>
                  <Text style={styles.completedStatLabel}>VÀNG NHẬN ĐƯỢC</Text>
                </View>
              </View>

              {/* Progress bar area */}
              <View style={styles.completedProgressArea}>
                <View style={styles.completedProgressBarBg}>
                  <View style={styles.completedProgressBarFill} />
                </View>
                <View style={styles.completedProgressTextRow}>
                  <Text style={styles.completedProgressLabel}>Tiến độ</Text>
                  <Text style={styles.completedProgressValue}>100%</Text>
                </View>
              </View>
            </ScrollView>

            {/* Actions Footer */}
            <View style={styles.completedFooter}>
              <TouchableOpacity
                style={styles.continueButton}
                onPress={handleBack}
                activeOpacity={0.85}
              >
                <Text style={styles.continueButtonText}>
                  Tiếp tục chương sau
                </Text>
                <Text style={styles.continueArrow}>➔</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.reviewButtonOutline}
                onPress={() => {
                  if (lastAttemptId) {
                    router.push({
                      pathname: "/(10_proflie)/10_5_test_detail",
                      params: {
                        attemptId: lastAttemptId,
                      },
                    });
                  } else {
                    setViewMode("review");
                  }
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.reviewButtonText}>Xem lại bài</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* Detailed Questions Review View */
          <View style={styles.completedContainer}>
            {/* Header bar */}
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setViewMode("celebration")}
                activeOpacity={0.7}
              >
                <ArrowLeft size={20} color="#1A202C" />
              </TouchableOpacity>

              <Text style={styles.headerTitle}>Chi tiết bài làm</Text>

              <View style={{ width: 40 }} />
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.reviewScrollContent}
            >
              <View style={styles.reviewList}>
                {questions.filter(Boolean).map((q, idx) => {
                  const isCorrect = result?.gradedAnswers[q.id];

                  return (
                    <View key={q.id} style={styles.reviewCard}>
                      <View style={styles.reviewHeader}>
                        <Text style={styles.reviewIndex}>Câu {idx + 1}</Text>
                        <View
                          style={[
                            styles.gradingBadge,
                            isCorrect
                              ? styles.gradingBadgeCorrect
                              : styles.gradingBadgeIncorrect,
                          ]}
                        >
                          <Text
                            style={[
                              styles.gradingBadgeText,
                              isCorrect
                                ? styles.gradingBadgeTextCorrect
                                : styles.gradingBadgeTextIncorrect,
                            ]}
                          >
                            {isCorrect ? "Đúng" : "Sai"}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.reviewText}>{q.text}</Text>
                    </View>
                  );
                })}
              </View>
            </ScrollView>

            {/* Back to celebration screen footer */}
            <View style={styles.completedFooter}>
              <TouchableOpacity
                style={styles.continueButton}
                onPress={() => setViewMode("celebration")}
                activeOpacity={0.8}
              >
                <Text style={styles.continueButtonText}>Quay lại</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* List of questions Modal */}
        <Modal
          visible={isListModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setIsListModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalDragIndicator} />

              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Danh sách câu hỏi</Text>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setIsListModalVisible(false)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalCloseText}>Đóng</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.modalGrid}>
                {Array.from({ length: totalQuestions }, (_, idx) => {
                  const q = questions[idx];
                  const isActive = idx === currentQuestionIndex;
                  const isAnswered = q ? isQuestionAnswered(q.id) : false;

                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        styles.gridItem,
                        isAnswered && styles.gridItemAnswered,
                        isActive && styles.gridItemActive,
                      ]}
                      onPress={() => {
                        actions.setQuestionIndex(idx);
                        setIsListModalVisible(false);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.gridItemText,
                          isAnswered && styles.gridItemTextAnswered,
                          isActive && styles.gridItemTextActive,
                        ]}
                      >
                        {idx + 1}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </>
  );
}

const screenHeight = Dimensions.get("window").height;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7FAFC",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EDF2F7",
  },
  backButton: {
    padding: 8,
    borderRadius: 100,
    backgroundColor: "#F7FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  titleContainer: {
    alignItems: "center",
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1A202C",
    marginBottom: 2,
  },
  timerContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  timerText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#5D45F9",
  },
  submitButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 100,
    backgroundColor: "#EEF2FF",
    borderWidth: 1,
    borderColor: "#C7D2FE",
  },
  submitButtonText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#5D45F9",
  },
  progressArea: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EDF2F7",
  },
  progressTextRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#718096",
  },
  progressValue: {
    fontSize: 13,
    fontWeight: "800",
    color: "#5D45F9",
  },
  progressBarBg: {
    height: 6,
    backgroundColor: "#EDF2F7",
    borderRadius: 100,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#5D45F9",
    borderRadius: 100,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  blockIndicatorsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 5,
    marginTop: 36,
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
  footer: {
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#EDF2F7",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  navButtonsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  navButton: {
    flex: 1,
    height: 52,
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  navButtonPrev: {
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  navButtonNext: {
    backgroundColor: "#5D45F9",
    shadowColor: "#5D45F9",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonTextPrev: {
    fontSize: 15,
    fontWeight: "800",
    color: "#4A5568",
  },
  navButtonTextNext: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 12, 38, 0.45)",
    justifyContent: "flex-end",
  },
  modalContainer: {
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
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  modalTitle: {
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
  modalGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    padding: 24,
  },
  gridItem: {
    width: 56,
    height: 56,
    borderRadius: 100,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  gridItemAnswered: {
    backgroundColor: "#EEF2FF",
    borderColor: "#C7D2FE",
  },
  gridItemActive: {
    backgroundColor: "#5D45F9",
    borderColor: "#5D45F9",
  },
  gridItemText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#718096",
  },
  gridItemTextAnswered: {
    color: "#5D45F9",
  },
  gridItemTextActive: {
    color: "#FFFFFF",
  },
  completedContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  helpButton: {
    padding: 8,
  },
  completedScrollContent: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
  },
  completedHeroOuter: {
    position: "relative",
    marginBottom: 24,
  },
  completedHeroCircle: {
    width: 140,
    height: 140,
    borderRadius: 100,
    backgroundColor: "#F8FAFC",
    overflow: "hidden",
    borderWidth: 4,
    borderColor: "#EEF2FF",
  },
  completedHeroImage: {
    width: "100%",
    height: "100%",
  },
  completedBadgeOverlay: {
    position: "absolute",
    bottom: 0,
    right: 4,
    backgroundColor: "#FFFFFF",
    padding: 10,
    borderRadius: 100,
    shadowColor: "#5D45F9",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  completedTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: "#1A202C",
    textAlign: "center",
    marginBottom: 6,
  },
  completedSubtitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#718096",
    textAlign: "center",
    marginBottom: 32,
  },
  completedStatsRow: {
    flexDirection: "row",
    gap: 16,
    width: "100%",
    marginBottom: 32,
  },
  completedStatCard: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EDF2F7",
  },
  completedStatIconBg: {
    width: 38,
    height: 38,
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  statBlueBg: {
    backgroundColor: "#EBF8FF",
  },
  statIndigoBg: {
    backgroundColor: "#EEF2FF",
  },
  statOrangeBg: {
    backgroundColor: "#FFF5F5",
  },
  statYellowBg: {
    backgroundColor: "#FEFCBF",
  },
  completedStatValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1A202C",
    marginBottom: 4,
  },
  completedStatLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#A0AEC0",
    letterSpacing: 0.5,
  },
  completedProgressArea: {
    width: "100%",
    backgroundColor: "#F8FAFC",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#EDF2F7",
  },
  completedProgressBarBg: {
    height: 8,
    backgroundColor: "#E2E8F0",
    borderRadius: 100,
    overflow: "hidden",
    marginBottom: 12,
  },
  completedProgressBarFill: {
    height: "100%",
    backgroundColor: "#5D45F9",
    borderRadius: 100,
  },
  completedProgressTextRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  completedProgressLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#718096",
  },
  completedProgressValue: {
    fontSize: 14,
    fontWeight: "800",
    color: "#5D45F9",
  },
  completedFooter: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    backgroundColor: "#FFFFFF",
  },
  continueButton: {
    height: 54,
    backgroundColor: "#5D45F9",
    borderRadius: 100,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 12,
    shadowColor: "#5D45F9",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  continueArrow: {
    fontSize: 16,
    color: "#FFFFFF",
  },
  reviewButtonOutline: {
    height: 54,
    borderRadius: 100,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  reviewButtonText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#4A5568",
  },
  reviewScrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  // Voice Mode HUD Styles
  voicePanel: {
    position: "absolute",
    bottom: 125, // Positioned above the bottom footer
    left: 20,
    right: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    shadowColor: "#5D45F9",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 10,
  },
  voiceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#EDF2F7",
    paddingBottom: 8,
    marginBottom: 12,
  },
  voiceStatusIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  voiceStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 100,
    backgroundColor: "#A0AEC0",
  },
  voiceStatusDotListening: {
    backgroundColor: "#E53E3E",
  },
  voiceStatusDotSpeaking: {
    backgroundColor: "#3182CE",
  },
  voiceStatusDotProcessing: {
    backgroundColor: "#5D45F9",
  },
  voiceStatusDotSubmitted: {
    backgroundColor: "#38A169",
  },
  voiceStatusDotError: {
    backgroundColor: "#E53E3E",
  },
  voiceStatusText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#4A5568",
  },
  voiceCloseButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFF5F5",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: "#FED7D7",
  },
  voiceCloseButtonText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#C53030",
  },
  voiceBody: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  voiceIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 100,
    backgroundColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  voiceIconContainerListening: {
    backgroundColor: "#E53E3E",
  },
  voiceIconContainerSpeaking: {
    backgroundColor: "#3182CE",
  },
  voiceIconContainerSubmitted: {
    backgroundColor: "#38A169",
  },
  voiceTextContainer: {
    flex: 1,
  },
  voiceLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#718096",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  voiceSpokenText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1A202C",
  },
  voiceSubtitles: {
    marginTop: 12,
    backgroundColor: "#F7FAFC",
    borderRadius: 12,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: "#3182CE",
  },
  voiceSubtitlesText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4A5568",
    fontStyle: "italic",
  },
  reviewList: {
    gap: 16,
  },

  reviewCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },

  reviewIndex: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A202C",
  },

  gradingBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },

  gradingBadgeCorrect: {
    backgroundColor: "#C6F6D5",
  },

  gradingBadgeIncorrect: {
    backgroundColor: "#FED7D7",
  },

  gradingBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },

  gradingBadgeTextCorrect: {
    color: "#22543D",
  },

  gradingBadgeTextIncorrect: {
    color: "#C53030",
  },

  reviewText: {
    fontSize: 14,
    color: "#4A5568",
    lineHeight: 22,
  },
});
