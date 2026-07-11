import React from "react";
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
    ImageBackground,
    Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LessonSummaryData, LessonSection } from "../hooks/useLessonSummary";
import { ExpandableSection } from "./ExpandableSection";
import VideoPlayer from "../../videostream/components/VideoPlayer";
import { colors } from "../../../theme/colors";
import typography from "../../../theme/typography";

interface LessonSummaryProps {
    data: LessonSummaryData;
    sections: LessonSection[];
    onActionPress: (
        actionType: "flashcard" | "mindmap" | "slide" | "quiz",
    ) => void;
    onNodePress?: (nodeId: number) => void;
    onSectionTestPress?: (sectionId: number) => void;
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
}: LessonSummaryProps) {
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
                    source={{
                        uri: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=500",
                    }}
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

                <Text style={styles.lessonHeading}>
                    Bài {data.position}: {data.name}
                </Text>
                <Text style={styles.lessonDescription}>{data.summary}</Text>
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
                        <Image
                            source={require("../../../../assets/images/flashcard_ic.png")}
                            style={{ width: 16, height: 16 }}
                            resizeMode="contain"
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
    lessonDescription: {
        ...typography.bodyMedium,
        color: colors.textSecondary,
        lineHeight: 22,
    },

    /* Feature Navigation Grid Matrix */
    gridContainer: {
        flexDirection: "row",
        gap: 12,
        marginBottom: 20,
        justifyContent: "center",
    },
    gridButton: {
        flexDirection: "row",
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.borderMedium,
        borderRadius: 30,
        paddingVertical: 8,
        paddingHorizontal: 16,
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
    },
    iconWrapper: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: "center",
        alignItems: "center",
    },
    gridButtonText: {
        ...typography.caption,
        fontFamily: typography.fonts.bold,
        color: colors.textPrimary,
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
