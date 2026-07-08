import React, { useState } from "react";
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    ActivityIndicator,
    RefreshControl,
    TextInput,
    TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Book } from "lucide-react-native";
import Svg, { Circle } from "react-native-svg";
import { useRouter } from "expo-router";
import { useAppSelector } from "../../../store/storeHook";
import { useLessonMenu } from "../hooks/useLessonMenu";
import { ScreenWrapper } from "../../../components/layout/ScreenWrapper";
import { Card } from "../../../components/Card";
import { colors } from "../../../theme/colors";
import typography from "../../../theme/typography";

interface LessonMenuProps {
    selectedGrade: number;
    onLessonPress: (id: number) => void;
    onMindmapPress: (topicId: number) => void;
    onTestPress: (scopeType: string, scopeId: number) => void;
}

/** Small progress ring at the end of the card */
function SmallProgressRing({ pct, isAccent }: { pct: number; isAccent?: boolean }) {
    const size = 24;
    const strokeWidth = 3;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const clampedPct = Math.max(0, Math.min(1, pct));
    const strokeDashoffset = circumference - clampedPct * circumference;

    const bgStroke = isAccent ? "rgba(255, 255, 255, 0.3)" : colors.borderMedium;
    const fgStroke = isAccent ? "#FFFFFF" : colors.primary;

    return (
        <Svg width={size} height={size}>
            <Circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={bgStroke}
                strokeWidth={strokeWidth}
                fill="none"
            />
            <Circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={fgStroke}
                strokeWidth={strokeWidth}
                fill="none"
                strokeDasharray={`${circumference} ${circumference}`}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
        </Svg>
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

export function LessonMenu({
    selectedGrade,
    onLessonPress,
    onMindmapPress,
    onTestPress,
}: LessonMenuProps) {
    const router = useRouter();
    const isLoggedIn = !!useAppSelector((state) => state.auth.profile);
    const {
        topics,
        finalTestPassed,
        loading,
        refetch,
        isFetching,
    } = useLessonMenu(selectedGrade);

    const [searchQuery, setSearchQuery] = useState("");
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [collapsedTopics, setCollapsedTopics] = useState<Record<number, boolean>>({});

    const toggleTopic = (topicId: number) => {
        setCollapsedTopics((prev) => ({
            ...prev,
            [topicId]: !prev[topicId],
        }));
    };

    const filteredTopics = React.useMemo(() => {
        if (!searchQuery.trim()) return topics;
        const query = searchQuery.trim();
        return topics
            .map((topic) => {
                const topicMatches = matchesTopicOrLesson(topic.name, topic.position, "chủ đề", query);

                const matchedLessons = topic.lessons.filter((lesson) =>
                    matchesTopicOrLesson(lesson.name, lesson.position, "bài", query)
                );

                const testTitle = `Kiểm tra Chủ đề ${topic.position}`;
                const firstTestMatches = matchesSearch(testTitle, query, true);

                if (topicMatches || matchedLessons.length > 0 || firstTestMatches) {
                    return {
                        ...topic,
                        lessons: matchedLessons.length > 0 ? matchedLessons : (topicMatches ? topic.lessons : []),
                    };
                }
                return null;
            })
            .filter(Boolean) as typeof topics;
    }, [topics, searchQuery]);

    const shouldShowFinalTest = React.useMemo(() => {
        if (!searchQuery.trim()) return true;
        const finalTestTitle = `Kiểm tra Lớp ${selectedGrade}`;
        return matchesSearch(finalTestTitle, searchQuery, true);
    }, [selectedGrade, searchQuery]);

    const overallStats = React.useMemo(() => {
        let total = 0;
        let completed = 0;
        topics.forEach((topic) => {
            topic.lessons.forEach((lesson) => {
                const lessonAny = lesson as any;
                if (lessonAny.progress) {
                    total += lessonAny.progress.totalNodes || 0;
                    completed += lessonAny.progress.completedNodes || 0;
                }
            });
        });
        return { completed, total };
    }, [topics]);

    const overallProgress = overallStats.total > 0 ? overallStats.completed / overallStats.total : 0;
    const progressPercentage = Math.round(overallProgress * 100);

    const themeColor = React.useMemo(() => {
        if (selectedGrade === 11) return colors.secondary;
        if (selectedGrade === 12) return colors.success;
        return colors.primary;
    }, [selectedGrade]);

    const branchConfig = {
        hierarchy: "Học phần",
        title: `Lớp ${selectedGrade}`,
        onBackPress: () => router.back(),
    };

    return (
        <ScreenWrapper branchConfig={branchConfig} showTopBar={false}>
            <View style={styles.container}>
                {loading ? (
                    <View style={styles.centerLoader}>
                        <ActivityIndicator
                            size="large"
                            color={colors.primary}
                        />
                    </View>
                ) : (
                    <>
                        <ScrollView
                            contentContainerStyle={styles.scrollContent}
                            showsVerticalScrollIndicator={false}
                            refreshControl={
                                <RefreshControl
                                    refreshing={isFetching && !loading}
                                    onRefresh={refetch}
                                    colors={[colors.primary]}
                                    tintColor={colors.primary}
                                />
                            }
                        >
                            {/* Overall Grade Progress Card */}
                            <Card variant="bordered" style={styles.headerProgressCard}>
                                <View style={[styles.gradeAvatar, { backgroundColor: colors.surfaceVariant }]}>
                                    <Ionicons name="book" size={32} color={themeColor} />
                                </View>
                                <View style={styles.gradeProgressRight}>
                                    <Text style={styles.gradeTitleText}>
                                        Lịch sử lớp {selectedGrade}
                                    </Text>
                                    <View style={styles.topProgressWrapper}>
                                        <View style={styles.topProgressTrack}>
                                            <View
                                                style={[
                                                    styles.topProgressFill,
                                                    { width: `${progressPercentage}%`, backgroundColor: themeColor },
                                                ]}
                                            >
                                                {progressPercentage >= 20 && (
                                                    <Text style={styles.progressNumberTextInside}>
                                                        {overallStats.completed}/{overallStats.total}
                                                    </Text>
                                                )}
                                            </View>
                                            {progressPercentage < 20 && (
                                                <View
                                                    style={[
                                                        styles.progressNumberTextOutsideContainer,
                                                        { left: `${progressPercentage}%` },
                                                    ]}
                                                >
                                                    <Text style={styles.progressNumberTextOutside}>
                                                        {overallStats.completed}/{overallStats.total}
                                                    </Text>
                                                </View>
                                            )}
                                        </View>
                                        <View
                                            style={[
                                                styles.topProgressIconFloating,
                                                { left: `${progressPercentage}%` },
                                            ]}
                                        >
                                            <Book
                                                size={28}
                                                color={colors.borderMedium}
                                                fill="#FFFFFF"
                                                strokeWidth={1.5}
                                                style={styles.floatingBookShadow}
                                            />
                                        </View>
                                    </View>
                                </View>
                            </Card>

                            {/* Search Container moved beneath the layout inside ScrollView */}
                            <View style={styles.searchContainer}>
                                <TextInput
                                    style={[
                                        styles.searchInput,
                                        isSearchFocused && styles.searchInputFocused
                                    ]}
                                    placeholder="Tìm kiếm bài học..."
                                    placeholderTextColor={colors.textPlaceholder}
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                    underlineColorAndroid="transparent"
                                    onFocus={() => setIsSearchFocused(true)}
                                    onBlur={() => setIsSearchFocused(false)}
                                />
                            </View>

                            {filteredTopics.map((topic) => {
                                const isCollapsed = !!collapsedTopics[topic.id];

                                return (
                                    <View key={topic.id} style={styles.topicWrapper}>
                                        {/* Interactive collapsible topic header */}
                                        <TouchableOpacity
                                            style={styles.topicDivider}
                                            onPress={() => toggleTopic(topic.id)}
                                            activeOpacity={0.7}
                                        >
                                            <Text style={styles.topicDividerText} numberOfLines={2}>
                                                Chủ đề {topic.position}: {topic.name}
                                            </Text>
                                            <Ionicons
                                                name={isCollapsed ? "chevron-down" : "chevron-up"}
                                                size={18}
                                                color={colors.textMuted}
                                            />
                                        </TouchableOpacity>

                                        {/* Collapsible content */}
                                        {!isCollapsed && (
                                            <View style={styles.lessonList}>
                                                {topic.lessons.map((lesson) => {
                                                    const lessonAny = lesson as any;
                                                    const lessonPct =
                                                        lessonAny.progress != null &&
                                                        lessonAny.progress.totalNodes > 0
                                                            ? lessonAny.progress.completedNodes /
                                                              lessonAny.progress.totalNodes
                                                            : 0;
                                                    const isDone = lessonPct >= 1;

                                                    return (
                                                        <Card
                                                            key={lesson.id}
                                                            variant="grayBorder"
                                                            style={styles.lessonCard}
                                                            onPress={() => onLessonPress(lesson.id)}
                                                        >
                                                            <View style={styles.cardTextContainer}>
                                                                <Text style={styles.lessonCardTitle}>
                                                                    Bài {lesson.position}:{" "}
                                                                    <Text style={styles.lessonNameText}>{lesson.name}</Text>
                                                                </Text>
                                                            </View>
                                                            <View style={styles.cardRightContainer}>
                                                                {isDone ? (
                                                                    <Ionicons name="checkmark-circle" size={24} color={colors.success} />
                                                                ) : (
                                                                    <SmallProgressRing pct={lessonPct} />
                                                                )}
                                                                {isLoggedIn && lessonAny.progress != null && (
                                                                    <Text style={styles.lessonProgressTextBelow}>
                                                                        {lessonAny.progress.completedNodes}/{lessonAny.progress.totalNodes}
                                                                    </Text>
                                                                )}
                                                            </View>
                                                        </Card>
                                                    );
                                                })}

                                                {/* Topic test card */}
                                                {(() => {
                                                    const testPassed = !!topic.testPassed;
                                                    const testIsDone = testPassed;

                                                    return (
                                                        <Card
                                                            variant="accent"
                                                            style={styles.testCard}
                                                            onPress={() => onTestPress("TOPIC", topic.id)}
                                                        >
                                                            <Ionicons name="trophy" size={20} color="#FFFFFF" style={styles.cardLeftIcon} />
                                                            <View style={styles.cardTextContainer}>
                                                                <Text style={styles.testCardTitle}>
                                                                    Kiểm tra Chủ đề {topic.position}
                                                                </Text>
                                                            </View>
                                                            <View style={styles.cardRightContainer}>
                                                                {testIsDone ? (
                                                                    <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
                                                                ) : (
                                                                    <SmallProgressRing pct={0} isAccent={true} />
                                                                )}
                                                            </View>
                                                        </Card>
                                                    );
                                                })()}
                                            </View>
                                        )}
                                    </View>
                                );
                            })}

                            {/* --- Grade Level Finale Test Section --- */}
                            {shouldShowFinalTest && (() => {
                                const finalIsDone = finalTestPassed;

                                return (
                                    <Card
                                        variant="accent"
                                        style={styles.finalExamCard}
                                        onPress={() => onTestPress("GRADE", selectedGrade)}
                                    >
                                        <Ionicons name="ribbon" size={24} color="#FFFFFF" style={styles.cardLeftIcon} />
                                        <View style={styles.cardTextContainer}>
                                            <Text style={styles.finalExamCardTitle}>
                                                Kiểm tra tổng hợp Lớp {selectedGrade}
                                            </Text>
                                            <Text style={styles.finalExamCardSubtitle}>
                                                Đánh giá năng lực toàn diện
                                            </Text>
                                        </View>
                                        <View style={styles.cardRightContainer}>
                                            {finalIsDone ? (
                                                <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
                                            ) : (
                                                <SmallProgressRing pct={0} isAccent={true} />
                                            )}
                                        </View>
                                    </Card>
                                );
                            })()}
                        </ScrollView>
                    </>
                )}
            </View>
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    centerLoader: { flex: 1, justifyContent: "center", alignItems: "center" },
    container: { flex: 1 },
    scrollContent: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 40 },
    topicWrapper: { marginBottom: 24 },
    
    /* Topic Divider */
    topicDivider: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginVertical: 12,
        paddingHorizontal: 4,
        width: "100%",
    },
    topicDividerText: {
        fontFamily: typography.fonts.bold,
        fontSize: 14,
        color: colors.textMuted,
        letterSpacing: 0.5,
        flex: 1,
        marginRight: 8,
    },

    lessonList: {
        width: "100%",
    },

    lessonCard: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginBottom: 12,
    },
    testCard: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 16,
        marginBottom: 12,
    },
    finalExamCard: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 16,
        marginTop: 16,
        marginBottom: 24,
    },

    cardTextContainer: {
        flex: 1,
        justifyContent: "center",
    },
    cardRightContainer: {
        marginLeft: 16,
        justifyContent: "center",
        alignItems: "center",
    },
    cardLeftIcon: {
        marginRight: 12,
    },

    lessonCardTitle: {
        fontFamily: typography.fonts.semiBold,
        fontSize: 15,
        color: colors.textPrimary,
    },
    lessonNameText: {
        color: colors.primary,
    },
    lessonProgressTextBelow: {
        fontFamily: typography.fonts.regular,
        fontSize: 10,
        color: colors.textSecondary,
        marginTop: 4,
        textAlign: "center",
    },
    testCardTitle: {
        fontFamily: typography.fonts.bold,
        fontSize: 15,
        color: "#FFFFFF",
    },
    finalExamCardTitle: {
        fontFamily: typography.fonts.bold,
        fontSize: 16,
        color: "#FFFFFF",
    },
    finalExamCardSubtitle: {
        fontFamily: typography.fonts.regular,
        fontSize: 12,
        color: "rgba(255, 255, 255, 0.8)",
        marginTop: 2,
    },

    searchContainer: {
        marginHorizontal: 4,
        marginTop: 4,
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

    /* Overall Grade Progress Card */
    headerProgressCard: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        marginBottom: 20,
        marginHorizontal: 4,
    },
    gradeAvatar: {
        width: 60,
        height: 60,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 16,
    },
    gradeProgressRight: {
        flex: 1,
        justifyContent: "center",
    },
    gradeTitleText: {
        fontFamily: typography.fonts.bold,
        fontSize: 16,
        color: colors.textPrimary,
        marginBottom: 8,
    },
    topProgressWrapper: {
        position: "relative",
        height: 28,
        justifyContent: "center",
    },
    topProgressTrack: {
        height: 20,
        backgroundColor: colors.borderMedium,
        borderRadius: 10,
        overflow: "hidden",
        width: "100%",
        position: "relative",
    },
    topProgressFill: {
        height: "100%",
        borderRadius: 10,
        justifyContent: "center",
        alignItems: "center",
    },
    progressNumberTextInside: {
        fontFamily: typography.fonts.bold,
        fontSize: 11,
        color: "#FFFFFF",
    },
    progressNumberTextOutsideContainer: {
        position: "absolute",
        top: 0,
        bottom: 0,
        justifyContent: "center",
        paddingLeft: 8,
    },
    progressNumberTextOutside: {
        fontFamily: typography.fonts.bold,
        fontSize: 11,
        color: colors.textSecondary,
    },
    topProgressIconFloating: {
        position: "absolute",
        top: 0,
        marginLeft: -14,
    },
    floatingBookShadow: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 2.5,
        elevation: 3,
    },
});