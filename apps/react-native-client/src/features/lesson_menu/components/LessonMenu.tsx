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
import { useLessonMenu, Topic, Lesson } from "../hooks/useLessonMenu";
import { TopBarWrapper } from "@/features/top_bar";

interface LessonMenuProps {
    onLessonPress: (id: string) => void;
    onMindmapPress: (topicId: string) => void;
    onTestPress: (testId: string) => void;
}

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
        currentGradeData,
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

    return (
        <TopBarWrapper>
        <View style={styles.container}>
            {/* --- Grade Selector Tab Bar --- */}
            <View style={styles.gradeTabsContainer}>
                {[10, 11, 12].map((grade) => {
                    const isActive = selectedGrade === grade;
                    return (
                        <TouchableOpacity
                            key={grade}
                            style={[
                                styles.gradeTab,
                                isActive && styles.activeGradeTab,
                            ]}
                            onPress={() => setSelectedGrade(grade)}
                            activeOpacity={0.8}
                        >
                            <Text
                                style={[
                                    styles.gradeTabText,
                                    isActive && styles.activeGradeTabText,
                                ]}
                            >
                                Lớp {grade}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {currentGradeData?.topics.map((topic, idx) => {
                    const isExpanded = expandedTopicId === topic.id;

                    return (
                        <View key={topic.id} style={styles.topicWrapper}>
                            {/* Accordion Trigger Header */}
                            <TouchableOpacity
                                style={[
                                    styles.topicHeader,
                                    isExpanded && styles.expandedTopicHeader,
                                ]}
                                onPress={() => toggleTopic(topic.id)}
                                activeOpacity={0.9}
                            >
                                <View style={styles.topicHeaderLeft}>
                                    <Text
                                        style={[
                                            styles.topicTitle,
                                            isExpanded && styles.whiteText,
                                        ]}
                                    >
                                        {topic.title}
                                    </Text>
                                    <Text
                                        style={[
                                            styles.topicDesc,
                                            isExpanded &&
                                                styles.lightPurpleText,
                                        ]}
                                    >
                                        {topic.description}
                                    </Text>
                                </View>
                                <Ionicons
                                    name={
                                        isExpanded
                                            ? "chevron-up"
                                            : "chevron-forward"
                                    }
                                    size={20}
                                    color={isExpanded ? "#FFF" : "#8E8E93"}
                                />
                            </TouchableOpacity>

                            {/* Accordion Node Map Content */}
                            {isExpanded && (
                                <View style={styles.mapContainer}>
                                    {/* Spine Connector Line running through nodes */}
                                    <View style={styles.verticalSpine} />

                                    {/* Mindmap Node */}
                                    <TouchableOpacity
                                        style={styles.mindmapButton}
                                        onPress={() => onMindmapPress(topic.id)}
                                    >
                                        <Ionicons
                                            name="git-network-outline"
                                            size={18}
                                            color="#5856D6"
                                        />
                                        <Text style={styles.mindmapText}>
                                            XEM MINDMAP TOÀN CHỦ ĐỀ
                                        </Text>
                                    </TouchableOpacity>

                                    {/* Lesson Nodes */}
                                    {topic.lessons.map((lesson, idx) => (
                                        <View
                                            key={lesson.id}
                                            style={styles.nodeItem}
                                        >
                                            <TouchableOpacity
                                                style={[
                                                    styles.nodeCircle,
                                                    styles.lessonNodeCircle,
                                                ]}
                                                onPress={() =>
                                                    onLessonPress(lesson.id)
                                                }
                                            >
                                                <Ionicons
                                                    name={
                                                        idx === 0
                                                            ? "checkmark"
                                                            : "book"
                                                    }
                                                    size={28}
                                                    color={
                                                        idx === 0
                                                            ? "#FFF"
                                                            : "#5856D6"
                                                    }
                                                />
                                            </TouchableOpacity>
                                            <Text style={styles.nodeLabel}>
                                                Bài {lesson.lessonNumber}:{" "}
                                                {lesson.title}
                                            </Text>
                                        </View>
                                    ))}

                                    {/* Topic-Level Milestone Test Node */}
                                    <View style={styles.nodeItem}>
                                        <TouchableOpacity
                                            style={[
                                                styles.nodeCircle,
                                                styles.topicTestCircle,
                                            ]}
                                            onPress={() =>
                                                onTestPress(topic.topicTestId)
                                            }
                                        >
                                            <Ionicons
                                                name="trophy"
                                                size={28}
                                                color="#FF9500"
                                            />
                                        </TouchableOpacity>
                                        <Text style={styles.testLabel}>
                                            KIỂM TRA CHỦ ĐỀ{" "}
                                            {idx + 1}
                                        </Text>
                                    </View>
                                </View>
                            )}
                        </View>
                    );
                })}

                {/* --- Grade Level Finale Test Section --- */}
                {currentGradeData && (
                    <View style={styles.finalExamSection}>
                        <View style={styles.finalExamBadgeContainer}>
                            <View style={styles.finalExamOuterRing}>
                                <View style={styles.finalExamInnerCircle}>
                                    <Ionicons
                                        name="ribbon"
                                        size={42}
                                        color="#FFF"
                                    />
                                </View>
                            </View>
                        </View>
                        <Text style={styles.finalExamTitle}>THI CUỐI KỲ</Text>
                        <Text style={styles.finalExamSubtitle}>
                            Kiểm tra kiến thức lớp {selectedGrade}
                        </Text>

                        <TouchableOpacity
                            style={styles.finalExamButton}
                            onPress={() =>
                                onTestPress(currentGradeData.finalTestId)
                            }
                        >
                            <Text style={styles.finalExamButtonText}>
                                BẮT ĐẦU THI NGAY
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
        </View></TopBarWrapper> 
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
    },
    activeGradeTab: {
        backgroundColor: "#FFF",
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    gradeTabText: { fontSize: 15, fontWeight: "600", color: "#8E8E93" },
    activeGradeTabText: { color: "#5856D6", fontWeight: "700" },
    scrollContent: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 40 },
    topicWrapper: { marginBottom: 12 },
    topicHeader: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#EAEAEF",
        borderRadius: 16,
        padding: 16,
    },
    expandedTopicHeader: { backgroundColor: "#5856D6" },
    topicHeaderLeft: { flex: 1, paddingRight: 8 },
    topicTitle: { fontSize: 17, fontWeight: "700", color: "#1C1C1E" },
    topicDesc: { fontSize: 13, color: "#3A3A3C", marginTop: 4 },
    whiteText: { color: "#FFF" },
    lightPurpleText: { color: "#D2D1F7" },

    /* Map View Tree Styling */
    mapContainer: {
        alignItems: "center",
        paddingVertical: 16,
        position: "relative",
    },
    verticalSpine: {
        position: "absolute",
        top: 0,
        bottom: 0,
        width: 3,
        backgroundColor: "#E5E5EA",
        zIndex: 0,
    },
    mindmapButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#EAEAFE",
        borderColor: "#D2D1F7",
        borderWidth: 1,
        borderRadius: 20,
        paddingVertical: 8,
        paddingHorizontal: 16,
        gap: 6,
        zIndex: 1,
        marginBottom: 24,
    },
    mindmapText: { fontSize: 12, fontWeight: "700", color: "#5856D6" },
    nodeItem: {
        alignItems: "center",
        marginBottom: 24,
        width: "80%",
        zIndex: 1,
    },
    nodeCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 4,
        elevation: 3,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
    },
    lessonNodeCircle: {
        backgroundColor: "#5856D6", // Using first-node style color for active checks
        borderColor: "#E8E8FC",
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
