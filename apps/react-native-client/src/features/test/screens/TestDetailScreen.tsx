import React from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Dimensions
} from "react-native";
import { useSelector } from "react-redux";
import { useLocalSearchParams } from "expo-router";
import { Calendar, Award, CheckCircle2, AlertCircle, BookOpen, Star, HelpCircle, Check, X } from "lucide-react-native";
import { RootState } from "../../../store/store";
import { Question } from "../types";

export default function TestDetailScreen() {
    const { attemptId } = useLocalSearchParams<{ attemptId: string }>();
    const attempts = useSelector((state: RootState) => state.testHistory.attempts) || [];

    const attempt = attempts.find((a: any) => a.id === attemptId) || attempts[0];

    if (!attempt) {
        return (
            <View style={styles.errorContainer}>
                <AlertCircle size={48} color="#FF3B30" />
                <Text style={styles.errorTitle}>Không tìm thấy lượt làm bài</Text>
                <Text style={styles.errorSubtitle}>Lượt làm bài có thể đã bị xóa hoặc không tồn tại.</Text>
            </View>
        );
    }

    const renderQuestionDetail = (q: Question, idx: number) => {
        const userAns = attempt.answers[q.id];
        const isCorrect = attempt.gradedAnswers[q.id];

        return (
            <View key={q.id} style={styles.questionCard}>
                <View style={styles.cardHeader}>
                    <Text style={styles.questionIndex}>Câu {idx + 1}</Text>
                    <View
                        style={[
                            styles.gradingBadge,
                            isCorrect ? styles.gradingBadgeCorrect : styles.gradingBadgeIncorrect
                        ]}
                    >
                        {isCorrect ? (
                            <CheckCircle2 size={12} color="#059669" />
                        ) : (
                            <AlertCircle size={12} color="#DC2626" />
                        )}
                        <Text
                            style={[
                                styles.gradingBadgeText,
                                isCorrect ? styles.gradingBadgeTextCorrect : styles.gradingBadgeTextIncorrect
                            ]}
                        >
                            {isCorrect ? "Đúng" : "Sai"}
                        </Text>
                    </View>
                </View>

                <Text style={styles.questionText}>{q.text}</Text>

                {/* Specific answer review rendering based on type */}
                {q.type === "single-choice" && (
                    <View style={styles.optionsList}>
                        {q.options.map((opt, optIdx) => {
                            const isUserSelected = userAns === optIdx;
                            const isCorrectOpt = q.correctOptionIndex === optIdx;

                            let optionStyle: any = styles.optionItem;
                            let textStyle: any = styles.optionText;

                            if (isCorrectOpt) {
                                optionStyle = [styles.optionItem, styles.optionCorrect];
                                textStyle = [styles.optionText, styles.optionTextCorrect];
                            } else if (isUserSelected && !isCorrectOpt) {
                                optionStyle = [styles.optionItem, styles.optionIncorrect];
                                textStyle = [styles.optionText, styles.optionTextIncorrect];
                            }

                            return (
                                <View key={optIdx} style={optionStyle}>
                                    <Text style={textStyle}>
                                        {opt}
                                    </Text>
                                    {isCorrectOpt && <Check size={16} color="#059669" />}
                                    {isUserSelected && !isCorrectOpt && <X size={16} color="#DC2626" />}
                                </View>
                            );
                        })}
                    </View>
                )}

                {q.type === "multiple-choice" && (
                    <View style={styles.optionsList}>
                        {q.options.map((opt, optIdx) => {
                            const userSelectedArray = userAns || [];
                            const isUserSelected = userSelectedArray.includes(optIdx);
                            const isCorrectOpt = q.correctOptionIndexes.includes(optIdx);

                            let optionStyle: any = styles.optionItem;
                            let textStyle: any = styles.optionText;

                            if (isCorrectOpt) {
                                optionStyle = [styles.optionItem, styles.optionCorrect];
                                textStyle = [styles.optionText, styles.optionTextCorrect];
                            } else if (isUserSelected && !isCorrectOpt) {
                                optionStyle = [styles.optionItem, styles.optionIncorrect];
                                textStyle = [styles.optionText, styles.optionTextIncorrect];
                            }

                            return (
                                <View key={optIdx} style={optionStyle}>
                                    <Text style={textStyle}>
                                        {opt}
                                    </Text>
                                    {isCorrectOpt && <Check size={16} color="#059669" />}
                                    {isUserSelected && !isCorrectOpt && <X size={16} color="#DC2626" />}
                                </View>
                            );
                        })}
                    </View>
                )}

                {q.type === "fill-in-blank" && (
                    <View style={styles.fillReviewContainer}>
                        <View style={styles.fillItemRow}>
                            <Text style={styles.fillLabel}>Câu trả lời của bạn:</Text>
                            <Text style={[styles.fillValue, isCorrect ? styles.fillTextCorrect : styles.fillTextIncorrect]}>
                                {userAns || "(Chưa trả lời)"}
                            </Text>
                        </View>
                        {!isCorrect && (
                            <View style={[styles.fillItemRow, styles.marginTop8]}>
                                <Text style={styles.fillLabel}>Đáp án đúng:</Text>
                                <Text style={[styles.fillValue, styles.fillTextCorrect]}>
                                    {q.correctText}
                                </Text>
                            </View>
                        )}
                    </View>
                )}

                {q.type === "matching" && (
                    <View style={styles.matchingReviewContainer}>
                        <Text style={styles.matchingSubTitle}>Các cặp đã ghép:</Text>
                        {q.leftOptions.map((leftOpt) => {
                            const matchedRightId = userAns?.[leftOpt.id];
                            const rightOpt = q.rightOptions.find((r) => r.id === matchedRightId);
                            const correctRightId = q.correctPairs[leftOpt.id];
                            const correctRightOpt = q.rightOptions.find((r) => r.id === correctRightId);
                            const isPairCorrect = matchedRightId === correctRightId;

                            return (
                                <View key={leftOpt.id} style={styles.matchingRowCard}>
                                    <View style={styles.matchingLeftOption}>
                                        <Text style={styles.matchingText}>{leftOpt.text}</Text>
                                    </View>
                                    
                                    <View style={styles.matchingConnection}>
                                        <Text style={[styles.matchingArrow, isPairCorrect ? styles.fillTextCorrect : styles.fillTextIncorrect]}>
                                            ➔
                                        </Text>
                                    </View>

                                    <View style={[styles.matchingRightOption, isPairCorrect ? styles.matchingRightCorrect : styles.matchingRightIncorrect]}>
                                        <Text style={styles.matchingText}>
                                            {rightOpt ? rightOpt.text : "(Không ghép)"}
                                        </Text>
                                    </View>

                                    {!isPairCorrect && (
                                        <View style={styles.matchingCorrectFeedback}>
                                            <Text style={styles.matchingCorrectFeedbackLabel}>Đúng: </Text>
                                            <Text style={styles.matchingCorrectFeedbackValue}>{correctRightOpt?.text}</Text>
                                        </View>
                                    )}
                                </View>
                            );
                        })}
                    </View>
                )}
            </View>
        );
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Attempt Summary Banner */}
            <View style={styles.bannerCard}>
                <BookOpen size={24} color="#5D45F9" style={styles.bannerIcon} />
                <Text style={styles.bannerTitle}>{attempt.testTitle}</Text>
                
                <View style={styles.scoreRow}>
                    <Text style={styles.bannerScore}>{attempt.score}</Text>
                    <Text style={styles.bannerScoreMax}>/100đ</Text>
                </View>

                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Calendar size={14} color="#718096" />
                        <Text style={styles.statText}>{attempt.timestamp}</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Award size={14} color="#718096" />
                        <Text style={styles.statText}>
                            {attempt.correctAnswersCount}/{attempt.totalQuestions} Câu đúng
                        </Text>
                    </View>
                </View>
            </View>

            {/* Questions List */}
            <Text style={styles.sectionTitle}>Chi tiết câu hỏi</Text>
            <View style={styles.questionsList}>
                {attempt.questions.map((q: Question, idx: number) => renderQuestionDetail(q, idx))}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F8F7FF",
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
    },
    errorContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 40,
    },
    errorTitle: {
        fontSize: 18,
        fontWeight: "800",
        color: "#2D2D3A",
        marginTop: 16,
        marginBottom: 8,
    },
    errorSubtitle: {
        fontSize: 14,
        color: "#718096",
        textAlign: "center",
    },
    bannerCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 24,
        padding: 24,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#EAE7FA",
        shadowColor: "#5D45F9",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.05,
        shadowRadius: 16,
        elevation: 3,
        marginBottom: 24,
    },
    bannerIcon: {
        marginBottom: 12,
    },
    bannerTitle: {
        fontSize: 18,
        fontWeight: "800",
        color: "#1C1C1E",
        marginBottom: 12,
        textAlign: "center",
    },
    scoreRow: {
        flexDirection: "row",
        alignItems: "baseline",
        marginBottom: 16,
    },
    bannerScore: {
        fontSize: 40,
        fontWeight: "900",
        color: "#5D45F9",
    },
    bannerScoreMax: {
        fontSize: 18,
        fontWeight: "700",
        color: "#718096",
        marginLeft: 2,
    },
    statsRow: {
        flexDirection: "row",
        gap: 16,
    },
    statItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    statText: {
        fontSize: 12,
        color: "#718096",
        fontWeight: "500",
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "800",
        color: "#1C1C1E",
        marginBottom: 14,
    },
    questionsList: {
        gap: 16,
    },
    questionCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: "#EAE7FA",
    },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 10,
    },
    questionIndex: {
        fontSize: 12,
        fontWeight: "800",
        color: "#A0AEC0",
        textTransform: "uppercase",
    },
    gradingBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 100,
    },
    gradingBadgeCorrect: {
        backgroundColor: "#ECFDF5",
    },
    gradingBadgeIncorrect: {
        backgroundColor: "#FEF2F2",
    },
    gradingBadgeText: {
        fontSize: 11,
        fontWeight: "800",
    },
    gradingBadgeTextCorrect: {
        color: "#059669",
    },
    gradingBadgeTextIncorrect: {
        color: "#DC2626",
    },
    questionText: {
        fontSize: 15,
        fontWeight: "700",
        color: "#2D3748",
        lineHeight: 22,
        marginBottom: 16,
    },
    optionsList: {
        gap: 10,
    },
    optionItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        borderWidth: 1.5,
        borderColor: "#E5E7EB",
        borderRadius: 16,
        padding: 14,
    },
    optionCorrect: {
        backgroundColor: "#ECFDF5",
        borderColor: "#10B981",
    },
    optionIncorrect: {
        backgroundColor: "#FEF2F2",
        borderColor: "#EF4444",
    },
    optionText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#4A5568",
        flex: 1,
        marginRight: 10,
    },
    optionTextCorrect: {
        color: "#065F46",
    },
    optionTextIncorrect: {
        color: "#991B1B",
    },
    // Fill in blank review
    fillReviewContainer: {
        backgroundColor: "#F8FAFC",
        borderWidth: 1,
        borderColor: "#EDF2F7",
        borderRadius: 16,
        padding: 14,
        gap: 8,
    },
    fillItemRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    fillLabel: {
        fontSize: 13,
        fontWeight: "600",
        color: "#718096",
    },
    fillValue: {
        fontSize: 14,
        fontWeight: "700",
    },
    fillTextCorrect: {
        color: "#059669",
    },
    fillTextIncorrect: {
        color: "#DC2626",
    },
    marginTop8: {
        marginTop: 8,
    },
    // Matching review
    matchingReviewContainer: {
        gap: 12,
    },
    matchingSubTitle: {
        fontSize: 13,
        fontWeight: "700",
        color: "#718096",
        marginBottom: 4,
    },
    matchingRowCard: {
        backgroundColor: "#F8FAFC",
        borderWidth: 1,
        borderColor: "#EDF2F7",
        borderRadius: 16,
        padding: 12,
        flexDirection: "row",
        flexWrap: "wrap",
        alignItems: "center",
    },
    matchingLeftOption: {
        flex: 1,
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#E2E8F0",
        borderRadius: 10,
        padding: 10,
        minWidth: 100,
    },
    matchingConnection: {
        paddingHorizontal: 8,
        alignItems: "center",
        justifyContent: "center",
    },
    matchingArrow: {
        fontSize: 16,
        fontWeight: "800",
    },
    matchingRightOption: {
        flex: 1,
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderRadius: 10,
        padding: 10,
        minWidth: 100,
    },
    matchingRightCorrect: {
        borderColor: "#10B981",
        backgroundColor: "#ECFDF5",
    },
    matchingRightIncorrect: {
        borderColor: "#EF4444",
        backgroundColor: "#FEF2F2",
    },
    matchingText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#4A5568",
        textAlign: "center",
    },
    matchingCorrectFeedback: {
        width: "100%",
        flexDirection: "row",
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: "#EDF2F7",
        paddingHorizontal: 4,
    },
    matchingCorrectFeedbackLabel: {
        fontSize: 11,
        fontWeight: "600",
        color: "#718096",
    },
    matchingCorrectFeedbackValue: {
        fontSize: 11,
        fontWeight: "700",
        color: "#059669",
    },
});
