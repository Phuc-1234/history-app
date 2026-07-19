import React from "react";
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Image,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAppSelector } from "@/store/storeHook";
import { useGetProfileQuery } from "@/features/auth/services/authApi";
import { useGetHomeDataQuery } from "../services/homeApi";
import { ScreenWrapper } from "../../../components/layout/ScreenWrapper";
import { colors } from "../../../theme/colors";
import typography from "../../../theme/typography";
import { Card } from "../../../components/Card";
import type { HomeLessonItem } from "../services/homeApi";
import { PodiumSection } from "../../leaderboard/components/PodiumSection";
import { AvatarWithFrame } from "../../../components/ui";
import { useSideDrawer } from "../../../components/layout/SideDrawerContext";



// ─── Component: Thẻ bài học ───────────────────────────────────────────────────
function LessonCard({ lesson, onPress }: { lesson: HomeLessonItem; onPress: () => void }) {
    const { completedNodes, totalNodes } = lesson.progress;
    const percent = totalNodes > 0 ? Math.round((completedNodes / totalNodes) * 100) : 0;

    return (
        <Card variant="soft" style={lessonStyles.card} activeOpacity={0.8} onPress={onPress}>
            <View style={lessonStyles.iconBox}>
                <Ionicons name="book-outline" size={22} color={colors.primary} />
            </View>
            <View style={lessonStyles.textBlock}>
                <Text style={lessonStyles.topicName} numberOfLines={1}>
                    {lesson.topicName ?? "Lịch sử"}
                </Text>
                <Text style={lessonStyles.lessonName} numberOfLines={1}>
                    {lesson.name}
                </Text>
                {totalNodes > 0 && (
                    <View style={lessonStyles.progressRow}>
                        <View style={lessonStyles.progressBar}>
                            <View style={[lessonStyles.progressFill, { width: `${percent}%` }]} />
                        </View>
                        <Text style={lessonStyles.progressText}>{percent}%</Text>
                    </View>
                )}
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </Card>
    );
}

const lessonStyles = StyleSheet.create({
    card: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.surfaceVariant,
        paddingHorizontal: 14,
        paddingVertical: 12,
        gap: 12,
    },
    iconBox: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: colors.primaryContainer,
        alignItems: "center",
        justifyContent: "center",
    },
    textBlock: { flex: 1 },
    topicName: {
        fontFamily: typography.fonts.regular,
        fontSize: 11,
        color: colors.textMuted,
        marginBottom: 2,
    },
    lessonName: {
        fontFamily: typography.fonts.medium,
        fontSize: 14,
        color: colors.textPrimary,
        marginBottom: 6,
    },
    progressRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    progressBar: {
        flex: 1,
        height: 4,
        backgroundColor: colors.borderMedium,
        borderRadius: 2,
        overflow: "hidden",
    },
    progressFill: {
        height: "100%",
        backgroundColor: colors.primary,
        borderRadius: 2,
    },
    progressText: {
        fontFamily: typography.fonts.regular,
        fontSize: 11,
        color: colors.textMuted,
        minWidth: 28,
    },
});

import { useLoading } from "@/features/loading";
import { useTopBarData } from "../../top_bar/hooks/useTopBarData";
import { StreakDrawerModal } from "../../streak";
import { TierDrawerModal } from "../../tier";

// ─── Main HomeScreen ──────────────────────────────────────────────────────────
export default function HomeScreen() {
    const router = useRouter();
    const { hideLoading } = useLoading();
    const { openDrawer } = useSideDrawer();
    const { data: topBarData, streakManager, tierManager } = useTopBarData();

    // Đảm bảo profile luôn mới nhất
    const { refetch: refetchProfile, isFetching: isFetchingProfile, isLoading: isLoadingProfile } = useGetProfileQuery();
    const profile = useAppSelector((state) => state.auth.profile);

    // Gọi 1 API duy nhất cho toàn bộ trang chủ
    const { data, isLoading, error, refetch: refetchHome } = useGetHomeDataQuery(undefined, {
        skip: isLoadingProfile,
    });

    React.useEffect(() => {
        if (!isLoadingProfile && !isLoading) {
            hideLoading();
        }
    }, [isLoadingProfile, isLoading, hideLoading]);

    const handleRefresh = React.useCallback(() => {
        refetchProfile();
        refetchHome();
    }, [refetchProfile, refetchHome]);

    const isRefreshing = isFetchingProfile || isLoading;

    const topUsersData = React.useMemo(() => {
        if (!data?.leaderboard) return [];
        return data.leaderboard.slice(0, 3).map((u, idx) => ({
            id: u.id,
            name: u.name || "Ẩn danh",
            xp: u.totalXp ?? 0,
            streak: 0,
            avatar:
                u.avatarUrl ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    u.name || "User"
                )}&background=E8E4F4&color=5856D6&bold=true`,
            equippedFrameUrl: u.equippedFrameUrl ?? null,
            rank: idx + 1,
            isFriend: false,
            isFollowing: false,
        }));
    }, [data?.leaderboard]);

    const handleGoToLeaderboard = () => router.push("/(tabs)/9_1_leaderboard" as never);
    const handleGoToLesson = (lessonId: number) =>
        router.push(`/(3_4_lessons)/lesson/${lessonId}` as never);
    const handleGoToLessons = () => router.push("/(tabs)/2_1_lessons" as never);
    const handleGoToTests = () => router.push("/(tabs)/5_1_national_tests" as never);
    const handleGoToFriends = () => router.push("/(social)/friends" as never);
    const handleGoToItems = () => router.push("/(tabs)/7_1_item" as never);

    return (
        <>
            <ScreenWrapper
            showTopBar={false}
            enableScroll={true}
            enableRefresh={true}
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            showHistoricalBackground={false}
            contentContainerStyle={styles.scrollContent}
            backgroundColor={colors.primary}
        >
            {/* ── Header Block ── */}
            <View style={styles.headerBlock}>
                <View style={styles.headerRow}>
                    <View style={styles.logoContainer}>
                        <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={openDrawer}
                            style={styles.menuButton}
                        >
                            <Ionicons name="menu" size={26} color="#FFFFFF" />
                        </TouchableOpacity>
                        <Text style={styles.logoText}>Sắc sử</Text>
                    </View>
                    <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => {
                            router.push("/notifications" as never);
                        }}
                        style={styles.bellButton}
                    >
                        <Image
                            source={require("../../../../assets/images/bellRinging.png")}
                            style={styles.bellIcon}
                        />
                    </TouchableOpacity>
                </View>

                {/* Thẻ chào người dùng */}
                <Card variant="soft" style={styles.userCard}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                        <AvatarWithFrame
                            uri={profile?.profileImgUrl}
                            frameUri={profile?.equippedFrameUrl}
                            size={56}
                            name={profile?.name}
                            borderWidth={2}
                        />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.greetingText}>
                                Chào, {profile?.name || "bạn"}!
                            </Text>
                            <View style={styles.badgeRow}>
                                {/* XP Badge */}
                                <TouchableOpacity
                                    style={[styles.badge, (topBarData?.xpMultiplier ?? 1) > 1 && styles.xpMultipliedBadge]}
                                    activeOpacity={0.7}
                                    onPress={tierManager.openTierDrawer}
                                >
                                    {topBarData?.badgeImgUrl ? (
                                        <Image
                                            source={{ uri: topBarData.badgeImgUrl }}
                                            style={styles.badgeIcon}
                                        />
                                    ) : (
                                        <Ionicons name="star" size={15} color={colors.secondary} />
                                    )}
                                    <Text style={styles.badgeText}>
                                        {topBarData ? `${topBarData.totalXp} XP` : "0 XP"}
                                    </Text>
                                    {(topBarData?.xpMultiplier ?? 1) > 1 && (
                                        <View style={styles.multiplierTag}>
                                            <Text style={styles.multiplierTagText}>x{topBarData?.xpMultiplier}</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>

                                {/* Gold Badge */}
                                <TouchableOpacity
                                    style={[styles.badge, (topBarData?.goldMultiplier ?? 1) > 1 && styles.goldMultipliedBadge]}
                                    activeOpacity={0.7}
                                    onPress={() => router.push("/(tabs)/8_2_buy_gold")}
                                >
                                    <Ionicons name="cash" size={15} color={colors.gold} />
                                    <Text style={styles.badgeText}>
                                        {topBarData?.totalGold ?? "0"}
                                    </Text>
                                    {(topBarData?.goldMultiplier ?? 1) > 1 && (
                                        <View style={[styles.multiplierTag, styles.goldMultiplierTag]}>
                                            <Text style={styles.multiplierTagText}>x{topBarData?.goldMultiplier}</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>

                                {/* Streak Badge */}
                                <TouchableOpacity
                                    style={styles.badge}
                                    activeOpacity={0.7}
                                    onPress={streakManager.openStreakDrawer}
                                >
                                    <Ionicons name="flame" size={15} color={colors.warning} />
                                    <Text style={styles.badgeText}>
                                        {topBarData?.currentStreak ?? 0}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Card>
            </View>

            {/* ── Nội dung chính ── */}
            <View style={styles.bodyBlock}>

                {/* Loading state */}
                {isLoading && (
                    <View style={styles.loadingBlock}>
                        <ActivityIndicator size="small" color={colors.primary} />
                    </View>
                )}

                {/* Error state */}
                {!isLoading && error && (
                    <View style={styles.loadingBlock}>
                        <Text style={{ fontFamily: typography.fonts.regular, color: colors.error, marginBottom: 12, textAlign: "center" }}>
                            Lỗi tải dữ liệu: {("message" in error) ? (error as any).message : JSON.stringify(error)}
                        </Text>
                        <TouchableOpacity
                            style={{
                                backgroundColor: colors.primary,
                                paddingHorizontal: 20,
                                paddingVertical: 10,
                                borderRadius: 20
                            }}
                            onPress={handleRefresh}
                        >
                            <Text style={{ fontFamily: typography.fonts.semiBold, color: "#fff" }}>Thử lại</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {!isLoading && data && (
                    <>
                        {/* ── Section: Bài học ── */}
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Bài học</Text>
                            <TouchableOpacity onPress={handleGoToLessons}>
                                <Text style={styles.sectionLink}>Xem tất cả</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.lessonList}>
                            {data.lessons.map((lesson) => (
                                <LessonCard
                                    key={lesson.id}
                                    lesson={lesson}
                                    onPress={() => handleGoToLesson(lesson.id)}
                                />
                            ))}
                        </View>

                        {/* ── Section: Nút nhanh ── */}
                        <View style={[styles.sectionHeader, { marginTop: 24 }]}>
                            <Text style={styles.sectionTitle}>Khám phá</Text>
                        </View>

                        <View style={styles.quickGrid}>
                            <Card
                                style={styles.quickCard}
                                activeOpacity={0.8}
                                onPress={handleGoToTests}
                            >
                                <Ionicons name="clipboard-outline" size={22} color={colors.primary} />
                                <Text style={styles.quickLabel}>Luyện đề</Text>
                            </Card>

                            <Card
                                style={styles.quickCard}
                                activeOpacity={0.8}
                                onPress={handleGoToItems}
                            >
                                <Ionicons name="gift-outline" size={22} color={colors.secondary} />
                                <Text style={styles.quickLabel}>Vật phẩm</Text>
                            </Card>

                            <Card
                                style={styles.quickCard}
                                activeOpacity={0.8}
                                onPress={handleGoToFriends}
                            >
                                <Ionicons name="people-outline" size={22} color={colors.success} />
                                <Text style={styles.quickLabel}>Bạn bè</Text>
                            </Card>
                        </View>

                        {/* ── Section: Top 3 BXH ── */}
                        <View style={[styles.sectionHeader, { marginTop: 24 }]}>
                            <Text style={styles.sectionTitle}>Bảng xếp hạng</Text>
                            <TouchableOpacity onPress={handleGoToLeaderboard}>
                                <Text style={styles.sectionLink}>Xem tất cả</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.leaderboardRow}>
                            {topUsersData.length >= 3 && (
                                <PodiumSection
                                    topUsers={topUsersData}
                                    isSmallDevice={false}
                                    showStreak={false}
                                />
                            )}
                        </View>
                    </>
                )}
            </View>
        </ScreenWrapper>
        {topBarData && (
            <>
                <StreakDrawerModal
                    visible={streakManager.streakDrawerVisible}
                    onClose={streakManager.closeStreakDrawer}
                    currentStreak={topBarData.currentStreak}
                />
                <TierDrawerModal
                    visible={tierManager.tierDrawerVisible}
                    onClose={tierManager.closeTierDrawer}
                    totalXp={topBarData.totalXp}
                    currentTierIndex={topBarData.currentTierIndex}
                />
            </>
        )}
        </>
    );
}

const styles = StyleSheet.create({
    scrollContent: { flexGrow: 1 },

    // ── Header ──
    headerBlock: {
        backgroundColor: colors.primary,
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 32,
    },
    headerRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 20,
    },
    logoContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    menuButton: {
        justifyContent: "center",
        alignItems: "center",
    },
    logoText: {
        fontFamily: typography.fonts.medium,
        fontSize: 22,
        color: colors.textLight,
        letterSpacing: 0.5,
    },
    bellButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(124, 86, 86, 0.15)",
    },
    bellIcon: {
        width: 20,
        height: 20,
        resizeMode: "contain",
        tintColor: '#ffffff'
    },
    searchButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.textLight,
        alignItems: "center",
        justifyContent: "center",
    },
    userCard: {
        paddingHorizontal: 18,
        paddingVertical: 16,
    },
    greetingText: {
        fontFamily: typography.fonts.medium,
        fontSize: 17,
        color: colors.textPrimary,
        marginBottom: 6,
    },
    badgeRow: { flexDirection: "row", gap: 10, flexWrap: "nowrap" },
    badge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.background,
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 6,
        gap: 5,
        position: "relative",
        borderWidth: 1.5,
        borderColor: "transparent",
    },
    xpMultipliedBadge: {
        borderColor: "#007AFF",
    },
    goldMultipliedBadge: {
        borderColor: "#FFB800",
    },
    badgeText: {
        fontFamily: typography.fonts.bold,
        fontSize: 12,
        color: colors.textPrimary,
    },
    multiplierTag: {
        position: "absolute",
        top: -6,
        right: -6,
        backgroundColor: "#007AFF",
        paddingHorizontal: 4,
        paddingVertical: 1,
        borderRadius: 30,
        borderWidth: 1,
        borderColor: "#FFFFFF",
        zIndex: 10,
    },
    goldMultiplierTag: {
        backgroundColor: "#FFB800",
    },
    multiplierTagText: {
        fontSize: 8,
        fontFamily: typography.fonts.bold,
        color: "#FFFFFF",
    },
    badgeIcon: {
        width: 15,
        height: 15,
        resizeMode: "contain",
    },

    // ── Body ──
    bodyBlock: {
        flex: 1,
        backgroundColor: colors.background,
        paddingHorizontal: 20,
        paddingTop: 24,
        paddingBottom: 40,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        marginTop: -16,
    },
    loadingBlock: {
        paddingVertical: 40,
        alignItems: "center",
    },

    // Section header
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 12,
    },
    sectionTitle: {
        fontFamily: typography.fonts.medium,
        fontSize: 15,
        color: colors.textPrimary,
    },
    sectionLink: {
        fontFamily: typography.fonts.regular,
        fontSize: 13,
        color: colors.primary,
    },

    // Leaderboard
    leaderboardRow: {
        marginBottom: 8,
    },

    // Lessons
    lessonList: { gap: 10 },

    // Quick buttons
    quickGrid: {
        flexDirection: "row",
        gap: 10,
    },
    quickCard: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.surfaceVariant,
        paddingVertical: 16,
        gap: 6,
    },
    quickLabel: {
        fontFamily: typography.fonts.regular,
        fontSize: 12,
        color: colors.textPrimary,
    },
});
