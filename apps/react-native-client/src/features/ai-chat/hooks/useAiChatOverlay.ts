import { useState, useEffect, useCallback } from "react";
import { Platform, Keyboard } from "react-native";
import {
    useListSessionsQuery,
    useCreateSessionMutation,
    useDeleteSessionMutation,
    useUpdateSessionMutation,
    useGetSessionMessagesQuery,
    useSendMessageMutation,
    AiChatMessageDto,
    AiChatSessionDto,
    AiChatModeType,
} from "../services/aiChatApi";
import { useVoiceInput } from "./useVoiceInput";
import { useScreenContext } from "./useScreenContext";

export interface DisplayChatMessage extends AiChatMessageDto {
    isPending?: boolean;
    isError?: boolean;
}

interface UseAiChatOverlayOptions {
    visible: boolean;
}

export function useAiChatOverlay({ visible }: UseAiChatOverlayOptions) {
    const screenContext = useScreenContext();
    const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
    const [inputText, setInputText] = useState("");
    const [showSessionsDrawer, setShowSessionsDrawer] = useState(false);
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const [pendingMessage, setPendingMessage] = useState<{
        id: string;
        content: string;
        status: "sending" | "error";
    } | null>(null);

    const {
        isListening,
        isTranscribing,
        transcript,
        startListening,
        stopListening,
        forceStopImmediate,
    } = useVoiceInput({
        onTranscriptComplete: (text) => {
            if (text) {
                setInputText((prev) => (prev ? `${prev} ${text}` : text));
            }
        },
    });

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

    const [actionSession, setActionSession] = useState<AiChatSessionDto | null>(null);
    const [showRenameModal, setShowRenameModal] = useState(false);
    const [renameTitleInput, setRenameTitleInput] = useState("");

    const { data: sessionsData, isLoading: isLoadingSessions } = useListSessionsQuery(undefined, { skip: !visible });
    const [createSession, { isLoading: isCreatingSession }] = useCreateSessionMutation();
    const [deleteSession] = useDeleteSessionMutation();
    const [updateSession, { isLoading: isUpdatingSession }] = useUpdateSessionMutation();

    const { data: messagesData, isLoading: isLoadingMessages } = useGetSessionMessagesQuery(
        selectedSessionId!,
        { skip: !selectedSessionId || !visible }
    );

    const [sendMessage, { isLoading: isSending }] = useSendMessageMutation();

    const sessions = sessionsData?.sessions || [];
    const messages = messagesData?.messages || [];
    const activeSession = sessions.find((s) => s.id === selectedSessionId);
    const activeMode: AiChatModeType = activeSession?.mode || "GENERAL";

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

    const handleCreateNewSession = useCallback(async (mode?: AiChatModeType) => {
        try {
            const res = await createSession({ mode: mode || activeMode }).unwrap();
            setSelectedSessionId(res.session.id);
            setShowSessionsDrawer(false);
        } catch (err) {
            console.error("Failed to create chat session:", err);
        }
    }, [createSession, activeMode]);

    const [errorModal, setErrorModal] = useState<{
        visible: boolean;
        title: string;
        message: string;
    }>({ visible: false, title: "", message: "" });

    const handleChangeMode = useCallback(async (newMode: AiChatModeType) => {
        if (!selectedSessionId) return;
        try {
            await updateSession({ sessionId: selectedSessionId, mode: newMode }).unwrap();
        } catch (err) {
            console.error("Failed to update chat mode:", err);
            setErrorModal({
                visible: true,
                title: "Lỗi cập nhật",
                message: "Không thể thay đổi chế độ trò chuyện. Vui lòng kiểm tra lại kết nối.",
            });
        }
    }, [selectedSessionId, updateSession]);

    const handleDeleteSession = useCallback(async (id: string) => {
        try {
            await deleteSession(id).unwrap();
            if (selectedSessionId === id) {
                const remaining = sessions.filter((s) => s.id !== id);
                setSelectedSessionId(remaining.length > 0 ? remaining[0].id : null);
            }
        } catch (err) {
            console.error("Failed to delete session:", err);
        }
    }, [deleteSession, selectedSessionId, sessions]);

    const handleLongPressSession = useCallback((session: AiChatSessionDto) => {
        setActionSession(session);
    }, []);

    const handleOpenRename = useCallback(() => {
        if (actionSession) {
            setRenameTitleInput(actionSession.title);
            setShowRenameModal(true);
        }
    }, [actionSession]);

    const handleSaveRename = useCallback(async () => {
        if (!actionSession || !renameTitleInput.trim()) return;
        try {
            await updateSession({ sessionId: actionSession.id, title: renameTitleInput.trim() }).unwrap();
            setShowRenameModal(false);
            setActionSession(null);
        } catch (err) {
            console.error("Failed to rename session:", err);
        }
    }, [actionSession, renameTitleInput, updateSession]);

    const handleConfirmDelete = useCallback(async () => {
        if (!actionSession) return;
        const idToDelete = actionSession.id;
        setActionSession(null);
        await handleDeleteSession(idToDelete);
    }, [actionSession, handleDeleteSession]);

    const handleSend = useCallback(async (contentToSend?: string) => {
        const text = (contentToSend || inputText).trim();
        if (!text || (isSending && pendingMessage?.status === "sending")) return;

        let activeSessionId = selectedSessionId;
        if (!activeSessionId) {
            try {
                const res = await createSession({ mode: "GENERAL" }).unwrap();
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
            await sendMessage({
                sessionId: activeSessionId,
                content: text,
                screenContext,
            }).unwrap();
            setPendingMessage(null);
        } catch (err) {
            console.error("Failed to send message:", err);
            setPendingMessage({ id: tempId, content: text, status: "error" });
        }
    }, [inputText, isSending, pendingMessage, selectedSessionId, createSession, sendMessage, screenContext]);

    return {
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
        isUpdatingTitle: isUpdatingSession,
        isLoadingMessages,
        isSending,

        sessions,
        displayMessages,

        handleCreateNewSession,
        handleDeleteSession,
        handleLongPressSession,
        handleOpenRename,
        handleSaveRename,
        handleConfirmDelete,
        handleSend,
    };
}
