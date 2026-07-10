import { StyleSheet } from "react-native";
import { colors } from "@/theme/colors";
import { typography } from "@/theme/typography";

/**
 * Style layout dùng chung cho các màn social (search, profile, friends, requests).
 *
 * Đã dọn bỏ các rule không còn dùng: `header`, `headerTitle`, `headerAction`,
 * `bottomBar*`, `rankPill`/`rankText`, `searchCardHead`, `searchNameRow`,
 * `searchMetaRow*`, `searchBtnOutline/Disabled/Secondary/Ghost/Text`,
 * `segmentItemActive`, `requestCard`, `cardActionRow`, `cardActionButton`.
 */
export const styles = StyleSheet.create({
    // ─── Content containers ──────────────────────────────────────────────
    content: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 116,
        gap: 14,
    },

    // ─── Search box (SearchUsersScreen) ──────────────────────────────────
    searchBox: {
        height: 48,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: colors.borderDark,
        backgroundColor: colors.surface,
        paddingHorizontal: 14,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    searchInput: {
        flex: 1,
        ...typography.bodyMedium,
        fontFamily: typography.fonts.regular,
        color: colors.textPrimary,
    },

    // ─── Section headers ─────────────────────────────────────────────────
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    sectionTitle: {
        fontSize: 17,
        fontFamily: typography.fonts.semiBold,
        color: colors.textPrimary,
    },
    sectionHint: {
        ...typography.bodySmallMedium,
        color: colors.textMuted,
    },

    // ─── Search user card (SearchUserCard) ───────────────────────────────
    searchCard: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        backgroundColor: colors.primaryContainer,
        borderRadius: 12,
        padding: 14,
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
        fontFamily: typography.fonts.semiBold,
        color: colors.textPrimary,
    },
    userTitle: {
        marginTop: 3,
        ...typography.bodySmall,
        color: colors.textMuted,
    },
    userMeta: {
        marginTop: 4,
        ...typography.caption,
        color: colors.textMuted,
        lineHeight: 17,
    },
    levelPill: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 30,
        borderWidth: 2,
        borderColor: colors.warning,
        backgroundColor: "transparent",
    },
    levelText: {
        fontSize: 11,
        fontFamily: typography.fonts.semiBold,
        color: colors.warning,
    },
    searchButtonRow: {
        flexDirection: "row",
        gap: 8,
        flexShrink: 0,
        alignItems: "center",
    },

    // ─── Profile hero (OtherProfileScreen) ───────────────────────────────
    profileHero: {
        alignItems: "center",
        backgroundColor: colors.inputBackground,
        borderRadius: 12,
        padding: 20,
        gap: 10,
    },
    profileName: {
        ...typography.h2,
        fontFamily: typography.fonts.semiBold,
        color: colors.textPrimary,
    },
    profileSubtitle: {
        ...typography.bodySmallMedium,
        color: colors.textMuted,
    },
    profileStats: {
        width: "100%",
        flexDirection: "row",
        gap: 10,
        marginVertical: 8,
    },
    badgeGrid: {
        flexDirection: "row",
        gap: 12,
    },
    badgeCard: {
        flex: 1,
        borderRadius: 12,
        backgroundColor: "transparent",
        borderWidth: 2,
        padding: 14,
        alignItems: "center",
        gap: 8,
    },
    badgeTitle: {
        ...typography.caption,
        fontFamily: typography.fonts.semiBold,
        color: colors.textPrimary,
        textAlign: "center",
    },

    // ─── Summary grid + actions (FriendsAndFollowScreen) ─────────────────
    summaryGrid: {
        flexDirection: "row",
        gap: 10,
    },
    actionRow: {
        width: "100%",
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
});

export type SocialStyles = typeof styles;
