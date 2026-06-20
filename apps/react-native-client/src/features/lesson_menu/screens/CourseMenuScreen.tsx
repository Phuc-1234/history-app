import React from "react";
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenWrapper } from "../../../components/layout/ScreenWrapper";
import { useGetGradeStructureQuery } from "../contentApiSlice";
import { colors } from "../../../theme/colors";
import { Ionicons } from "@expo/vector-icons";

function CourseCard({
    grade,
    completed,
    total,
    onPress,
}: {
    grade: number;
    completed: number;
    total: number;
    onPress: () => void;
}) {
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    let themeColor = colors.primary;
    let bgColor = "#EBE8FF";
    if (grade === 11) {
        themeColor = colors.secondary;
        bgColor = "#FEF1D3";
    } else if (grade === 12) {
        themeColor = colors.success;
        bgColor = "#ECFDF5";
    }

    return (
        <TouchableOpacity
            style={styles.card}
            onPress={onPress}
            activeOpacity={0.85}
        >
            {/* Left Image Section */}
            <View style={[styles.imageContainer, { backgroundColor: bgColor }]}>
                <Ionicons name="book" size={40} color={themeColor} />
                
                {/* Overlapping Pill Badge */}
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>{percentage}%</Text>
                </View>
            </View>

            {/* Right Details Section */}
            <View style={styles.detailsContainer}>
                <Text style={styles.courseTitle} numberOfLines={2}>
                    Sách giáo khoa lớp {grade}
                </Text>
                
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
        </TouchableOpacity>
    );
}

export function CourseMenuScreen() {
    const router = useRouter();

    const { data: struct10, isLoading: loading10 } = useGetGradeStructureQuery(10);
    const { data: struct11, isLoading: loading11 } = useGetGradeStructureQuery(11);
    const { data: struct12, isLoading: loading12 } = useGetGradeStructureQuery(12);

    const isLoading = loading10 || loading11 || loading12;

    const getProgress = (structure: any) => {
        if (!structure || !structure.topics) return { completed: 0, total: 0 };
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

    const handleCoursePress = (grade: number) => {
        router.push({
            pathname: "/(3_4_lessons)/lesson_menu",
            params: { grade: String(grade) },
        });
    };

    return (
        <ScreenWrapper
            enableScroll
            contentContainerStyle={styles.scrollContent}
        >
            <View style={styles.container}>
                <Text style={styles.screenHeader}>Khóa Học</Text>
                <Text style={styles.screenSubtitle}>Chọn sách giáo khoa để bắt đầu học tập</Text>

                {isLoading ? (
                    <View style={styles.centerLoader}>
                        <ActivityIndicator size="large" color={colors.primary} />
                    </View>
                ) : (
                    <View style={styles.listContainer}>
                        <CourseCard
                            grade={10}
                            completed={prog10.completed}
                            total={prog10.total}
                            onPress={() => handleCoursePress(10)}
                        />
                        <CourseCard
                            grade={11}
                            completed={prog11.completed}
                            total={prog11.total}
                            onPress={() => handleCoursePress(11)}
                        />
                        <CourseCard
                            grade={12}
                            completed={prog12.completed}
                            total={prog12.total}
                            onPress={() => handleCoursePress(12)}
                        />
                    </View>
                )}
            </View>
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
        fontSize: 26,
        fontWeight: "800",
        color: colors.textPrimary,
        marginBottom: 4,
    },
    screenSubtitle: {
        fontSize: 15,
        color: colors.textSecondary,
        marginBottom: 24,
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
        backgroundColor: colors.surface,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: colors.borderDark,
        marginBottom: 18,
        overflow: "hidden",
        
        height: 110,
    },
    imageContainer: {
        width: 110,
        height: 110,
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
    },
    badge: {
        position: "absolute",
        bottom: 8,
        right: 8,
        backgroundColor: colors.primary,
        borderRadius: 5,
        paddingHorizontal: 8,
        paddingVertical: 3,
        
    },
    badgeText: {
        color: colors.textLight,
        fontSize: 11,
        fontWeight: "300",
    },
    detailsContainer: {
        flex: 1,
        paddingVertical: 14,
        paddingHorizontal: 16,
        justifyContent: "center",
    },
    courseTitle: {
        fontSize: 17,
        fontWeight: "700",
        color: colors.textPrimary,
        marginBottom: 4,
    },
    courseSubtitle: {
        fontSize: 13,
        color: colors.textSecondary,
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
});
