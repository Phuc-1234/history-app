import React from "react";
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Circle } from "react-native-svg";
import Animated, {
    useSharedValue,
    useAnimatedProps,
    useAnimatedStyle,
    withTiming,
    Easing,
} from "react-native-reanimated";
import { useLessonMenu } from "../hooks/useLessonMenu";
import { ScreenWrapper } from "../../../components/layout/ScreenWrapper";
import { colors } from "../../../theme/colors";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface LessonMenuProps {
    onLessonPress: (id: number) => void;
    onMindmapPress: (topicId: number) => void;
    onTestPress: (scopeType: string, scopeId: number) => void;
}

// ---- Sub-components for progress visualisations ----

/** Grade tab: fills from bottom upward based on progress % */
function GradeTabWithProgress({
    grade,
    isActive,
    pct, // 0–1, null = not logged in
    onPress,
}: {
    grade: number;
    isActive: boolean;
    pct: number | null;
    onPress: () => void;
}) {
    const progress = useSharedValue(0);

    React.useEffect(() => {
        if (pct != null && pct > 0) {
            progress.value = withTiming(pct, {
                duration: 1000,
                easing: Easing.out(Easing.quad),
            });
        } else {
            progress.value = 0;
        }
    }, [pct]);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            height: `${Math.round(progress.value * 100)}%`,
        };
    });

    return (
        <TouchableOpacity
            style={[styles.gradeTab, isActive && styles.activeGradeTab]}
            onPress={onPress}
            activeOpacity={0.8}
        >
            {/* Progress fill — rises from bottom */}
            {pct != null && pct > 0 && (
                <Animated.View
                    style={[
                        StyleSheet.absoluteFill,
                        styles.gradeTabFill,
                        animatedStyle,
                        { top: undefined, bottom: 0 },
                    ]}
                    pointerEvents="none"
                />
            )}
            <Text
                style={[
                    styles.gradeTabText,
                    isActive && styles.activeGradeTabText,
                ]}
            >
                Lớp {grade}
            </Text>
            {pct != null && (
                <Text style={styles.gradePctText}>
                    {Math.round(pct * 100)}%
                </Text>
            )}
        </TouchableOpacity>
    );
}

/** Lesson circle: arc ring showing % via a layered border approach */
function LessonCircle({
    isDone,
    pct, // 0–1 or null
    onPress,
    children,
}: {
    isDone: boolean;
    pct: number | null;
    onPress: () => void;
    children: React.ReactNode;
}) {
    const filledColor = isDone ? colors.success : colors.primary;
    const emptyColor = isDone ? colors.successContainer : colors.primaryContainer;

    return (
        <View style={styles.lessonCircleWrapper}>
            {/* Progress ring — outer border colored by pct */}
            {pct != null ? (
                <View style={styles.progressRingOuter}>
                    <ProgressRing pct={pct} filled={filledColor} empty={emptyColor} />
                    <TouchableOpacity
                        style={[
                            styles.nodeCircle,
                            isDone
                                ? styles.lessonNodeCircleDone
                                : styles.lessonNodeCircleTodo,
                        ]}
                        onPress={onPress}
                        activeOpacity={0.7}
                    >
                        {children}
                    </TouchableOpacity>
                </View>
            ) : (
                <TouchableOpacity
                    style={[
                        styles.nodeCircle,
                        isDone
                            ? styles.lessonNodeCircleDone
                            : styles.lessonNodeCircleTodo,
                    ]}
                    onPress={onPress}
                    activeOpacity={0.7}
                >
                    {children}
                </TouchableOpacity>
            )}
        </View>
    );
}

/**
 * Progress ring using two rotated half-disc views.
 * Classic "pie chart" technique — works with any 0–1 pct.
 */
function ProgressRing({
    pct,
    filled = colors.primary,
    empty = colors.primaryContainer,
}: {
    pct: number;
    filled?: string;
    empty?: string;
}) {
    const RING_SIZE = 64; // inner circle size
    const RING_PADDING = 6; // space between inner circle and ring
    const outerSize = RING_SIZE + RING_PADDING * 2;
    const strokeWidth = 6;
    const radius = (outerSize - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    // Limit percentage between 0 and 1
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
                top: -RING_PADDING,
                left: -RING_PADDING,
            }}
        >
            {/* Empty base circle */}
            <Circle
                cx={outerSize / 2}
                cy={outerSize / 2}
                r={radius}
                stroke={empty}
                strokeWidth={strokeWidth}
                fill="none"
            />
            {/* Animated progress segment */}
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

/** Animated topic progress fill */
function TopicProgressFill({
    pct,
    isExpanded,
}: {
    pct: number | null;
    isExpanded: boolean;
}) {
    const progress = useSharedValue(0);

    React.useEffect(() => {
        if (pct != null && pct > 0) {
            progress.value = withTiming(pct, {
                duration: 1000,
                easing: Easing.out(Easing.quad),
            });
        } else {
            progress.value = 0;
        }
    }, [pct]);

    const animatedStyle = useAnimatedStyle(() => {
        const currentPct = progress.value;
        return {
            width: currentPct >= 0.99 ? "100%" : `${Math.round(currentPct * 100)}%`,
        };
    });

    if (pct == null || pct <= 0) return null;

    return (
        <Animated.View
            style={[
                styles.topicProgressFill,
                isExpanded && styles.topicProgressFillExpanded,
                animatedStyle,
            ]}
        />
    );
}

// ---- Main Component ----

export function LessonMenu({
    onLessonPress,
    onMindmapPress,
    onTestPress,
}: LessonMenuProps) {
    const {
        selectedGrade,
        setSelectedGrade,
        expandedTopicId,
        toggleTopic,
        topics,
        finalTest,
        loading,
        refetch,
        isFetching,
    } = useLessonMenu();

    // Grade-level progress: sum all topic progress if present
    const getGradePct = (): number | null => {
        if (!topics.length) return null;
        const firstTopic = topics[0] as any;
        if (firstTopic?.progress == null) return null;

        let total = 0;
        let completed = 0;
        for (const t of topics as any[]) {
            total += t.progress?.totalNodes ?? 0;
            completed += t.progress?.completedNodes ?? 0;
        }
        return total > 0 ? completed / total : 0;
    };

    const gradePct = getGradePct();

    return (
        <ScreenWrapper>
            <View style={styles.container}>
                {/* --- Grade Selector Tab Bar --- */}
                <View style={styles.gradeTabsContainer}>
                    {[10, 11, 12].map((grade) => {
                        const isActive = selectedGrade === grade;
                        // Only show pct for the currently selected grade
                        const tabPct = isActive ? gradePct : null;
                        return (
                            <GradeTabWithProgress
                                key={grade}
                                grade={grade}
                                isActive={isActive}
                                pct={tabPct}
                                onPress={() => setSelectedGrade(grade)}
                            />
                        );
                    })}
                </View>

                {loading ? (
                    <View style={styles.centerLoader}>
                        <ActivityIndicator
                            size="large"
                            color={colors.primary}
                        />
                    </View>
                ) : (
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
                        {topics.map((topic) => {
                            const isExpanded = expandedTopicId === topic.id;
                            const topicAny = topic as any;
                            const topicPct =
                                topicAny.progress != null &&
                                    topicAny.progress.totalNodes > 0
                                    ? topicAny.progress.completedNodes /
                                    topicAny.progress.totalNodes
                                    : null;

                            return (
                                <View key={topic.id} style={styles.topicWrapper}>
                                    {/* Accordion Trigger Header */}
                                    <TouchableOpacity
                                        accessible={true}
                                        accessibilityLabel={
                                            isExpanded
                                                ? `Thu gọn chủ đề ${topic.position}: ${topic.name}`
                                                : `Mở rộng chủ đề ${topic.position}: ${topic.name}`
                                        }
                                        accessibilityRole="button"
                                        style={[
                                            styles.topicHeader,
                                            isExpanded && styles.expandedTopicHeader,
                                        ]}
                                        onPress={() => toggleTopic(topic.id)}
                                        activeOpacity={0.9}
                                    >
                                        <TopicProgressFill pct={topicPct} isExpanded={isExpanded} />

                                        <View style={styles.topicHeaderInner}>
                                            <View style={styles.topicHeaderLeft}>
                                                <Text
                                                    style={[
                                                        styles.topicTitle,
                                                        isExpanded && styles.whiteText,
                                                    ]}
                                                >
                                                    CHỦ ĐỀ {topic.position}: {topic.name}
                                                </Text>
                                                <Text
                                                    style={[
                                                        styles.topicDesc,
                                                        isExpanded &&
                                                        styles.lightPurpleText,
                                                    ]}
                                                >
                                                    Khám phá kiến thức của chủ đề này
                                                </Text>
                                            </View>
                                            <View style={styles.topicHeaderRight}>
                                                <Ionicons
                                                    name={
                                                        (isExpanded
                                                            ? "chevron-up"
                                                            : "chevron-forward") as any
                                                    }
                                                    size={20}
                                                    color={
                                                        isExpanded ? colors.textLight : colors.textMuted
                                                    }
                                                />
                                            </View>
                                        </View>
                                    </TouchableOpacity>

                                    {/* Accordion Node Map Content */}
                                    {isExpanded && (
                                        <View style={styles.mapContainer}>
                                            {/* Spine Connector Line */}
                                            <View style={styles.verticalSpine} />

                                            {/* Lesson Nodes (alternating left/right) */}
                                            {topic.lessons.map((lesson, lessonIdx) => {
                                                const lessonAny = lesson as any;
                                                const lessonPct =
                                                    lessonAny.progress != null &&
                                                        lessonAny.progress.totalNodes > 0
                                                        ? lessonAny.progress
                                                            .completedNodes /
                                                        lessonAny.progress
                                                            .totalNodes
                                                        : null;
                                                const isDone =
                                                    lessonPct != null && lessonPct >= 1;
                                                const isLeft = lessonIdx % 2 === 0;

                                                return (
                                                    <View
                                                        key={lesson.id}
                                                        style={[
                                                            styles.nodeItem,
                                                            isLeft
                                                                ? styles.nodeLeft
                                                                : styles.nodeRight,
                                                        ]}
                                                    >
                                                        <LessonCircle
                                                            isDone={isDone}
                                                            pct={lessonPct}
                                                            onPress={() =>
                                                                onLessonPress(
                                                                    lesson.id,
                                                                )
                                                            }
                                                        >
                                                            <Ionicons
                                                                name={
                                                                    (isDone
                                                                        ? "trophy"
                                                                        : "book") as any
                                                                }
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
                                        {topic.firstTest && (
                                            <View
                                                style={[
                                                    styles.nodeItem,
                                                    styles.nodeCenter,
                                                ]}
                                            >
                                                <TouchableOpacity
                                                    style={[
                                                        styles.nodeCircle,
                                                        styles.topicTestCircle,
                                                    ]}
                                                    onPress={() =>
                                                        onTestPress(
                                                            "TOPIC",
                                                            topic.id
                                                        )
                                                    }
                                                >
                                                    <Ionicons
                                                        name={"trophy" as any}
                                                        size={28}
                                                        color={colors.secondary}
                                                    />
                                                </TouchableOpacity>
                                                <Text style={styles.testLabel}>
                                                    {topic.firstTest.title}
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                )}
                            </View>
                        );
                    })}

                        {/* --- Grade Level Finale Test Section --- */}
                        {finalTest && (
                            <View style={styles.finalExamSection}>
                                <View style={styles.finalExamBadgeContainer}>
                                    <View style={styles.finalExamOuterRing}>
                                        <View style={styles.finalExamInnerCircle}>
                                            <Ionicons
                                                name={"ribbon" as any}
                                                size={42}
                                                color={colors.textLight}
                                            />
                                        </View>
                                    </View>
                                </View>
                                <Text style={styles.finalExamTitle}>
                                    {finalTest.title}
                                </Text>
                                <Text style={styles.finalExamSubtitle}>
                                    Kiểm tra kiến thức tổng hợp lớp {selectedGrade}
                                </Text>

                                <TouchableOpacity
                                    style={styles.finalExamButton}
                                    onPress={() => onTestPress("GRADE", selectedGrade)}
                                >
                                    <Text style={styles.finalExamButtonText}>
                                        BẮT ĐẦU THI NGAY
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </ScrollView>
                )}
            </View>
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    centerLoader: { flex: 1, justifyContent: "center", alignItems: "center" },
    container: { flex: 1, backgroundColor: colors.background },
    gradeTabsContainer: {
        flexDirection: "row",
        backgroundColor: colors.surfaceVariant,
        padding: 6,
        borderRadius: 14,
        marginHorizontal: 16,
        marginTop: 16,
        marginBottom: 8,
    },
    gradeTab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: "center",
        borderRadius: 10,
        overflow: "hidden",
        position: "relative",
    },
    activeGradeTab: {
        backgroundColor: colors.surface,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    gradeTabFill: {
        backgroundColor: colors.primaryContainer,
        borderRadius: 10,
    },
    gradeTabText: { fontSize: 15, fontWeight: "600", color: colors.textMuted, zIndex: 1 },
    activeGradeTabText: { color: colors.primary, fontWeight: "700" },
    gradePctText: {
        fontSize: 11,
        fontWeight: "700",
        color: colors.primary,
        marginTop: 2,
        zIndex: 1,
    },
    scrollContent: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 40 },
    topicWrapper: { marginBottom: 12 },
    topicHeader: {
        backgroundColor: colors.surfaceVariant,
        borderRadius: 16,
        overflow: "hidden",
    },
    expandedTopicHeader: { backgroundColor: colors.primary },
    topicHeaderInner: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        flex: 1,
        width: "100%",
        zIndex: 2,
    },
    topicHeaderLeft: { flex: 1, paddingRight: 8 },
    topicHeaderRight: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    topicTitle: { fontSize: 17, fontWeight: "700", color: colors.textPrimary },
    topicDesc: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
    topicPctText: { fontSize: 13, fontWeight: "700", color: colors.primary },
    topicProgressFill: {
        position: "absolute",
        left: 0,
        top: 0,
        bottom: 0,
        backgroundColor: colors.primaryContainer, // Soft red progress fill for collapsed topic header
        zIndex: 1,
    },
    topicProgressFillExpanded: {
        backgroundColor: colors.secondary, // Warm imperial gold fill for expanded topic header
    },
    whiteText: { color: colors.textLight },
    lightPurpleText: { color: colors.secondaryContainer },

    /* Map View Tree Styling */
    mapContainer: {
        paddingVertical: 16,
        position: "relative",
        width: "100%",
    },
    verticalSpine: {
        position: "absolute",
        top: 40,
        bottom: 50,
        left: "50%",
        width: 4,
        marginLeft: -2,
        backgroundColor: colors.borderMedium,
        zIndex: 0,
    },
    mindmapButton: {
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "center",
        backgroundColor: colors.primaryContainer,
        borderColor: colors.primary,
        borderWidth: 1,
        borderRadius: 20,
        paddingVertical: 8,
        paddingHorizontal: 16,
        gap: 6,
        zIndex: 1,
        marginBottom: 32,
    },
    mindmapText: { fontSize: 12, fontWeight: "700", color: colors.primary },

    nodeItem: {
        alignItems: "center",
        marginBottom: 32,
        width: "50%",
        zIndex: 1,
    },
    nodeLeft: {
        alignSelf: "flex-start",
        paddingLeft: 24,
    },
    nodeRight: {
        alignSelf: "flex-end",
        paddingRight: 24,
    },
    nodeCenter: {
        alignSelf: "center",
        marginBottom: 10,
    },

    lessonCircleWrapper: {
        alignItems: "center",
        justifyContent: "center",
    },
    progressRingOuter: {
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
    },
    nodeCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: "center",
        alignItems: "center",
        elevation: 3,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
    },
    lessonNodeCircleDone: {
        backgroundColor: colors.success,
        borderWidth: 0,
    },
    lessonNodeCircleTodo: {
        backgroundColor: colors.surface,
        borderWidth: 1.5,
        borderColor: colors.borderMedium,
    },
    lessonPctInsideText: {
        fontSize: 13,
        fontWeight: "800",
        color: colors.primary,
    },
    
    topicTestCircle: {
        backgroundColor: colors.surface,
        borderColor: colors.secondary,
    },
    nodeLabel: {
        fontSize: 14,
        fontWeight: "700",
        color: colors.textPrimary,
        textAlign: "center",
        marginTop: 8,
        paddingHorizontal: 10,
    },
    textDisabled: {
        color: colors.textMuted,
        fontWeight: "500",
    },
    testLabel: {
        fontSize: 13,
        fontWeight: "800",
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
    finalExamOuterRing: {
        width: 90,
        height: 90,
        borderRadius: 45,
        borderWidth: 2,
        borderColor: colors.primary,
        borderStyle: "dashed",
        justifyContent: "center",
        alignItems: "center",
    },
    finalExamInnerCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: colors.primary,
        justifyContent: "center",
        alignItems: "center",
    },
    finalExamTitle: {
        fontSize: 22,
        fontWeight: "800",
        color: colors.textPrimary,
        letterSpacing: 0.5,
    },
    finalExamSubtitle: {
        fontSize: 14,
        color: colors.textMuted,
        marginTop: 4,
        marginBottom: 20,
    },
    finalExamButton: {
        backgroundColor: colors.primary,
        borderRadius: 25,
        width: "85%",
        paddingVertical: 14,
        alignItems: "center",
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 4,
    },
    finalExamButtonText: {
        color: colors.textLight,
        fontSize: 16,
        fontWeight: "700",
        letterSpacing: 0.5,
    },
});