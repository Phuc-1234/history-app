import React, { useState } from "react";
import {
    StyleSheet,
    Text,
    View,
    ActivityIndicator,
    TextInput,
    ScrollView,
    RefreshControl,
    Modal,
    TouchableOpacity,
    Image,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenWrapper } from "../../../components/layout/ScreenWrapper";
import { useGetGradeStructureQuery, useGetGradesQuery } from "../contentApiSlice";
import { colors } from "../../../theme/colors";
import typography from "../../../theme/typography";
import { Card } from "../../../components/Card";
import { Ionicons } from "@expo/vector-icons";
import { useAppSelector } from "../../../store/storeHook";
import { PremiumModal } from "../../../components/PremiumModal";
import { CustomModal } from "../../../components/Modal";
import { toastService } from "../../../services/toastService";


function CourseCard({
    grade,
    completed,
    total,
    isPro,
    isUserPro,
    imgUrl,
    isLoading,
    onPress,
}: {
    grade: number;
    completed: number | null;
    total: number | null;
    isPro: boolean;
    isUserPro: boolean;
    imgUrl?: string | null;
    isLoading?: boolean;
    onPress: () => void;
}) {
    const percentage = (total && total > 0 && completed !== null) ? Math.round((completed / total) * 100) : 0;

    let themeColor = colors.primary;
    if (grade === 11) {
        themeColor = colors.secondary;
    } else if (grade === 12) {
        themeColor = colors.success;
    }

    return (
        <Card
            style={[
                styles.card,
                {
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.borderMedium,
                },
            ]}
            onPress={onPress}
            activeOpacity={0.85}
        >
            {/* Left Image Section */}
            <View style={[styles.imageContainer, { backgroundColor: colors.surfaceVariant, overflow: "hidden" }]}>
                {imgUrl ? (
                    <Image source={{ uri: imgUrl }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                ) : (
                    <Ionicons name="book" size={40} color={themeColor} />
                )}

                {isPro && !isUserPro && (
                    <View style={styles.lockOverlay}>
                        <Ionicons name="lock-closed" size={24} color="#FFFFFF" />
                    </View>
                )}
            </View>

            {/* Right Details Section */}
            <View style={styles.detailsContainer}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 4 }}>
                    <Text style={styles.courseTitle} numberOfLines={2}>
                        Lịch sử lớp {grade}
                    </Text>
                    {isPro && (
                        <View style={[styles.proBadge, { backgroundColor: isUserPro ? colors.successContainer : colors.secondaryContainer }]}>
                            <Ionicons name={isUserPro ? "ribbon" : "lock-closed"} size={11} color={isUserPro ? colors.success : colors.secondaryHover} />
                            <Text style={[styles.proBadgeText, { color: isUserPro ? colors.success : colors.secondaryHover }]}>PRO</Text>
                        </View>
                    )}
                </View>

                <Text style={styles.courseSubtitle}>
                    {isLoading || completed === null || total === null ? "... phần đã hoàn thành" : `${completed}/${total} phần đã hoàn thành`}
                </Text>

                {/* Modern mini progress bar */}
                <View style={styles.progressContainer}>
                    <View style={styles.progressBarTrack}>
                        <View
                            style={[
                                styles.progressBarFill,
                                { width: `${percentage}%`, backgroundColor: themeColor },
                            ]}
                        />
                    </View>
                </View>
            </View>

            {/* Chevron Right indicator */}
            <View style={styles.chevronContainer}>
                <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </View>
        </Card>
    );
}

function matchesGradeOnly(grade: number, query: string): boolean {
    const q = query.trim().toLowerCase();
    if (!q) return true;

    const title = `lịch sử lớp ${grade}`.toLowerCase();
    const altTitle = `lớp ${grade}`.toLowerCase();

    return title.includes(q) || altTitle.includes(q) || String(grade).includes(q);
}

function GradeCourseCard({
    grade,
    isUserPro,
    searchQuery,
    isRefreshing,
    onCoursePress,
    onVisibilityChange,
}: {
    grade: any;
    isUserPro: boolean;
    searchQuery: string;
    isRefreshing: boolean;
    onCoursePress: (gradeId: number) => void;
    onVisibilityChange: (gradeId: number, isVisible: boolean) => void;
}) {
    const { data: structure, isLoading, refetch } = useGetGradeStructureQuery(grade.id, {
        refetchOnMountOrArgChange: true,
    });

    React.useEffect(() => {
        if (isRefreshing) {
            refetch();
        }
    }, [isRefreshing, refetch]);

    const progress = React.useMemo(() => {
        if (!structure) return null;
        if (structure.progress) {
            return {
                completed: structure.progress.completedNodes,
                total: structure.progress.totalNodes,
            };
        }
        if (!structure.topics) return null;
        let total = 0;
        let completed = 0;
        for (const t of structure.topics) {
            total += t.progress?.totalNodes ?? 0;
            completed += t.progress?.completedNodes ?? 0;
        }
        return { completed, total };
    }, [structure]);

    const isVisible = React.useMemo(() => {
        return matchesGradeOnly(grade.id, searchQuery);
    }, [grade.id, searchQuery]);

    React.useEffect(() => {
        onVisibilityChange(grade.id, isVisible);
        return () => onVisibilityChange(grade.id, false);
    }, [grade.id, isVisible, onVisibilityChange]);

    if (!isVisible) return null;

    return (
        <CourseCard
            grade={grade.id}
            completed={progress ? progress.completed : null}
            total={progress ? progress.total : null}
            isLoading={isLoading || !structure}
            isPro={!!grade.isPro}
            isUserPro={isUserPro}
            imgUrl={grade.imgUrl}
            onPress={() => onCoursePress(grade.id)}
        />
    );
}

export function CourseMenuScreen() {
    const router = useRouter();
    const profile = useAppSelector((state) => state.auth.profile);
    const isUserPro = profile?.isPro === true;

    const { data: gradesData, isLoading, isFetching, refetch } = useGetGradesQuery();

    const [premiumModalVisible, setPremiumModalVisible] = useState(false);
    const [lockedFeatureName, setLockedFeatureName] = useState("");
    const [guestModalVisible, setGuestModalVisible] = useState(false);

    const [searchQuery, setSearchQuery] = useState("");
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [visibleMap, setVisibleMap] = useState<Record<number, boolean>>({});

    const publicGrades = React.useMemo(() => {
        return (gradesData?.grades || [])
            .filter((g: any) => g.state === "PUBLIC")
            .sort((a: any, b: any) => a.id - b.id);
    }, [gradesData]);

    const handleVisibilityChange = React.useCallback((gradeId: number, isVisible: boolean) => {
        setVisibleMap((prev) => {
            if (prev[gradeId] === isVisible) return prev;
            return { ...prev, [gradeId]: isVisible };
        });
    }, []);

    const handleRefresh = () => {
        refetch();
    };

    const isGradePro = (gradeId: number) => {
        const gradeObj = gradesData?.grades?.find((g) => g.id === gradeId);
        return !!gradeObj?.isPro;
    };

    const showProModal = (feature: string) => {
        if (!profile) {
            setGuestModalVisible(true);
            return;
        }
        setLockedFeatureName(feature);
        setPremiumModalVisible(true);
    };

    const handleCoursePress = (grade: number) => {
        if (isGradePro(grade) && !isUserPro) {
            showProModal(`khóa học Lớp ${grade}`);
            return;
        }
        router.push({
            pathname: "/(3_4_lessons)/lesson_menu",
            params: { grade: String(grade) },
        });
    };
    const hasVisibleCards = publicGrades.length > 0 && publicGrades.some((g: any) => visibleMap[g.id] !== false);

    return (
        <ScreenWrapper>
            <View style={styles.container}>
                <View style={styles.headerRow}>
                    <Text style={styles.screenHeader}>Học phần</Text>
                </View>
                <Text style={styles.screenSubtitle}>Chọn học phần để bắt đầu</Text>

                <View style={styles.searchContainer}>
                    <TextInput
                        style={[
                            styles.searchInput,
                            isSearchFocused && styles.searchInputFocused
                        ]}
                        placeholder="Tìm kiếm khối lớp..."
                        placeholderTextColor={colors.textPlaceholder}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        underlineColorAndroid="transparent"
                        onFocus={() => setIsSearchFocused(true)}
                        onBlur={() => setIsSearchFocused(false)}
                        returnKeyType="done"
                    />
                </View>

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                    refreshControl={
                        <RefreshControl
                            refreshing={isFetching && !isLoading}
                            onRefresh={handleRefresh}
                            colors={[colors.primary]}
                            tintColor={colors.primary}
                        />
                    }
                >
                    {isLoading ? (
                        <View style={styles.centerLoader}>
                            <ActivityIndicator size="large" color={colors.primary} />
                        </View>
                    ) : (
                        <View style={styles.listContainer}>
                            {publicGrades.map((grade: any) => (
                                <GradeCourseCard
                                    key={grade.id}
                                    grade={grade}
                                    isUserPro={isUserPro}
                                    searchQuery={searchQuery}
                                    isRefreshing={isFetching}
                                    onCoursePress={handleCoursePress}
                                    onVisibilityChange={handleVisibilityChange}
                                />
                            ))}
                            {!hasVisibleCards && (
                                <Text style={styles.noResultsText}>
                                    Không tìm thấy khóa học nào phù hợp.
                                </Text>
                            )}
                        </View>
                    )}
                </ScrollView>
            </View>


            <PremiumModal
                visible={premiumModalVisible}
                onClose={() => setPremiumModalVisible(false)}
                featureName={lockedFeatureName}
            />
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
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 16,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    screenHeader: {
        fontFamily: typography.fonts.bold,
        fontSize: 26,
        color: colors.textPrimary,
        marginBottom: 4,
        textAlign: "center",
    },
    screenSubtitle: {
        fontFamily: typography.fonts.regular,
        fontSize: 15,
        color: colors.textSecondary,
        marginBottom: 24,
        textAlign: "center",
    },
    centerLoader: {
        marginTop: 100,
        justifyContent: "center",
        alignItems: "center",
    },
    listContainer: {
        flexDirection: "column",
    },
    card: {
        flexDirection: "row",
        marginBottom: 18,
        overflow: "hidden",
        height: 110,
        alignItems: "center",
    },
    imageContainer: {
        width: 86,
        height: 86,
        borderRadius: 8,
        marginLeft: 12,
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
    },
    badge: {
        position: "absolute",
        bottom: 8,
        right: 8,
        backgroundColor: colors.primary,
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 3,
    },
    badgeText: {
        fontFamily: typography.fonts.light,
        color: colors.textLight,
        fontSize: 11,
    },
    detailsContainer: {
        flex: 1,
        paddingVertical: 14,
        paddingHorizontal: 16,
        justifyContent: "center",
    },
    courseTitle: {
        fontFamily: typography.fonts.bold,
        fontSize: 17,
        color: colors.accent,
        marginBottom: 4,
    },
    courseSubtitle: {
        fontFamily: typography.fonts.regular,
        fontSize: 11,
        color: "#000000",
        marginBottom: 10,
    },
    progressContainer: {
        width: "100%",
    },
    progressBarTrack: {
        height: 6,
        backgroundColor: colors.borderMedium,
        borderRadius: 3,
        overflow: "hidden",
        width: "100%",
    },
    progressBarFill: {
        height: "100%",
        borderRadius: 3,
    },
    chevronContainer: {
        justifyContent: "center",
        paddingRight: 16,
    },
    searchContainer: {
        marginBottom: 16,
    },
    searchInput: {
        fontFamily: typography.fonts.light,
        height: 48,
        backgroundColor: colors.inputBackground,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 14,
        color: colors.textPrimary,
        borderWidth: 1.5,
        borderColor: "transparent",
    },
    searchInputFocused: {
        borderColor: colors.accent,
    },
    noResultsText: {
        fontFamily: typography.fonts.regular,
        textAlign: "center",
        color: colors.textSecondary,
        fontSize: 14,
        marginTop: 32,
    },
    headerRow: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 4,
    },
    masteryBadgeButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.accent,
        borderRadius: 30,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    masteryBadgeButtonText: {
        fontFamily: typography.fonts.semiBold,
        fontSize: 13,
        color: "#FFFFFF",
        marginLeft: 4,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.4)",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    modalContent: {
        width: "100%",
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 20,
        borderWidth: 1,
        borderColor: colors.borderMedium,
    },
    modalTitle: {
        fontFamily: typography.fonts.bold,
        fontSize: 20,
        color: colors.textPrimary,
        marginBottom: 4,
        textAlign: "center",
    },
    modalSubtitle: {
        fontFamily: typography.fonts.regular,
        fontSize: 13,
        color: colors.textSecondary,
        marginBottom: 20,
        textAlign: "center",
    },
    modalScroll: {
        maxHeight: 300,
        marginBottom: 20,
    },
    masteryGradeItem: {
        marginBottom: 16,
    },
    masteryGradeHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 6,
    },
    masteryGradeText: {
        fontFamily: typography.fonts.semiBold,
        fontSize: 15,
        color: colors.textPrimary,
    },
    masteryGradePct: {
        fontFamily: typography.fonts.bold,
        fontSize: 15,
    },
    masteryProgressBarTrack: {
        height: 8,
        backgroundColor: colors.borderMedium,
        borderRadius: 4,
        overflow: "hidden",
    },
    masteryProgressBarFill: {
        height: "100%",
        borderRadius: 4,
    },
    modalCloseButton: {
        backgroundColor: colors.primary,
        borderRadius: 30,
        paddingVertical: 12,
        alignItems: "center",
    },
    modalCloseButtonText: {
        fontFamily: typography.fonts.bold,
        fontSize: 15,
        color: "#FFFFFF",
    },
    lockOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(43, 29, 18, 0.4)",
        borderRadius: 8,
        justifyContent: "center",
        alignItems: "center",
    },
    proBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 2,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
    },
    proBadgeText: {
        fontFamily: typography.fonts.bold,
        fontSize: 10,
    },
});
