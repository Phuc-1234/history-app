import React, { useRef, useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    Modal,
    Pressable,
    TextInput,
    FlatList,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Dimensions,
    Clipboard,
} from "react-native";
import * as Speech from "expo-speech";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/theme/colors";
import { AiSkeletonBubble } from "./AiSkeletonBubble";
import { VibratingVoiceInput } from "./VibratingVoiceInput";
import { AiMarkdownMessage } from "./AiMarkdownMessage";
import { MascotRotator } from "./MascotRotator";
import { TwinklingStars } from "./TwinklingStars";
import { CustomModal } from "@/components/Modal";
import { useAiChatOverlay, DisplayChatMessage } from "../hooks/useAiChatOverlay";
import { AiChatModeType } from "../services/aiChatApi";

interface AiChatOverlayProps {
    visible: boolean;
    onClose: () => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const OVERLAY_HEIGHT = SCREEN_HEIGHT * 0.8;

const MODES: { id: AiChatModeType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { id: "COURSE_ONLY", label: "Chỉ Giáo Trình", icon: "book" },
    { id: "COURSE_FIRST", label: "Ưu Tiên Giáo Trình", icon: "school" },
    { id: "GENERAL", label: "Chung", icon: "chatbubbles" },
];

export const AiChatOverlay: React.FC<AiChatOverlayProps> = ({ visible, onClose }) => {
    const insets = useSafeAreaInsets();
    const flatListRef = useRef<FlatList>(null);
    const [speakingId, setSpeakingId] = useState<string | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const {
        selectedSessionId,
        setSelectedSessionId,
        inputText,
        setInputText,
        showSessionsDrawer,
        setShowSessionsDrawer,
        keyboardHeight,
        pendingMessage,
        actionSession,
        setActionSession,
        showRenameModal,
        setShowRenameModal,
        renameTitleInput,
        setRenameTitleInput,
        activeMode,
        handleChangeMode,
        errorModal,
        setErrorModal,
        screenContext,

        isListening,
        isTranscribing,
        transcript,
        startListening,
        stopListening,
        forceStopImmediate,

        isLoadingSessions,
        isUpdatingTitle,
        isLoadingMessages,
        isSending,

        sessions,
        displayMessages,

        handleCreateNewSession,
        handleLongPressSession,
        handleOpenRename,
        handleSaveRename,
        handleConfirmDelete,
        handleSend,
    } = useAiChatOverlay({ visible });

    const speakingIdRef = useRef<string | null>(null);

    const updateSpeakingId = (id: string | null) => {
        speakingIdRef.current = id;
        setSpeakingId(id);
    };

    useEffect(() => {
        if (!visible) {
            Speech.stop();
            updateSpeakingId(null);
        }
    }, [visible]);

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

    const handleCopy = (content: string, id: string) => {
        Clipboard.setString(content);
        setCopiedId(id);
        setTimeout(() => {
            setCopiedId((prev) => (prev === id ? null : prev));
        }, 2000);
    };

    const handleSpeak = (content: string, id: string) => {
        if (speakingIdRef.current === id) {
            Speech.stop();
            updateSpeakingId(null);
        } else {
            Speech.stop();
            updateSpeakingId(id);
            const plainText = stripMarkdown(content);
            Speech.speak(plainText, {
                language: "vi-VN",
                onDone: () => {
                    if (speakingIdRef.current === id) {
                        updateSpeakingId(null);
                    }
                },
                onError: () => {
                    if (speakingIdRef.current === id) {
                        updateSpeakingId(null);
                    }
                },
                onStopped: () => {
                    if (speakingIdRef.current === id) {
                        updateSpeakingId(null);
                    }
                },
            });
        }
    };

    const renderMessageItem = ({ item }: { item: DisplayChatMessage }) => {
        const isUser = item.sender === "user";
        const isSpeaking = speakingId === item.id;
        const isCopied = copiedId === item.id;

        return (
            <View style={[styles.messageBubbleContainer, isUser ? styles.userBubbleAlign : styles.assistantBubbleAlign]}>
                <View style={{ alignItems: isUser ? "flex-end" : "flex-start", width: isUser ? undefined : "100%", maxWidth: isUser ? "80%" : "100%" }}>
                    <View
                        style={[
                            isUser ? [styles.messageBubble, styles.userBubble] : styles.assistantOverlayContainer,
                            item.isError && styles.errorBubble,
                        ]}
                    >
                        {isUser ? (
                            <Text selectable style={[styles.messageText, styles.userMessageText]}>
                                {item.content}
                            </Text>
                        ) : (
                            <AiMarkdownMessage
                                content={item.content}
                                textColor={colors.textPrimary}
                                onCloseOverlay={onClose}
                                selectable
                            />
                        )}
                    </View>

                    {item.isError && (
                        <Pressable style={styles.retryButton} onPress={() => handleSend(item.content)}>
                            <Ionicons name="alert-circle-outline" size={14} color={colors.error} />
                            <Text style={styles.retryText}>Gửi thất bại, chạm để thử lại</Text>
                        </Pressable>
                    )}

                    {!isUser && (
                        <View style={[styles.actionRow, styles.assistantActionRow]}>
                            <Pressable
                                style={styles.actionIconButton}
                                onPress={() => handleCopy(item.content, item.id)}
                            >
                                <Ionicons
                                    name={isCopied ? "checkmark-outline" : "copy-outline"}
                                    size={15}
                                    color={isCopied ? colors.primary : colors.textSecondary}
                                />
                            </Pressable>

                            <Pressable
                                style={styles.actionIconButton}
                                onPress={() => handleSpeak(item.content, item.id)}
                            >
                                <Ionicons
                                    name={isSpeaking ? "stop-circle-outline" : "volume-high-outline"}
                                    size={15}
                                    color={isSpeaking ? colors.primary : colors.textSecondary}
                                />
                            </Pressable>
                        </View>
                    )}
                </View>
            </View>
        );
    };

    return (
        <Modal visible={visible} animationType="slide" transparent statusBarTranslucent onRequestClose={onClose}>
            <View style={styles.modalBackdrop}>
                <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : undefined}
                    style={[styles.overlayContainer, { height: SCREEN_HEIGHT  }]}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <Pressable
                            style={styles.drawerToggleButton}
                            onPress={() => setShowSessionsDrawer(!showSessionsDrawer)}
                        >
                            <Ionicons
                                name={showSessionsDrawer ? "chevron-back-outline" : "menu-outline"}
                                size={24}
                                color={colors.textPrimary}
                            />
                        </Pressable>

                        <View style={styles.headerTitleContainer}>
                            <Text style={styles.headerTitle} numberOfLines={1}>
                                {showSessionsDrawer
                                    ? "Lịch sử trò chuyện"
                                    : sessions.find((s) => s.id === selectedSessionId)?.title || "Trợ lý AI Sử Việt"}
                            </Text>
                            {!showSessionsDrawer && screenContext?.screenName && (
                                <View style={{ flexDirection: "row", alignItems: "center", marginTop: 1 }}>
                                    <Ionicons name="location-sharp" size={11} color={colors.primary} style={{ marginRight: 3 }} />
                                    <Text style={styles.headerSubTitle} numberOfLines={1}>
                                        Đang xem: <Text style={styles.headerSubTitleHighlight}>{screenContext.screenName}</Text>
                                    </Text>
                                </View>
                            )}
                        </View>

                        <Pressable style={styles.newChatHeaderButton} onPress={() => handleCreateNewSession()}>
                            <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
                        </Pressable>

                        <Pressable style={styles.closeButton} onPress={onClose}>
                            <Ionicons name="close-outline" size={26} color={colors.textSecondary} />
                        </Pressable>
                    </View>

                    {/* Mode Selector Sub-header */}
                    {!showSessionsDrawer && (
                        <View style={styles.modeSelectorBar}>
                            {MODES.map((mode) => {
                                const isActive = activeMode === mode.id;
                                return (
                                    <Pressable
                                        key={mode.id}
                                        style={[
                                            styles.modePill,
                                            isActive && styles.modePillActive,
                                        ]}
                                        onPress={() => handleChangeMode(mode.id)}
                                    >
                                        <Ionicons
                                            name={mode.icon}
                                            size={12}
                                            color={isActive ? "#FFF" : colors.textSecondary}
                                            style={{ marginRight: 4 }}
                                        />
                                        <Text
                                            style={[
                                                styles.modePillText,
                                                isActive && styles.modePillTextActive,
                                            ]}
                                        >
                                            {mode.label}
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </View>
                    )}

                    {/* View Switch: Full Sessions List OR Chat View */}
                    {showSessionsDrawer ? (
                        <View style={styles.sessionsListFullContainer}>
                            <View style={styles.drawerHeader}>
                                <Text style={styles.drawerTitle}>Danh sách hội thoại</Text>
                            </View>
                            {isLoadingSessions ? (
                                <ActivityIndicator color={colors.primary} style={{ marginVertical: 20 }} />
                            ) : (
                                <FlatList
                                    data={sessions}
                                    keyExtractor={(s) => s.id}
                                    contentContainerStyle={{ paddingVertical: 8 }}
                                    renderItem={({ item }) => (
                                        <Pressable
                                            style={({ pressed }) => [
                                                styles.sessionItem,
                                                item.id === selectedSessionId && styles.sessionItemActive,
                                                pressed && styles.sessionItemPressed,
                                            ]}
                                            onPress={() => {
                                                setSelectedSessionId(item.id);
                                                setShowSessionsDrawer(false);
                                            }}
                                            onLongPress={() => handleLongPressSession(item)}
                                        >
                                            <View style={{ flex: 1 }}>
                                                <Text
                                                    style={[
                                                        styles.sessionItemText,
                                                        item.id === selectedSessionId && styles.sessionItemTextActive,
                                                    ]}
                                                    numberOfLines={1}
                                                >
                                                    {item.title}
                                                </Text>
                                                <Text style={styles.sessionItemModeText}>
                                                    {item.mode === "COURSE_ONLY"
                                                        ? "Chỉ Giáo Trình"
                                                        : item.mode === "COURSE_FIRST"
                                                        ? "Ưu Tiên Giáo Trình"
                                                        : "Chung"}
                                                </Text>
                                            </View>
                                        </Pressable>
                                    )}
                                />
                            )}
                        </View>
                    ) : (
                        <>
                            {/* Chat Messages */}
                            <View style={styles.messagesContainer}>
                                {isLoadingMessages && displayMessages.length === 0 ? (
                                    <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
                                ) : displayMessages.length === 0 ? (
                                    <View style={styles.emptyContainer}>
                                        <View style={styles.emptyMascotCircle}>
                                            <MascotRotator size={42} />
                                            <TwinklingStars mode="fab" />
                                        </View>
                                        <Text style={styles.emptyTitle}>Xin chào! Tôi có thể giúp gì cho bạn?</Text>
                                        <Text style={styles.emptySub}>
                                            Hỏi bất kỳ điều gì về lịch sử Việt Nam, mốc thời gian, nhân vật hoặc bài học!
                                        </Text>
                                    </View>
                                ) : (
                                    <FlatList
                                        ref={flatListRef}
                                        data={displayMessages}
                                        keyExtractor={(m) => m.id}
                                        renderItem={renderMessageItem}
                                        contentContainerStyle={{ paddingVertical: 12, paddingHorizontal: 16 }}
                                        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                                        ListFooterComponent={
                                            pendingMessage?.status === "sending" ? <AiSkeletonBubble /> : null
                                        }
                                    />
                                )}
                            </View>

                            {/* Input Bar & Disclaimer */}
                            <View
                                style={[
                                    styles.bottomContainer,
                                    {
                                        paddingBottom:
                                            Math.max(insets.bottom + 4, 8) +
                                            (Platform.OS === "android" ? keyboardHeight : 0),
                                    },
                                ]}
                            >
                                <View style={styles.inputContainer}>
                                    {isListening || isTranscribing ? (
                                        <VibratingVoiceInput
                                            isTranscribing={isTranscribing}
                                            transcript={transcript}
                                        />
                                    ) : (
                                        <TextInput
                                            style={styles.textInput}
                                            placeholder={
                                                activeMode === "COURSE_ONLY"
                                                    ? "Hỏi về giáo trình bài học..."
                                                    : activeMode === "COURSE_FIRST"
                                                    ? "Hỏi ưu tiên giáo trình..."
                                                    : "Nhập câu hỏi..."
                                            }
                                            placeholderTextColor={colors.textPlaceholder}
                                            value={inputText}
                                            onChangeText={setInputText}
                                            multiline
                                            maxLength={1000}
                                        />
                                    )}
                                    <Pressable
                                        style={[
                                            styles.micButton,
                                            isListening && styles.micButtonActive,
                                        ]}
                                        onPress={isListening ? stopListening : startListening}
                                        disabled={isTranscribing}
                                    >
                                        <Ionicons
                                            name={isListening ? "square" : "mic"}
                                            size={18}
                                            color={isListening ? colors.error : colors.primary}
                                        />
                                    </Pressable>
                                    <Pressable
                                        style={[
                                            styles.sendButton,
                                            (!inputText.trim() && !isListening && !transcript.trim() || pendingMessage?.status === "sending") &&
                                                styles.sendButtonDisabled,
                                        ]}
                                        onPress={() => {
                                            if (isListening) {
                                                const textFromVoice = forceStopImmediate();
                                                const textToSend = [inputText, textFromVoice].filter(Boolean).join(" ");
                                                if (textToSend.trim()) {
                                                    handleSend(textToSend);
                                                }
                                            } else {
                                                handleSend();
                                            }
                                        }}
                                        disabled={
                                            (!inputText.trim() && !isListening && !transcript.trim()) ||
                                            pendingMessage?.status === "sending"
                                        }
                                    >
                                        <Ionicons name="arrow-up" size={20} color="#FFF" />
                                    </Pressable>
                                </View>
                                <Text style={styles.disclaimerText}>
                                    AI có thể mắc sai lầm. Hãy kiểm tra các thông tin quan trọng.
                                </Text>
                            </View>
                        </>
                    )}
                </KeyboardAvoidingView>
            </View>

            {/* Session Action Options Modal (Long Press) */}
            <Modal
                visible={!!actionSession && !showRenameModal}
                transparent
                animationType="fade"
                onRequestClose={() => setActionSession(null)}
            >
                <View style={styles.actionModalBackdrop}>
                    <Pressable style={StyleSheet.absoluteFill} onPress={() => setActionSession(null)} />
                    <View style={styles.actionModalContainer}>
                        <Text style={styles.actionModalTitle} numberOfLines={1}>
                            {actionSession?.title}
                        </Text>
                        <Pressable style={styles.actionOptionRow} onPress={handleOpenRename}>
                            <Ionicons name="pencil-outline" size={20} color={colors.textPrimary} style={{ marginRight: 12 }} />
                            <Text style={styles.actionOptionText}>Đổi tên</Text>
                        </Pressable>
                        <View style={styles.actionOptionDivider} />
                        <Pressable style={styles.actionOptionRow} onPress={handleConfirmDelete}>
                            <Ionicons name="trash-outline" size={20} color={colors.error} style={{ marginRight: 12 }} />
                            <Text style={[styles.actionOptionText, { color: colors.error }]}>Xóa hội thoại</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>

            {/* Rename Session Title Modal */}
            <Modal
                visible={showRenameModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowRenameModal(false)}
            >
                <View style={styles.actionModalBackdrop}>
                    <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowRenameModal(false)} />
                    <View style={styles.renameModalContainer}>
                        <Text style={styles.renameModalTitle}>Đổi tên cuộc trò chuyện</Text>
                        <TextInput
                            style={styles.renameInput}
                            value={renameTitleInput}
                            onChangeText={setRenameTitleInput}
                            placeholder="Nhập tên mới..."
                            placeholderTextColor={colors.textPlaceholder}
                            autoFocus
                            maxLength={100}
                        />
                        <View style={styles.renameButtonRow}>
                            <Pressable
                                style={styles.renameCancelBtn}
                                onPress={() => {
                                    setShowRenameModal(false);
                                    setActionSession(null);
                                }}
                            >
                                <Text style={styles.renameCancelText}>Hủy</Text>
                            </Pressable>
                            <Pressable
                                style={[
                                    styles.renameSaveBtn,
                                    (!renameTitleInput.trim() || isUpdatingTitle) && styles.renameSaveBtnDisabled,
                                ]}
                                onPress={handleSaveRename}
                                disabled={!renameTitleInput.trim() || isUpdatingTitle}
                            >
                                {isUpdatingTitle ? (
                                    <ActivityIndicator size="small" color="#FFF" />
                                ) : (
                                    <Text style={styles.renameSaveText}>Lưu</Text>
                                )}
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Error Notification Modal */}
            <CustomModal
                visible={errorModal.visible}
                title={errorModal.title}
                message={errorModal.message}
                confirmText="Đồng ý"
                onConfirm={() => setErrorModal((prev) => ({ ...prev, visible: false }))}
                showMascot
                mascotExpression="sad"
            />
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalBackdrop: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.4)",
        justifyContent: "flex-end",
    },
    overlayContainer: {
        height: OVERLAY_HEIGHT,
        backgroundColor: colors.background,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.surfaceVariant,
        backgroundColor: colors.surface,
    },
    drawerToggleButton: {
        padding: 4,
        marginRight: 8,
    },
    headerTitleContainer: {
        flex: 1,
        justifyContent: "center",
    },
    headerTitle: {
        fontSize: 15,
        fontWeight: "600",
        color: colors.textPrimary,
    },
    headerSubTitle: {
        fontSize: 11,
        color: colors.textMuted,
        marginTop: 1,
    },
    headerSubTitleHighlight: {
        fontWeight: "600",
        color: colors.primary,
    },
    newChatHeaderButton: {
        padding: 4,
        marginRight: 8,
    },
    closeButton: {
        padding: 4,
    },
    modeSelectorBar: {
        flexDirection: "row",
        backgroundColor: colors.surfaceVariant,
        paddingHorizontal: 12,
        paddingVertical: 6,
        gap: 6,
        justifyContent: "center",
    },
    modePill: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 30,
        backgroundColor: colors.surface,
    },
    modePillActive: {
        backgroundColor: colors.primary,
    },
    modePillText: {
        fontSize: 11,
        fontWeight: "600",
        color: colors.textSecondary,
    },
    modePillTextActive: {
        color: "#FFF",
    },
    sessionsListFullContainer: {
        flex: 1,
        backgroundColor: colors.surface,
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    drawerHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    drawerTitle: {
        fontSize: 14,
        fontWeight: "600",
        color: colors.textSecondary,
    },
    sessionItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderRadius: 12, // container border radius = 12
        overflow: "hidden",
    },
    sessionItemActive: {
        backgroundColor: colors.primaryContainer,
    },
    sessionItemPressed: {
        backgroundColor: colors.surfaceVariant,
        opacity: 0.75,
    },
    sessionItemText: {
        fontSize: 14,
        color: colors.textPrimary,
    },
    sessionItemTextActive: {
        color: colors.primary,
        fontWeight: "600",
    },
    sessionItemModeText: {
        fontSize: 11,
        color: colors.textMuted,
        marginTop: 2,
    },
    messagesContainer: {
        flex: 1,
        backgroundColor: colors.background,
    },
    emptyContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 32,
    },
    emptyMascotCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        borderWidth: 2,
        borderColor: "#FFF",
        backgroundColor: colors.primary,
        justifyContent: "center",
        alignItems: "center",
        overflow: "visible",
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: colors.textPrimary,
        marginTop: 16,
        textAlign: "center",
    },
    emptySub: {
        fontSize: 13,
        color: colors.textMuted,
        marginTop: 8,
        textAlign: "center",
        lineHeight: 18,
    },
    contextBadge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.primaryContainer,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 30,
        marginTop: 12,
    },
    contextBadgeText: {
        fontSize: 11,
        color: colors.primary,
        fontWeight: "600",
    },
    messageBubbleContainer: {
        flexDirection: "row",
        marginVertical: 6,
        alignItems: "flex-end",
    },
    userBubbleAlign: {
        justifyContent: "flex-end",
    },
    assistantBubbleAlign: {
        justifyContent: "flex-start",
    },
    messageBubble: {
        maxWidth: "100%",
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 12,
    },
    userBubble: {
        backgroundColor: colors.primary,
        borderBottomRightRadius: 4,
    },
    assistantOverlayContainer: {
        width: "100%",
        paddingVertical: 4,
        paddingHorizontal: 4,
    },
    messageText: {
        fontSize: 14,
        lineHeight: 20,
    },
    userMessageText: {
        color: "#FFF",
    },
    errorBubble: {
        backgroundColor: colors.errorContainer,
        borderColor: colors.error,
        borderWidth: 1,
        borderRadius: 12,
    },
    retryButton: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 4,
        paddingHorizontal: 4,
    },
    retryText: {
        fontSize: 11,
        color: colors.error,
        marginLeft: 4,
    },
    actionRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 4,
        gap: 8,
    },
    userActionRow: {
        justifyContent: "flex-end",
    },
    assistantActionRow: {
        justifyContent: "flex-start",
    },
    actionIconButton: {
        width: 30,
        height: 30,
        borderRadius: 15,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.surfaceVariant,
    },
    bottomContainer: {
        backgroundColor: colors.surface,
        borderTopWidth: 1,
        borderTopColor: colors.surfaceVariant,
        paddingBottom: 4,
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingTop: 8,
        paddingBottom: 4,
    },
    textInput: {
        flex: 1,
        maxHeight: 100,
        minHeight: 40,
        backgroundColor: colors.inputBackground,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 10,
        fontSize: 14,
        color: colors.textPrimary,
    },
    micButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.surfaceVariant,
        alignItems: "center",
        justifyContent: "center",
        marginLeft: 8,
    },
    micButtonActive: {
        backgroundColor: colors.errorContainer,
    },
    sendButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.primary,
        alignItems: "center",
        justifyContent: "center",
        marginLeft: 8,
    },
    sendButtonDisabled: {
        backgroundColor: colors.textPlaceholder,
    },
    disclaimerText: {
        fontSize: 11,
        color: colors.textMuted,
        textAlign: "center",
        paddingVertical: 4,
    },
    actionModalBackdrop: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.4)",
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 24,
    },
    actionModalContainer: {
        width: "100%",
        backgroundColor: colors.surface,
        borderRadius: 12,
        paddingVertical: 16,
        paddingHorizontal: 16,
    },
    actionModalTitle: {
        fontSize: 15,
        fontWeight: "600",
        color: colors.textPrimary,
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    actionOptionRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderRadius: 8,
    },
    actionOptionText: {
        fontSize: 15,
        color: colors.textPrimary,
        fontWeight: "500",
    },
    actionOptionDivider: {
        height: 1,
        backgroundColor: colors.surfaceVariant,
        marginVertical: 4,
    },
    renameModalContainer: {
        width: "100%",
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 20,
    },
    renameModalTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: colors.textPrimary,
        marginBottom: 14,
    },
    renameInput: {
        backgroundColor: colors.inputBackground,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 10,
        fontSize: 14,
        color: colors.textPrimary,
        marginBottom: 18,
    },
    renameButtonRow: {
        flexDirection: "row",
        justifyContent: "flex-end",
        alignItems: "center",
    },
    renameCancelBtn: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 30,
        marginRight: 8,
    },
    renameCancelText: {
        fontSize: 14,
        fontWeight: "600",
        color: colors.textMuted,
    },
    renameSaveBtn: {
        backgroundColor: colors.primary,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 30,
    },
    renameSaveBtnDisabled: {
        backgroundColor: colors.textPlaceholder,
    },
    renameSaveText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#FFF",
    },
});
