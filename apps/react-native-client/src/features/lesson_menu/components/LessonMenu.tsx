import React from "react";
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Circle } from "react-native-svg";
import { useLessonMenu } from "../hooks/useLessonMenu";

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
    const fillHeight = pct != null ? `${Math.round(pct * 100)}%` : "0%";

    return (
        <TouchableOpacity
            style={[styles.gradeTab, isActive && styles.activeGradeTab]}
            onPress={onPress}
            activeOpacity={0.8}
        >
            {/* Progress fill — rises from bottom */}
            {pct != null && pct > 0 && (
                <View
                    style={[
                        StyleSheet.absoluteFill,
                        styles.gradeTabFill,
                        { height: fillHeight as any, top: undefined, bottom: 0 },
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

/** Topic header bar: fills from left to right based on % */
function TopicProgressBar({ pct }: { pct: number | null }) {
    if (pct == null) return null;
    return (
        <View style={styles.topicProgressBarBg}>
            <View
                style={[
                    styles.topicProgressBarFill,
                    { width: `${Math.round(pct * 100)}%` as any },
                ]}
            />
        </View>
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
    const filledColor = isDone ? "#34C759" : "#007AFF";
    const emptyColor = isDone ? "#E8F8F0" : "#E6F0FF";

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
    filled = "#007AFF",
    empty = "#E6F0FF",
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
    const strokeDashoffset = circumference - clampedPct * circumference;

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
            {/* Filled progress segment */}
            {clampedPct > 0 && (
                <Circle
                    cx={outerSize / 2}
                    cy={outerSize / 2}
                    r={radius}
                    stroke={filled}
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeDasharray={`${circumference} ${circumference}`}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    transform={`rotate(-90 ${outerSize / 2} ${outerSize / 2})`}
                />
            )}
        </Svg>
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
    } = useLessonMenu();

    if (loading) {
        return (
            <ActivityIndicator
                size="large"
                color="#5856D6"
                style={styles.centerLoader}
            />
        );
    }

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
        <>
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

                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
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
                                    {topicPct != null && topicPct > 0 && (
                                        <View
                                            style={[
                                                styles.topicProgressFill,
                                                isExpanded && styles.topicProgressFillExpanded,
                                                { width: `${Math.round(topicPct * 100)}%` },
                                            ]}
                                        />
                                    )}

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
                                        {/* Progress bar below description */}
                                        <TopicProgressBar pct={topicPct} />
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
                                                isExpanded ? "#FFF" : "#8E8E93"
                                            }
                                        />
                                    </View>
                                </TouchableOpacity>

                                {/* Accordion Node Map Content */}
                                {isExpanded && (
                                    <View style={styles.mapContainer}>
                                        {/* Spine Connector Line */}
                                        <View style={styles.verticalSpine} />

                                        {/* Mindmap Node */}
                                        <TouchableOpacity
                                            style={styles.mindmapButton}
                                            onPress={() =>
                                                onMindmapPress(topic.id)
                                            }
                                        >
                                            <Ionicons
                                                name={
                                                    "git-network-outline" as any
                                                }
                                                size={18}
                                                color="#5856D6"
                                            />
                                            <Text style={styles.mindmapText}>
                                                XEM MINDMAP TOÀN CHỦ ĐỀ
                                            </Text>
                                        </TouchableOpacity>

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
                                                                    ? "#FFD700"
                                                                    : "#007AFF"
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
                                                        color="#FF9500"
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
                                            color="#FFF"
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
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    centerLoader: { flex: 1, justifyContent: "center", alignItems: "center" },
    container: { flex: 1, backgroundColor: "#FFF" },
    gradeTabsContainer: {
        flexDirection: "row",
        backgroundColor: "#F2F2F7",
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
        backgroundColor: "#FFF",
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    gradeTabFill: {
        backgroundColor: "rgba(88,86,214,0.12)",
        borderRadius: 10,
    },
    gradeTabText: { fontSize: 15, fontWeight: "600", color: "#8E8E93", zIndex: 1 },
    activeGradeTabText: { color: "#5856D6", fontWeight: "700" },
    gradePctText: {
        fontSize: 11,
        fontWeight: "700",
        color: "#5856D6",
        marginTop: 2,
        zIndex: 1,
    },
    scrollContent: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 40 },
    topicWrapper: { marginBottom: 12 },
    topicHeader: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#EAEAEF",
        borderRadius: 16,
        padding: 16,
        overflow: "hidden",
    },
    expandedTopicHeader: { backgroundColor: "#5856D6" },
    topicHeaderLeft: { flex: 1, paddingRight: 8, zIndex: 2 },
    topicHeaderRight: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        zIndex: 2,
    },
    topicTitle: { fontSize: 17, fontWeight: "700", color: "#1C1C1E" },
    topicDesc: { fontSize: 13, color: "#3A3A3C", marginTop: 4 },
    topicPctText: { fontSize: 13, fontWeight: "700", color: "#5856D6" },
    topicProgressFill: {
        position: "absolute",
        left: 0,
        top: 0,
        height: "100%",
        backgroundColor: "#D0E8FF", // Soft blue progress fill for collapsed topic header
        zIndex: 1,
    },
    topicProgressFillExpanded: {
        backgroundColor: "#403EAE", // Darker purple fill for expanded topic header
    },
    topicProgressBarBg: {
        height: 4,
        backgroundColor: "rgba(0,0,0,0.08)",
        borderRadius: 2,
        marginTop: 8,
        overflow: "hidden",
    },
    topicProgressBarFill: {
        height: 4,
        backgroundColor: "#5856D6",
        borderRadius: 2,
    },
    whiteText: { color: "#FFF" },
    lightPurpleText: { color: "#D2D1F7" },

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
        backgroundColor: "#E5E5EA",
        zIndex: 0,
    },
    mindmapButton: {
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "center",
        backgroundColor: "#EAEAFE",
        borderColor: "#D2D1F7",
        borderWidth: 1,
        borderRadius: 20,
        paddingVertical: 8,
        paddingHorizontal: 16,
        gap: 6,
        zIndex: 1,
        marginBottom: 32,
    },
    mindmapText: { fontSize: 12, fontWeight: "700", color: "#5856D6" },

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
        backgroundColor: "#34C759",
        borderWidth: 0,
    },
    lessonNodeCircleTodo: {
        backgroundColor: "#FFF",
        borderWidth: 1.5,
        borderColor: "#E5E5EA",
    },
    lessonPctInsideText: {
        fontSize: 13,
        fontWeight: "800",
        color: "#007AFF",
    },
    topicTestCircle: {
        backgroundColor: "#FFF",
        borderColor: "#FF9500",
    },
    nodeLabel: {
        fontSize: 14,
        fontWeight: "700",
        color: "#1C1C1E",
        textAlign: "center",
        marginTop: 8,
        paddingHorizontal: 10,
    },
    textDisabled: {
        color: "#AEAEB2",
        fontWeight: "500",
    },
    testLabel: {
        fontSize: 13,
        fontWeight: "800",
        color: "#FF9500",
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
        borderTopColor: "#F2F2F7",
    },
    finalExamBadgeContainer: { marginBottom: 12 },
    finalExamOuterRing: {
        width: 90,
        height: 90,
        borderRadius: 45,
        borderWidth: 2,
        borderColor: "#5856D6",
        borderStyle: "dashed",
        justifyContent: "center",
        alignItems: "center",
    },
    finalExamInnerCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: "#5856D6",
        justifyContent: "center",
        alignItems: "center",
    },
    finalExamTitle: {
        fontSize: 22,
        fontWeight: "800",
        color: "#1C1C1E",
        letterSpacing: 0.5,
    },
    finalExamSubtitle: {
        fontSize: 14,
        color: "#8E8E93",
        marginTop: 4,
        marginBottom: 20,
    },
    finalExamButton: {
        backgroundColor: "#5856D6",
        borderRadius: 25,
        width: "85%",
        paddingVertical: 14,
        alignItems: "center",
        shadowColor: "#5856D6",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 4,
    },
    finalExamButtonText: {
        color: "#FFF",
        fontSize: 16,
        fontWeight: "700",
        letterSpacing: 0.5,
    },
});