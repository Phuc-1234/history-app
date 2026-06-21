import React from "react";
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ScrollView,
    ActivityIndicator
} from "react-native";
import { FileText, Clock, Mic } from "lucide-react-native";
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
}: Props) {
    const branchConfig = {
        hierarchy: "",
        title: purposeType === "EXAM" ? "Kiểm tra" : "Luyện tập",
        onBackPress: onBack,
    };

    if (loading) {
        return (
            <ScreenWrapper showTopBar={false} branchConfig={branchConfig} >
                <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={{ marginTop: 16, color: colors.textMuted, fontWeight: "700", fontSize: 14 }}>
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
        <ScreenWrapper showTopBar={false} branchConfig={branchConfig}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
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

                {/* Sub-containers: number of ques, time */}
                <View style={styles.gridContainer}>
                    {/* Questions count */}
                    <View style={[styles.gridItem, { backgroundColor: colors.primary }]}>
                        <FileText size={20} color="#FFFFFF" />
                        <Text style={styles.gridText}>{resolvedQuestionCount} câu hỏi</Text>
                    </View>

                    {/* Time limit */}
                    <View style={[styles.gridItem, { backgroundColor: colors.secondary }]}>
                        <Clock size={20} color="#FFFFFF" />
                        <Text style={styles.gridText}>
                            {resolvedTimeLimit !== null ? `${resolvedTimeLimit} phút` : "Không giới hạn"}
                        </Text>
                    </View>
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

                {onStartVoice && (
                    <TouchableOpacity
                        style={styles.voiceButton}
                        onPress={onStartVoice}
                        activeOpacity={0.85}
                    >
                        <Mic size={18} color={colors.primary} />
                        <Text style={styles.voiceButtonText}>Bắt đầu bằng giọng nói</Text>
                    </TouchableOpacity>
                )}

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
    scrollContent: {
        paddingBottom: 40,
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
        fontWeight: "800",
        color: colors.textPrimary,
        textAlign: "center",
    },
    scopeText: {
        fontSize: 16,
        fontWeight: "600",
        color: colors.textSecondary,
        textAlign: "center",
        marginTop: 6,
    },
    gridContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 12,
        marginTop: 8,
    },
    gridItem: {
        flex: 1,
        borderRadius: 5,
        paddingVertical: 18,
        paddingHorizontal: 12,
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
    },
    gridText: {
        fontSize: 13,
        fontWeight: "700",
        color: "#FFFFFF",
        textAlign: "center",
    },
    footer: {
        backgroundColor: colors.background,
        borderTopWidth: 1,
        borderTopColor: colors.borderMedium,
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
        fontWeight: "700",
    },
    arrowIcon: {
        fontSize: 14,
        color: colors.textLight,
        fontWeight: "700",
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
        fontWeight: "700",
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
        fontWeight: "700",
        color: colors.textMuted,
    },
});
