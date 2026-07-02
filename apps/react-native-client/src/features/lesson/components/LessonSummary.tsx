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
    const { completed, total } = getLessonProgress(sections);

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
                    imageStyle={{ borderRadius: 5 }}
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
                        {completed}/{total} phần
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

                <TouchableOpacity
                    style={[styles.gridButton, styles.filledGridButton]}
                    onPress={() => onActionPress("quiz")}
                >
                    <View style={styles.iconWrapperTransparent}>
                        <Ionicons name="document-text" size={16} color={colors.textLight} />
                    </View>
                    <Text style={[styles.gridButtonText, styles.whiteText]}>
                        Kiểm tra toàn bài
                    </Text>
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
                {sections.map((section, index) => (
                    <React.Fragment key={section.id}>
                        {index > 0 && <View style={styles.divider} />}
                        <ExpandableSection
                            section={section}
                            isTopLevel={true}
                            onNodePress={onNodePress}
                            onSectionTestPress={onSectionTestPress}
                        />
                    </React.Fragment>
                ))}
            </View>

            {/* Pill-shaped lesson-level test button */}
            <TouchableOpacity
                style={styles.pillTestButton}
                onPress={() => onActionPress("quiz")}
                activeOpacity={0.8}
            >
                <Ionicons name="document-text" size={18} color={colors.textLight} />
                <Text style={styles.pillTestButtonText}>Kiểm tra toàn bài</Text>
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
    tagText: { color: colors.textLight, fontSize: 12, fontWeight: "700" },
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
        fontSize: 13,
        fontWeight: "600",
        color: colors.textSecondary,
    },
    lessonHeading: {
        fontSize: 22,
        fontWeight: "normal",
        color: colors.primary,
        marginBottom: 8,
    },
    lessonDescription: { fontSize: 14, color: colors.textSecondary, lineHeight: 22 },

    /* Feature Navigation Grid Matrix */
    gridContainer: {
        flexDirection: "row",
        gap: 8,
        marginBottom: 20,
    },
    gridButton: {
        flex: 1,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.borderMedium,
        borderRadius: 9,
        paddingVertical: 10,
        paddingHorizontal: 4,
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
    },
    filledGridButton: { backgroundColor: colors.primary, borderColor: colors.primary },
    iconWrapper: {
        width: 32,
        height: 32,
        borderRadius: 4,
        justifyContent: "center",
        alignItems: "center",
    },
    iconWrapperTransparent: {
        width: 32,
        height: 32,
        justifyContent: "center",
        alignItems: "center",
    },
    gridButtonText: { fontSize: 12, fontWeight: "700", color: colors.textPrimary },
    whiteText: { color: colors.textLight },

    /* Tree List Wrapper */
    sectionsList: { marginTop: 8 },
    divider: {
        height: 2,
        backgroundColor: colors.borderDark,
        marginVertical: 16,
        marginHorizontal: 8,
    },

    /* Video Player */
    videoContainer: {
        marginBottom: 24,
    },
    videoTitle: {
        fontSize: 18,
        fontWeight: "800",
        color: colors.textPrimary,
        marginBottom: 12,
    },

    /* Pill Test Button */
    pillTestButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.primary,
        borderRadius: 40,
        paddingVertical: 12,
        paddingHorizontal: 24,
        gap: 8,
        marginTop: 16,
        alignSelf: "center",
        width: "80%",
    },
    pillTestButtonText: {
        color: colors.textLight,
        fontSize: 17,
        fontWeight: "700",
    },
});
