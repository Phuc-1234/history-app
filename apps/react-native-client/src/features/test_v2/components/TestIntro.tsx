import React, { useState } from "react";
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ActivityIndicator,
    ScrollView
} from "react-native";
import { FileText, Clock, Zap, Coins, Trophy, HelpCircle } from "lucide-react-native";
import { CustomModal } from "../../../components/Modal";
import Mascot from "../../../components/Mascot";
import { colors } from "../../../theme/colors";
import { ScreenWrapper } from "../../../components/layout/ScreenWrapper";
import typography from "@/theme/typography";

export function getScopePlaceholder(scopeType?: string, purposeType?: string): string {
    const isExam = purposeType === "EXAM";
    const typeLabel = isExam ? "Bài kiểm tra" : "Bài thử thách";
    if (!scopeType) return typeLabel;

    switch (scopeType.toUpperCase()) {
        case "GRADE":
            return `${typeLabel} theo khối lớp`;
        case "TOPIC":
            return `${typeLabel} theo chủ đề`;
        case "LESSON":
            return `${typeLabel} theo bài học`;
        case "SECTION":
            return `${typeLabel} theo phần`;
        case "NODE":
            return `${typeLabel} theo mục`;
        case "NATIONAL":
            return "Đề thi Quốc gia";
        default:
            return typeLabel;
    }
}

interface Props {
    title?: string;
    questionCount?: number;
    timeLimit?: number | null;
    loading?: boolean;
    onStart: () => void;
    onBack: () => void;
    onStartVoice?: () => void;
    purposeType?: "EXAM" | "PRACTICE";
    xpReward?: number;
    goldReward?: number;
    attemptNumber?: number;
    passThreshold?: number;
    attemptCount?: number;
    passCount?: number;
    scopeType?: string;
}

export default function TestIntro({
    title,
    questionCount,
    timeLimit,
    loading = false,
    onStart,
    onBack,
    onStartVoice,
    purposeType = "EXAM",
    xpReward,
    goldReward,
    attemptNumber,
    passThreshold = 80,
    attemptCount = 0,
    passCount = 0,
    scopeType,
}: Props) {
    const [showHelpModal, setShowHelpModal] = useState(false);

    const branchConfig = {
        hierarchy: "",
        title:
            purposeType === "EXAM"
                ? "Thông tin bài kiểm tra"
                : "Thông tin bài thử thách",
        onBackPress: onBack,
    };


    if (loading) {
        return (
            <ScreenWrapper showTopBar={false} branchConfig={branchConfig} showHistoricalBackground={false}>
                <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={{ marginTop: 16, color: colors.textMuted, fontFamily: typography.fonts.medium, fontSize: 14 }}>
                        Đang tải thông tin bài kiểm tra...
                    </Text>
                </View>
            </ScreenWrapper>
        );
    }

    const resolvedTitle = title || getScopePlaceholder(scopeType, purposeType);
    const resolvedQuestionCount = questionCount ?? 20;
    const resolvedTimeLimit = timeLimit !== undefined ? timeLimit : 15;

    return (
        <ScreenWrapper showTopBar={false} branchConfig={branchConfig} showHistoricalBackground={false}>
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
                <View style={styles.mainContent}>
                    {/* Mascot Illustration */}
                    <View style={styles.mascotContainer}>
                        <Mascot
                             expression="focused"
                            width={120}
                            height={120}
                        />
                    </View>

                    <View style={{ flex: 1, minHeight: 10 }} />

                    {/* Test's name below the mascot (no container) */}
                    <View style={styles.titleContainer}>
                        <View style={styles.titleRow}>
                            <Text style={styles.titleLabel}>
                                {purposeType === "EXAM" ? "Kiểm tra" : "Thử thách"}
                            </Text>
                            <TouchableOpacity
                                onPress={() => setShowHelpModal(true)}
                                style={styles.helpButton}
                                activeOpacity={0.7}
                            >
                                <HelpCircle size={18} color={colors.textMuted} />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.scopeText}>
                            {resolvedTitle}
                        </Text>
                    </View>

                    <View style={{ flex: 1, minHeight: 10 }} />

                    {/* Row 1: 3 Squares */}
                    <View style={styles.squaresRow}>
                        {/* Time limit */}
                        <View style={[styles.infoSquare, { borderColor: colors.error }]}>
                            <Text style={styles.infoSquareLabel}>Thời gian</Text>
                            <Clock size={20} color={colors.error} />
                            <Text style={[styles.infoSquareValue, { color: colors.error }]}>
                                {resolvedTimeLimit !== null ? `${resolvedTimeLimit} phút` : "Tự do"}
                            </Text>
                        </View>

                        {/* Questions count */}
                        <View style={[styles.infoSquare, { borderColor: colors.primary }]}>
                            <Text style={styles.infoSquareLabel}>Số câu hỏi</Text>
                            <FileText size={20} color={colors.primary} />
                            <Text style={[styles.infoSquareValue, { color: colors.primary }]}>{resolvedQuestionCount} câu</Text>
                        </View>

                        {/* Pass threshold */}
                        <View style={[styles.infoSquare, { borderColor: colors.success }]}>
                            <Text style={styles.infoSquareLabel}>Điểm đạt</Text>
                            <Trophy size={20} color={colors.success} />
                            <Text style={[styles.infoSquareValue, { color: colors.success }]}>{passThreshold}%</Text>
                        </View>
                    </View>

                    {/* Row 2: Small, faint line */}
                    <Text style={styles.attemptFaintText}>
                        Lần thử thứ {(attemptCount ?? 0) + 1}. {passCount && passCount > 0 ? `Bạn đã đạt đề này ${passCount} lần` : "Bạn chưa đạt đề này lần nào"}
                    </Text>

                    <View style={{ flex: 1, minHeight: 10 }} />

                    {/* Row 3: 2 rectangles of rewards */}
                    <View style={styles.rewardsRow}>
                        {/* XP reward */}
                        {xpReward != null && xpReward > 0 && (
                            <View style={[styles.rewardRectangle, { backgroundColor: "#2563EB" }]}>
                                <Zap size={20} color="#FFFFFF" />
                                <Text style={styles.rewardRectangleText}>+{xpReward} XP</Text>
                            </View>
                        )}

                        {/* Gold reward */}
                        {goldReward != null && goldReward > 0 && (
                            <View style={[styles.rewardRectangle, { backgroundColor: colors.gold }]}>
                                <Coins size={20} color="#FFFFFF" />
                                <Text style={styles.rewardRectangleText}>+{goldReward} vàng</Text>
                            </View>
                        )}
                    </View>

                    <View style={{ flex: 1, minHeight: 15 }} />
                </View>
            </ScrollView>

            {/* Action Buttons Footer */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.startButton}
                    onPress={onStart}
                    activeOpacity={0.85}
                >
                    <Text style={styles.startButtonText}>Bắt đầu làm bài</Text>
                    <Text style={styles.arrowIcon}>➔</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.laterButton}
                    onPress={onBack}
                    activeOpacity={0.7}
                >
                    <Text style={styles.laterButtonText}>Để sau</Text>
                </TouchableOpacity>
            </View>

            <CustomModal
                visible={showHelpModal}
                title={purposeType === "EXAM" ? "Chế độ kiểm tra" : "Chế độ thử thách"}
                message={
                    purposeType === "EXAM"
                        ? "Ở chế độ kiểm tra, bạn chỉ biết được kết quả sau khi nộp bài"
                        : "Ở chế độ thử thách, bạn có thể biết đáp án và lời giải thích sau từng câu hỏi"
                }
                confirmText="Đã hiểu"
                onConfirm={() => setShowHelpModal(false)}
                showMascot={true}
                mascotExpression="thinking"
            />
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    mainContent: {
        flex: 1,
        paddingHorizontal: 20,
    },
    mascotContainer: {
        alignItems: "center",
        marginTop: 8,
        marginBottom: 0,
    },
    titleContainer: {
        alignItems: "center",
        marginVertical: 6,
        paddingHorizontal: 16,
    },
    titleRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
    },
    helpButton: {
        padding: 4,
    },
    titleLabel: {
        fontSize: 24,
        fontFamily: typography.fonts.extraBold,
        color: colors.textPrimary,
        textAlign: "center",
    },
    scopeText: {
        fontSize: 16,
        fontFamily: typography.fonts.bold,
        color: colors.textSecondary,
        textAlign: "center",
        marginTop: 6,
    },
    squaresRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 6,
        gap: 8,
    },
    infoSquare: {
        flex: 1,
        aspectRatio: 1,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: colors.accent,
        backgroundColor: "transparent",
        alignItems: "center",
        justifyContent: "center",
        padding: 6,
        gap: 4,
    },
    infoSquareValue: {
        fontSize: 13,
        fontFamily: typography.fonts.medium,
        color: colors.accent,
        textAlign: "center",
    },
    infoSquareLabel: {
        fontSize: 10,
        fontFamily: typography.fonts.regular,
        color: colors.textMuted,
        textAlign: "center",
    },
    attemptFaintText: {
        fontSize: 13,
        fontFamily: typography.fonts.regular,
        color: colors.textMuted,
        textAlign: "center",
        marginVertical: 4,
    },
    rewardsRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 12,
        marginTop: 6,
    },
    rewardRectangle: {
        flex: 1,
        borderRadius: 12,
        backgroundColor: colors.accent,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 14,
        gap: 8,
    },
    rewardRectangleText: {
        fontSize: 14,
        fontFamily: typography.fonts.medium,
        color: "#FFFFFF",
        textAlign: "center",
    },
    footer: {
        
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 24,
    },
    startButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.primary,
        borderRadius: 30,
        paddingVertical: 12,
        paddingHorizontal: 24,
        gap: 8,
        marginTop: 16,
        alignSelf: "center",
        width: "80%",
    },
    startButtonText: {
        color: colors.textLight,
        fontSize: 15,
        fontFamily: typography.fonts.medium,
    },
    arrowIcon: {
        fontSize: 14,
        color: colors.textLight,
        fontFamily: typography.fonts.medium,
    },
    voiceButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        backgroundColor: colors.primaryContainer,
        borderWidth: 1,
        borderColor: colors.primary,
        borderRadius: 15,
        paddingVertical: 12,
        paddingHorizontal: 24,
        marginTop: 12,
        alignSelf: "center",
        width: "80%",
    },
    voiceButtonText: {
        fontSize: 14,
        fontFamily: typography.fonts.medium,
        color: colors.primary,
    },
    laterButton: {
        alignItems: "center",
        justifyContent: "center",
        height: 40,
        marginTop: 12,
    },
    laterButtonText: {
        fontSize: 14,
        fontFamily: typography.fonts.medium,
        color: colors.textMuted,
    },
    rewardRow: {
        flexDirection: "row",
        justifyContent: "center",
        flexWrap: "wrap",
        gap: 8,
        marginTop: 16,
    },
    attemptChip: {
        backgroundColor: colors.surfaceVariant,
        borderRadius: 30,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: colors.borderMedium,
    },
    attemptChipText: {
        fontSize: 12,
        fontFamily: typography.fonts.regular,
        color: colors.textMuted,
    },
});
