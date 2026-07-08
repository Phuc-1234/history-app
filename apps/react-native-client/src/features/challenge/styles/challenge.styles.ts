import { StyleSheet } from "react-native";
import { colors } from "@/theme/colors";

/**
 * Style cho 4 màn thi đấu (challenge). Tách riêng khỏi social vì
 * đây là nhóm tính năng khác và toàn bộ dùng mock data.
 */
export const styles = StyleSheet.create({
    content: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 116,
        gap: 14,
    },
    contentWithFooter: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 208,
        gap: 14,
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.surface,
        borderWidth: 2,
        borderColor: colors.borderDark,
    },
    userInfo: {
        flex: 1,
        minWidth: 0,
    },
    rowCenter: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    userName: {
        fontSize: 15,
        fontWeight: "600",
        color: colors.textPrimary,
    },
    userMeta: {
        marginTop: 4,
        fontSize: 12,
        fontWeight: "400",
        color: colors.textMuted,
        lineHeight: 17,
    },
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: "600",
        color: colors.textPrimary,
    },
    sectionHint: {
        fontSize: 13,
        fontWeight: "500",
        color: colors.textMuted,
    },
    topicText: {
        fontSize: 14,
        fontWeight: "500",
        color: colors.textPrimary,
        lineHeight: 20,
    },
    actionRow: {
        width: "100%",
        flexDirection: "row",
        gap: 10,
    },
    summaryGrid: {
        flexDirection: "row",
        gap: 10,
    },
    card: {
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 16,
        borderWidth: 2,
        borderColor: colors.borderDark,
        gap: 12,
    },
    rewardText: {
        marginTop: 5,
        fontSize: 12,
        fontWeight: "600",
        color: colors.success,
    },
    bodyText: {
        fontSize: 13,
        fontWeight: "400",
        color: colors.textMuted,
        lineHeight: 20,
    },
    footer: {
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 76,
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 24,
        backgroundColor: colors.background,
        borderTopWidth: 2,
        borderTopColor: colors.borderDark,
        gap: 10,
    },
    footerHint: {
        fontSize: 12,
        fontWeight: "500",
        color: colors.textMuted,
        textAlign: "center",
    },

    // ─── Challenge hub hero ──────────────────────────────────────────────
    challengeHero: {
        borderRadius: 12,
        padding: 18,
        gap: 18,
    },
    challengeEyebrow: {
        fontSize: 12,
        fontWeight: "600",
        color: colors.primaryContainer,
        textTransform: "uppercase",
    },
    challengeTitle: {
        marginTop: 4,
        fontSize: 26,
        fontWeight: "600",
        color: "#FFFFFF",
    },
    challengeCopy: {
        marginTop: 6,
        fontSize: 13,
        fontWeight: "400",
        color: colors.primaryContainer,
        lineHeight: 19,
    },

    // ─── Create challenge ────────────────────────────────────────────────
    chipRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },
    chip: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 30,
        backgroundColor: colors.inputBackground,
    },
    chipActive: {
        backgroundColor: colors.primary,
    },
    chipText: {
        fontSize: 12,
        fontWeight: "600",
        color: colors.textMuted,
    },
    chipTextActive: {
        color: "#FFFFFF",
    },
    packCard: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 14,
        borderWidth: 2,
        borderColor: colors.borderDark,
    },
    packCardSelected: {
        borderWidth: 2,
        borderColor: colors.primary,
        backgroundColor: "transparent",
    },
    packIcon: {
        width: 46,
        height: 46,
        borderRadius: 12,
        backgroundColor: "transparent",
        borderWidth: 2,
        borderColor: colors.primary,
        alignItems: "center",
        justifyContent: "center",
    },

    // ─── Battle ──────────────────────────────────────────────────────────
    scoreCard: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 16,
        borderWidth: 2,
        borderColor: colors.borderDark,
    },
    playerScore: {
        flex: 1,
        alignItems: "center",
        gap: 6,
    },
    scoreText: {
        fontSize: 28,
        fontWeight: "600",
        color: colors.primary,
    },
    roundPill: {
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 30,
        borderWidth: 2,
        borderColor: colors.warning,
        backgroundColor: "transparent",
    },
    roundPillText: {
        fontSize: 12,
        fontWeight: "600",
        color: colors.warning,
    },
    questionText: {
        fontSize: 21,
        lineHeight: 29,
        fontWeight: "600",
        color: colors.textPrimary,
    },
    answerCard: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 15,
        borderWidth: 2,
        borderColor: colors.borderDark,
    },
    answerCardSelected: {
        borderWidth: 0,
        backgroundColor: colors.primary,
    },
    answerKey: {
        width: 32,
        height: 32,
        borderRadius: 16,
        textAlign: "center",
        lineHeight: 32,
        overflow: "hidden",
        backgroundColor: colors.inputBackground,
        color: colors.textMuted,
        fontWeight: "600",
    },
    answerKeySelected: {
        backgroundColor: "#FFFFFF",
        color: colors.primary,
    },
    answerText: {
        flex: 1,
        fontSize: 15,
        fontWeight: "600",
        color: colors.textPrimary,
    },
    livePanel: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        borderRadius: 12,
        padding: 12,
        borderWidth: 2,
        borderColor: colors.success,
        backgroundColor: "transparent",
    },
    onlineDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.success,
    },

    // ─── Battle result ───────────────────────────────────────────────────
    resultHero: {
        borderRadius: 12,
        padding: 22,
        alignItems: "center",
        gap: 8,
    },
    resultTitle: {
        fontSize: 28,
        fontWeight: "600",
        color: "#FFFFFF",
    },
    finalScore: {
        fontSize: 42,
        fontWeight: "600",
        color: "#FFFFFF",
    },
    comparisonCard: {
        flexDirection: "row",
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 16,
        borderWidth: 2,
        borderColor: colors.borderDark,
    },
    divider: {
        width: 2,
        backgroundColor: colors.borderDark,
        marginHorizontal: 12,
    },
});
