import { StyleSheet } from "react-native";
import { colors } from "@/theme/colors";

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
        fontSize: 15,
        color: colors.textPrimary,
        fontWeight: "400",
    },

    // ─── Section headers ─────────────────────────────────────────────────
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
        fontWeight: "600",
        color: colors.textPrimary,
    },
    userTitle: {
        marginTop: 3,
        fontSize: 13,
        fontWeight: "400",
        color: colors.textMuted,
    },
    userMeta: {
        marginTop: 4,
        fontSize: 12,
        fontWeight: "400",
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
        fontWeight: "600",
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
        fontSize: 22,
        fontWeight: "600",
        color: colors.textPrimary,
    },
    profileSubtitle: {
        fontSize: 13,
        fontWeight: "500",
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
        fontSize: 12,
        fontWeight: "600",
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
