import React, { useState } from "react";
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    ActivityIndicator,
    TextInput,
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
            style={[styles.card, { backgroundColor: bgColor }]}
            onPress={onPress}
            activeOpacity={0.85}
        >
            {/* Left Image Section */}
            <View style={[styles.imageContainer, { backgroundColor: colors.surface }]}>
                <Ionicons name="book" size={40} color={themeColor} />
                
                {/* Overlapping Pill Badge */}
                <View style={[styles.badge, { backgroundColor: themeColor }]}>
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
        if (topic.firstTest && matchesSearch(topic.firstTest.title, query, true)) {
            return true;
        }
    }
    
    if (structure.finalTest && matchesSearch(structure.finalTest.title, query, true)) {
        return true;
    }
    
    return false;
}

export function CourseMenuScreen() {
    const router = useRouter();

    const { data: struct10, isLoading: loading10 } = useGetGradeStructureQuery(10);
    const { data: struct11, isLoading: loading11 } = useGetGradeStructureQuery(11);
    const { data: struct12, isLoading: loading12 } = useGetGradeStructureQuery(12);

    const isLoading = loading10 || loading11 || loading12;
    const [searchQuery, setSearchQuery] = useState("");

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

    const show10 = matchesGradeStructure(10, struct10, searchQuery);
    const show11 = matchesGradeStructure(11, struct11, searchQuery);
    const show12 = matchesGradeStructure(12, struct12, searchQuery);

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
                <Text style={styles.screenSubtitle}>Chọn khoá học để bắt đầu</Text>

                <View style={styles.searchContainer}>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Tìm kiếm bài học, chủ đề..."
                        placeholderTextColor={colors.textPlaceholder}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        underlineColorAndroid="transparent"
                    />
                </View>

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
                                onPress={() => handleCoursePress(10)}
                            />
                        )}
                        {show11 && (
                            <CourseCard
                                grade={11}
                                completed={prog11.completed}
                                total={prog11.total}
                                onPress={() => handleCoursePress(11)}
                            />
                        )}
                        {show12 && (
                            <CourseCard
                                grade={12}
                                completed={prog12.completed}
                                total={prog12.total}
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
        fontWeight: "700",
        color: colors.textPrimary,
        marginBottom: 4,
        textAlign: "center",
    },
    screenSubtitle: {
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
        borderRadius: 8,
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
    searchContainer: {
        marginBottom: 16,
    },
    searchInput: {
        height: 48,
        backgroundColor: colors.inputBackground,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 14,
        fontWeight: "300",
        color: colors.textPrimary,
    },
    noResultsText: {
        textAlign: "center",
        color: colors.textSecondary,
        fontSize: 14,
        marginTop: 32,
    },
});
