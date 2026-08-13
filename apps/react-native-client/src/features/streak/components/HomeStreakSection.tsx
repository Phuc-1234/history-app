import React from "react";
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ActivityIndicator,
} from "react-native";
import { Flame, CheckCircle2, Trophy, Calendar, ChevronRight } from "lucide-react-native";
import { colors } from "../../../theme/colors";
import typography from "../../../theme/typography";
import { useGetStreakInfoQuery } from "../services/streakApi";

interface HomeStreakSectionProps {
    currentStreak?: number;
    onPress?: () => void;
}

const WEEK_DAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

function getWeeklyFlameColors(xp: number, isToday: boolean, isCompleted: boolean) {
    if (xp > 60) {
        return { bg: "#FFD8BE", flameColor: "#D97706" };
    }
    if (xp > 25) {
        return { bg: "#FFE8D6", flameColor: "#FF5722" };
    }
    if (xp > 0 || isCompleted) {
        return { bg: "#FFF4E5", flameColor: "#FF9500" };
    }
    if (isToday) {
        return { bg: "#FFF4E5", flameColor: "#98A2B3" };
    }
    return { bg: "#F2F4F7", flameColor: "#98A2B3" };
}

export function HomeStreakSection({ currentStreak = 0, onPress }: HomeStreakSectionProps) {
    const { data: streakData, isLoading } = useGetStreakInfoQuery();

    const activeStreak = streakData?.currentStreak ?? currentStreak;
    const highestStreak = streakData?.highestStreak ?? activeStreak;
    const hasCompletedToday = streakData?.hasCompletedToday ?? false;
    const dailyXpList = streakData?.dailyXp ?? [];

    // Calculate current day index (0 = Monday, ..., 6 = Sunday)
    const todayIndex = (new Date().getDay() + 6) % 7;

    return (
        <TouchableOpacity
            activeOpacity={0.85}
            onPress={onPress}
            style={styles.cardContainer}
        >
            {/* Header / Main Stats Row */}
            <View style={styles.topRow}>
                <View style={styles.streakInfoLeft}>
                    <View style={styles.streakTextCol}>
                        <View style={styles.streakTitleRow}>
                            <Flame size={22} color="#FF9500" style={{ marginRight: 6 }} />
                            {activeStreak === 0 ? (
                                <Text style={styles.streakCountText}>Bắt đầu chuỗi học!</Text>
                            ) : (
                                <>
                                    <Text style={styles.streakCountText}>{activeStreak}</Text>
                                    <Text style={styles.streakUnitText}>ngày liên tục</Text>
                                </>
                            )}
                        </View>
                        <View style={styles.recordBadge}>
                            <Trophy size={10} color={colors.warning} />
                            <Text style={styles.recordText}>Kỷ lục: {highestStreak} ngày</Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* Reminder / Status Box */}
            <View style={[styles.statusBanner, hasCompletedToday ? styles.statusSuccess : styles.statusWarning]}>
                {isLoading ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                ) : hasCompletedToday ? (
                    <View style={styles.statusRow}>
                        <CheckCircle2 size={16} color={colors.success} />
                        <Text style={styles.statusText} numberOfLines={1}>
                            Tuyệt vời! Bạn đã tích lũy XP hôm nay.
                        </Text>
                    </View>
                ) : (
                    <View style={styles.statusRow}>
                        <Flame size={16} color="#FF9500" />
                        <Text style={styles.statusText} numberOfLines={1}>
                            Chưa có XP hôm nay! Học ngay để giữ chuỗi.
                        </Text>
                    </View>
                )}
            </View>

            {/* Reused Weekly Heat-Map Calendar */}
            <View style={styles.calendarBlock}>
                <View style={styles.calendarTitleRow}>
                    <Calendar size={12} color={colors.textMuted} />
                    <Text style={styles.calendarTitle}>Tiến trình tuần</Text>
                </View>
                <View style={styles.daysRow}>
                    {WEEK_DAYS.map((dayLabel, idx) => {
                        const isToday = idx === todayIndex;
                        const dayData = dailyXpList[idx];
                        const xp = dayData?.xp ?? 0;
                        const isCompleted = xp > 0;
                        const colorsConfig = getWeeklyFlameColors(xp, isToday, isCompleted);

                        return (
                            <View key={dayLabel} style={styles.dayCol}>
                                <View
                                    style={[
                                        styles.dayCircle,
                                        { backgroundColor: colorsConfig.bg },
                                        isToday && !hasCompletedToday && styles.dayCircleTodayPending,
                                    ]}
                                >
                                    <Flame size={13} color={colorsConfig.flameColor} />
                                </View>
                                <Text
                                    style={[
                                        styles.dayLabel,
                                        isToday && styles.dayLabelToday,
                                    ]}
                                >
                                    {dayLabel}
                                </Text>
                            </View>
                        );
                    })}
                </View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    cardContainer: {
        backgroundColor: colors.surface,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: colors.borderMedium,
        padding: 14,
        marginBottom: 20,
        gap: 12,
    },
    topRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    streakInfoLeft: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        flex: 1,
    },
    flameIconBox: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: "#FFF2E0",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "#FFE0B2",
    },
    streakTextCol: {
        justifyContent: "center",
        alignItems: "center",
    },
    streakTitleRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
    },
    streakCountText: {
        fontFamily: typography.fonts.bold,
        fontSize: 22,
        color: colors.textPrimary,
    },
    streakUnitText: {
        fontFamily: typography.fonts.bold,
        fontSize: 13,
        color: colors.textPrimary,
    },
    recordBadge: {
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 30,
        paddingHorizontal: 8,
        paddingVertical: 2,
        gap: 4,
        alignSelf: "center",
        marginTop: 2,
    },
    recordText: {
        fontFamily: typography.fonts.medium,
        fontSize: 10,
        color: colors.textMuted,
    },
    arrowBox: {
        width: 32,
        height: 32,
        borderRadius: 30,
        backgroundColor: colors.surfaceVariant,
        alignItems: "center",
        justifyContent: "center",
    },
    statusBanner: {
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    statusSuccess: {
        backgroundColor: "transparent",
    },
    statusWarning: {
        backgroundColor: "transparent",
    },
    statusRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    statusText: {
        fontFamily: typography.fonts.medium,
        fontSize: 12,
        color: colors.textPrimary,
        flex: 1,
    },
    calendarBlock: {
        backgroundColor: colors.surfaceVariant,
        borderRadius: 12,
        padding: 10,
    },
    calendarTitleRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        marginBottom: 8,
    },
    calendarTitle: {
        fontFamily: typography.fonts.medium,
        fontSize: 11,
        color: colors.textMuted,
    },
    daysRow: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    dayCol: {
        alignItems: "center",
        gap: 4,
    },
    dayCircle: {
        width: 26,
        height: 26,
        borderRadius: 13,
        alignItems: "center",
        justifyContent: "center",
    },
    dayCircleTodayPending: {
        borderWidth: 2,
        borderColor: "#FF9500",
    },
    dayLabel: {
        fontFamily: typography.fonts.medium,
        fontSize: 10,
        color: colors.textMuted,
    },
    dayLabelToday: {
        fontFamily: typography.fonts.bold,
        color: colors.textPrimary,
    },
});
