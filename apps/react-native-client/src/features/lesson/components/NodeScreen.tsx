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

function convertHslToHex(html: string): string {
    if (!html) return "";
    return html.replace(
        /hsla?\(\s*(\d+(?:\.\d+)?)\s*(?:,|\s+)\s*(\d+(?:\.\d+)?)%\s*(?:,|\s+)\s*(\d+(?:\.\d+)?)%\s*(?:(?:,|\/|\s+)\s*(\d+(?:\.\d+)?)\s*)?\)/gi,
        (match, hStr, sStr, lStr, aStr) => {
            const h = parseFloat(hStr);
            const s = parseFloat(sStr) / 100;
            const l = parseFloat(lStr) / 100;
            const a = aStr ? parseFloat(aStr) : 1;

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
                    {studyDone && isLoggedIn && (
                        <Ionicons name="checkmark-circle" size={24} color={colors.success} style={styles.completedTickIcon} />
                    )}
                </View>

                {/* Body — HTML rendered content */}
                <View style={{ marginBottom: 24 }}>
                    <RenderHtml
                        contentWidth={width}
                        source={{ html: convertHslToHex(node.body || "") }}
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

            {/* Action Buttons Container (Anchored at the bottom) */}
            <View style={styles.actionButtonsContainer}>
                <View style={styles.topRowButtons}>
                    {isLoggedIn && !node.hasRelevantQuestions && !node.video && (
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
                    )}

                    {isLoggedIn && node.hasRelevantQuestions && (
                        <TouchableOpacity
                            style={[styles.practiceBtn, { flex: 1 }]}
                            onPress={onQuizPress}
                        >
                            <Ionicons name="document-text" size={18} color={colors.textLight} />
                            <Text style={styles.practiceBtnText}>Thử thách</Text>
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity
                        style={styles.squareFcardBtn}
                        onPress={() => {
                            router.push(`/(3_4_lessons)/4_4_fcard?nodeId=${node.id}`);
                        }}
                    >
                        <Image
                            source={require("../../../../assets/images/flashcard_ic.png")}
                            style={{ width: 20, height: 20 }}
                            resizeMode="contain"
                        />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Prev / Next navigation footer */}
            {(onPrevPress || onNextPress) && (
                <View style={styles.navFooter}>
                    <TouchableOpacity
                        style={[styles.navFooterBtn, !onPrevPress && styles.navFooterBtnDisabled]}
                        onPress={onPrevPress}
                        disabled={!onPrevPress}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="chevron-back" size={18} color={onPrevPress ? colors.primary : colors.borderDark} />
                        <Text style={[styles.navFooterBtnText, !onPrevPress && styles.navFooterBtnTextDisabled]}>Trước</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.navFooterBtn, !onNextPress && styles.navFooterBtnDisabled]}
                        onPress={onNextPress}
                        disabled={!onNextPress}
                        activeOpacity={0.7}
                    >
                        <Text style={[styles.navFooterBtnText, !onNextPress && styles.navFooterBtnTextDisabled]}>Sau</Text>
                        <Ionicons name="chevron-forward" size={18} color={onNextPress ? colors.primary : colors.borderDark} />
                    </TouchableOpacity>
                </View>
            )}

            {/* Toast overlay */}
            <Toast
                message={toastMessage}
                visible={toastVisible}
                onHide={() => setToastVisible(false)}
            />
        </View>
    );
}

const tagsStyles = {
    body: {
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
        color: colors.textSecondary,
        fontSize: 15,
        lineHeight: 22,
    },
    strong: {
        fontWeight: "bold" as const,
    },
    b: {
        fontWeight: "bold" as const,
    },
    i: {
        fontStyle: "italic" as const,
    },
    em: {
        fontStyle: "italic" as const,
    },
    u: {
        textDecorationLine: "underline" as const,
    },
    th: {
        fontWeight: "bold" as const,
    },
};

const classesStyles = {
    "text-tiny": {
        fontSize: 10,
        lineHeight: 14,
    },
    "text-small": {
        fontSize: 13,
        lineHeight: 18,
    },
    "text-big": {
        fontSize: 20,
        lineHeight: 28,
    },
    "text-huge": {
        fontSize: 24,
        lineHeight: 34,
    },
};

const renderers = {
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
    span: ({ tnode, style, TDefaultRenderer, ...props }: any) => (
        <TDefaultRenderer tnode={tnode} style={style} {...props} />
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
    errorText: { fontSize: 15, color: colors.textMuted, marginBottom: 16 },
    backBtn: {
        backgroundColor: colors.primary,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 30,
    },
    backBtnText: { color: colors.textLight, fontWeight: "700" },

    nodeTitleContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 16,
        gap: 12,
    },
    nodeTitleText: {
        fontSize: 22,
        fontWeight: "800",
        color: colors.textPrimary,
        flex: 1,
        lineHeight: 30,
    },
    completedTickIcon: {
        flexShrink: 0,
    },

    /* Content */
    scrollContent: {
        padding: 20,
        paddingBottom: 60,
    },
    nodeBody: {
        fontSize: 16,
        color: colors.textSecondary,
        lineHeight: 26,
        marginBottom: 24,
    },

    /* Video */
    videoContainer: {
        marginBottom: 28,
    },
    videoLabel: {
        fontSize: 15,
        fontWeight: "700",
        color: colors.textPrimary,
        marginBottom: 10,
    },

    /* Action Buttons */
    actionButtonsContainer: {
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 12,
        backgroundColor: colors.background,
        borderTopWidth: 1,
        borderTopColor: colors.borderLight,
        gap: 12,
    },
    topRowButtons: {
        flexDirection: "row",
        gap: 10,
        alignItems: "center",
    },
    completeBtn: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 12,
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
        fontSize: 15,
        fontWeight: "700",
    },
    completeBtnTextSuccess: {
        color: colors.success,
    },
    completeBtnTextLight: {
        color: colors.textLight,
    },
    squareFcardBtn: {
        width: 48,
        height: 48,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.primary,
        backgroundColor: colors.surface,
        justifyContent: "center",
        alignItems: "center",
    },
    practiceBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.primary,
        borderRadius: 30,
        paddingVertical: 12,
        gap: 8,
    },
    practiceBtnText: {
        color: colors.textLight,
        fontSize: 15,
        fontWeight: "700",
    },

    /* Prev / Next footer */
    navFooter: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: colors.borderLight,
        backgroundColor: colors.background,
    },
    navFooterBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 30,
        backgroundColor: colors.surfaceVariant,
    },
    navFooterBtnDisabled: {
        opacity: 0.35,
    },
    navFooterBtnText: {
        fontSize: 14,
        fontWeight: "700",
        color: colors.primary,
    },
    navFooterBtnTextDisabled: {
        color: colors.textMuted,
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
