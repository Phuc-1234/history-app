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
} from "react-native";
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

interface AiChatOverlayProps {
    visible: boolean;
    onClose: () => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const OVERLAY_HEIGHT = SCREEN_HEIGHT * 0.8;

export const AiChatOverlay: React.FC<AiChatOverlayProps> = ({ visible, onClose }) => {
    const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
    const [inputText, setInputText] = useState("");
    const [showSessionsDrawer, setShowSessionsDrawer] = useState(false);

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

    const handleSend = async () => {
        const text = inputText.trim();
        if (!text || isSending) return;

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

        setInputText("");
        try {
            await sendMessage({ sessionId: activeSessionId, content: text }).unwrap();
        } catch (err) {
            console.error("Failed to send message:", err);
        }
    };

    const renderMessageItem = ({ item }: { item: AiChatMessageDto }) => {
        const isUser = item.sender === "user";
        return (
            <View style={[styles.messageBubbleContainer, isUser ? styles.userBubbleAlign : styles.assistantBubbleAlign]}>
                {!isUser && (
                    <View style={styles.aiAvatar}>
                        <Ionicons name="sparkles" size={14} color="#FFF" />
                    </View>
                )}
                <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.assistantBubble]}>
                    <Text style={[styles.messageText, isUser ? styles.userMessageText : styles.assistantMessageText]}>
                        {item.content}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <View style={styles.modalBackdrop}>
                <Pressable style={styles.backdropDismiss} onPress={onClose} />
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : undefined}
                    style={styles.overlayContainer}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <Pressable
                            style={styles.drawerToggleButton}
                            onPress={() => setShowSessionsDrawer(!showSessionsDrawer)}
                        >
                            <Ionicons name="menu-outline" size={24} color={colors.textPrimary} />
                        </Pressable>

                        <Text style={styles.headerTitle} numberOfLines={1}>
                            {sessions.find((s) => s.id === selectedSessionId)?.title || "Trợ lý AI Sử Việt"}
                        </Text>

                        <Pressable style={styles.newChatHeaderButton} onPress={handleCreateNewSession}>
                            <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
                        </Pressable>

                        <Pressable style={styles.closeButton} onPress={onClose}>
                            <Ionicons name="close-outline" size={26} color={colors.textSecondary} />
                        </Pressable>
                    </View>

                    {/* Session List Drawer (Dropdown Overlay) */}
                    {showSessionsDrawer && (
                        <View style={styles.sessionsDrawerContainer}>
                            <View style={styles.drawerHeader}>
                                <Text style={styles.drawerTitle}>Lịch sử trò chuyện</Text>
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
                                    style={{ maxHeight: 200 }}
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
                    )}

                    {/* Chat Messages */}
                    <View style={styles.messagesContainer}>
                        {isLoadingMessages && messages.length === 0 ? (
                            <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
                        ) : messages.length === 0 ? (
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
                                data={messages}
                                keyExtractor={(m) => m.id}
                                renderItem={renderMessageItem}
                                contentContainerStyle={{ paddingVertical: 12, paddingHorizontal: 16 }}
                                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                            />
                        )}
                        {isSending && (
                            <View style={styles.sendingIndicator}>
                                <ActivityIndicator size="small" color={colors.primary} />
                                <Text style={styles.sendingText}>AI đang trả lời...</Text>
                            </View>
                        )}
                    </View>

                    {/* Input Bar */}
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
                                (!inputText.trim() || isSending) && styles.sendButtonDisabled,
                            ]}
                            onPress={handleSend}
                            disabled={!inputText.trim() || isSending}
                        >
                            <Ionicons name="arrow-up" size={20} color="#FFF" />
                        </Pressable>
                    </View>
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
    sessionsDrawerContainer: {
        backgroundColor: colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: colors.surfaceVariant,
        paddingHorizontal: 16,
        paddingVertical: 10,
        zIndex: 10,
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
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 16,
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
        paddingVertical: 10,
        paddingHorizontal: 8,
        borderRadius: 8,
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
    sendingIndicator: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    sendingText: {
        fontSize: 12,
        color: colors.textMuted,
        marginLeft: 8,
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: colors.surface,
        borderTopWidth: 1,
        borderTopColor: colors.surfaceVariant,
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
});
