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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import RenderHtml, { TNodeChildrenRenderer } from "react-native-render-html";
import VideoPlayer from "../../videostream/components/VideoPlayer";
import { Toast } from "../../../components/Toast";
import { useAppSelector } from "../../../store/storeHook";
import {
    useGetNodeDetailQuery,
    useFinishStudyNodeMutation,
} from "../lessonApiSlice";

// Time (ms) user must stay on screen before it counts as "studied"
const STUDY_THRESHOLD_MS = 8000;

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
}

export function NodeScreen({ nodeId, onBack, onQuizPress }: NodeScreenProps) {
    const { width } = useWindowDimensions();
    const isLoggedIn = !!useAppSelector((state) => state.auth.profile);
    const { data: node, isLoading, error } = useGetNodeDetailQuery(nodeId);
    const [finishStudy] = useFinishStudyNodeMutation();

    const [toastVisible, setToastVisible] = useState(false);
    const [toastMessage, setToastMessage] = useState("");
    const [studyDone, setStudyDone] = useState(false);

    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const entryTimeRef = useRef(Date.now());

    // Start the study timer when screen mounts (or node changes)
    useEffect(() => {
        if (!isLoggedIn || !node) {
            return;
        }

        if (node.isCompleted) {
            setStudyDone(true);
            return;
        }

        entryTimeRef.current = Date.now();
        setStudyDone(false);

        timerRef.current = setTimeout(async () => {
            setStudyDone(true);
            try {
                const result = await finishStudy(nodeId).unwrap();
                const msg =
                    result.consequences.find((c) => c.message)?.message ??
                    "Đã ghi nhận học bài!";
                setToastMessage(msg);
                setToastVisible(true);
            } catch {
                // silently fail — user still gets credit locally
                setToastMessage("Đã ghi nhận học bài!");
                setToastVisible(true);
            }
        }, STUDY_THRESHOLD_MS);

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [nodeId, isLoggedIn, node]);

    if (isLoading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#5856D6" />
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
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.headerBackBtn}>
                    <Ionicons name="arrow-back" size={22} color="#1C1C1E" />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>
                    {node.header ?? `Phần ${node.position}`}
                </Text>
                {/* Completion badge */}
                {node.isCompleted && isLoggedIn && (
                    <View style={styles.completedBadge}>
                        <Ionicons name="checkmark-circle" size={20} color="#34C759" />
                    </View>
                )}
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Title */}
                {node.header && (
                    <Text style={styles.nodeTitle}>{node.header}</Text>
                )}

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
                        <Text style={styles.videoLabel}>Video bài giảng</Text>
                        <VideoPlayer
                            videoId={node.video.id}
                            videoUrl={node.video.hlsUrl}
                            onEnd={() => {}}
                            onNextWhenError={() => {}}
                        />
                    </View>
                )}

                {/* Quiz button — only if relevant questions exist */}
                {node.hasRelevantQuestions && (
                    <TouchableOpacity
                        style={styles.quizButton}
                        onPress={onQuizPress}
                        activeOpacity={0.85}
                    >
                        <Ionicons name="document-text" size={20} color="#FFF" />
                        <Text style={styles.quizButtonText}>Làm bài kiểm tra</Text>
                    </TouchableOpacity>
                )}

                {/* Study timer indicator */}
                {isLoggedIn && (
                    <View style={styles.studyIndicator}>
                        <Ionicons
                            name={studyDone ? "checkmark-circle" : "time-outline"}
                            size={16}
                            color={studyDone ? "#34C759" : "#AEAEB2"}
                        />
                        <Text
                            style={[
                                styles.studyIndicatorText,
                                studyDone && styles.studyDoneText,
                            ]}
                        >
                            {studyDone
                                ? (node?.isCompleted ? "Bạn đã học bài này" : "Đã ghi nhận học bài")
                                : "Đọc bài để hoàn thành…"}
                        </Text>
                    </View>
                )}
            </ScrollView>

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
        color: "#3A3A3C",
        fontSize: 16,
        lineHeight: 26,
    },
    p: {
        marginTop: 0,
        marginBottom: 12,
    },
    a: {
        color: "#5856D6",
        textDecorationLine: "underline" as const,
    },
    li: {
        color: "#3A3A3C",
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
    container: { flex: 1, backgroundColor: "#FFF" },
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#FFF",
    },
    errorText: { fontSize: 15, color: "#8E8E93", marginBottom: 16 },
    backBtn: {
        backgroundColor: "#5856D6",
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
    },
    backBtnText: { color: "#FFF", fontWeight: "700" },

    /* Header */
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#F2F2F7",
        gap: 12,
    },
    headerBackBtn: {
        padding: 4,
    },
    headerTitle: {
        flex: 1,
        fontSize: 17,
        fontWeight: "700",
        color: "#1C1C1E",
    },
    completedBadge: {
        padding: 4,
    },

    /* Content */
    scrollContent: {
        padding: 20,
        paddingBottom: 60,
    },
    nodeTitle: {
        fontSize: 22,
        fontWeight: "800",
        color: "#1C1C1E",
        marginBottom: 16,
        lineHeight: 30,
    },
    nodeBody: {
        fontSize: 16,
        color: "#3A3A3C",
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
        color: "#1C1C1E",
        marginBottom: 10,
    },

    /* Quiz button */
    quizButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#5856D6",
        borderRadius: 16,
        paddingVertical: 14,
        gap: 8,
        marginBottom: 20,
        elevation: 3,
        shadowColor: "#5856D6",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
    },
    quizButtonText: {
        color: "#FFF",
        fontSize: 16,
        fontWeight: "700",
    },

    /* Study indicator */
    studyIndicator: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        paddingVertical: 10,
    },
    studyIndicatorText: {
        fontSize: 13,
        color: "#AEAEB2",
    },
    studyDoneText: {
        color: "#34C759",
        fontWeight: "600",
    },
    table: {
        borderWidth: 1,
        borderColor: "#E5E5EA",
        borderRadius: 8,
        overflow: "hidden",
        marginVertical: 12,
        backgroundColor: "#FFF",
    },
    tbody: {
        flexDirection: "column",
    },
    tr: {
        flexDirection: "row",
        borderBottomWidth: 1,
        borderBottomColor: "#E5E5EA",
    },
    td: {
        flex: 1,
        padding: 10,
        justifyContent: "center",
        borderRightWidth: 1,
        borderRightColor: "#E5E5EA",
    },
    th: {
        backgroundColor: "#F2F2F7",
    },
});
