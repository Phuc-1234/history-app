// features/lesson/components/NodeScreen.tsx
// Full-screen micro-lesson reader for a single node
import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
    useWindowDimensions,
    Platform,
    RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Speech from "expo-speech";
import VideoPlayer from "../../videostream/components/VideoPlayer";
import { Toast } from "../../../components/Toast";
import { AppHtmlRenderer } from "../../../components/AppHtmlRenderer";
import { useAppSelector } from "../../../store/storeHook";
import {
    useGetNodeDetailQuery,
    useFinishStudyNodeMutation,
} from "../lessonApiSlice";
import { colors } from "../../../theme/colors";
import typography from "../../../theme/typography";
import FeedbackModal from "../../../components/FeedbackModal";
import { stripHtml } from "@/utils/htmlUtils";
import { usePreventDoubleTap } from "@/hooks/usePreventDoubleTap";

function isEnglishText(text: string): boolean {
    const vietnameseCharRegex = /[àáảãạăắằẳẵặâấầẩẫậđèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵ]/i;
    if (vietnameseCharRegex.test(text)) {
        return false;
    }
    const englishCharRegex = /[a-zA-Z]/;
    return englishCharRegex.test(text);
}

const stripMarkdown = (text: string): string => {
    return text
        .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1")
        .replace(/^#{1,6}\s+/gm, "")
        .replace(/^>\s*/gm, "")
        .replace(/^-\s*\[[ xX]\]\s*/gm, "")
        .replace(/^[\*\-]\s+/gm, "")
        .replace(/\*\*([^*]+)\*\*/g, "$1")
        .replace(/\*([^*]+)\*/g, "$1")
        .replace(/_([^_]+)_/g, "$1")
        .replace(/\[([^\]]+)\]/g, "$1")
        .trim();
};

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
    const { data: node, isLoading, isFetching, error, refetch } = useGetNodeDetailQuery(nodeId);
    const [finishStudy] = useFinishStudyNodeMutation();
    const preventDoubleTap = usePreventDoubleTap();

    const [toastVisible, setToastVisible] = useState(false);
    const [toastMessage, setToastMessage] = useState("");
    const [studyDone, setStudyDone] = useState(false);
    const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const isSpeakingRef = useRef(false);
    const progressTriggered = useRef(false);

    const updateSpeakingState = (speaking: boolean) => {
        isSpeakingRef.current = speaking;
        setIsSpeaking(speaking);
    };

    useEffect(() => {
        progressTriggered.current = false;
        Speech.stop();
        updateSpeakingState(false);
        setShowMenu(false);
        return () => {
            Speech.stop();
            updateSpeakingState(false);
        };
    }, [nodeId]);

    const handleToggleSpeak = () => {
        setShowMenu(false);
        if (isSpeakingRef.current) {
            Speech.stop();
            updateSpeakingState(false);
        } else {
            const headerText = node?.header ? stripMarkdown(stripHtml(node.header)) : "";
            const bodyText = node?.body ? stripMarkdown(stripHtml(node.body)) : "";
            const plainText = [headerText, bodyText].filter(Boolean).join(". ");
            if (!plainText.trim()) return;

            Speech.stop();
            updateSpeakingState(true);
            Speech.speak(plainText, {
                language: isEnglishText(plainText) ? "en-US" : "vi-VN",
                onDone: () => {
                    updateSpeakingState(false);
                },
                onError: () => {
                    updateSpeakingState(false);
                },
                onStopped: () => {
                    updateSpeakingState(false);
                },
            });
        }
    };

    const handleFlashcardPress = preventDoubleTap(() => {
        setShowMenu(false);
        if (node) {
            router.push(`/(3_4_lessons)/4_4_fcard?nodeId=${node.id}`);
        }
    });

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
            await finishStudy(nodeId).unwrap();
            setToastMessage("Đã hoàn thành nút kiến thức");
            setToastVisible(true);
        } catch {
            setToastMessage("Đã hoàn thành nút kiến thức");
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

                await finishStudy(nodeId).unwrap();

                if (!hasTest) {
                    setToastMessage("đã hoàn thành nút kiến thức");
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
                refreshControl={
                    <RefreshControl
                        refreshing={isFetching}
                        onRefresh={refetch}
                        colors={[colors.primary]}
                        tintColor={colors.primary}
                    />
                }
            >
                {/* Node Title & Completion Tick + 3-dot dropdown */}
                <View style={styles.nodeTitleContainer}>
                    <Text style={styles.nodeTitleText}>
                        {node.header || ""}
                    </Text>
                    <View style={styles.rightHeaderActions}>
                        {studyDone && isLoggedIn && (
                            <Ionicons name="checkmark-circle" size={24} color={colors.success} style={styles.completedTickIcon} />
                        )}
                        <View style={styles.menuAnchor}>
                            <TouchableOpacity
                                onPress={() => setShowMenu((prev) => !prev)}
                                style={styles.moreButton}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="ellipsis-vertical" size={20} color={colors.textSecondary} />
                            </TouchableOpacity>

                            {showMenu && (
                                <>
                                    <TouchableWithoutFeedback onPress={() => setShowMenu(false)}>
                                        <View style={styles.dropdownBackdrop} />
                                    </TouchableWithoutFeedback>
                                    <View style={styles.dropdownMenu}>
                                        <TouchableOpacity
                                            style={styles.dropdownItem}
                                            onPress={handleToggleSpeak}
                                            activeOpacity={0.7}
                                        >
                                            <Ionicons
                                                name={isSpeaking ? "stop-circle-outline" : "volume-high-outline"}
                                                size={18}
                                                color={isSpeaking ? colors.error : colors.textPrimary}
                                                style={styles.dropdownItemIcon}
                                            />
                                            <Text style={[styles.dropdownItemText, isSpeaking && { color: colors.error }]}>
                                                {isSpeaking ? "Dừng đọc" : "Đọc"}
                                            </Text>
                                        </TouchableOpacity>

                                        <View style={styles.dropdownDivider} />

                                        <TouchableOpacity
                                            style={styles.dropdownItem}
                                            onPress={handleFlashcardPress}
                                            activeOpacity={0.7}
                                        >
                                            <Ionicons
                                                name="layers-outline"
                                                size={18}
                                                color={colors.textPrimary}
                                                style={styles.dropdownItemIcon}
                                            />
                                            <Text style={styles.dropdownItemText}>Flashcard của nút này</Text>
                                        </TouchableOpacity>

                                        <View style={styles.dropdownDivider} />

                                        <TouchableOpacity
                                            style={styles.dropdownItem}
                                            onPress={() => {
                                                setShowMenu(false);
                                                setFeedbackModalVisible(true);
                                            }}
                                            activeOpacity={0.7}
                                        >
                                            <Ionicons
                                                name="chatbubble-ellipses-outline"
                                                size={18}
                                                color={colors.textPrimary}
                                                style={styles.dropdownItemIcon}
                                            />
                                            <Text style={styles.dropdownItemText}>Góp ý</Text>
                                        </TouchableOpacity>
                                    </View>
                                </>
                            )}
                        </View>
                    </View>
                </View>

                {/* Body — HTML rendered content */}
                <View style={{ marginBottom: 24 }}>
                    <AppHtmlRenderer
                        html={node.body || ""}
                        contentWidth={width - 40}
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
        zIndex: 100,
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
    menuAnchor: {
        position: "relative",
        zIndex: 100,
    },
    moreButton: {
        padding: 4,
    },
    dropdownBackdrop: {
        position: "absolute",
        top: -500,
        left: -1000,
        right: -1000,
        bottom: -2000,
        zIndex: 999,
    },
    dropdownMenu: {
        position: "absolute",
        top: 32,
        right: 0,
        backgroundColor: colors.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.borderMedium,
        paddingVertical: 4,
        minWidth: 200,
        zIndex: 1000,
    },
    dropdownItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 10,
        paddingHorizontal: 12,
    },
    dropdownItemIcon: {
        marginRight: 10,
    },
    dropdownItemText: {
        fontFamily: typography.fonts.medium,
        fontSize: 14,
        color: colors.textPrimary,
    },
    dropdownDivider: {
        height: 1,
        backgroundColor: colors.borderLight,
        marginHorizontal: 8,
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
});

