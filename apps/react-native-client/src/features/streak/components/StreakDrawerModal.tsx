import React, { useState } from "react";
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    Image,
    ActivityIndicator,
    Pressable,
} from "react-native";
import { X, Flame, CheckCircle2, Lock, Gift, Sparkles, Trophy, Calendar, ChevronRight } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../../../theme/colors";
import { typography } from "../../../theme/typography";
import { useGetStreakInfoQuery, StreakMilestone } from "../services/streakApi";
import { useAppSelector } from "../../../store/storeHook";
import { MonthlyStreakModal } from "./MonthlyStreakModal";

interface StreakDrawerModalProps {
    visible: boolean;
    onClose: () => void;
    currentStreak?: number;
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

export default function StreakDrawerModal({
    visible,
    onClose,
    currentStreak = 0,
}: StreakDrawerModalProps) {
    const profile = useAppSelector((state) => state.auth.profile);
    const [monthlyModalVisible, setMonthlyModalVisible] = useState(false);
    const [activeReward, setActiveReward] = useState<{ name: string; quantity: number } | null>(null);
    const { data: streakData, isLoading, isError } = useGetStreakInfoQuery(undefined, { skip: !profile });

    const activeStreak = streakData?.currentStreak ?? currentStreak;
    const highestStreak = streakData?.highestStreak ?? activeStreak;
    const hasCompletedToday = streakData?.hasCompletedToday ?? false;
    const milestones = streakData?.milestones ?? [];
    const dailyXpList = streakData?.dailyXp ?? [];

    // Calculate current day index (0 = Monday, ..., 6 = Sunday)
    const todayIndex = (new Date().getDay() + 6) % 7;

    return (
        <>
            <Modal
                animationType="slide"
                transparent={true}
                visible={visible}
                onRequestClose={onClose}
            >
                <View style={styles.overlay}>
                    <View style={styles.modalContainer}>
                        <View style={styles.topIndicator} />

                        {/* Header */}
                        <View style={styles.header}>
                            <View style={styles.headerTitleRow}>
                                <Flame size={20} color="#FF9500" />
                                <View>
                                    <Text style={styles.headerTitle}>Chuỗi học tập</Text>
                                    <Text style={styles.headerSubtitle}>
                                        Tích lũy XP mỗi ngày để duy trì chuỗi & nhận thưởng
                                    </Text>
                                </View>
                            </View>
                            <TouchableOpacity
                                onPress={onClose}
                                style={styles.closeButton}
                                activeOpacity={0.7}
                            >
                                <X size={18} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.scrollContent}
                        >
                            {/* Current Streak Info */}
                            <View style={styles.heroSection}>
                                <View style={styles.heroMainRowWrapper}>
                                    <View style={styles.heroHeader}>
                                        <View style={styles.heroBadgeBox}>
                                            <Flame size={64} color="#FF9500" />
                                        </View>
                                        <View style={styles.heroTextContent}>
                                            <View style={styles.heroTitleRow}>
                                                {isLoading || !streakData ? (
                                                    <ActivityIndicator size="small" color="#FF9500" />
                                                ) : activeStreak === 0 ? (
                                                    <Text style={[styles.heroStreakCount, { fontSize: 24 }]}>Bắt đầu chuỗi học!</Text>
                                                ) : (
                                                    <>
                                                        <Text style={styles.heroStreakCount}>{activeStreak}</Text>
                                                        <Text style={styles.heroStreakUnit}>Ngày liên tục</Text>
                                                    </>
                                                )}
                                            </View>
                                            <View style={styles.highestTag}>
                                                <Trophy size={12} color={colors.warning} />
                                                <Text style={styles.highestTagText}>
                                                    Kỷ lục: {highestStreak} ngày
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                </View>

                                {/* Today Status Alert Box */}
                                <View style={styles.statusBox}>
                                    {hasCompletedToday ? (
                                        <View style={styles.statusRow}>
                                            <CheckCircle2 size={18} color={colors.success} />
                                            <Text style={styles.statusText}>
                                                Tuyệt vời! Bạn đã tích lũy XP hôm nay.
                                            </Text>
                                        </View>
                                    ) : (
                                        <View style={styles.statusRow}>
                                            <Flame size={18} color="#FF9500" />
                                            <Text style={styles.statusText}>
                                                Hôm nay chưa có XP! Hoàn thành 1 bài tập để giữ chuỗi!
                                            </Text>
                                        </View>
                                    )}
                                </View>

                                {/* Weekly Tracker Row (Clickable to open Monthly Calendar) */}
                                <TouchableOpacity
                                    style={styles.weeklyTrackerContainer}
                                    onPress={() => setMonthlyModalVisible(true)}
                                    activeOpacity={0.8}
                                >
                                    <View style={styles.weeklyTitleRow}>
                                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                                            <Calendar size={13} color={colors.textSecondary} />
                                            <Text style={styles.weeklyTitle}>Tuần này</Text>
                                        </View>
                                        <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
                                            <Text style={{ fontSize: 12, color: colors.primary, fontFamily: typography.fonts.medium }}>
                                                Xem lịch tháng
                                            </Text>
                                            <ChevronRight size={14} color={colors.primary} />
                                        </View>
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
                                                        <Flame size={14} color={colorsConfig.flameColor} />
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
                                </TouchableOpacity>
                            </View>

                        {/* Milestones Section Header */}
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Cột mốc chuỗi & Phần thưởng</Text>
                        </View>

                        {/* Loading / Error States */}
                        {isLoading && (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="small" color={colors.primary} />
                                <Text style={styles.loadingText}>Đang tải thông tin cột mốc...</Text>
                            </View>
                        )}

                        {!isLoading && isError && (
                            <View style={styles.loadingContainer}>
                                <Text style={styles.errorText}>Khai thác cột mốc thất bại.</Text>
                            </View>
                        )}

                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.milestonesScrollContainer}
                        >
                            {!isLoading && milestones.map((item) => {
                                const isReached = item.isReached || activeStreak >= item.day;

                                return (
                                    <View
                                        key={item.id || item.day}
                                        style={[
                                            styles.milestoneCard,
                                            isReached ? styles.milestoneCardReached : styles.milestoneCardUnreached,
                                        ]}
                                    >
                                        <View style={styles.milestoneHeaderRow}>
                                            <View
                                                style={[
                                                    styles.milestoneIconBg,
                                                    isReached && styles.milestoneIconBgActive,
                                                ]}
                                            >
                                                <Flame
                                                    size={22}
                                                    color={isReached ? "#FF9500" : colors.textMuted}
                                                />
                                            </View>

                                            <View style={styles.milestoneStatusCol}>
                                                {isReached ? (
                                                    <View style={styles.reachedChip}>
                                                        <CheckCircle2 size={13} color="#FFFFFF" />
                                                        <Text style={styles.reachedChipText}>Đã đạt</Text>
                                                    </View>
                                                ) : (
                                                    <View style={styles.lockedChip}>
                                                        <Lock size={12} color={colors.textMuted} />
                                                        <Text style={styles.lockedChipText}>Chưa đạt</Text>
                                                    </View>
                                                )}
                                            </View>
                                        </View>

                                        <View style={styles.milestoneMetaVertical}>
                                            <Text style={styles.milestoneTitle}>
                                                Chuỗi {item.day} ngày
                                            </Text>
                                            <Text style={styles.milestoneSub} numberOfLines={2}>
                                                Duy trì học tập liên tục trong {item.day} ngày
                                            </Text>
                                        </View>

                                        {/* Reward Row inside Milestone Card */}
                                        <View style={styles.rewardsContainer}>
                                            <View style={styles.rewardsHeader}>
                                                <Gift size={13} color={colors.primary} />
                                                <Text style={styles.rewardsHeaderTitle}>Phần thưởng:</Text>
                                            </View>
                                            <View style={styles.rewardsRow}>
                                                {item.xp > 0 && (
                                                    <View style={styles.rewardChip}>
                                                        <Text style={styles.rewardChipText}>+{item.xp} XP</Text>
                                                    </View>
                                                )}
                                                {item.gold > 0 && (
                                                    <View style={[styles.rewardChip, styles.goldRewardChip]}>
                                                        <Text style={[styles.rewardChipText, styles.goldRewardText]}>
                                                            +{item.gold} Vàng
                                                        </Text>
                                                    </View>
                                                )}
                                                {item.items?.map((it) => (
                                                    <TouchableOpacity
                                                        key={it.id}
                                                        style={styles.squareRewardItem}
                                                        activeOpacity={0.7}
                                                        onPress={() => setActiveReward({ name: it.name, quantity: it.quantity })}
                                                    >
                                                        <View style={styles.squareRewardBox}>
                                                            {it.imgUrl ? (
                                                                <Image source={{ uri: it.imgUrl }} style={styles.squareRewardImg} />
                                                            ) : null}
                                                            <View style={styles.squareRewardBadge}>
                                                                <Text style={styles.squareRewardBadgeText}>x{it.quantity}</Text>
                                                            </View>
                                                        </View>
                                                        <Text style={styles.squareRewardName} numberOfLines={1}>
                                                            {it.name}
                                                        </Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </View>
                                        </View>
                                    </View>
                                );
                            })}
                        </ScrollView>
                    </ScrollView>
                </View>

                {activeReward && (
                    <Pressable
                        style={styles.bubbleOverlay}
                        onPress={() => setActiveReward(null)}
                    >
                        <Pressable
                            style={styles.bubbleContainer}
                            onPress={(e) => e.stopPropagation()}
                        >
                            <View style={styles.bubbleHeader}>
                                <Gift size={16} color={colors.primary} />
                                <Text style={styles.bubbleTitle}>Thông tin phần thưởng</Text>
                            </View>
                            <Text style={styles.bubbleItemName}>{activeReward.name}</Text>
                            <Text style={styles.bubbleItemQty}>Số lượng: x{activeReward.quantity}</Text>
                        </Pressable>
                    </Pressable>
                )}
            </View>
        </Modal>

        <MonthlyStreakModal
            visible={monthlyModalVisible}
            onClose={() => setMonthlyModalVisible(false)}
        />
        </>
    );
}

const screenHeight = Dimensions.get("window").height;

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(15, 12, 38, 0.45)",
        justifyContent: "flex-end",
    },
    modalContainer: {
        backgroundColor: colors.background,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: screenHeight * 0.85,
        paddingBottom: 20,
    },
    topIndicator: {
        width: 44,
        height: 5,
        backgroundColor: colors.borderMedium,
        borderRadius: 100,
        alignSelf: "center",
        marginTop: 10,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingTop: 14,
        paddingBottom: 14,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderLight,
    },
    headerTitleRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        flex: 1,
    },
    headerIconBg: {
        width: 36,
        height: 36,
        borderRadius: 12, // container border radius = 12
        backgroundColor: "#FF9500",
        alignItems: "center",
        justifyContent: "center",
    },
    headerTitle: {
        fontFamily: typography.fonts.bold,
        fontSize: 18,
        color: colors.textPrimary,
    },
    headerSubtitle: {
        fontFamily: typography.fonts.medium,
        fontSize: 11,
        color: colors.textMuted,
    },
    closeButton: {
        padding: 6,
        borderRadius: 30, // pill button border radius = 30
        backgroundColor: colors.surfaceVariant,
        borderWidth: 1,
        borderColor: colors.borderMedium,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 24,
    },
    heroSection: {
        marginBottom: 20,
        gap: 14,
    },
    heroMainRowWrapper: {
        paddingVertical: 16,
        alignItems: "center",
        justifyContent: "center",
    },
    heroHeader: {
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
    },
    heroBadgeBox: {
        alignItems: "center",
        justifyContent: "center",
    },
    heroTextContent: {
        alignItems: "center",
    },
    heroTitleRow: {
        flexDirection: "row",
        alignItems: "baseline",
        gap: 6,
        justifyContent: "center",
    },
    heroStreakCount: {
        fontFamily: typography.fonts.bold,
        fontSize: 32,
        color: colors.textPrimary,
    },
    heroStreakUnit: {
        fontFamily: typography.fonts.bold,
        fontSize: 16,
        color: colors.textPrimary,
    },
    highestTag: {
         flexDirection: "row",
         alignItems: "center",
         borderRadius: 30, // pill button border radius = 30
         paddingHorizontal: 10,
         paddingVertical: 4,
         alignSelf: "center",
         gap: 4,
         marginTop: 6,
     },
    highestTagText: {
        fontFamily: typography.fonts.semiBold,
        fontSize: 11,
        color: colors.textSecondary,
    },
    statusBox: {
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
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
    weeklyTrackerContainer: {
        backgroundColor: colors.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.borderMedium,
        padding: 12,
    },
    weeklyTitleRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginBottom: 10,
    },
    weeklyTitle: {
        fontFamily: typography.fonts.semiBold,
        fontSize: 12,
        color: colors.textPrimary,
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
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: colors.surfaceVariant,
        alignItems: "center",
        justifyContent: "center",
    },
    dayCircleCompleted: {
        backgroundColor: "#FF9500",
    },
    dayCircleTodayPending: {
        borderWidth: 2,
        borderColor: "#FF9500",
        backgroundColor: "transparent",
    },
    dayCircleText: {
        fontFamily: typography.fonts.medium,
        fontSize: 11,
        color: colors.textMuted,
    },
    dayCircleTextToday: {
        fontFamily: typography.fonts.bold,
        color: "#FF9500",
    },
    dayLabel: {
        fontFamily: typography.fonts.medium,
        fontSize: 11,
        color: colors.textMuted,
    },
    dayLabelToday: {
        fontFamily: typography.fonts.bold,
        color: colors.textPrimary,
    },
    sectionHeader: {
        marginBottom: 12,
    },
    sectionTitle: {
        fontFamily: typography.fonts.bold,
        fontSize: 15,
        color: colors.textPrimary,
    },
    loadingContainer: {
        paddingVertical: 24,
        alignItems: "center",
        gap: 8,
    },
    loadingText: {
        fontFamily: typography.fonts.medium,
        fontSize: 13,
        color: colors.textMuted,
    },
    errorText: {
        fontFamily: typography.fonts.medium,
        fontSize: 13,
        color: colors.error,
    },
    milestonesScrollContainer: {
        paddingBottom: 8,
        alignItems: "flex-start",
    },
    milestoneCard: {
        width: 220,
        marginRight: 16,
        paddingVertical: 8,
        alignItems: "center",
        justifyContent: "flex-start",
    },
    milestoneCardReached: {},
    milestoneCardUnreached: {
        opacity: 0.4,
    },
    milestoneHeaderRow: {
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        marginBottom: 8,
    },
    milestoneIconBg: {
        width: 42,
        height: 42,
        borderRadius: 12,
        backgroundColor: colors.surfaceVariant,
        alignItems: "center",
        justifyContent: "center",
    },
    milestoneIconBgActive: {
        backgroundColor: "#FFF2E0",
    },
    milestoneMetaVertical: {
        alignItems: "center",
        marginBottom: 10,
        minHeight: 65,
    },
    milestoneTitle: {
        fontFamily: typography.fonts.bold,
        fontSize: 15,
        color: colors.textPrimary,
        marginBottom: 2,
        textAlign: "center",
    },
    milestoneSub: {
        fontFamily: typography.fonts.regular,
        fontSize: 11,
        color: colors.textMuted,
        lineHeight: 15,
        textAlign: "center",
    },
    milestoneStatusCol: {},
    reachedChip: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        backgroundColor: colors.success,
        borderRadius: 30, // pill button border radius = 30
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    reachedChipText: {
        fontFamily: typography.fonts.bold,
        fontSize: 10,
        color: "#FFFFFF",
    },
    lockedChip: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        backgroundColor: colors.surfaceVariant,
        borderRadius: 30, // pill button border radius = 30
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    lockedChipText: {
        fontFamily: typography.fonts.medium,
        fontSize: 10,
        color: colors.textMuted,
    },
    rewardsContainer: {
        marginTop: 10,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: colors.borderLight,
        width: "100%",
    },
    rewardsHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        marginBottom: 6,
    },
    rewardsHeaderTitle: {
        fontFamily: typography.fonts.semiBold,
        fontSize: 11,
        color: colors.primary,
    },
    rewardsRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: 6,
    },
    rewardChip: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.primaryContainer,
        borderRadius: 30, // pill button border radius = 30
        paddingHorizontal: 10,
        paddingVertical: 4,
        gap: 4,
    },
    goldRewardChip: {
        backgroundColor: colors.secondaryContainer,
    },
    itemRewardChip: {
        backgroundColor: colors.surfaceVariant,
    },
    rewardChipText: {
        fontFamily: typography.fonts.bold,
        fontSize: 11,
        color: colors.primary,
    },
    goldRewardText: {
        color: colors.warning,
    },
    itemImg: {
        width: 14,
        height: 14,
        resizeMode: "contain",
    },
    squareRewardItem: {
        flexDirection: "row",
        alignItems: "center",
        marginRight: 12,
        marginBottom: 6,
        gap: 6,
    },
    squareRewardBox: {
        width: 36,
        height: 36,
        borderRadius: 8,
        backgroundColor: colors.surfaceVariant,
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
    },
    squareRewardImg: {
        width: 24,
        height: 24,
        resizeMode: "contain",
    },
    squareRewardBadge: {
        position: "absolute",
        bottom: -2,
        right: -2,
        backgroundColor: colors.primary,
        borderRadius: 10,
        paddingHorizontal: 4,
        paddingVertical: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    squareRewardBadgeText: {
        fontSize: 8,
        fontFamily: typography.fonts.bold,
        color: "#FFFFFF",
    },
    squareRewardName: {
        fontSize: 12,
        color: colors.textPrimary,
        fontFamily: typography.fonts.medium,
        flex: 1,
    },
    bubbleOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.15)",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
    },
    bubbleContainer: {
        backgroundColor: colors.background,
        borderWidth: 1.5,
        borderColor: colors.primary,
        borderRadius: 12, // container border radius = 12
        padding: 16,
        width: "85%",
        maxWidth: 320,
        alignSelf: "center",
    },
    bubbleHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginBottom: 8,
    },
    bubbleTitle: {
        fontFamily: typography.fonts.bold,
        fontSize: 12,
        color: colors.primary,
        textTransform: "uppercase",
    },
    bubbleItemName: {
        fontFamily: typography.fonts.bold,
        fontSize: 16,
        color: colors.textPrimary,
        marginBottom: 4,
    },
    bubbleItemQty: {
        fontFamily: typography.fonts.medium,
        fontSize: 13,
        color: colors.textSecondary,
    },
});
