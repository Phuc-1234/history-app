import React from "react";
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ScrollView,
    Image,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Zap, Coins, Swords } from "lucide-react-native";
import { useAppSelector } from "@/store/storeHook";
import { useGetProfileQuery } from "@/features/auth/services/authApi";
import { useGetHomeDataQuery } from "../services/homeApi";
import { ScreenWrapper } from "../../../components/layout/ScreenWrapper";
import { colors } from "../../../theme/colors";
import typography from "../../../theme/typography";
import { Card } from "../../../components/Card";
import type { HomeLessonItem } from "../services/homeApi";
import { PodiumSection } from "../../leaderboard/components/PodiumSection";
import { AvatarWithFrame, FaintStarsOverlay } from "../../../components/ui";
import { useSideDrawer } from "../../../components/layout/SideDrawerContext";
import { CustomModal } from "../../../components/Modal";

// ─── Component: Thẻ bài học ───────────────────────────────────────────────────
function LessonCard({
    lesson,
    onPress,
}: {
    lesson: HomeLessonItem;
    onPress: () => void;
}) {
    const { completedNodes, totalNodes } = lesson.progress;
    const percent =
        totalNodes > 0 ? Math.round((completedNodes / totalNodes) * 100) : 0;

    return (
        <Card
            variant="soft"
            style={lessonStyles.card}
            activeOpacity={0.8}
            onPress={onPress}
        >
            <View style={lessonStyles.iconBox}>
                <Ionicons
                    name="book-outline"
                    size={22}
                    color={colors.primary}
                />
            </View>
            <View style={lessonStyles.textBlock}>
                <Text style={lessonStyles.topicName} numberOfLines={1}>
                    {lesson.gradeId ? `Lớp ${lesson.gradeId} - ` : ""}
                    {lesson.topicName ?? "Lịch sử"}
                </Text>
                <Text style={lessonStyles.lessonName} numberOfLines={1}>
                    {lesson.name}
                </Text>
                {totalNodes > 0 && (
                    <View style={lessonStyles.progressRow}>
                        <View style={lessonStyles.progressBar}>
                            <View
                                style={[
                                    lessonStyles.progressFill,
                                    { width: `${percent}%` },
                                ]}
                            />
                        </View>
                        <Text style={lessonStyles.progressText}>
                            {percent}%
                        </Text>
                    </View>
                )}
            </View>
            <Ionicons
                name="chevron-forward"
                size={18}
                color={colors.textMuted}
            />
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
import { StreakDrawerModal, HomeStreakSection } from "../../streak";
import { TierDrawerModal } from "../../tier";

// ─── Main HomeScreen ──────────────────────────────────────────────────────────
export default function HomeScreen() {
    const router = useRouter();
    const { hideLoading } = useLoading();
    const { openDrawer } = useSideDrawer();
    const { data: topBarData, streakManager, tierManager } = useTopBarData();

    // Đảm bảo profile luôn mới nhất
    const {
        refetch: refetchProfile,
        isFetching: isFetchingProfile,
        isLoading: isLoadingProfile,
    } = useGetProfileQuery();
    const profile = useAppSelector((state) => state.auth.profile);

    // Gọi 1 API duy nhất cho toàn bộ trang chủ
    const {
        data,
        isLoading,
        error,
        refetch: refetchHome,
    } = useGetHomeDataQuery(undefined, {
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
                    u.name || "User",
                )}&background=E8E4F4&color=5856D6&bold=true`,
            equippedFrameUrl: u.equippedFrameUrl ?? null,
            equippedLeaderboardBgUrl: u.equippedLeaderboardBgUrl ?? null,
            rank: idx + 1,
            isFriend: false,
            isFollowing: false,
        }));
    }, [data?.leaderboard]);

    const [guestModalVisible, setGuestModalVisible] = React.useState(false);

    const handleGoToLeaderboard = () =>
        router.push("/(tabs)/9_1_leaderboard" as never);
    const handleGoToLesson = (lessonId: number) =>
        router.push(`/(3_4_lessons)/lesson/${lessonId}` as never);
    const handleGoToLessons = () => router.push("/(tabs)/2_1_lessons" as never);
    const handleGoToTests = () =>
        router.push("/(tabs)/5_1_national_tests" as never);
    const handleGoToFriends = () => {
        if (!profile) {
            setGuestModalVisible(true);
            return;
        }
        router.push("/(social)/friends" as never);
    };
    const handleGoToItems = () => {
        if (!profile) {
            setGuestModalVisible(true);
            return;
        }
        router.push("/(tabs)/7_1_item" as never);
    };
    const handleGoToPvp = () => {
        if (!profile) {
            setGuestModalVisible(true);
            return;
        }
        router.push("/pvp" as never);
    };

    const isPro = !!profile?.isPro;

    return (
        <>
            <ScreenWrapper
                showTopBar={false}
                enableScroll={true}
                enableRefresh={true}
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                showHistoricalBackground="trongdong"
                contentContainerStyle={styles.scrollContent}
                backgroundColor={isPro ? "#e08c3d" : colors.primary}
            >
                {/* ── Header Block ── */}
                <LinearGradient
                    colors={isPro ? ["#e08c3d", "#c37938"] : [colors.primary, colors.primary]}
                    style={styles.headerBlock}
                >
                    {isPro && <FaintStarsOverlay isProHeader={true} />}
                    <View style={styles.headerRow}>
                        <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={openDrawer}
                            style={styles.menuButton}
                        >
                            <Ionicons
                                name="menu"
                                size={26}
                                color="#FFFFFF"
                            />
                        </TouchableOpacity>
                        <Text style={styles.logoText}>Sắc Sử</Text>
                        <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={() => {
                                if (!profile) {
                                    setGuestModalVisible(true);
                                    return;
                                }
                                router.push("/notifications" as never);
                            }}
                            style={styles.bellButton}
                        >
                            <Ionicons
                                name="notifications-outline"
                                size={22}
                                color="#FFFFFF"
                            />
                        </TouchableOpacity>
                    </View>

                    {/* Thẻ chào người dùng / Khuyến khích đăng nhập */}
                    {profile ? (
                        <Card variant="soft" style={styles.userCard}>
                            {isPro && (
                                <View style={styles.cardProBadge}>
                                    <Text style={styles.cardProBadgeText}>PRO</Text>
                                </View>
                            )}
                            <View
                                style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    gap: 14,
                                }}
                            >
                                <AvatarWithFrame
                                    uri={profile?.profileImgUrl}
                                    frameUri={profile?.equippedFrameUrl}
                                    size={56}
                                    name={profile?.name}
                                    borderWidth={2}
                                />
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.greetingText}>
                                        Chào, <Text style={styles.greetingUsername}>{profile?.name || "bạn"}</Text>!
                                    </Text>
                                    <View style={styles.badgeRow}>
                                        {/* XP Badge */}
                                        <TouchableOpacity
                                            style={[
                                                styles.badge,
                                                (topBarData?.xpMultiplier ?? 1) >
                                                    1 && styles.xpMultipliedBadge,
                                            ]}
                                            activeOpacity={0.7}
                                            onPress={tierManager.openTierDrawer}
                                        >
                                            <Zap
                                                size={15}
                                                color={colors.secondary}
                                            />
                                            <Text style={styles.badgeText}>
                                                {topBarData
                                                    ? `${topBarData.totalXp} XP`
                                                    : "0 XP"}
                                            </Text>
                                            {(topBarData?.xpMultiplier ?? 1) >
                                                1 && (
                                                <View style={styles.multiplierTag}>
                                                    <Text
                                                        style={
                                                            styles.multiplierTagText
                                                        }
                                                    >
                                                        x{topBarData?.xpMultiplier}
                                                    </Text>
                                                </View>
                                            )}
                                        </TouchableOpacity>

                                        {/* Gold Badge */}
                                        <TouchableOpacity
                                            style={[
                                                styles.badge,
                                                (topBarData?.goldMultiplier ?? 1) >
                                                    1 && styles.goldMultipliedBadge,
                                            ]}
                                            activeOpacity={0.7}
                                            onPress={() =>
                                                router.push("/(tabs)/7_1_item")
                                            }
                                        >
                                            <Coins size={15} color={colors.gold} />
                                            <Text style={styles.badgeText}>
                                                {topBarData?.totalGold ?? "0"}
                                            </Text>
                                            {(topBarData?.goldMultiplier ?? 1) >
                                                1 && (
                                                <View
                                                    style={[
                                                        styles.multiplierTag,
                                                        styles.goldMultiplierTag,
                                                    ]}
                                                >
                                                    <Text
                                                        style={
                                                            styles.multiplierTagText
                                                        }
                                                    >
                                                        x
                                                        {topBarData?.goldMultiplier}
                                                    </Text>
                                                </View>
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        </Card>
                    ) : (
                        <Card variant="soft" style={styles.guestCard}>
                            <View style={styles.guestCardContent}>
                                <Ionicons
                                    name="person-circle-outline"
                                    size={36}
                                    color={colors.primary}
                                />
                                <Text style={styles.guestPromptText} numberOfLines={2}>
                                    Đăng nhập để lưu tiến trình học tập của bạn!
                                </Text>
                                <TouchableOpacity
                                    style={styles.guestLoginBtn}
                                    activeOpacity={0.8}
                                    onPress={() => router.push("/(1_auth)/1_1_login")}
                                >
                                    <Text style={styles.guestLoginBtnText}>Đăng nhập</Text>
                                </TouchableOpacity>
                            </View>
                        </Card>
                    )}
                </LinearGradient>

                {/* ── Nội dung chính ── */}
                <View style={styles.bodyBlock}>
                    {/* Loading state */}
                    {isLoading && (
                        <View style={styles.loadingBlock}>
                            <ActivityIndicator
                                size="small"
                                color={colors.primary}
                            />
                        </View>
                    )}

                    {/* Error state */}
                    {!isLoading && error && (
                        <View style={styles.loadingBlock}>
                            <Text
                                style={{
                                    fontFamily: typography.fonts.regular,
                                    color: colors.error,
                                    marginBottom: 12,
                                    textAlign: "center",
                                }}
                            >
                                Lỗi tải dữ liệu:{" "}
                                {"message" in error
                                    ? (error as any).message
                                    : JSON.stringify(error)}
                            </Text>
                            <TouchableOpacity
                                style={{
                                    backgroundColor: colors.primary,
                                    paddingHorizontal: 20,
                                    paddingVertical: 10,
                                    borderRadius: 20,
                                }}
                                onPress={handleRefresh}
                            >
                                <Text
                                    style={{
                                        fontFamily: typography.fonts.semiBold,
                                        color: "#fff",
                                    }}
                                >
                                    Thử lại
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {!isLoading && data && (
                        <>
                            {/* ── Section: Chuỗi học tập ── */}
                            {profile && (
                                <HomeStreakSection
                                    currentStreak={topBarData?.currentStreak}
                                    onPress={streakManager.openStreakDrawer}
                                />
                            )}

                            {/* Pro button — shiny gradient */}
                            {profile && (
                                <TouchableOpacity
                                    style={styles.proButtonWrapper}
                                    onPress={() => router.push("/(10_proflie)/10_8_subscription" as any)}
                                    activeOpacity={0.82}
                                >
                                    <LinearGradient
                                        colors={colors.proGradient}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                        style={styles.squareButtonPro}
                                    >
                                        <FaintStarsOverlay />
                                        {/* shimmer strip */}
                                        <LinearGradient
                                            colors={["transparent", "rgba(255,255,255,0.35)", "transparent"]}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                            style={styles.proShimmer}
                                        />
                                        <Ionicons name="sparkles" size={22} color="#fff" />
                                        <Text style={styles.squareLabelPro}>
                                            {profile?.isPro ? "Bạn đã là người dùng PRO!" : "Đăng ký Sắc Sử PRO"}
                                        </Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            )}

                            {/* ── Section: Bài học ── */}
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>
                                    Tiếp tục học
                                </Text>
                                <TouchableOpacity onPress={handleGoToLessons}>
                                    <Text style={styles.sectionLink}>
                                        Xem tất cả
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.lessonList}>
                                {data.lessons.map((lesson) => (
                                    <LessonCard
                                        key={lesson.id}
                                        lesson={lesson}
                                        onPress={() =>
                                            handleGoToLesson(lesson.id)
                                        }
                                    />
                                ))}
                            </View>

                            {/* ── Section: Nút nhanh ── */}
                            <View
                                style={[
                                    styles.sectionHeader,
                                    { marginTop: 24 },
                                ]}
                            >
                                <Text style={styles.sectionTitle}>
                                    Khám phá
                                </Text>
                            </View>

                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.quickScrollContainer}
                            >
                                <Card
                                    style={styles.quickCardHorizontal}
                                    activeOpacity={0.8}
                                    onPress={handleGoToTests}
                                >
                                    <Ionicons
                                        name="clipboard-outline"
                                        size={22}
                                        color={colors.primary}
                                    />
                                    <Text style={styles.quickLabel}>
                                        Luyện đề
                                    </Text>
                                </Card>

                                <Card
                                    style={styles.quickCardHorizontal}
                                    activeOpacity={0.8}
                                    onPress={handleGoToPvp}
                                >
                                    <Swords
                                        size={22}
                                        color={colors.primary}
                                    />
                                    <Text style={styles.quickLabel}>
                                        Thi đấu PVP
                                    </Text>
                                </Card>

                                <Card
                                    style={styles.quickCardHorizontal}
                                    activeOpacity={0.8}
                                    onPress={handleGoToItems}
                                >
                                    <Ionicons
                                        name="gift-outline"
                                        size={22}
                                        color={colors.secondary}
                                    />
                                    <Text style={styles.quickLabel}>
                                        Vật phẩm
                                    </Text>
                                </Card>

                                <Card
                                    style={styles.quickCardHorizontal}
                                    activeOpacity={0.8}
                                    onPress={handleGoToFriends}
                                >
                                    <Ionicons
                                        name="people-outline"
                                        size={22}
                                        color={colors.success}
                                    />
                                    <Text style={styles.quickLabel}>
                                        Bạn bè
                                    </Text>
                                </Card>
                            </ScrollView>

                            {/* ── Section: Top 3 BXH ── */}
                            <View
                                style={[
                                    styles.sectionHeader,
                                    { marginTop: 24 },
                                ]}
                            >
                                <Text style={styles.sectionTitle}>
                                    Bảng xếp hạng
                                </Text>
                                <TouchableOpacity
                                    onPress={handleGoToLeaderboard}
                                >
                                    <Text style={styles.sectionLink}>
                                        Xem tất cả
                                    </Text>
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
            {topBarData?.isLoggedIn && (
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
            <CustomModal
                visible={guestModalVisible}
                title="Yêu cầu đăng nhập"
                message="Bạn cần đăng nhập để sử dụng tính năng này. Đăng nhập ngay?"
                confirmText="Đăng nhập"
                cancelText="Hủy"
                onConfirm={() => {
                    setGuestModalVisible(false);
                    router.push("/(1_auth)/1_1_login");
                }}
                onCancel={() => setGuestModalVisible(false)}
                showMascot={true}
                mascotExpression="thinking"
            />
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
        position: "relative",
        overflow: "hidden",
    },
    proButtonWrapper: {
        width: "100%",
        height: 50,
        borderRadius: 12,
        overflow: "hidden",
        marginBottom: 16,
    },
    squareButtonPro: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        overflow: "hidden",
    },
    proShimmer: {
        position: "absolute",
        top: 0,
        left: "-30%",
        width: "60%",
        height: "100%",
        transform: [{ skewX: "-20deg" }],
    },
    squareLabelPro: {
        fontFamily: typography.fonts.bold,
        fontSize: 14,
        color: "#fff",
        textAlign: "center",
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
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
        marginLeft: -8,
    },
    logoText: {
        fontFamily: typography.fonts.medium,
        fontSize: 22,
        color: colors.textLight,
        letterSpacing: 0.5,
        textAlign: "center",
    },
    bellButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(124, 86, 86, 0.15)",
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
        position: "relative",
    },
    guestCard: {
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 12,
    },
    guestCardContent: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
    },
    guestPromptText: {
        ...typography.bodyMediumSemiBold,
        color: colors.textPrimary,
        flex: 1,
        fontSize: 13,
    },
    guestLoginBtn: {
        backgroundColor: colors.primary,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 30,
    },
    guestLoginBtnText: {
        ...typography.bodyMediumBold,
        color: colors.textLight,
        fontSize: 13,
    },
    cardProBadge: {
        position: "absolute",
        top: 14,
        right: 14,
        backgroundColor: "#FFD700",
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 30,
        zIndex: 2,
    },
    cardProBadgeText: {
        fontFamily: typography.fonts.bold,
        fontSize: 10,
        color: "#5C3516",
        letterSpacing: 0.5,
    },
    greetingText: {
        fontFamily: typography.fonts.medium,
        fontSize: 17,
        color: colors.textPrimary,
        marginBottom: 6,
    },
    greetingUsername: {
        fontFamily: typography.fonts.bold,
        fontSize: 17,
        color: colors.primary,
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
        backgroundColor: "transparent",
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
    quickScrollContainer: {
        gap: 10,
        paddingRight: 10,
    },
    quickCard: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.surfaceVariant,
        paddingVertical: 16,
        gap: 6,
    },
    quickCardHorizontal: {
        width: 104,
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
