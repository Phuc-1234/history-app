// features/lesson/components/NodeScreen.tsx
// Full-screen micro-lesson reader for a single node
import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useWindowDimensions,
    Image,
    Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import RenderHtml, { TNodeChildrenRenderer } from "react-native-render-html";
import VideoPlayer from "../../videostream/components/VideoPlayer";
import { Toast } from "../../../components/Toast";
import { useAppSelector } from "../../../store/storeHook";
import {
    useGetNodeDetailQuery,
    useFinishStudyNodeMutation,
} from "../lessonApiSlice";
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

interface NodeScreenProps {
    nodeId: number;
    onBack: () => void;
    onQuizPress?: () => void; // called when user taps the quiz button
    onPrevPress?: () => void; // navigate to previous sibling node
    onNextPress?: () => void; // navigate to next sibling node
    lessonName?: string;
}

export function NodeScreen({ nodeId, onBack, onQuizPress, onPrevPress, onNextPress, lessonName }: NodeScreenProps) {
    const router = useRouter();
    const { width } = useWindowDimensions();
    const isLoggedIn = !!useAppSelector((state) => state.auth.profile);
    const { data: node, isLoading, error } = useGetNodeDetailQuery(nodeId);
    const [finishStudy] = useFinishStudyNodeMutation();

    const [toastVisible, setToastVisible] = useState(false);
    const [toastMessage, setToastMessage] = useState("");
    const [studyDone, setStudyDone] = useState(false);
    const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
    const progressTriggered = useRef(false);

    useEffect(() => {
        progressTriggered.current = false;
    }, [nodeId]);

    const parentSectionsString = useAppSelector((state: any) => {
        const queries = state.api?.queries || {};
        for (const queryKey of Object.keys(queries)) {
            if (queryKey.startsWith("getLessonTree(")) {
                const qData = queries[queryKey]?.data;
                if (qData && qData.sections) {
                    const getParentPath = (sections: any[], targetNodeId: number): any[] | null => {
                        for (const sec of sections) {
                            if (sec.nodes && sec.nodes.some((n: any) => n.id === targetNodeId)) {
                                return [sec];
                            }
                            if (sec.children && sec.children.length > 0) {
                                const path = getParentPath(sec.children, targetNodeId);
                                if (path) {
                                    return [sec, ...path];
                                }
                            }
                        }
                        return null;
                    };
                    const path = getParentPath(qData.sections, nodeId);
                    if (path) {
                        return path.map((s) => s.name).join(" > ");
                    }
                }
            }
        }
        return "";
    });

    useEffect(() => {
        if (node) {
            setStudyDone(!!node.isCompleted);
        }
    }, [node]);

    const handleMarkComplete = async () => {
        if (!isLoggedIn || !node) return;
        setStudyDone(true);
        try {
            const result = await finishStudy(nodeId).unwrap();
            const msg =
                result.consequences?.find((c: any) => c.message)?.message ??
                "Đã ghi nhận hoàn thành!";
            setToastMessage(msg);
            setToastVisible(true);
        } catch {
            setToastMessage("Đã ghi nhận hoàn thành!");
            setToastVisible(true);
        }
    };

    const handleVideoProgress = async (currentTime: number, duration: number) => {
        if (!isLoggedIn || !node || progressTriggered.current || studyDone) return;

        if (currentTime >= duration - 5) {
            progressTriggered.current = true;
            try {
                const hasTest = !!node.hasRelevantQuestions;
                if (!hasTest) {
                    setStudyDone(true);
                }

                const result = await finishStudy(nodeId).unwrap();

                if (!hasTest) {
                    const msg =
                        result.consequences?.find((c: any) => c.message)?.message ??
                        "Đã ghi nhận hoàn thành!";
                    setToastMessage(msg);
                    setToastVisible(true);
                }
            } catch (err) {
                console.error("Auto finish study error:", err);
            }
        }
    };

    if (isLoading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (error || !node) {
        return (
            <View style={styles.center}>
                <Text style={styles.errorText}>Không tải được nội dung.</Text>
                <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                    <Text style={styles.backBtnText}>Quay lại</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Node Title & Completion Tick */}
                <View style={styles.nodeTitleContainer}>
                    <Text style={styles.nodeTitleText}>
                        {node.header || ""}
                    </Text>
                    <View style={styles.rightHeaderActions}>
                        {studyDone && isLoggedIn && (
                            <Ionicons name="checkmark-circle" size={24} color={colors.success} style={styles.completedTickIcon} />
                        )}
                        <TouchableOpacity
                            onPress={() => setFeedbackModalVisible(true)}
                            style={styles.flagButton}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="flag-outline" size={20} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Body — HTML rendered content */}
                <View style={{ marginBottom: 24 }}>
                    <RenderHtml
                        contentWidth={width - 40}
                        source={{ html: preprocessHtml(node.body || "") }}
                        tagsStyles={tagsStyles}
                        classesStyles={classesStyles}
                        renderers={renderers}
                    />
                </View>

                {/* Video player */}
                {node.video && (
                    <View style={styles.videoContainer}>
                        
                        <VideoPlayer
                            videoId={node.video.id}
                            videoUrl={node.video.hlsUrl}
                            onEnd={() => {}}
                            onNextWhenError={() => {}}
                            onProgress={handleVideoProgress}
                        />
                    </View>
                )}
            </ScrollView>

            {/* Prev / Next navigation footer */}
            {(onPrevPress ||
                onNextPress ||
                (isLoggedIn &&
                    (node.hasRelevantQuestions ||
                        (!node.hasRelevantQuestions && !node.video)))) && (
                <View style={styles.navFooter}>
                    <TouchableOpacity
                        style={[styles.navFooterBtn, !onPrevPress && styles.navFooterBtnDisabled]}
                        onPress={onPrevPress}
                        disabled={!onPrevPress}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="chevron-back" size={18} color={onPrevPress ? colors.primary : colors.borderDark} />
                    </TouchableOpacity>

                    {/* Middle Action Button */}
                    {isLoggedIn && (
                        node.hasRelevantQuestions ? (
                            <TouchableOpacity
                                style={styles.practiceBtn}
                                onPress={onQuizPress}
                            >
                                <Ionicons name="document-text" size={18} color={colors.textLight} />
                                <Text style={styles.practiceBtnText}>Thử thách</Text>
                            </TouchableOpacity>
                        ) : (!node.video && (
                            <TouchableOpacity
                                style={[
                                    styles.completeBtn,
                                    studyDone ? styles.completeBtnFilled : styles.completeBtnFlipped,
                                ]}
                                onPress={handleMarkComplete}
                                disabled={studyDone}
                            >
                                <Ionicons
                                    name={studyDone ? "checkmark-circle" : "checkmark-circle-outline"}
                                    size={18}
                                    color={studyDone ? colors.textLight : colors.success}
                                />
                                <Text
                                    style={[
                                        styles.completeBtnText,
                                        studyDone ? styles.completeBtnTextLight : styles.completeBtnTextSuccess,
                                    ]}
                                >
                                    {studyDone ? "Đã học" : "Đánh dấu đã học"}
                                </Text>
                            </TouchableOpacity>
                        ))
                    )}

                    <TouchableOpacity
                        style={[styles.navFooterBtn, !onNextPress && styles.navFooterBtnDisabled]}
                        onPress={onNextPress}
                        disabled={!onNextPress}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="chevron-forward" size={18} color={onNextPress ? colors.primary : colors.borderDark} />
                    </TouchableOpacity>
                </View>
            )}

            {/* Floating Flashcard Button */}
            <TouchableOpacity
                style={styles.floatingFcardBtn}
                onPress={() => {
                    router.push(`/(3_4_lessons)/4_4_fcard?nodeId=${node.id}`);
                }}
            >
                <Image
                    source={require("../../../../assets/images/flashcard_ic.png")}
                    style={{ width: 24, height: 24 }}
                    resizeMode="contain"
                />
            </TouchableOpacity>

            {/* Toast overlay */}
            <Toast
                message={toastMessage}
                visible={toastVisible}
                onHide={() => setToastVisible(false)}
            />

            {/* Context Feedback Modal */}
            <FeedbackModal
                visible={feedbackModalVisible}
                onClose={() => setFeedbackModalVisible(false)}
                targetType="NODE"
                targetId={node.id}
                targetTitle={node.header || `Mục số ${node.position}`}
            />
        </View>
    );
}


const tagsStyles = {
    body: {
        fontFamily: typography.fonts.regular,
        color: colors.textSecondary,
        fontSize: 16,
        lineHeight: 26,
    },
    p: {
        marginTop: 0,
        marginBottom: 12,
    },
    a: {
        color: colors.primary,
        textDecorationLine: "underline" as const,
    },
    li: {
        fontFamily: typography.fonts.regular,
        color: colors.textSecondary,
        fontSize: 15,
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
    mark: {
        backgroundColor: "#ffe066",
        color: colors.textPrimary,
    },
    th: {
        fontFamily: typography.fonts.bold,
        fontWeight: "bold" as const,
    },
};

const classesStyles = {
    "text-tiny": {
        fontFamily: typography.fonts.regular,
        fontSize: 10,
        lineHeight: 14,
    },
    "text-small": {
        fontFamily: typography.fonts.regular,
        fontSize: 13,
        lineHeight: 18,
    },
    "text-big": {
        fontFamily: typography.fonts.regular,
        fontSize: 20,
        lineHeight: 28,
    },
    "text-huge": {
        fontFamily: typography.fonts.regular,
        fontSize: 24,
        lineHeight: 34,
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

function extractInlineStyles(styleAttr?: string) {
    if (!styleAttr) return null;
    const res: any = {};
    const colorMatch = styleAttr.match(/(?:^|;|\s*)color\s*:\s*([^;]+)/i);
    if (colorMatch) res.color = colorMatch[1].trim();

    const bgMatch = styleAttr.match(/(?:^|;|\s*)background(?:-color)?\s*:\s*([^;]+)/i);
    if (bgMatch) res.backgroundColor = bgMatch[1].trim();

    const alignMatch = styleAttr.match(/(?:^|;|\s*)text-align\s*:\s*([^;]+)/i);
    if (alignMatch) res.textAlign = alignMatch[1].trim();

    return Object.keys(res).length > 0 ? res : null;
}

const renderers = {
    p: ({ tnode, style, TDefaultRenderer, ...props }: any) => {
        const inlineAlign = tnode.attributes?.style?.match(/text-align\s*:\s*(center|right|left|justify)/i)?.[1]
            || tnode.attributes?.align;
        const textAlign = inlineAlign || style?.textAlign;

        let extraStyle: any = null;
        if (textAlign === "center") {
            extraStyle = { width: "100%", alignItems: "center", textAlign: "center" };
        } else if (textAlign === "right") {
            extraStyle = { width: "100%", alignItems: "flex-end", textAlign: "right" };
        } else if (textAlign === "left") {
            extraStyle = { width: "100%", alignItems: "flex-start", textAlign: "left" };
        }

        return (
            <TDefaultRenderer
                tnode={tnode}
                style={extraStyle ? [style, extraStyle] : style}
                {...props}
            />
        );
    },
    figure: ({ tnode, style, TDefaultRenderer, ...props }: any) => {
        const inlineAlign = tnode.attributes?.style?.match(/text-align\s*:\s*(center|right|left|justify)/i)?.[1]
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

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: colors.background,
    },
    errorText: {
        ...typography.bodyMedium,
        color: colors.textMuted,
        marginBottom: 16,
    },
    backBtn: {
        backgroundColor: colors.primary,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 30,
    },
    backBtnText: {
        ...typography.bodyMediumBold,
        color: colors.textLight,
    },

    nodeTitleContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 16,
        gap: 12,
    },
    nodeTitleText: {
        ...typography.h2,
        color: colors.textPrimary,
        flex: 1,
        lineHeight: 30,
    },
    completedTickIcon: {
        flexShrink: 0,
    },
    rightHeaderActions: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    flagButton: {
        padding: 4,
    },


    /* Content */
    scrollContent: {
        padding: 20,
        paddingBottom: 60,
    },
    nodeBody: {
        ...typography.bodyLarge,
        color: colors.textSecondary,
        lineHeight: 26,
        marginBottom: 24,
    },

    /* Video */
    videoContainer: {
        marginBottom: 28,
    },
    videoLabel: {
        ...typography.bodyLargeBold,
        color: colors.textPrimary,
        marginBottom: 10,
    },

    completeBtn: {
        flex: 1,
        marginHorizontal: 12,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 30,
        gap: 6,
    },
    completeBtnFlipped: {
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.success,
    },
    completeBtnFilled: {
        backgroundColor: colors.success,
    },
    completeBtnText: {
        ...typography.bodyMediumBold,
    },
    completeBtnTextSuccess: {
        color: colors.success,
    },
    completeBtnTextLight: {
        color: colors.textLight,
    },
    practiceBtn: {
        flex: 1,
        marginHorizontal: 12,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.primary,
        borderRadius: 30,
        paddingVertical: 8,
        paddingHorizontal: 16,
        gap: 8,
    },
    practiceBtnText: {
        ...typography.bodyMediumBold,
        color: colors.textLight,
    },

    /* Prev / Next footer */
    navFooter: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: colors.borderLight,
        backgroundColor: colors.background,
    },
    navFooterBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: colors.surfaceVariant,
    },
    navFooterBtnDisabled: {
        opacity: 0.35,
    },
    floatingFcardBtn: {
        position: "absolute",
        bottom: 80,
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.primary,
        backgroundColor: colors.surface,
        justifyContent: "center",
        alignItems: "center",
    },

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
});
