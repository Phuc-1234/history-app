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
    const [activeReward, setActiveReward] = useState<{ name: string; quantity: number } | null>(null);
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
                        {/* Current Tier & Progress */}
                        <View style={styles.heroSection}>
                            <View style={styles.heroMainRowWrapper}>
                                <View style={styles.heroHeader}>
                                    <View style={styles.heroBadgeBox}>
                                        {currentTier?.badgeImgUrl ? (
                                            <Image
                                                source={{ uri: currentTier.badgeImgUrl }}
                                                style={styles.badgeImg}
                                            />
                                        ) : (
                                            <Sparkles size={56} color={colors.primary} />
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
                        </View>

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

                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.tiersScrollContainer}
                        >
                            {!isLoading && tiers.map((item) => {
                                const isCurrent = item.index === currentTierIndex;
                                const isUnlocked = totalXp >= item.xpThreshold || item.index <= currentTierIndex;

                                return (
                                    <View
                                        key={item.index}
                                        style={[
                                            styles.tierCard,
                                            isCurrent && styles.tierCardCurrent,
                                            !isUnlocked && styles.tierCardLocked,
                                        ]}
                                    >
                                        <View style={styles.tierHeaderRow}>
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

                                        <View style={styles.tierMetaVertical}>
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
                                                <Text style={styles.tierDesc} numberOfLines={2}>{item.description}</Text>
                                            ) : null}
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
                                        ) : null}
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
    badgeImg: {
        width: 72,
        height: 72,
        resizeMode: "contain",
    },
    heroTextContent: {
        alignItems: "center",
    },
    heroTierLabel: {
        fontFamily: typography.fonts.medium,
        fontSize: 11,
        color: colors.textSecondary,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    heroTierName: {
        fontFamily: typography.fonts.bold,
        fontSize: 22,
        color: colors.textPrimary,
        marginBottom: 2,
        textAlign: "center",
    },
    heroXpText: {
        fontFamily: typography.fonts.semiBold,
        fontSize: 13,
        color: colors.textMuted,
    },
    progressSection: {
        backgroundColor: colors.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.borderMedium,
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
        color: colors.textPrimary,
    },
    progressPercentText: {
        fontFamily: typography.fonts.bold,
        fontSize: 12,
        color: colors.primary,
    },
    progressBarTrack: {
        height: 8,
        backgroundColor: colors.surfaceVariant,
        borderRadius: 4,
        overflow: "hidden",
        marginBottom: 8,
    },
    progressBarFill: {
        height: "100%",
        backgroundColor: colors.primary,
        borderRadius: 4,
    },
    xpRemainingText: {
        fontFamily: typography.fonts.medium,
        fontSize: 11,
        color: colors.textSecondary,
    },
    xpHighlightText: {
        fontFamily: typography.fonts.bold,
        color: colors.primary,
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
    tiersScrollContainer: {
        paddingBottom: 8,
        alignItems: "flex-start",
    },
    tierCard: {
        width: 220,
        marginRight: 16,
        paddingVertical: 8,
        alignItems: "center",
        justifyContent: "flex-start",
    },
    tierCardCurrent: {},
    tierCardLocked: {
        opacity: 0.4,
    },
    tierHeaderRow: {
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        marginBottom: 8,
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
    tierMetaVertical: {
        alignItems: "center",
        marginBottom: 10,
        minHeight: 65,
    },
    tierNameRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        marginBottom: 2,
    },
    tierName: {
        fontFamily: typography.fonts.bold,
        fontSize: 15,
        color: colors.textPrimary,
        textAlign: "center",
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
        textAlign: "center",
    },
    tierDesc: {
        fontFamily: typography.fonts.regular,
        fontSize: 11,
        color: colors.textMuted,
        lineHeight: 15,
        textAlign: "center",
    },
    tierStatusCol: {
        paddingTop: 2,
    },
    rewardsContainer: {
        marginTop: 12,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: colors.borderLight,
        width: "100%",
    },
    rewardsHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
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
