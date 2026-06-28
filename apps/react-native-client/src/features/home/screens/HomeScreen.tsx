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
import type { HomeLessonItem } from "../services/homeApi";
import { PodiumSection } from "../../leaderboard/components/PodiumSection";



// ─── Component: Thẻ bài học ───────────────────────────────────────────────────
function LessonCard({ lesson, onPress }: { lesson: HomeLessonItem; onPress: () => void }) {
    const { completedNodes, totalNodes } = lesson.progress;
    const percent = totalNodes > 0 ? Math.round((completedNodes / totalNodes) * 100) : 0;

    return (
        <TouchableOpacity style={lessonStyles.card} activeOpacity={0.8} onPress={onPress}>
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
        </TouchableOpacity>
    );
}

const lessonStyles = StyleSheet.create({
    card: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.surfaceVariant,
        borderRadius: 12,
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
        fontSize: 11,
        fontWeight: "400",
        color: colors.textMuted,
        marginBottom: 2,
    },
    lessonName: {
        fontSize: 14,
        fontWeight: "500",
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
        fontSize: 11,
        fontWeight: "400",
        color: colors.textMuted,
        minWidth: 28,
    },
});

// ─── Main HomeScreen ──────────────────────────────────────────────────────────
export default function HomeScreen() {
    const router = useRouter();

    // Đảm bảo profile luôn mới nhất
    useGetProfileQuery();
    const profile = useAppSelector((state) => state.auth.profile);

    // Gọi 1 API duy nhất cho toàn bộ trang chủ
    const { data, isLoading } = useGetHomeDataQuery();

    // Map data top 3 cho PodiumSection
    const topUsersData = React.useMemo(() => {
        if (!data?.leaderboard) return [];
        return data.leaderboard.slice(0, 3).map((u) => ({
            id: u.id,
            name: u.name || "Ẩn danh",
            xp: u.totalXp ?? 0,
            streak: 0,
            avatar:
                u.avatarUrl ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    u.name || "User"
                )}&background=E8E4F4&color=5856D6&bold=true`,
        }));
    }, [data?.leaderboard]);

    const handleGoToLeaderboard = () => router.push("/(tabs)/9_1_leaderboard" as never);
    const handleGoToLesson = (lessonId: number) =>
        router.push(`/(3_4_lessons)/lesson/${lessonId}` as never);
    const handleGoToLessons = () => router.push("/(tabs)/2_1_lessons" as never);
    const handleGoToTests = () => router.push("/(tabs)/5_1_national_tests" as never);
    const handleGoToFriends = () => router.push("/(social)/friends" as never);

    return (
        <ScreenWrapper
            showTopBar={false}
            enableScroll={true}
            showHistoricalBackground={false}
            contentContainerStyle={styles.scrollContent}
            backgroundColor={colors.primary}
        >
            {/* ── Header Block ── */}
            <View style={styles.headerBlock}>
                <View style={styles.headerRow}>
                    <Text style={styles.logoText}>📜 Sử Việt</Text>
                    <TouchableOpacity
                        style={styles.searchButton}
                        activeOpacity={0.8}
                        onPress={handleGoToLessons}
                    >
                        <Ionicons name="search" size={20} color={colors.primary} />
                    </TouchableOpacity>
                </View>

                {/* Thẻ chào người dùng */}
                <View style={styles.userCard}>
                    <Text style={styles.greetingText}>
                        Chào, {profile?.name || "bạn"} 👋
                    </Text>
                    <View style={styles.badgeRow}>
                        <View style={styles.badge}>
                            <Ionicons name="star" size={15} color={colors.secondary} />
                            <Text style={styles.badgeText}>
                                {(profile?.totalXp ?? 0).toLocaleString("vi-VN")} XP
                            </Text>
                        </View>
                        <View style={styles.badge}>
                            <Ionicons name="stats-chart" size={15} color={colors.primary} />
                            <Text style={styles.badgeText}>
                                {profile?.tierName ?? "Chưa có hạng"}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* ── Nội dung chính ── */}
            <View style={styles.bodyBlock}>

                {/* Loading state */}
                {isLoading && (
                    <View style={styles.loadingBlock}>
                        <ActivityIndicator size="small" color={colors.primary} />
                    </View>
                )}

                {!isLoading && data && (
                    <>
                        {/* ── Section: Top 3 BXH ── */}
                        <View style={styles.sectionHeader}>
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

                        {/* ── Section: Bài học ── */}
                        <View style={[styles.sectionHeader, { marginTop: 24 }]}>
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
                            <TouchableOpacity
                                style={styles.quickCard}
                                activeOpacity={0.8}
                                onPress={handleGoToTests}
                            >
                                <Ionicons name="clipboard-outline" size={22} color={colors.primary} />
                                <Text style={styles.quickLabel}>Làm bài</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.quickCard}
                                activeOpacity={0.8}
                                onPress={handleGoToLeaderboard}
                            >
                                <Ionicons name="trophy-outline" size={22} color={colors.secondary} />
                                <Text style={styles.quickLabel}>BXH</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.quickCard}
                                activeOpacity={0.8}
                                onPress={handleGoToFriends}
                            >
                                <Ionicons name="people-outline" size={22} color={colors.success} />
                                <Text style={styles.quickLabel}>Bạn bè</Text>
                            </TouchableOpacity>
                        </View>
                    </>
                )}
            </View>
        </ScreenWrapper>
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
    logoText: {
        fontSize: 22,
        fontWeight: "500",
        color: colors.textLight,
        letterSpacing: 0.5,
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
        backgroundColor: colors.primaryContainer,
        borderRadius: 12,
        paddingHorizontal: 18,
        paddingVertical: 16,
    },
    greetingText: {
        fontSize: 17,
        fontWeight: "500",
        color: colors.textPrimary,
        marginBottom: 12,
    },
    badgeRow: { flexDirection: "row", gap: 10 },
    badge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.background,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 8,
        gap: 6,
    },
    badgeText: {
        fontSize: 13,
        fontWeight: "400",
        color: colors.textPrimary,
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
        fontSize: 15,
        fontWeight: "500",
        color: colors.textPrimary,
    },
    sectionLink: {
        fontSize: 13,
        fontWeight: "400",
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
        borderRadius: 12,
        paddingVertical: 16,
        gap: 6,
    },
    quickLabel: {
        fontSize: 12,
        fontWeight: "400",
        color: colors.textPrimary,
    },
});
