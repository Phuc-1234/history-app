import React, { useState, useRef, useEffect } from "react";
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
    Keyboard,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/theme/colors";
import {
    useListSessionsQuery,
    useCreateSessionMutation,
    useDeleteSessionMutation,
    useGetSessionMessagesQuery,
    useSendMessageMutation,
    AiChatMessageDto,
} from "../services/aiChatApi";
import { AiSkeletonBubble } from "./AiSkeletonBubble";

interface AiChatOverlayProps {
    visible: boolean;
    onClose: () => void;
}

interface DisplayChatMessage extends AiChatMessageDto {
    isPending?: boolean;
    isError?: boolean;
}

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const OVERLAY_HEIGHT = SCREEN_HEIGHT * 0.8;

export const AiChatOverlay: React.FC<AiChatOverlayProps> = ({ visible, onClose }) => {
    const insets = useSafeAreaInsets();
    const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
    const [inputText, setInputText] = useState("");
    const [showSessionsDrawer, setShowSessionsDrawer] = useState(false);
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const [pendingMessage, setPendingMessage] = useState<{
        id: string;
        content: string;
        status: "sending" | "error";
    } | null>(null);

    useEffect(() => {
        setPendingMessage(null);
    }, [selectedSessionId]);

    useEffect(() => {
        if (Platform.OS === "android") {
            const showSub = Keyboard.addListener("keyboardDidShow", (e) => {
                setKeyboardHeight(e.endCoordinates.height);
            });
            const hideSub = Keyboard.addListener("keyboardDidHide", () => {
                setKeyboardHeight(0);
            });
            return () => {
                showSub.remove();
                hideSub.remove();
            };
        }
    }, []);

    const { data: sessionsData, isLoading: isLoadingSessions } = useListSessionsQuery(undefined, { skip: !visible });
    const [createSession, { isLoading: isCreatingSession }] = useCreateSessionMutation();
    const [deleteSession] = useDeleteSessionMutation();

    const { data: messagesData, isLoading: isLoadingMessages } = useGetSessionMessagesQuery(
        selectedSessionId!,
        { skip: !selectedSessionId || !visible }
    );

    const [sendMessage, { isLoading: isSending }] = useSendMessageMutation();

    const flatListRef = useRef<FlatList>(null);

    const sessions = sessionsData?.sessions || [];
    const messages = messagesData?.messages || [];

    const displayMessages: DisplayChatMessage[] = [
        ...messages,
        ...(pendingMessage && selectedSessionId
            ? [
                  {
                      id: pendingMessage.id,
                      sessionId: selectedSessionId,
                      sender: "user" as const,
                      content: pendingMessage.content,
                      createdAt: new Date().toISOString(),
                      isPending: pendingMessage.status === "sending",
                      isError: pendingMessage.status === "error",
                  },
              ]
            : []),
    ];

    // Auto-select latest session or create one when opened if empty
    useEffect(() => {
        if (visible && sessions.length > 0 && !selectedSessionId) {
            setSelectedSessionId(sessions[0].id);
        }
    }, [visible, sessions, selectedSessionId]);

    const handleCreateNewSession = async () => {
        try {
            const res = await createSession().unwrap();
            setSelectedSessionId(res.session.id);
            setShowSessionsDrawer(false);
        } catch (err) {
            console.error("Failed to create chat session:", err);
        }
    };

    const handleDeleteSession = async (id: string) => {
        try {
            await deleteSession(id).unwrap();
            if (selectedSessionId === id) {
                const remaining = sessions.filter((s) => s.id !== id);
                setSelectedSessionId(remaining.length > 0 ? remaining[0].id : null);
            }
        } catch (err) {
            console.error("Failed to delete session:", err);
        }
    };

    const handleSend = async (contentToSend?: string) => {
        const text = (contentToSend || inputText).trim();
        if (!text || (isSending && pendingMessage?.status === "sending")) return;

        let activeSessionId = selectedSessionId;
        if (!activeSessionId) {
            try {
                const res = await createSession().unwrap();
                activeSessionId = res.session.id;
                setSelectedSessionId(activeSessionId);
            } catch {
                return;
            }
        }

        if (!contentToSend) {
            setInputText("");
        }
        const tempId = `temp-user-${Date.now()}`;
        setPendingMessage({ id: tempId, content: text, status: "sending" });

        try {
            await sendMessage({ sessionId: activeSessionId, content: text }).unwrap();
            setPendingMessage(null);
        } catch (err) {
            console.error("Failed to send message:", err);
            setPendingMessage({ id: tempId, content: text, status: "error" });
        }
    };

    const renderMessageItem = ({ item }: { item: DisplayChatMessage }) => {
        const isUser = item.sender === "user";
        return (
            <View style={[styles.messageBubbleContainer, isUser ? styles.userBubbleAlign : styles.assistantBubbleAlign]}>
                {!isUser && (
                    <View style={styles.aiAvatar}>
                        <Ionicons name="sparkles" size={14} color="#FFF" />
                    </View>
                )}
                <View style={{ alignItems: isUser ? "flex-end" : "flex-start", maxWidth: "80%" }}>
                    <View
                        style={[
                            styles.messageBubble,
                            isUser ? styles.userBubble : styles.assistantBubble,
                            item.isError && styles.errorBubble,
                        ]}
                    >
                        <Text
                            style={[
                                styles.messageText,
                                item.isError
                                    ? styles.errorMessageText
                                    : isUser
                                    ? styles.userMessageText
                                    : styles.assistantMessageText,
                            ]}
                        >
                            {item.content}
                        </Text>
                    </View>
                    {item.isError && (
                        <Pressable style={styles.retryButton} onPress={() => handleSend(item.content)}>
                            <Ionicons name="alert-circle-outline" size={14} color={colors.error} />
                            <Text style={styles.retryText}>Gửi thất bại. Chạm để thử lại</Text>
                        </Pressable>
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
                    style={[styles.overlayContainer, { height: SCREEN_HEIGHT * 0.8 }]}
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

                        <Text style={styles.headerTitle} numberOfLines={1}>
                            {showSessionsDrawer
                                ? "Lịch sử trò chuyện"
                                : sessions.find((s) => s.id === selectedSessionId)?.title || "Trợ lý AI Sử Việt"}
                        </Text>

                        <Pressable style={styles.newChatHeaderButton} onPress={handleCreateNewSession}>
                            <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
                        </Pressable>

                        <Pressable style={styles.closeButton} onPress={onClose}>
                            <Ionicons name="close-outline" size={26} color={colors.textSecondary} />
                        </Pressable>
                    </View>

                    {/* View Switch: Full Sessions List OR Chat View */}
                    {showSessionsDrawer ? (
                        <View style={styles.sessionsListFullContainer}>
                            <View style={styles.drawerHeader}>
                                <Text style={styles.drawerTitle}>Danh sách hội thoại</Text>
                                <Pressable style={styles.addSessionBtn} onPress={handleCreateNewSession}>
                                    <Ionicons name="add" size={18} color="#FFF" />
                                    <Text style={styles.addSessionBtnText}>Tạo mới</Text>
                                </Pressable>
                            </View>
                            {isLoadingSessions ? (
                                <ActivityIndicator color={colors.primary} style={{ marginVertical: 20 }} />
                            ) : (
                                <FlatList
                                    data={sessions}
                                    keyExtractor={(s) => s.id}
                                    contentContainerStyle={{ paddingVertical: 8 }}
                                    renderItem={({ item }) => (
                                        <View
                                            style={[
                                                styles.sessionItem,
                                                item.id === selectedSessionId && styles.sessionItemActive,
                                            ]}
                                        >
                                            <Pressable
                                                style={{ flex: 1 }}
                                                onPress={() => {
                                                    setSelectedSessionId(item.id);
                                                    setShowSessionsDrawer(false);
                                                }}
                                            >
                                                <Text
                                                    style={[
                                                        styles.sessionItemText,
                                                        item.id === selectedSessionId && styles.sessionItemTextActive,
                                                    ]}
                                                    numberOfLines={1}
                                                >
                                                    {item.title}
                                                </Text>
                                            </Pressable>
                                            <Pressable
                                                onPress={() => handleDeleteSession(item.id)}
                                                style={styles.deleteSessionBtn}
                                            >
                                                <Ionicons name="trash-outline" size={16} color={colors.textMuted} />
                                            </Pressable>
                                        </View>
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
                                        <Ionicons name="sparkles-outline" size={48} color={colors.primary} />
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
                                    <TextInput
                                        style={styles.textInput}
                                        placeholder="Nhập câu hỏi..."
                                        placeholderTextColor={colors.textPlaceholder}
                                        value={inputText}
                                        onChangeText={setInputText}
                                        multiline
                                        maxLength={1000}
                                    />
                                    <Pressable
                                        style={[
                                            styles.sendButton,
                                            (!inputText.trim() || pendingMessage?.status === "sending") &&
                                                styles.sendButtonDisabled,
                                        ]}
                                        onPress={() => handleSend()}
                                        disabled={!inputText.trim() || pendingMessage?.status === "sending"}
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
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalBackdrop: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.4)",
        justifyContent: "flex-end",
    },
    backdropDismiss: {
        flex: 1,
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
    headerTitle: {
        flex: 1,
        fontSize: 16,
        fontWeight: "600",
        color: colors.textPrimary,
    },
    newChatHeaderButton: {
        padding: 4,
        marginRight: 8,
    },
    closeButton: {
        padding: 4,
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
    addSessionBtn: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.primary,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 30,
    },
    addSessionBtnText: {
        color: "#FFF",
        fontSize: 12,
        fontWeight: "600",
        marginLeft: 4,
    },
    sessionItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderRadius: 12,
    },
    sessionItemActive: {
        backgroundColor: colors.primaryContainer,
    },
    sessionItemText: {
        fontSize: 14,
        color: colors.textPrimary,
    },
    sessionItemTextActive: {
        color: colors.primary,
        fontWeight: "600",
    },
    deleteSessionBtn: {
        padding: 4,
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
    aiAvatar: {
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: colors.primary,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 8,
        marginBottom: 2,
    },
    messageBubble: {
        maxWidth: "80%",
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 16,
    },
    userBubble: {
        backgroundColor: colors.primary,
        borderBottomRightRadius: 4,
    },
    assistantBubble: {
        backgroundColor: colors.surfaceVariant,
        borderBottomLeftRadius: 4,
    },
    messageText: {
        fontSize: 14,
        lineHeight: 20,
    },
    userMessageText: {
        color: "#FFF",
    },
    assistantMessageText: {
        color: colors.textPrimary,
    },
    errorBubble: {
        backgroundColor: colors.errorContainer,
        borderColor: colors.error,
        borderWidth: 1,
    },
    errorMessageText: {
        color: colors.textError,
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
});
