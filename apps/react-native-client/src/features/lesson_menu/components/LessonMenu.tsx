import React, { useState } from "react";
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Circle } from "react-native-svg";
import Animated, {
    useSharedValue,
    useAnimatedProps,
    withTiming,
    Easing,
} from "react-native-reanimated";
import { useRouter } from "expo-router";
import { useAppSelector } from "../../../store/storeHook";
import { useLessonMenu } from "../hooks/useLessonMenu";
import { ScreenWrapper } from "../../../components/layout/ScreenWrapper";
import { colors } from "../../../theme/colors";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface LessonMenuProps {
    selectedGrade: number;
    onLessonPress: (id: number) => void;
    onMindmapPress: (topicId: number) => void;
    onTestPress: (scopeType: string, scopeId: number) => void;
}

/** Lesson circle: arc ring showing % via a layered border approach */
function LessonCircle({
    isDone,
    pct, // 0–1
    completed,
    total,
    size = 64,
    showBadge = true,
    onPress,
    children,
}: {
    isDone: boolean;
    pct: number;
    completed: number;
    total: number;
    size?: number;
    showBadge?: boolean;
    onPress?: () => void;
    children: React.ReactNode;
}) {
    const filledColor = isDone ? colors.success : colors.primary;
    const emptyColor = colors.borderMedium;

    const gap = 8;
    const strokeWidth = 5;

    return (
        <View style={styles.lessonCircleWrapper}>
            <View style={{ width: size + gap * 2, height: size + gap * 2, alignItems: "center", justifyContent: "center", position: "relative" }}>
                <ProgressRing 
                    pct={pct} 
                    size={size} 
                    gap={gap} 
                    strokeWidth={strokeWidth} 
                    filled={filledColor} 
                    empty={emptyColor} 
                />
                <TouchableOpacity
                    style={[
                        styles.nodeCircle,
                        {
                            width: size,
                            height: size,
                            borderRadius: size / 2,
                        },
                        isDone
                            ? styles.lessonNodeCircleDone
                            : styles.lessonNodeCircleTodo,
                    ]}
                    onPress={onPress}
                    activeOpacity={0.7}
                    disabled={!onPress}
                >
                    {children}
                </TouchableOpacity>

                {/* Golden Badge showing completed/total nodes */}
                {showBadge && (
                    <View style={styles.goldBadge}>
                        <Text style={styles.goldBadgeText}>
                            {completed}/{total}
                        </Text>
                    </View>
                )}
            </View>
        </View>
    );
}

/**
 * Progress ring using two rotated half-disc views.
 */
function ProgressRing({
    pct,
    size = 64,
    gap = 8,
    strokeWidth = 5,
    filled = colors.primary,
    empty = colors.borderMedium,
}: {
    pct: number;
    size?: number;
    gap?: number;
    strokeWidth?: number;
    filled?: string;
    empty?: string;
}) {
    const outerSize = size + gap * 2;
    const radius = (outerSize - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const clampedPct = Math.max(0, Math.min(1, pct));

    const progress = useSharedValue(0);

    React.useEffect(() => {
        progress.value = withTiming(clampedPct, {
            duration: 1000,
            easing: Easing.out(Easing.quad),
        });
    }, [clampedPct]);

    const animatedProps = useAnimatedProps(() => {
        const offset = circumference - progress.value * circumference;
        return {
            strokeDashoffset: offset,
        };
    });

    return (
        <Svg
            width={outerSize}
            height={outerSize}
            style={{
                position: "absolute",
                top: 0,
                left: 0,
            }}
        >
            <Circle
                cx={outerSize / 2}
                cy={outerSize / 2}
                r={radius}
                stroke={empty}
                strokeWidth={strokeWidth}
                fill="none"
            />
            <AnimatedCircle
                cx={outerSize / 2}
                cy={outerSize / 2}
                r={radius}
                stroke={filled}
                strokeWidth={strokeWidth}
                fill="none"
                strokeDasharray={`${circumference} ${circumference}`}
                animatedProps={animatedProps}
                strokeLinecap="round"
                transform={`rotate(-90 ${outerSize / 2} ${outerSize / 2})`}
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

    const branchConfig = {
        hierarchy: "Khóa học",
        title: `Lớp ${selectedGrade}`,
        onBackPress: () => router.back(),
    };

    return (
        <ScreenWrapper branchConfig={branchConfig}>
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
                        <View style={styles.searchContainer}>
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Tìm kiếm bài học..."
                                placeholderTextColor={colors.textPlaceholder}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                underlineColorAndroid="transparent"
                            />
                        </View>
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
                            {filteredTopics.map((topic) => {
                                return (
                                    <View key={topic.id} style={styles.topicWrapper}>
                                    {/* Faint Divider Heading */}
                                    <View style={styles.topicDivider}>
                                        <View style={styles.dividerLine} />
                                        <Text style={styles.topicDividerText}>
                                            Chủ đề {topic.position}: {topic.name}
                                        </Text>
                                    </View>

                                    {/* Map Content */}
                                    <View style={styles.mapContainer}>
                                        {/* Lesson Nodes (curving layout) */}
                                        {topic.lessons.map((lesson, lessonIdx) => {
                                            const lessonAny = lesson as any;
                                            const lessonPct =
                                                lessonAny.progress != null &&
                                                lessonAny.progress.totalNodes > 0
                                                    ? lessonAny.progress.completedNodes /
                                                      lessonAny.progress.totalNodes
                                                    : 0;
                                            const isDone = lessonPct >= 1;

                                            const numLessons = topic.lessons.length;
                                            const curveDirection = (topic.position - 1) % 2 === 0 ? -1 : 1;
                                            const angle = ((lessonIdx + 1) / (numLessons + 1)) * Math.PI;
                                            const translateX = curveDirection * Math.sin(angle) * 65;

                                            return (
                                                <View
                                                    key={lesson.id}
                                                    style={[
                                                        styles.nodeItem,
                                                        { transform: [{ translateX }] }
                                                    ]}
                                                >
                                                    <LessonCircle
                                                        isDone={isDone}
                                                        pct={lessonPct}
                                                        completed={lessonAny.progress?.completedNodes ?? 0}
                                                        total={lessonAny.progress?.totalNodes ?? 0}
                                                        size={64}
                                                        showBadge={isLoggedIn && lessonAny.progress != null}
                                                        onPress={() =>
                                                            onLessonPress(lesson.id)
                                                        }
                                                    >
                                                        <Ionicons
                                                            name={isDone ? "trophy" : "book"}
                                                            size={26}
                                                            color={
                                                                isDone
                                                                    ? colors.gold
                                                                    : colors.primary
                                                            }
                                                        />
                                                    </LessonCircle>
                                                    <Text
                                                        style={[
                                                            styles.nodeLabel,
                                                            !isDone &&
                                                                styles.textDisabled,
                                                        ]}
                                                    >
                                                        Bài {lesson.position}:{" "}
                                                        {lesson.name}
                                                    </Text>
                                                </View>
                                            );
                                        })}

                                        {/* Topic-Level Milestone Test Node */}
                                        {(() => {
                                            const testPassed = !!topic.testPassed;
                                            const testCompleted = testPassed ? 1 : 0;
                                            const testTotal = 1;
                                            const testPct = testPassed ? 1 : 0;
                                            const testIsDone = testPassed;

                                            return (
                                                <View
                                                    style={[
                                                        styles.nodeItem,
                                                        styles.nodeCenter,
                                                    ]}
                                                >
                                                    <LessonCircle
                                                        isDone={testIsDone}
                                                        pct={testPct}
                                                        completed={testCompleted}
                                                        total={testTotal}
                                                        size={64}
                                                        showBadge={false}
                                                        onPress={() =>
                                                            onTestPress(
                                                                "TOPIC",
                                                                topic.id
                                                            )
                                                        }
                                                    >
                                                        <Ionicons
                                                            name="trophy"
                                                            size={32}
                                                            color={
                                                                testIsDone
                                                                    ? colors.gold
                                                                    : colors.secondary
                                                            }
                                                        />
                                                    </LessonCircle>
                                                    <Text style={styles.testLabel}>
                                                        Kiểm tra Chủ đề {topic.position}
                                                    </Text>
                                                </View>
                                            );
                                        })()}
                                    </View>
                                </View>
                                );
                            })}

                            {/* --- Grade Level Finale Test Section --- */}
                            {shouldShowFinalTest && (() => {
                                const finalCompleted = finalTestPassed ? 1 : 0;
                                const finalTotal = 1;
                                const finalPct = finalTestPassed ? 1 : 0;
                                const finalIsDone = finalTestPassed;

                                return (
                                    <View style={styles.finalExamSection}>
                                        <View style={styles.finalExamBadgeContainer}>
                                            <LessonCircle
                                                isDone={finalIsDone}
                                                pct={finalPct}
                                                completed={finalCompleted}
                                                total={finalTotal}
                                                size={84}
                                                showBadge={false}
                                                onPress={() => onTestPress("GRADE", selectedGrade)}
                                            >
                                                <Ionicons
                                                    name="ribbon"
                                                    size={40}
                                                    color={finalIsDone ? colors.gold : colors.primary}
                                                />
                                            </LessonCircle>
                                        </View>
                                        <Text style={styles.finalExamTitle}>
                                            Kiểm tra tổng hợp Lớp {selectedGrade}
                                        </Text>
                                        <Text style={styles.finalExamSubtitle}>
                                            Đánh giá năng lực toàn diện
                                        </Text>
                                    </View>
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
    
    /* Topic Divider Divider */
    topicDivider: {
        alignItems: "center",
        marginVertical: 16,
        paddingHorizontal: 8,
        width: "100%",
    },
    dividerLine: {
        width: "100%",
        height: 1,
        backgroundColor: colors.borderLight,
        marginBottom: 12,
    },
    topicDividerText: {
        fontSize: 13,
        fontWeight: "500",
        color: colors.textMuted,
        textAlign: "center",
        letterSpacing: 0.5,
    },

    /* Map View Tree Styling */
    mapContainer: {
        paddingVertical: 16,
        position: "relative",
        width: "100%",
    },
    nodeItem: {
        alignItems: "center",
        marginBottom: 32,
        width: "100%",
        zIndex: 1,
    },
    nodeCenter: {
        alignSelf: "center",
        marginBottom: 10,
    },
    lessonCircleWrapper: {
        alignItems: "center",
        justifyContent: "center",
    },
    nodeCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: "center",
        alignItems: "center",
    },
    lessonNodeCircleDone: {
        backgroundColor: colors.success,
        borderWidth: 0,
    },
    lessonNodeCircleTodo: {
        backgroundColor: colors.surfaceVariant,
        borderWidth: 0,
    },
    nodeLabel: {
        fontSize: 14,
        fontWeight: "500",
        color: colors.textPrimary,
        textAlign: "center",
        marginTop: 8,
        paddingHorizontal: 10,
        maxWidth: 200,
    },
    textDisabled: {
        color: colors.textMuted,
        fontWeight: "500",
    },
    testLabel: {
        fontSize: 13,
        fontWeight: "500",
        color: colors.secondary,
        textAlign: "center",
        marginTop: 8,
        letterSpacing: 0.5,
    },

    /* Final Exam Layout Card */
    finalExamSection: {
        alignItems: "center",
        marginTop: 32,
        paddingTop: 24,
        borderTopWidth: 1,
        borderTopColor: colors.borderMedium,
    },
    finalExamBadgeContainer: { marginBottom: 12 },
    finalExamTitle: {
        fontSize: 22,
        fontWeight: "700",
        color: colors.textPrimary,
        letterSpacing: 0.5,
    },
    finalExamSubtitle: {
        fontSize: 14,
        color: colors.textMuted,
        marginTop: 4,
        marginBottom: 20,
    },
    goldBadge: {
        position: "absolute",
        bottom: -2,
        right: -2,
        backgroundColor: colors.gold,
        borderRadius: 3,
        
        paddingHorizontal: 5,
        paddingVertical: 1,
        minWidth: 26,
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1,
        elevation: 2,
    },
    goldBadgeText: {
        color: "#4A3B00",
        fontSize: 10,
        fontWeight: "600",
    },
    searchContainer: {
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 4,
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
});