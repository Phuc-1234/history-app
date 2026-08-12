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
    AiModelTierType,
} from "../services/aiChatApi";
import { useVoiceInput } from "./useVoiceInput";
import { useScreenContext } from "./useScreenContext";

export interface DisplayChatMessage extends AiChatMessageDto {
    isPending?: boolean;
    isError?: boolean;
    isQuotaExceeded?: boolean;
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
        sessionId?: string | null;
        content: string;
        status: "sending" | "error" | "quota_exceeded";
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
        if (pendingMessage && pendingMessage.sessionId !== undefined && pendingMessage.sessionId !== selectedSessionId) {
            setPendingMessage(null);
        }
    }, [selectedSessionId, pendingMessage]);

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
    const [selectedModelTier, setSelectedModelTier] = useState<AiModelTierType>("MEDIUM");
    const [actionSession, setActionSession] = useState<AiChatSessionDto | null>(null);
    const [showRenameModal, setShowRenameModal] = useState(false);
    const [renameTitleInput, setRenameTitleInput] = useState("");
    const hasInitializedSessionRef = useRef(false);

    const { data: sessionsData, isLoading: isLoadingSessions, isFetching: isFetchingSessions } = useListSessionsQuery(undefined, { skip: !visible });
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
    const messages = selectedSessionId ? messagesData?.messages || [] : [];

    // Sync selectedMode and selectedModelTier with activeSession when session changes
    useEffect(() => {
        if (activeSession?.mode) {
            setSelectedMode(activeSession.mode);
        }
        if (activeSession?.modelTier) {
            setSelectedModelTier(activeSession.modelTier);
        }
    }, [activeSession?.mode, activeSession?.modelTier, selectedSessionId]);

    // Reset selectedSessionId if active session is deleted or session list becomes empty
    useEffect(() => {
        if (isLoadingSessions || isFetchingSessions || isSending || isCreatingSession) return;
        if (selectedSessionId && sessions.length > 0 && !activeSession && !pendingMessage) {
            setSelectedSessionId(sessions[0].id);
        } else if (sessions.length === 0 && selectedSessionId && !pendingMessage) {
            setSelectedSessionId(null);
        }
    }, [sessions, selectedSessionId, activeSession, isLoadingSessions, isFetchingSessions, isSending, pendingMessage, isCreatingSession]);

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
                      isQuotaExceeded: pendingMessage.status === "quota_exceeded",
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

    const handleCreateNewSession = useCallback((mode?: AiChatModeType, modelTier?: AiModelTierType) => {
        setSelectedSessionId(null);
        setSelectedMode(mode || "GENERAL");
        setSelectedModelTier(modelTier || "MEDIUM");
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

    const handleChangeModelTier = useCallback(async (newTier: AiModelTierType) => {
        setSelectedModelTier(newTier);
        if (!selectedSessionId) return;
        try {
            await updateSession({ sessionId: selectedSessionId, modelTier: newTier }).unwrap();
        } catch (err) {
            console.error("Failed to update model tier:", err);
            setErrorModal({
                visible: true,
                title: "Lỗi cập nhật",
                message: "Không thể thay đổi cấp độ AI. Vui lòng kiểm tra lại kết nối.",
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

        if (!contentToSend) {
            setInputText("");
        }

        const tempId = `temp-user-${Date.now()}`;
        let activeSessionId = selectedSessionId;

        setPendingMessage({ id: tempId, sessionId: activeSessionId, content: text, status: "sending" });

        if (!activeSessionId) {
            try {
                const res = await createSession({ mode: selectedMode, modelTier: selectedModelTier }).unwrap();
                activeSessionId = res.session.id;
                setSelectedSessionId(activeSessionId);
                setPendingMessage((prev) => (prev ? { ...prev, sessionId: activeSessionId } : null));
            } catch (err) {
                console.error("Failed to create session on first send:", err);
                setPendingMessage(null);
                return;
            }
        }

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
                setPendingMessage({ id: tempId, sessionId: activeSessionId, content: text, status: "quota_exceeded" });
            } else {
                setPendingMessage({ id: tempId, sessionId: activeSessionId, content: text, status: "error" });
            }
        }
    }, [inputText, isSending, pendingMessage, selectedSessionId, selectedMode, selectedModelTier, createSession, sendMessage, screenContext]);

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
        activeModelTier: selectedModelTier,
        handleChangeModelTier,
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
