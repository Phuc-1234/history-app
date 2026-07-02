import React from "react";
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ActivityIndicator
} from "react-native";
import { FileText, Clock, Zap, Coins, Trophy } from "lucide-react-native";
import Mascot from "../../../components/Mascot";
import { colors } from "../../../theme/colors";
import { ScreenWrapper } from "../../../components/layout/ScreenWrapper";

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
}: Props) {
    const branchConfig = {
        hierarchy: "",
        title: purposeType === "EXAM" ? "Kiểm tra" : "Luyện tập",
        onBackPress: onBack,
    };

    if (loading) {
        return (
            <ScreenWrapper showTopBar={false} branchConfig={branchConfig} showHistoricalBackground={false}>
                <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={{ marginTop: 16, color: colors.textMuted, fontWeight: "500", fontSize: 14 }}>
                        Đang tải thông tin bài kiểm tra...
                    </Text>
                </View>
            </ScreenWrapper>
        );
    }

    const resolvedTitle = title ?? "Sử học và đời sống";
    const resolvedQuestionCount = questionCount ?? 20;
    const resolvedTimeLimit = timeLimit !== undefined ? timeLimit : 15;

    return (
        <ScreenWrapper showTopBar={false} branchConfig={branchConfig} showHistoricalBackground={false}>
            <View style={styles.mainContent}>
                {/* Mascot Illustration */}
                <View style={styles.mascotContainer}>
                    <Mascot
                        expression="focused"
                        width={150}
                        height={150}
                    />
                </View>

                {/* Test's name below the mascot (no container) */}
                <View style={styles.titleContainer}>
                    <Text style={styles.titleLabel}>
                        {purposeType === "EXAM" ? "Kiểm tra" : "Luyện tập"}
                    </Text>
                    <Text style={styles.scopeText}>
                        {resolvedTitle}
                    </Text>
                </View>

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
            </View>

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
        marginTop: 40,
        marginBottom: 10,
    },
    titleContainer: {
        alignItems: "center",
        marginVertical: 20,
        paddingHorizontal: 16,
    },
    titleLabel: {
        fontSize: 24,
        fontWeight: "600",
        color: colors.textPrimary,
        textAlign: "center",
    },
    scopeText: {
        fontSize: 16,
        fontWeight: "500",
        color: colors.textSecondary,
        textAlign: "center",
        marginTop: 6,
    },
    squaresRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 8,
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
        fontWeight: "500",
        color: colors.accent,
        textAlign: "center",
    },
    infoSquareLabel: {
        fontSize: 10,
        fontWeight: "400",
        color: colors.textMuted,
        textAlign: "center",
    },
    attemptFaintText: {
        fontSize: 13,
        fontWeight: "400",
        color: colors.textMuted,
        textAlign: "center",
        marginVertical: 16,
    },
    rewardsRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 12,
        marginTop: 8,
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
        fontWeight: "500",
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
        fontWeight: "500",
    },
    arrowIcon: {
        fontSize: 14,
        color: colors.textLight,
        fontWeight: "500",
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
        fontWeight: "500",
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
        fontWeight: "500",
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
        fontWeight: "400",
        color: colors.textMuted,
    },
});
