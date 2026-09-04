import React, { useState } from "react";
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
    ImageBackground,
    Image,
    Platform,
    useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppHtmlRenderer } from "../../../components/AppHtmlRenderer";
import { LessonSummaryData, LessonSection } from "../hooks/useLessonSummary";
import { ExpandableSection } from "./ExpandableSection";
import VideoPlayer from "../../videostream/components/VideoPlayer";
import { colors } from "../../../theme/colors";
import typography from "../../../theme/typography";
import FeedbackModal from "../../../components/FeedbackModal";
import { CuratedTestsSection } from "../../test_v2";
import { useAppSelector } from "@/store/storeHook";

interface LessonSummaryProps {
    data: LessonSummaryData;
    sections: LessonSection[];
    onActionPress: (
        actionType: "flashcard" | "mindmap" | "slide" | "quiz",
    ) => void;
    onNodePress?: (nodeId: number) => void;
    onSectionTestPress?: (sectionId: number) => void;
    refreshTrigger?: number | boolean;
}

const getLessonProgress = (sections: LessonSection[]) => {
    let completed = 0;
    let total = 0;
    const traverse = (sec: LessonSection) => {
        if (sec.nodes) {
            sec.nodes.forEach((node) => {
                total++;
                if (node.isComplete) {
                    completed++;
                }
            });
        }
        if (sec.children) {
            sec.children.forEach(traverse);
        }
    };
    sections.forEach(traverse);
    return { completed, total };
};

export function LessonSummary({
    data,
    sections,
    onActionPress,
    onNodePress,
    onSectionTestPress,
    refreshTrigger,
}: LessonSummaryProps) {
    const { width } = useWindowDimensions();
    const isLoggedIn = !!useAppSelector((state) => state.auth.profile);
    const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);

    const progress = data.progress || getLessonProgress(sections);
    const completed = "completedNodes" in progress && progress.completedNodes !== undefined
        ? progress.completedNodes
        : (progress as any).completed;
    const total = "totalNodes" in progress && progress.totalNodes !== undefined
        ? progress.totalNodes
        : (progress as any).total;

    return (
        <View style={styles.container}>
            {/* --- Top Banner Display --- */}
            <View style={styles.bannerContainer}>
                {/* Replace with your image asset later */}
                <ImageBackground
                    source={
                        data.imgUrl
                            ? { uri: data.imgUrl }
                            : require("../../../../assets/images/default_lesson.png")
                    }
                    style={styles.bannerBg}
                    imageStyle={{ borderRadius: 12 }}
                >
                    
                </ImageBackground>
            </View>

            {/* --- Main Hero Content --- */}
            <View style={styles.heroContent}>
                {/* Progress bar and counter above title */}
                <View style={styles.progressContainer}>
                    <View style={styles.progressBarBg}>
                        <View
                            style={[
                                styles.progressBarFill,
                                { width: total > 0 ? `${(completed / total) * 100}%` : "0%" },
                            ]}
                        />
                    </View>
                    <Text style={styles.progressText}>
                        {completed}/{total}
                    </Text>
                </View>

                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <Text style={[styles.lessonHeading, { flex: 1, marginBottom: 0 }]}>
                        Bài {data.position}: {data.name}
                    </Text>
                    {isLoggedIn && (
                        <TouchableOpacity
                            onPress={() => setFeedbackModalVisible(true)}
                            style={styles.flagButton}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="flag-outline" size={20} color={colors.textSecondary} />
                        </TouchableOpacity>
                    )}
                </View>
                {data.summary ? (
                    <View style={styles.lessonDescriptionContainer}>
                        <AppHtmlRenderer
                            html={data.summary}
                            contentWidth={width - 32}
                            baseStyle={{
                                fontSize: 14,
                                lineHeight: 22,
                            }}
                        />
                    </View>
                ) : null}

            </View>

            {/* --- Matrix Action Grid Button Links --- */}
            <View style={styles.gridContainer}>
                <TouchableOpacity
                    style={styles.gridButton}
                    onPress={() => onActionPress("flashcard")}
                >
                    <View
                        style={[
                            styles.iconWrapper,
                            { backgroundColor: colors.primaryContainer },
                        ]}
                    >
                        <Ionicons
                            name="layers-outline"
                            size={16}
                            color={colors.primary}
                        />
                    </View>
                    <Text style={styles.gridButtonText}>Thẻ lật</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.gridButton}
                    onPress={() => onActionPress("mindmap")}
                >
                    <View
                        style={[
                            styles.iconWrapper,
                            { backgroundColor: colors.secondaryContainer },
                        ]}
                    >
                        <Ionicons
                            name="git-network"
                            size={16}
                            color={colors.secondary}
                        />
                    </View>
                    <Text style={styles.gridButtonText}>Mind map</Text>
                </TouchableOpacity>
            </View>

            {/* --- Video Player Section --- */}
            {data.videoId && data.videoUrl && (
                <View style={styles.videoContainer}>
                    <Text style={styles.videoTitle}>Video bài giảng</Text>
                    <VideoPlayer
                        videoId={data.videoId}
                        videoUrl={data.videoUrl}
                        onEnd={() => {}}
                        onNextWhenError={() => {}}
                    />
                </View>
            )}

            {/* --- Render Root Document Node Tree --- */}
            <View style={styles.sectionsList}>
                {sections.map((section) => (
                    <ExpandableSection
                        key={section.id}
                        section={section}
                        isTopLevel={true}
                        onNodePress={onNodePress}
                        onSectionTestPress={onSectionTestPress}
                    />
                ))}
            </View>

            {/* Pill-shaped lesson-level test button */}
            <TouchableOpacity
                style={[
                    styles.pillTestButton,
                    data.testPassed && { backgroundColor: colors.success }
                ]}
                onPress={() => onActionPress("quiz")}
                activeOpacity={0.8}
            >
                <Text style={styles.pillTestButtonText}>Kiểm tra toàn bài</Text>
                {data.testPassed && (
                    <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                )}
            </TouchableOpacity>

            {/* Curated Tests for Lesson Scope */}
            <CuratedTestsSection
                scopeType="LESSON"
                scopeId={data.lessonId}
                title="Một số đề luyện tập"
                variant="plain"
                defaultExpanded={true}
                refreshTrigger={refreshTrigger}
            />

            {/* Context Feedback Modal */}
            <FeedbackModal
                visible={feedbackModalVisible}
                onClose={() => setFeedbackModalVisible(false)}
                targetType="LESSON"
                targetId={data.lessonId}
                targetTitle={`Bài ${data.position}: ${data.name}`}
            />
        </View>
    );
}


const styles = StyleSheet.create({
    container: { padding: 16, backgroundColor: colors.background, paddingBottom: 40 },
    bannerContainer: { height: 160, marginBottom: 16 },
    bannerBg: { flex: 1, justifyContent: "flex-end", padding: 12 },
    tag: {
        backgroundColor: colors.secondary,
        alignSelf: "flex-start",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
    },
    tagText: {
        ...typography.caption,
        fontFamily: typography.fonts.bold,
        color: colors.textLight,
    },
    heroContent: { marginBottom: 20 },
    progressContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 12,
        gap: 12,
    },
    progressBarBg: {
        flex: 1,
        height: 6,
        backgroundColor: colors.primaryContainer,
        borderRadius: 3,
        overflow: "hidden",
    },
    progressBarFill: {
        height: "100%",
        backgroundColor: colors.primary,
        borderRadius: 3,
    },
    progressText: {
        ...typography.bodySmallSemiBold,
        color: colors.textSecondary,
    },
    lessonHeading: {
        ...typography.h2,
        color: colors.primary,
        marginBottom: 8,
    },
    flagButton: {
        padding: 4,
    },
    lessonDescription: {
        ...typography.bodyMedium,
        color: colors.textSecondary,
        lineHeight: 22,
        textAlign: (Platform.OS === "ios" ? "justify" : "left") as "justify" | "left",
    },
    lessonDescriptionContainer: {
        marginBottom: 4,
    },



    /* Feature Navigation Grid Matrix */
    gridContainer: {
        flexDirection: "row",
        gap: 12,
        marginBottom: 20,
        justifyContent: "center",
    },
    gridButton: {
        flex: 1,
        flexDirection: "row",
        backgroundColor: colors.primary,
        borderWidth: 2,
        borderColor: colors.accent,
        borderRadius: 12,
        paddingVertical: 8,
        paddingHorizontal: 16,
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
    },
    iconWrapper: {
        width: 30,
        height: 30,
    backgroundColor: colors.accent,
        borderRadius: 15,
        justifyContent: "center",
        alignItems: "center",
    },
    gridButtonText: {
        ...typography.caption,
        fontFamily: typography.fonts.bold,
        color: colors.textLight,
    },

    /* Tree List Wrapper */
    sectionsList: { marginTop: 8 },

    /* Video Player */
    videoContainer: {
        marginBottom: 24,
    },
    videoTitle: {
        ...typography.h3,
        fontFamily: typography.fonts.extraBold,
        color: colors.textPrimary,
        marginBottom: 12,
    },

    /* Pill Test Button */
    pillTestButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.primary,
        borderRadius: 30,
        paddingVertical: 12,
        paddingHorizontal: 24,
        gap: 8,
        marginTop: 16,
        alignSelf: "center",
        width: "80%",
    },
    pillTestButtonText: {
        color: colors.textLight,
        fontFamily: typography.fonts.bold,
        fontSize: 17,
    },
});
