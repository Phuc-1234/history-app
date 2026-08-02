import { useState, useEffect, useCallback, useRef } from "react";
import { Platform, Keyboard } from "react-native";
import {
    useGetUserQuotaQuery,
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
    const [showPremiumModal, setShowPremiumModal] = useState(false);

    const { data: quotaData, isLoading: isLoadingQuota } = useGetUserQuotaQuery(undefined, { skip: !visible });

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

    const [selectedMode, setSelectedMode] = useState<AiChatModeType>("GENERAL");
    const [actionSession, setActionSession] = useState<AiChatSessionDto | null>(null);
    const [showRenameModal, setShowRenameModal] = useState(false);
    const [renameTitleInput, setRenameTitleInput] = useState("");
    const hasInitializedSessionRef = useRef(false);

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
    const activeSession = sessions.find((s) => s.id === selectedSessionId);
    const messages = selectedSessionId && activeSession ? messagesData?.messages || [] : [];

    // Sync selectedMode with activeSession mode when session changes
    useEffect(() => {
        if (activeSession?.mode) {
            setSelectedMode(activeSession.mode);
        }
    }, [activeSession?.mode, selectedSessionId]);

    // Reset selectedSessionId if active session is deleted or session list becomes empty
    useEffect(() => {
        if (selectedSessionId && sessions.length > 0 && !activeSession) {
            setSelectedSessionId(sessions[0].id);
        } else if (sessions.length === 0 && selectedSessionId) {
            setSelectedSessionId(null);
        }
    }, [sessions, selectedSessionId, activeSession]);

    const displayMessages: DisplayChatMessage[] = [
        ...messages,
        ...(pendingMessage
            ? [
                  {
                      id: pendingMessage.id,
                      sessionId: selectedSessionId || "temp-session",
                      sender: "user" as const,
                      content: pendingMessage.content,
                      createdAt: new Date().toISOString(),
                      isPending: pendingMessage.status === "sending",
                      isError: pendingMessage.status === "error",
                  },
              ]
            : []),
    ];

    // Reset init flag when modal closes
    useEffect(() => {
        if (!visible) {
            hasInitializedSessionRef.current = false;
        }
    }, [visible]);

    // Auto-select latest session when opened for the first time
    useEffect(() => {
        if (visible && !hasInitializedSessionRef.current && sessions.length > 0 && !selectedSessionId) {
            setSelectedSessionId(sessions[0].id);
            hasInitializedSessionRef.current = true;
        }
    }, [visible, sessions, selectedSessionId]);

    const handleCreateNewSession = useCallback((mode?: AiChatModeType) => {
        setSelectedSessionId(null);
        setSelectedMode(mode || "GENERAL");
        setShowSessionsDrawer(false);
    }, []);

    const [errorModal, setErrorModal] = useState<{
        visible: boolean;
        title: string;
        message: string;
    }>({ visible: false, title: "", message: "" });

    const handleChangeMode = useCallback(async (newMode: AiChatModeType) => {
        setSelectedMode(newMode);
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
                const res = await createSession({ mode: selectedMode }).unwrap();
                activeSessionId = res.session.id;
                setSelectedSessionId(activeSessionId);
            } catch (err) {
                console.error("Failed to create session on first send:", err);
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
        } catch (err: any) {
            console.error("Failed to send message:", err);
            if (err?.status === 429 || err?.data?.error === "QUOTA_EXCEEDED" || err?.data?.message?.includes("QUOTA_EXCEEDED")) {
                setShowPremiumModal(true);
            }
            setPendingMessage({ id: tempId, content: text, status: "error" });
        }
    }, [inputText, isSending, pendingMessage, selectedSessionId, selectedMode, createSession, sendMessage, screenContext]);

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
        activeMode: selectedMode,
        handleChangeMode,
        errorModal,
        setErrorModal,
        showPremiumModal,
        setShowPremiumModal,
        screenContext,
        quotaData,
        isLoadingQuota,

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
