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
import RenderHtml, { TNodeChildrenRenderer } from "react-native-render-html";
import { LessonSummaryData, LessonSection } from "../hooks/useLessonSummary";
import { ExpandableSection } from "./ExpandableSection";
import VideoPlayer from "../../videostream/components/VideoPlayer";
import { colors } from "../../../theme/colors";
import typography from "../../../theme/typography";
import FeedbackModal from "../../../components/FeedbackModal";

function preprocessHtml(html: string): string {
    if (!html) return "";

    let processed = html;

    // 1. Convert align="..." HTML attribute to inline style text-align
    processed = processed.replace(
        /<([a-z1-6]+)\s+([^>]*?)align=["'](center|right|left|justify)["']([^>]*?)>/gi,
        '<$1 $2style="text-align:$3;" $4>'
    );

    // 2. Convert shorthand background: to background-color: in inline style attributes
    processed = processed.replace(/style=(["'])(.*?)\1/gi, (match, quote, styleContent) => {
        const updatedStyle = styleContent.replace(/(^|;|\s*)background\s*:\s*([^;]+)/gi, "$1background-color:$2");
        return `style=${quote}${updatedStyle}${quote}`;
    });

    // 3. Convert HSL/HSLA to Hex (handles deg, %, comma/space syntax)
    processed = processed.replace(
        /hsla?\(\s*(\d+(?:\.\d+)?)(?:deg)?\s*[\s,]+\s*(\d+(?:\.\d+)?)%\s*[\s,]+\s*(\d+(?:\.\d+)?)%(?:\s*[\s,\/]+\s*(\d+(?:\.\d+)?%?))?\s*\)/gi,
        (match, hStr, sStr, lStr, aStr) => {
            const h = parseFloat(hStr);
            const s = parseFloat(sStr) / 100;
            const l = parseFloat(lStr) / 100;
            let a = 1;
            if (aStr) {
                a = aStr.endsWith("%") ? parseFloat(aStr) / 100 : parseFloat(aStr);
            }

            const k = (n: number) => (n + h / 30) % 12;
            const factor = s * Math.min(l, 1 - l);
            const f = (n: number) =>
                l - factor * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));

            const r = Math.round(255 * f(0));
            const g = Math.round(255 * f(8));
            const b = Math.round(255 * f(4));

            const rHex = r.toString(16).padStart(2, "0");
            const gHex = g.toString(16).padStart(2, "0");
            const bHex = b.toString(16).padStart(2, "0");

            if (aStr !== undefined) {
                const aHex = Math.round(a * 255).toString(16).padStart(2, "0");
                return `#${rHex}${gHex}${bHex}${aHex}`;
            }
            return `#${rHex}${gHex}${bHex}`;
        }
    );

    return processed;
}

function extractInlineStyles(styleAttr?: string) {
    if (!styleAttr) return null;
    const res: any = {};
    const colorMatch = styleAttr.match(/(?:^|;|\s*)color\s*:\s*([^;]+)/i);
    if (colorMatch) res.color = colorMatch[1].trim();

    const bgMatch = styleAttr.match(/(?:^|;|\s*)background(?:-color)?\s*:\s*([^;]+)/i);
    if (bgMatch) res.backgroundColor = bgMatch[1].trim();

    const alignMatch = styleAttr.match(/(?:^|;|\s*)text-align\s*:\s*([^;]+)/i);
    if (alignMatch) res.textAlign = alignMatch[1].trim();

    const fontStyleMatch = styleAttr.match(/(?:^|;|\s*)font-style\s*:\s*([^;]+)/i);
    if (fontStyleMatch) res.fontStyle = fontStyleMatch[1].trim();

    const fontWeightMatch = styleAttr.match(/(?:^|;|\s*)font-weight\s*:\s*([^;]+)/i);
    if (fontWeightMatch) {
        const fw = fontWeightMatch[1].trim().toLowerCase();
        if (fw === "bold" || fw === "bolder" || parseInt(fw, 10) >= 600) {
            res.fontFamily = typography.fonts.bold;
            res.fontWeight = "bold";
        }
    }

    const textDecorationMatch = styleAttr.match(/(?:^|;|\s*)text-decoration(?:-line)?\s*:\s*([^;]+)/i);
    if (textDecorationMatch) res.textDecorationLine = textDecorationMatch[1].trim();

    const fontSizeMatch = styleAttr.match(/(?:^|;|\s*)font-size\s*:\s*([^;]+)/i);
    if (fontSizeMatch) {
        const rawVal = fontSizeMatch[1].trim();
        const num = parseFloat(rawVal);
        if (!isNaN(num) && num > 0) {
            if (rawVal.endsWith("em") || rawVal.endsWith("rem")) {
                res.fontSize = Math.round(num * 14);
            } else if (rawVal.endsWith("pt")) {
                res.fontSize = Math.round(num * 1.333);
            } else {
                res.fontSize = Math.round(num);
            }
        }
    }

    return Object.keys(res).length > 0 ? res : null;
}

const summaryTagsStyles = {
    body: {
        fontFamily: typography.fonts.regular,
        color: colors.textSecondary,
        fontSize: 14,
        lineHeight: 22,
        textAlign: (Platform.OS === "ios" ? "justify" : "left") as "justify" | "left",
    },
    p: {
        marginTop: 0,
        marginBottom: 8,
        fontFamily: typography.fonts.regular,
        color: colors.textSecondary,
        fontSize: 14,
        lineHeight: 22,
    },
    a: {
        color: colors.primary,
        textDecorationLine: "underline" as const,
    },
    li: {
        fontFamily: typography.fonts.regular,
        color: colors.textSecondary,
        fontSize: 14,
        lineHeight: 22,
    },
    strong: {
        fontFamily: typography.fonts.bold,
        fontWeight: "bold" as const,
    },
    b: {
        fontFamily: typography.fonts.bold,
        fontWeight: "bold" as const,
    },
    i: {
        fontFamily: typography.fonts.italic,
        fontStyle: "italic" as const,
    },
    em: {
        fontFamily: typography.fonts.italic,
        fontStyle: "italic" as const,
    },
    u: {
        textDecorationLine: "underline" as const,
    },
    s: {
        textDecorationLine: "line-through" as const,
    },
    del: {
        textDecorationLine: "line-through" as const,
    },
    strike: {
        textDecorationLine: "line-through" as const,
    },
    mark: {
        backgroundColor: "#ffe066",
        color: colors.textPrimary,
    },
    th: {
        fontFamily: typography.fonts.bold,
        fontWeight: "bold" as const,
    },
    h1: {
        fontFamily: typography.fonts.extraBold,
        fontSize: 20,
        color: colors.textPrimary,
        marginBottom: 6,
    },
    h2: {
        fontFamily: typography.fonts.bold,
        fontSize: 18,
        color: colors.textPrimary,
        marginBottom: 6,
    },
    h3: {
        fontFamily: typography.fonts.bold,
        fontSize: 16,
        color: colors.textPrimary,
        marginBottom: 4,
    },
    blockquote: {
        borderLeftWidth: 3,
        borderLeftColor: colors.primary,
        paddingLeft: 10,
        marginVertical: 6,
        fontStyle: "italic" as const,
        color: colors.textSecondary,
    },
    code: {
        fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
        backgroundColor: colors.surfaceVariant,
        paddingHorizontal: 4,
        paddingVertical: 2,
        borderRadius: 4,
        fontSize: 13,
        color: colors.textPrimary,
    },
};

const summaryClassesStyles = {
    "text-tiny": {
        fontFamily: typography.fonts.regular,
        fontSize: 10,
        lineHeight: 14,
    },
    "text-small": {
        fontFamily: typography.fonts.regular,
        fontSize: 12,
        lineHeight: 16,
    },
    "text-big": {
        fontFamily: typography.fonts.regular,
        fontSize: 18,
        lineHeight: 24,
    },
    "text-huge": {
        fontFamily: typography.fonts.regular,
        fontSize: 22,
        lineHeight: 30,
    },
    "text-align-center": { textAlign: "center" as const },
    "text-align-right": { textAlign: "right" as const },
    "text-align-left": { textAlign: "left" as const },
    "text-align-justify": { textAlign: "justify" as const },
    "ql-align-center": { textAlign: "center" as const },
    "ql-align-right": { textAlign: "right" as const },
    "ql-align-left": { textAlign: "left" as const },
    "ql-align-justify": { textAlign: "justify" as const },
    "text-center": { textAlign: "center" as const },
    "text-right": { textAlign: "right" as const },
    "text-left": { textAlign: "left" as const },
    "text-justify": { textAlign: "justify" as const },
    "marker-yellow": { backgroundColor: "#ffe066", color: colors.textPrimary },
    "marker-green": { backgroundColor: "#a2f4bf", color: colors.textPrimary },
    "marker-pink": { backgroundColor: "#ffc0cb", color: colors.textPrimary },
    "marker-blue": { backgroundColor: "#a0c4ff", color: colors.textPrimary },
    "pen-red": { color: "#e63946" },
    "pen-green": { color: "#2a9d8f" },
};

const summaryRenderers = {
    p: ({ tnode, style, TDefaultRenderer, ...props }: any) => {
        const inlineAlign =
            tnode.attributes?.style?.match(/text-align\s*:\s*(center|right|left|justify)/i)?.[1]
            || tnode.attributes?.align;
        const textAlign = inlineAlign || style?.textAlign;

        let extraStyle: any = null;
        if (textAlign === "center") {
            extraStyle = { width: "100%", alignItems: "center", textAlign: "center" };
        } else if (textAlign === "right") {
            extraStyle = { width: "100%", alignItems: "flex-end", textAlign: "right" };
        } else if (textAlign === "left") {
            extraStyle = { width: "100%", alignItems: "flex-start", textAlign: "left" };
        } else if (textAlign === "justify") {
            extraStyle = { width: "100%", textAlign: "justify" };
        }

        const extracted = extractInlineStyles(tnode.attributes?.style);

        return (
            <TDefaultRenderer
                tnode={tnode}
                style={[style, extraStyle, extracted].filter(Boolean)}
                {...props}
            />
        );
    },
    div: ({ tnode, style, TDefaultRenderer, ...props }: any) => {
        const inlineAlign =
            tnode.attributes?.style?.match(/text-align\s*:\s*(center|right|left|justify)/i)?.[1]
            || tnode.attributes?.align;
        const textAlign = inlineAlign || style?.textAlign;

        let extraStyle: any = null;
        if (textAlign === "center") {
            extraStyle = { width: "100%", alignItems: "center", textAlign: "center" };
        } else if (textAlign === "right") {
            extraStyle = { width: "100%", alignItems: "flex-end", textAlign: "right" };
        } else if (textAlign === "left") {
            extraStyle = { width: "100%", alignItems: "flex-start", textAlign: "left" };
        } else if (textAlign === "justify") {
            extraStyle = { width: "100%", textAlign: "justify" };
        }

        const extracted = extractInlineStyles(tnode.attributes?.style);

        return (
            <TDefaultRenderer
                tnode={tnode}
                style={[style, extraStyle, extracted].filter(Boolean)}
                {...props}
            />
        );
    },
    figure: ({ tnode, style, TDefaultRenderer, ...props }: any) => {
        const inlineAlign =
            tnode.attributes?.style?.match(/text-align\s*:\s*(center|right|left|justify)/i)?.[1]
            || tnode.attributes?.align;
        const textAlign = inlineAlign || style?.textAlign;

        let extraStyle: any = null;
        if (textAlign === "center") {
            extraStyle = { width: "100%", alignItems: "center" };
        } else if (textAlign === "right") {
            extraStyle = { width: "100%", alignItems: "flex-end" };
        }

        return (
            <TDefaultRenderer
                tnode={tnode}
                style={extraStyle ? [style, extraStyle] : style}
                {...props}
            />
        );
    },
    span: ({ tnode, style, TDefaultRenderer, ...props }: any) => {
        const extracted = extractInlineStyles(tnode.attributes?.style);
        if (extracted) {
            return (
                <TDefaultRenderer
                    tnode={tnode}
                    style={[style, extracted]}
                    {...props}
                />
            );
        }
        return <TDefaultRenderer tnode={tnode} style={style} {...props} />;
    },
    mark: ({ tnode, style, TDefaultRenderer, ...props }: any) => {
        const extracted = extractInlineStyles(tnode.attributes?.style);
        const markStyle = { backgroundColor: "#ffe066", color: colors.textPrimary, ...extracted };
        return (
            <TDefaultRenderer
                tnode={tnode}
                style={[style, markStyle]}
                {...props}
            />
        );
    },
    table: ({ tnode }: any) => (
        <View style={styles.table}>
            <TNodeChildrenRenderer tnode={tnode} />
        </View>
    ),
    tbody: ({ tnode }: any) => (
        <View style={styles.tbody}>
            <TNodeChildrenRenderer tnode={tnode} />
        </View>
    ),
    tr: ({ tnode }: any) => (
        <View style={styles.tr}>
            <TNodeChildrenRenderer tnode={tnode} />
        </View>
    ),
    td: ({ tnode }: any) => (
        <View style={styles.td}>
            <TNodeChildrenRenderer tnode={tnode} />
        </View>
    ),
    th: ({ tnode }: any) => (
        <View style={[styles.td, styles.th]}>
            <TNodeChildrenRenderer tnode={tnode} />
        </View>
    ),
};

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
    const { width } = useWindowDimensions();
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
                    <TouchableOpacity
                        onPress={() => setFeedbackModalVisible(true)}
                        style={styles.flagButton}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="flag-outline" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                </View>
                {data.summary ? (
                    <View style={styles.lessonDescriptionContainer}>
                        <RenderHtml
                            contentWidth={width - 32}
                            source={{ html: preprocessHtml(data.summary) }}
                            tagsStyles={summaryTagsStyles}
                            classesStyles={summaryClassesStyles}
                            renderers={summaryRenderers}
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

    /* Table Styles */
    table: {
        borderWidth: 1,
        borderColor: colors.borderMedium,
        borderRadius: 4,
        overflow: "hidden",
        marginVertical: 12,
        backgroundColor: colors.surface,
    },
    tbody: {
        flexDirection: "column",
    },
    tr: {
        flexDirection: "row",
        borderBottomWidth: 1,
        borderBottomColor: colors.borderMedium,
    },
    td: {
        flex: 1,
        padding: 10,
        justifyContent: "center",
        borderRightWidth: 1,
        borderRightColor: colors.borderMedium,
    },
    th: {
        backgroundColor: colors.surfaceVariant,
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
