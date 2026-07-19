import React from "react";
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
} from "react-native";
import { X, Flame, CheckCircle2, Lock, Gift, Sparkles, Trophy, Calendar } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../../../theme/colors";
import { typography } from "../../../theme/typography";
import { useGetStreakInfoQuery, StreakMilestone } from "../services/streakApi";

interface StreakDrawerModalProps {
    visible: boolean;
    onClose: () => void;
    currentStreak?: number;
}

const WEEK_DAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

export default function StreakDrawerModal({
    visible,
    onClose,
    currentStreak = 0,
}: StreakDrawerModalProps) {
    const { data: streakData, isLoading, isError } = useGetStreakInfoQuery(undefined, {
        skip: !visible,
    });

    const activeStreak = streakData?.currentStreak ?? currentStreak;
    const highestStreak = streakData?.highestStreak ?? activeStreak;
    const hasCompletedToday = streakData?.hasCompletedToday ?? false;
    const milestones = streakData?.milestones ?? [];

    // Calculate current day index (0 = Monday, ..., 6 = Sunday)
    const todayIndex = (new Date().getDay() + 6) % 7;

    return (
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
                            <View style={styles.headerIconBg}>
                                <Flame size={20} color="#FFFFFF" />
                            </View>
                            <View>
                                <Text style={styles.headerTitle}>Chuỗi học tập</Text>
                                <Text style={styles.headerSubtitle}>
                                    Học tập mỗi ngày để duy trì chuỗi & nhận thưởng
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
                        {/* Current Streak Hero Card */}
                        <LinearGradient
                            colors={["#FF9500", "#c37938"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.heroCard}
                        >
                            <View style={styles.heroHeader}>
                                <View style={styles.heroBadgeBox}>
                                    <Flame size={32} color="#FFFFFF" />
                                </View>
                                <View style={styles.heroTextContent}>
                                    <View style={styles.heroTitleRow}>
                                        <Text style={styles.heroStreakCount}>{activeStreak}</Text>
                                        <Text style={styles.heroStreakUnit}>Ngày liên tục</Text>
                                    </View>
                                    <View style={styles.highestTag}>
                                        <Trophy size={12} color="#FFFFFF" />
                                        <Text style={styles.highestTagText}>
                                            Kỷ lục: {highestStreak} ngày
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            {/* Today Status Alert Box */}
                            <View style={styles.statusBox}>
                                {hasCompletedToday ? (
                                    <View style={styles.statusRow}>
                                        <CheckCircle2 size={18} color="#FFFFFF" />
                                        <Text style={styles.statusText}>
                                            Tuyệt vời! Bạn đã hoàn thành bài học hôm nay.
                                        </Text>
                                    </View>
                                ) : (
                                    <View style={styles.statusRow}>
                                        <Flame size={18} color="#FFFFFF" />
                                        <Text style={styles.statusText}>
                                            Hôm nay chưa học! Hãy hoàn thành 1 bài tập để giữ chuỗi!
                                        </Text>
                                    </View>
                                )}
                            </View>

                            {/* Weekly Tracker Row */}
                            <View style={styles.weeklyTrackerContainer}>
                                <View style={styles.weeklyTitleRow}>
                                    <Calendar size={13} color="rgba(255, 255, 255, 0.9)" />
                                    <Text style={styles.weeklyTitle}>Tuần này</Text>
                                </View>
                                <View style={styles.daysRow}>
                                    {WEEK_DAYS.map((dayLabel, idx) => {
                                        const isToday = idx === todayIndex;
                                        const isPast = idx < todayIndex;
                                        const isCompleted = isToday ? hasCompletedToday : (isPast && activeStreak > (todayIndex - idx));

                                        return (
                                            <View key={dayLabel} style={styles.dayCol}>
                                                <View
                                                    style={[
                                                        styles.dayCircle,
                                                        isCompleted && styles.dayCircleCompleted,
                                                        isToday && !hasCompletedToday && styles.dayCircleTodayPending,
                                                    ]}
                                                >
                                                    {isCompleted ? (
                                                        <Flame size={14} color="#FF9500" />
                                                    ) : (
                                                        <Text
                                                            style={[
                                                                styles.dayCircleText,
                                                                isToday && styles.dayCircleTextToday,
                                                            ]}
                                                        >
                                                            {idx + 1}
                                                        </Text>
                                                    )}
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
                        </LinearGradient>

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

                        {/* Milestone List */}
                        {!isLoading && milestones.map((item) => {
                            const isReached = item.isReached || activeStreak >= item.day;

                            return (
                                <View
                                    key={item.id || item.day}
                                    style={[
                                        styles.milestoneCard,
                                        isReached && styles.milestoneCardReached,
                                    ]}
                                >
                                    <View style={styles.milestoneMainRow}>
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

                                        <View style={styles.milestoneMeta}>
                                            <Text style={styles.milestoneTitle}>
                                                Chuỗi {item.day} ngày
                                            </Text>
                                            <Text style={styles.milestoneSub}>
                                                Duy trì học tập liên tục trong {item.day} ngày
                                            </Text>
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
                                                <View key={it.id} style={[styles.rewardChip, styles.itemRewardChip]}>
                                                    {it.imgUrl ? (
                                                        <Image source={{ uri: it.imgUrl }} style={styles.itemImg} />
                                                    ) : null}
                                                    <Text style={styles.rewardChipText}>
                                                        {it.name} x{it.quantity}
                                                    </Text>
                                                </View>
                                            ))}
                                        </View>
                                    </View>
                                </View>
                            );
                        })}
                    </ScrollView>
                </View>
            </View>
        </Modal>
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
    heroCard: {
        borderRadius: 12, // container border radius = 12
        padding: 18,
        marginBottom: 20,
    },
    heroHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        marginBottom: 14,
    },
    heroBadgeBox: {
        width: 56,
        height: 56,
        borderRadius: 12,
        backgroundColor: "rgba(255, 255, 255, 0.2)",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.3)",
    },
    heroTextContent: {
        flex: 1,
    },
    heroTitleRow: {
        flexDirection: "row",
        alignItems: "baseline",
        gap: 6,
    },
    heroStreakCount: {
        fontFamily: typography.fonts.bold,
        fontSize: 32,
        color: "#FFFFFF",
    },
    heroStreakUnit: {
        fontFamily: typography.fonts.bold,
        fontSize: 16,
        color: "#FFFFFF",
    },
    highestTag: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.15)",
        borderRadius: 30, // pill button border radius = 30
        paddingHorizontal: 8,
        paddingVertical: 3,
        alignSelf: "flex-start",
        gap: 4,
        marginTop: 2,
    },
    highestTagText: {
        fontFamily: typography.fonts.semiBold,
        fontSize: 11,
        color: "#FFFFFF",
    },
    statusBox: {
        backgroundColor: "rgba(255, 255, 255, 0.18)",
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginBottom: 14,
    },
    statusRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    statusText: {
        fontFamily: typography.fonts.medium,
        fontSize: 12,
        color: "#FFFFFF",
        flex: 1,
    },
    weeklyTrackerContainer: {
        backgroundColor: "rgba(0, 0, 0, 0.12)",
        borderRadius: 12,
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
        color: "rgba(255, 255, 255, 0.95)",
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
        backgroundColor: "rgba(255, 255, 255, 0.2)",
        alignItems: "center",
        justifyContent: "center",
    },
    dayCircleCompleted: {
        backgroundColor: "#FFFFFF",
    },
    dayCircleTodayPending: {
        borderWidth: 2,
        borderColor: "#FFFFFF",
        backgroundColor: "transparent",
    },
    dayCircleText: {
        fontFamily: typography.fonts.medium,
        fontSize: 11,
        color: "rgba(255, 255, 255, 0.8)",
    },
    dayCircleTextToday: {
        fontFamily: typography.fonts.bold,
        color: "#FFFFFF",
    },
    dayLabel: {
        fontFamily: typography.fonts.medium,
        fontSize: 11,
        color: "rgba(255, 255, 255, 0.8)",
    },
    dayLabelToday: {
        fontFamily: typography.fonts.bold,
        color: "#FFFFFF",
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
    milestoneCard: {
        backgroundColor: colors.surface,
        borderRadius: 12, // container border radius = 12
        borderWidth: 1.5,
        borderColor: colors.borderMedium,
        padding: 14,
        marginBottom: 12,
    },
    milestoneCardReached: {
        borderColor: "#FF9500",
        backgroundColor: colors.secondaryContainer,
    },
    milestoneMainRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
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
    milestoneMeta: {
        flex: 1,
    },
    milestoneTitle: {
        fontFamily: typography.fonts.bold,
        fontSize: 15,
        color: colors.textPrimary,
        marginBottom: 2,
    },
    milestoneSub: {
        fontFamily: typography.fonts.regular,
        fontSize: 11,
        color: colors.textMuted,
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
    },
    rewardsHeader: {
        flexDirection: "row",
        alignItems: "center",
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
});
