import React from "react";
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
    ImageBackground,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LessonSummaryData, LessonSection } from "../hooks/useLessonSummary";
import { ExpandableSection } from "./ExpandableSection";
import VideoPlayer from "../../videostream/components/VideoPlayer";

interface LessonSummaryProps {
    data: LessonSummaryData;
    sections: LessonSection[];
    onActionPress: (
        actionType: "flashcard" | "mindmap" | "slide" | "quiz",
    ) => void;
    onNodePress?: (nodeId: number) => void;
    onSectionTestPress?: (sectionId: number) => void;
}

export function LessonSummary({
    data,
    sections,
    onActionPress,
    onNodePress,
    onSectionTestPress,
}: LessonSummaryProps) {
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
                    imageStyle={{ borderRadius: 16 }}
                >
                    <View style={styles.tag}>
                        <Text style={styles.tagText}>
                            Lịch sử lớp {data.position * 10}
                        </Text>
                    </View>
                </ImageBackground>
            </View>

            {/* --- Main Hero Content --- */}
            <View style={styles.heroContent}>
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
                            { backgroundColor: "#EAEAFE" },
                        ]}
                    >
                        <Ionicons name="copy" size={16} color="#5856D6" />
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
                            { backgroundColor: "#FFEAD2" },
                        ]}
                    >
                        <Ionicons
                            name="git-network"
                            size={16}
                            color="#FF9500"
                        />
                    </View>
                    <Text style={styles.gridButtonText}>Mind map</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.gridButton, styles.filledGridButton]}
                    onPress={() => onActionPress("quiz")}
                >
                    <View style={styles.iconWrapperTransparent}>
                        <Ionicons name="document-text" size={16} color="#FFF" />
                    </View>
                    <Text style={[styles.gridButtonText, styles.whiteText]}>
                        Test toàn bài
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
                style={styles.pillTestButton}
                onPress={() => onActionPress("quiz")}
                activeOpacity={0.8}
            >
                <Ionicons name="document-text" size={18} color="#FFF" />
                <Text style={styles.pillTestButtonText}>Kiểm tra toàn bài</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { padding: 16, backgroundColor: "#FFF", paddingBottom: 40 },
    bannerContainer: { height: 160, marginBottom: 16 },
    bannerBg: { flex: 1, justifyContent: "flex-end", padding: 12 },
    tag: {
        backgroundColor: "#FF9500",
        alignSelf: "flex-start",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    tagText: { color: "#FFF", fontSize: 12, fontWeight: "700" },
    heroContent: { marginBottom: 20 },
    lessonHeading: {
        fontSize: 22,
        fontWeight: "800",
        color: "#5856D6",
        marginBottom: 8,
    },
    lessonDescription: { fontSize: 14, color: "#3A3A3C", lineHeight: 22 },

    /* Feature Navigation Grid Matrix */
    gridContainer: {
        flexDirection: "row",
        gap: 8,
        marginBottom: 20,
    },
    gridButton: {
        flex: 1,
        backgroundColor: "#FFF",
        borderWidth: 1,
        borderColor: "#E5E5EA",
        borderRadius: 12,
        paddingVertical: 10,
        paddingHorizontal: 4,
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
    },
    filledGridButton: { backgroundColor: "#5856D6", borderColor: "#5856D6" },
    iconWrapper: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: "center",
        alignItems: "center",
    },
    iconWrapperTransparent: {
        width: 32,
        height: 32,
        justifyContent: "center",
        alignItems: "center",
    },
    gridButtonText: { fontSize: 12, fontWeight: "700", color: "#1C1C1E" },
    whiteText: { color: "#FFF" },

    /* Tree List Wrapper */
    sectionsList: { marginTop: 8 },

    /* Video Player */
    videoContainer: {
        marginBottom: 24,
    },
    videoTitle: {
        fontSize: 18,
        fontWeight: "800",
        color: "#1C1C1E",
        marginBottom: 12,
    },

    /* Pill Test Button */
    pillTestButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#5856D6",
        borderRadius: 24,
        paddingVertical: 12,
        paddingHorizontal: 24,
        gap: 8,
        marginTop: 16,
        alignSelf: "center",
        width: "80%",
    },
    pillTestButtonText: {
        color: "#FFF",
        fontSize: 15,
        fontWeight: "700",
    },
});
