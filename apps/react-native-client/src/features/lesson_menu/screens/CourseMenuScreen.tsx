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
import { toastService } from "../../../services/toastService";
import { easterEggService } from "../../easter_egg";


function CourseCard({
    grade,
    completed,
    total,
    isPro,
    isUserPro,
    imgUrl,
    onPress,
}: {
    grade: number;
    completed: number;
    total: number;
    isPro: boolean;
    isUserPro: boolean;
    imgUrl?: string | null;
    onPress: () => void;
}) {
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

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

                {/* Overlapping Pill Badge */}
                <View style={[styles.badge, { backgroundColor: themeColor }]}>
                    <Text style={styles.badgeText}>{percentage}%</Text>
                </View>

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
                    {completed}/{total} phần đã học
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

function matchesSearch(text: string, query: string, isTest: boolean = false): boolean {
    const normText = text.toLowerCase().trim();
    const normQuery = query.toLowerCase().trim();

    if (normText.includes(normQuery)) return true;

    const testKeywords = ["quiz", "test", "kiểm tra", "đề", "exam"];

    if (isTest) {
        const isGeneric = testKeywords.some(k => normQuery === k);
        if (isGeneric) return true;
    }

    const queryHasTestKey = testKeywords.some(k => normQuery.includes(k) && (k !== "đề" || !normQuery.includes("chủ đề")));

    if (isTest && queryHasTestKey) {
        let cleanQuery = normQuery;
        let cleanText = normText;
        testKeywords.forEach(k => {
            cleanQuery = cleanQuery.replace(k, "").trim();
            cleanText = cleanText.replace(k, "").trim();
        });

        cleanQuery = cleanQuery.replace("chủ đề", "").trim();
        cleanText = cleanText.replace("chủ đề", "").trim();

        if (cleanQuery && (cleanText.includes(cleanQuery) || cleanQuery.includes(cleanText))) {
            return true;
        }
    }

    return false;
}

function matchesTopicOrLesson(name: string, position: number, prefix: string, query: string): boolean {
    const normQuery = query.toLowerCase().trim();
    const normName = name.toLowerCase().trim();
    const prefixWithPos = `${prefix} ${position}`.toLowerCase();
    const fullName = `${prefixWithPos}: ${normName}`;

    if (fullName.includes(normQuery) || normName.includes(normQuery)) return true;

    if (/^\d+$/.test(normQuery) && parseInt(normQuery, 10) === position) {
        return true;
    }

    return false;
}

function matchesGradeStructure(grade: number, structure: any, query: string): boolean {
    const q = query.trim().toLowerCase();
    if (!q) return true;

    const gradeTitle = `sách giáo khoa lớp ${grade}`.toLowerCase();
    if (gradeTitle.includes(q) || String(grade).includes(q)) return true;

    if (!structure || !structure.topics) return false;

    for (const topic of structure.topics) {
        if (matchesTopicOrLesson(topic.name, topic.position, "chủ đề", query)) {
            return true;
        }
        if (topic.lessons) {
            for (const lesson of topic.lessons) {
                if (matchesTopicOrLesson(lesson.name, lesson.position, "bài", query)) {
                    return true;
                }
            }
        }
        const testTitle = `Kiểm tra Chủ đề ${topic.position}`;
        if (matchesSearch(testTitle, query, true)) {
            return true;
        }
    }

    const finalTestTitle = `Kiểm tra Lớp ${grade}`;
    if (matchesSearch(finalTestTitle, query, true)) {
        return true;
    }

    return false;
}

export function CourseMenuScreen() {
    const router = useRouter();
    const profile = useAppSelector((state) => state.auth.profile);
    const isUserPro = profile?.isPro === true;

    const { data: struct10, isLoading: loading10, refetch: refetch10, isFetching: isFetching10 } = useGetGradeStructureQuery(10);
    const { data: struct11, isLoading: loading11, refetch: refetch11, isFetching: isFetching11 } = useGetGradeStructureQuery(11);
    const { data: struct12, isLoading: loading12, refetch: refetch12, isFetching: isFetching12 } = useGetGradeStructureQuery(12);

    const { data: gradesData } = useGetGradesQuery();

    const [premiumModalVisible, setPremiumModalVisible] = useState(false);
    const [lockedFeatureName, setLockedFeatureName] = useState("");

    const isLoading = loading10 || loading11 || loading12;
    const isFetching = isFetching10 || isFetching11 || isFetching12;
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearchFocused, setIsSearchFocused] = useState(false);

    const handleRefresh = () => {
        refetch10();
        refetch11();
        refetch12();
    };

    const getProgress = (structure: any) => {
        if (!structure) return { completed: 0, total: 0 };
        if (structure.progress) {
            return {
                completed: structure.progress.completedNodes,
                total: structure.progress.totalNodes,
            };
        }
        if (!structure.topics) return { completed: 0, total: 0 };
        let total = 0;
        let completed = 0;
        for (const t of structure.topics) {
            total += t.progress?.totalNodes ?? 0;
            completed += t.progress?.completedNodes ?? 0;
        }
        return { completed, total };
    };

    const prog10 = getProgress(struct10);
    const prog11 = getProgress(struct11);
    const prog12 = getProgress(struct12);

    const show10 = matchesGradeStructure(10, struct10, searchQuery);
    const show11 = matchesGradeStructure(11, struct11, searchQuery);
    const show12 = matchesGradeStructure(12, struct12, searchQuery);

    const isGradePro = (gradeId: number) => {
        const gradeObj = gradesData?.grades?.find((g) => g.id === gradeId);
        return !!gradeObj?.isPro;
    };

    const getGradeImgUrl = (gradeId: number) => {
        const gradeObj = gradesData?.grades?.find((g) => g.id === gradeId);
        return gradeObj?.imgUrl;
    };

    const showProModal = (feature: string) => {
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

    const handleSearchSubmit = () => {
        const code = searchQuery.trim().toLowerCase();
        if (code === "eng on") {
            easterEggService.setEngMode(true);
            toastService.show("English mode activated!", "success");
            setSearchQuery("");
        } else if (code === "eng off") {
            easterEggService.setEngMode(false);
            toastService.show("English mode deactivated!", "info");
            setSearchQuery("");
        }
    };

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
                        placeholder="Tìm kiếm bài học, chủ đề..."
                        placeholderTextColor={colors.textPlaceholder}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        underlineColorAndroid="transparent"
                        onFocus={() => setIsSearchFocused(true)}
                        onBlur={() => setIsSearchFocused(false)}
                        returnKeyType="done"
                        onSubmitEditing={handleSearchSubmit}
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
                            {show10 && (
                                <CourseCard
                                    grade={10}
                                    completed={prog10.completed}
                                    total={prog10.total}
                                    isPro={isGradePro(10)}
                                    isUserPro={isUserPro}
                                    imgUrl={getGradeImgUrl(10)}
                                    onPress={() => handleCoursePress(10)}
                                />
                            )}
                            {show11 && (
                                <CourseCard
                                    grade={11}
                                    completed={prog11.completed}
                                    total={prog11.total}
                                    isPro={isGradePro(11)}
                                    isUserPro={isUserPro}
                                    imgUrl={getGradeImgUrl(11)}
                                    onPress={() => handleCoursePress(11)}
                                />
                            )}
                            {show12 && (
                                <CourseCard
                                    grade={12}
                                    completed={prog12.completed}
                                    total={prog12.total}
                                    isPro={isGradePro(12)}
                                    isUserPro={isUserPro}
                                    imgUrl={getGradeImgUrl(12)}
                                    onPress={() => handleCoursePress(12)}
                                />
                            )}
                            {!show10 && !show11 && !show12 && (
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
        fontSize: 13,
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
