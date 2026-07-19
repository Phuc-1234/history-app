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
import { X, Award, CheckCircle2, Lock, Gift, Sparkles, ChevronRight } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../../../theme/colors";
import { typography } from "../../../theme/typography";
import { useGetTiersQuery, TierItem } from "../services/tierApi";

interface TierDrawerModalProps {
    visible: boolean;
    onClose: () => void;
    totalXp?: number;
    currentTierIndex?: number;
}

export default function TierDrawerModal({
    visible,
    onClose,
    totalXp = 0,
    currentTierIndex = 1,
}: TierDrawerModalProps) {
    const { data: tiersData, isLoading, isError } = useGetTiersQuery(undefined, {
        skip: !visible,
    });

    const tiers = tiersData?.tiers ?? [];

    // Find current tier & next tier
    const currentTier = tiers.find((t) => t.index === currentTierIndex) ?? tiers[0];
    const nextTier = tiers.find((t) => t.index === currentTierIndex + 1);

    // Compute XP progress percentage
    let progressPercent = 100;
    let xpNeededForNext = 0;

    if (nextTier && currentTier) {
        const currentTierXp = currentTier.xpThreshold;
        const nextTierXp = nextTier.xpThreshold;
        const range = nextTierXp - currentTierXp;
        const gainedInRange = totalXp - currentTierXp;

        if (range > 0) {
            progressPercent = Math.min(100, Math.max(0, Math.round((gainedInRange / range) * 100)));
        } else {
            progressPercent = totalXp >= nextTierXp ? 100 : 0;
        }
        xpNeededForNext = Math.max(0, nextTierXp - totalXp);
    } else if (!nextTier && tiers.length > 0) {
        progressPercent = 100; // Max tier reached
    }

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
                                <Award size={20} color="#FFFFFF" />
                            </View>
                            <View>
                                <Text style={styles.headerTitle}>Danh hiệu</Text>
                                <Text style={styles.headerSubtitle}>
                                    Tích lũy XP để nâng cấp danh hiệu & nhận quà
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
                        {/* Current Tier & Progress Card */}
                        <LinearGradient
                            colors={["#c37938", "#a66228"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.heroCard}
                        >
                            <View style={styles.heroHeader}>
                                <View style={styles.heroBadgeBox}>
                                    {currentTier?.badgeImgUrl ? (
                                        <Image
                                            source={{ uri: currentTier.badgeImgUrl }}
                                            style={styles.badgeImg}
                                        />
                                    ) : (
                                        <Sparkles size={28} color="#FFFFFF" />
                                    )}
                                </View>
                                <View style={styles.heroTextContent}>
                                    <Text style={styles.heroTierLabel}>Danh hiệu hiện tại</Text>
                                    <Text style={styles.heroTierName}>
                                        {currentTier?.name ?? `Tier ${currentTierIndex}`}
                                    </Text>
                                    <Text style={styles.heroXpText}>
                                        {totalXp.toLocaleString()} XP đã tích lũy
                                    </Text>
                                </View>
                            </View>

                            {/* Progress Section */}
                            <View style={styles.progressSection}>
                                <View style={styles.progressInfoRow}>
                                    <Text style={styles.progressLabelText}>
                                        {nextTier
                                            ? `Tiến trình đến ${nextTier.name}`
                                            : "Đã đạt cấp danh hiệu tối đa!"}
                                    </Text>
                                    <Text style={styles.progressPercentText}>{progressPercent}%</Text>
                                </View>

                                <View style={styles.progressBarTrack}>
                                    <View
                                        style={[
                                            styles.progressBarFill,
                                            { width: `${progressPercent}%` },
                                        ]}
                                    />
                                </View>

                                {nextTier ? (
                                    <Text style={styles.xpRemainingText}>
                                        Cần thêm <Text style={styles.xpHighlightText}>{xpNeededForNext.toLocaleString()} XP</Text> để thăng cấp danh hiệu tiếp theo.
                                    </Text>
                                ) : (
                                    <Text style={styles.xpRemainingText}>
                                        Bạn đang ở vị thế cao nhất của hành trình!
                                    </Text>
                                )}
                            </View>
                        </LinearGradient>

                        {/* List Section Title */}
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Tất cả các danh hiệu</Text>
                        </View>

                        {/* Loading / Error States */}
                        {isLoading && (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="small" color={colors.primary} />
                                <Text style={styles.loadingText}>Đang tải danh sách danh hiệu...</Text>
                            </View>
                        )}

                        {!isLoading && isError && (
                            <View style={styles.loadingContainer}>
                                <Text style={styles.errorText}>Khai thác danh sách danh hiệu thất bại.</Text>
                            </View>
                        )}

                        {/* Tier List */}
                        {!isLoading && tiers.map((item) => {
                            const isCurrent = item.index === currentTierIndex;
                            const isUnlocked = totalXp >= item.xpThreshold || item.index <= currentTierIndex;

                            return (
                                <View
                                    key={item.index}
                                    style={[
                                        styles.tierCard,
                                        isCurrent && styles.tierCardCurrent,
                                    ]}
                                >
                                    {/* Tier Card Header */}
                                    <View style={styles.tierMainRow}>
                                        <View style={styles.tierIconContainer}>
                                            {item.badgeImgUrl ? (
                                                <Image
                                                    source={{ uri: item.badgeImgUrl }}
                                                    style={styles.tierBadgeImg}
                                                />
                                            ) : (
                                                <Award
                                                    size={24}
                                                    color={isCurrent ? colors.primary : colors.textMuted}
                                                />
                                            )}
                                        </View>

                                        <View style={styles.tierMeta}>
                                            <View style={styles.tierNameRow}>
                                                <Text style={styles.tierName}>{item.name}</Text>
                                                {isCurrent && (
                                                    <View style={styles.currentChip}>
                                                        <Text style={styles.currentChipText}>Hiện tại</Text>
                                                    </View>
                                                )}
                                            </View>
                                            <Text style={styles.tierXpReq}>
                                                Yêu cầu: {item.xpThreshold.toLocaleString()} XP
                                            </Text>
                                            {item.description ? (
                                                <Text style={styles.tierDesc}>{item.description}</Text>
                                            ) : null}
                                        </View>

                                        <View style={styles.tierStatusCol}>
                                            {isCurrent ? (
                                                <Sparkles size={18} color={colors.primary} />
                                            ) : isUnlocked ? (
                                                <CheckCircle2 size={18} color={colors.success} />
                                            ) : (
                                                <Lock size={18} color={colors.textMuted} />
                                            )}
                                        </View>
                                    </View>

                                    {/* Rewards Box */}
                                    {item.rewards ? (
                                        <View style={styles.rewardsContainer}>
                                            <View style={styles.rewardsHeader}>
                                                <Gift size={14} color={colors.primary} />
                                                <Text style={styles.rewardsHeaderTitle}>
                                                    Phần thưởng khi đạt cấp
                                                </Text>
                                            </View>
                                            <View style={styles.rewardsRow}>
                                                {item.rewards.xp > 0 && (
                                                    <View style={styles.rewardChip}>
                                                        <Text style={styles.rewardChipText}>
                                                            +{item.rewards.xp} XP
                                                        </Text>
                                                    </View>
                                                )}
                                                {item.rewards.gold > 0 && (
                                                    <View style={[styles.rewardChip, styles.goldRewardChip]}>
                                                        <Text style={[styles.rewardChipText, styles.goldRewardText]}>
                                                            +{item.rewards.gold} Vàng
                                                        </Text>
                                                    </View>
                                                )}
                                                {item.rewards.items?.map((it) => (
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
                                    ) : null}
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
        backgroundColor: colors.primary,
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
        marginBottom: 16,
    },
    heroBadgeBox: {
        width: 52,
        height: 52,
        borderRadius: 12,
        backgroundColor: "rgba(255, 255, 255, 0.2)",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.3)",
    },
    badgeImg: {
        width: 36,
        height: 36,
        resizeMode: "contain",
    },
    heroTextContent: {
        flex: 1,
    },
    heroTierLabel: {
        fontFamily: typography.fonts.medium,
        fontSize: 11,
        color: "rgba(255, 255, 255, 0.8)",
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    heroTierName: {
        fontFamily: typography.fonts.bold,
        fontSize: 22,
        color: "#FFFFFF",
        marginBottom: 2,
    },
    heroXpText: {
        fontFamily: typography.fonts.semiBold,
        fontSize: 13,
        color: "rgba(255, 255, 255, 0.95)",
    },
    progressSection: {
        backgroundColor: "rgba(255, 255, 255, 0.15)",
        borderRadius: 12,
        padding: 12,
    },
    progressInfoRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 6,
    },
    progressLabelText: {
        fontFamily: typography.fonts.medium,
        fontSize: 12,
        color: "#FFFFFF",
    },
    progressPercentText: {
        fontFamily: typography.fonts.bold,
        fontSize: 12,
        color: "#FFFFFF",
    },
    progressBarTrack: {
        height: 8,
        backgroundColor: "rgba(0, 0, 0, 0.15)",
        borderRadius: 4,
        overflow: "hidden",
        marginBottom: 8,
    },
    progressBarFill: {
        height: "100%",
        backgroundColor: "#FFFFFF",
        borderRadius: 4,
    },
    xpRemainingText: {
        fontFamily: typography.fonts.medium,
        fontSize: 11,
        color: "rgba(255, 255, 255, 0.9)",
    },
    xpHighlightText: {
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
    tierCard: {
        backgroundColor: colors.surface,
        borderRadius: 12, // container border radius = 12
        borderWidth: 1.5,
        borderColor: colors.borderMedium,
        padding: 14,
        marginBottom: 12,
    },
    tierCardCurrent: {
        borderColor: colors.primary,
        backgroundColor: colors.primaryContainer,
    },
    tierMainRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 12,
    },
    tierIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: colors.surfaceVariant,
        alignItems: "center",
        justifyContent: "center",
    },
    tierBadgeImg: {
        width: 30,
        height: 30,
        resizeMode: "contain",
    },
    tierMeta: {
        flex: 1,
    },
    tierNameRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 2,
    },
    tierName: {
        fontFamily: typography.fonts.bold,
        fontSize: 15,
        color: colors.textPrimary,
    },
    currentChip: {
        backgroundColor: colors.primary,
        borderRadius: 30, // pill button border radius = 30
        paddingHorizontal: 8,
        paddingVertical: 2,
    },
    currentChipText: {
        fontFamily: typography.fonts.bold,
        fontSize: 10,
        color: "#FFFFFF",
    },
    tierXpReq: {
        fontFamily: typography.fonts.semiBold,
        fontSize: 12,
        color: colors.textSecondary,
        marginBottom: 4,
    },
    tierDesc: {
        fontFamily: typography.fonts.regular,
        fontSize: 11,
        color: colors.textMuted,
        lineHeight: 15,
    },
    tierStatusCol: {
        paddingTop: 2,
    },
    rewardsContainer: {
        marginTop: 12,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: colors.borderLight,
    },
    rewardsHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginBottom: 8,
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
