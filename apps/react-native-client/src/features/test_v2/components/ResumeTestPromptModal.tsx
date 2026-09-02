import React from "react";
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
} from "react-native";
import { Clock, FileText, Trash2, Play } from "lucide-react-native";
import { colors, spacing, typography } from "@/theme";
import type { UserTestLogV2 } from "../types";

interface ResumeTestPromptModalProps {
    visible: boolean;
    testLog: UserTestLogV2 | null;
    onResume: () => void;
    onAbandon: () => void;
    isAbandoning?: boolean;
}

export function ResumeTestPromptModal({
    visible,
    testLog,
    onResume,
    onAbandon,
    isAbandoning = false,
}: ResumeTestPromptModalProps) {
    if (!visible || !testLog) return null;

    const answeredCount = testLog.draftAnswerJson?.length ?? 0;
    const totalCount = testLog.questionCount || testLog.questionSequenceJson?.length || 0;

    let timeRemainingText = "";
    if (testLog.expiresAt) {
        const remainingMs = new Date(testLog.expiresAt).getTime() - Date.now();
        if (remainingMs > 0) {
            const minutes = Math.ceil(remainingMs / 60000);
            timeRemainingText = `Còn lại ~${minutes} phút`;
        }
    }

    const title = testLog.testTitle || "Bài kiểm tra chưa hoàn thành";

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={() => {}}
        >
            <View style={styles.overlay}>
                <View style={styles.modalCard}>
                    <View style={styles.iconContainer}>
                        <Clock size={32} color={colors.primary} />
                    </View>

                    <Text style={styles.title}>Bài thi chưa nộp</Text>
                    <Text style={styles.description}>
                        Bạn có bài kiểm tra đang làm dở và chưa hết thời gian. Bạn có muốn tiếp tục làm bài không?
                    </Text>

                    <View style={styles.infoCard}>
                        <View style={styles.infoRow}>
                            <FileText size={16} color={colors.primary} />
                            <Text style={styles.infoTitle} numberOfLines={1}>
                                {title}
                            </Text>
                        </View>
                        <View style={styles.infoMetaRow}>
                            <Text style={styles.infoMetaText}>
                                Tiến độ: {answeredCount}/{totalCount} câu
                            </Text>
                            {!!timeRemainingText && (
                                <Text style={styles.infoMetaTime}>
                                    {timeRemainingText}
                                </Text>
                            )}
                        </View>
                    </View>

                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={onResume}
                        activeOpacity={0.8}
                        disabled={isAbandoning}
                    >
                        <Play size={18} color="#FFFFFF" fill="#FFFFFF" />
                        <Text style={styles.primaryButtonText}>
                            Tiếp tục làm bài
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.abandonButton}
                        onPress={onAbandon}
                        activeOpacity={0.8}
                        disabled={isAbandoning}
                    >
                        {isAbandoning ? (
                            <ActivityIndicator size="small" color={colors.error} />
                        ) : (
                            <>
                                <Trash2 size={16} color={colors.error} />
                                <Text style={styles.abandonButtonText}>
                                    Hủy bài làm
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "center",
        alignItems: "center",
        padding: spacing.lg,
    },
    modalCard: {
        width: "100%",
        maxWidth: 340,
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: spacing.xl,
        alignItems: "center",
        borderWidth: 1,
        borderColor: colors.borderMedium,
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 30,
        backgroundColor: colors.surfaceVariant,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: spacing.md,
    },
    title: {
        fontFamily: typography.fonts.bold,
        fontSize: 18,
        color: colors.textPrimary,
        textAlign: "center",
        marginBottom: spacing.xs,
    },
    description: {
        fontFamily: typography.fonts.regular,
        fontSize: 14,
        color: colors.textSecondary,
        textAlign: "center",
        lineHeight: 20,
        marginBottom: spacing.md,
    },
    infoCard: {
        width: "100%",
        backgroundColor: colors.surfaceVariant,
        borderRadius: 12,
        padding: spacing.md,
        marginBottom: spacing.lg,
        borderWidth: 1,
        borderColor: colors.borderLight,
        gap: 6,
    },
    infoRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    infoTitle: {
        fontFamily: typography.fonts.semiBold,
        fontSize: 14,
        color: colors.textPrimary,
        flex: 1,
    },
    infoMetaRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: 2,
    },
    infoMetaText: {
        fontFamily: typography.fonts.medium,
        fontSize: 12,
        color: colors.textSecondary,
    },
    infoMetaTime: {
        fontFamily: typography.fonts.semiBold,
        fontSize: 12,
        color: colors.warning,
    },
    primaryButton: {
        width: "100%",
        backgroundColor: colors.primary,
        borderRadius: 30,
        paddingVertical: 13,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        marginBottom: spacing.sm,
    },
    primaryButtonText: {
        fontFamily: typography.fonts.bold,
        fontSize: 15,
        color: "#FFFFFF",
    },
    abandonButton: {
        width: "100%",
        borderRadius: 30,
        paddingVertical: 11,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        borderWidth: 1,
        borderColor: colors.error,
        backgroundColor: "transparent",
    },
    abandonButtonText: {
        fontFamily: typography.fonts.semiBold,
        fontSize: 14,
        color: colors.error,
    },
});
