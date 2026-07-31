import { useState, useEffect, useCallback } from "react";
import { Platform, Keyboard } from "react-native";
import {
    useListSessionsQuery,
    useCreateSessionMutation,
    useDeleteSessionMutation,
    useUpdateSessionTitleMutation,
    useGetSessionMessagesQuery,
    useSendMessageMutation,
    AiChatMessageDto,
    AiChatSessionDto,
} from "../services/aiChatApi";
import { useVoiceInput } from "./useVoiceInput";

export interface DisplayChatMessage extends AiChatMessageDto {
    isPending?: boolean;
    isError?: boolean;
}

interface UseAiChatOverlayOptions {
    visible: boolean;
}

export function useAiChatOverlay({ visible }: UseAiChatOverlayOptions) {
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
    const [updateSessionTitle, { isLoading: isUpdatingTitle }] = useUpdateSessionTitleMutation();

    const { data: messagesData, isLoading: isLoadingMessages } = useGetSessionMessagesQuery(
        selectedSessionId!,
        { skip: !selectedSessionId || !visible }
    );

    const [sendMessage, { isLoading: isSending }] = useSendMessageMutation();

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

    const handleCreateNewSession = useCallback(async () => {
        try {
            const res = await createSession().unwrap();
            setSelectedSessionId(res.session.id);
            setShowSessionsDrawer(false);
        } catch (err) {
            console.error("Failed to create chat session:", err);
        }
    }, [createSession]);

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
            await updateSessionTitle({ sessionId: actionSession.id, title: renameTitleInput.trim() }).unwrap();
            setShowRenameModal(false);
            setActionSession(null);
        } catch (err) {
            console.error("Failed to rename session:", err);
        }
    }, [actionSession, renameTitleInput, updateSessionTitle]);

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
    }, [inputText, isSending, pendingMessage, selectedSessionId, createSession, sendMessage]);

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
        handleDeleteSession,
        handleLongPressSession,
        handleOpenRename,
        handleSaveRename,
        handleConfirmDelete,
        handleSend,
    };
}
