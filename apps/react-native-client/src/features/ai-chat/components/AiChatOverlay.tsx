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
import { useRouter } from "expo-router";
import * as Speech from "expo-speech";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/theme/colors";
import { typography } from "@/theme/typography";
import { AiSkeletonBubble } from "./AiSkeletonBubble";
import { VibratingVoiceInput } from "./VibratingVoiceInput";
import { AiMarkdownMessage } from "./AiMarkdownMessage";
import { MascotRotator } from "./MascotRotator";
import { TwinklingStars } from "./TwinklingStars";
import { CustomModal } from "@/components/Modal";
import { PremiumModal } from "@/components/PremiumModal";
import { useAiChatOverlay, DisplayChatMessage } from "../hooks/useAiChatOverlay";
import { AiChatModeType, AiModelTierType } from "../services/aiChatApi";

function isEnglishText(text: string): boolean {
    const vietnameseCharRegex = /[àáảãạăắằẳẵặâấầẩẫậđèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵ]/i;
    if (vietnameseCharRegex.test(text)) {
        return false;
    }
    const englishCharRegex = /[a-zA-Z]/;
    return englishCharRegex.test(text);
}

interface AiChatOverlayProps {
    visible: boolean;
    onClose: () => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const OVERLAY_HEIGHT = SCREEN_HEIGHT * 0.8;

const MODES: { id: AiChatModeType; label: string; labelEn: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { id: "COURSE_ONLY", label: "Chỉ Giáo Trình", labelEn: "Course Only", icon: "book" },
    { id: "COURSE_FIRST", label: "Ưu Tiên Giáo Trình", labelEn: "Course First", icon: "school" },
    { id: "GENERAL", label: "Chung", labelEn: "General", icon: "chatbubbles" },
];

const MODEL_TIERS: { id: AiModelTierType; label: string; labelEn: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { id: "LOW", label: "Thấp", labelEn: "Low", icon: "flash-outline" },
    { id: "MEDIUM", label: "Trung bình", labelEn: "Medium", icon: "flash" },
    { id: "HIGH", label: "Cao", labelEn: "High", icon: "sparkles" },
];

export const AiChatOverlay: React.FC<AiChatOverlayProps> = ({ visible, onClose }) => {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const flatListRef = useRef<FlatList>(null);
    const [speakingId, setSpeakingId] = useState<string | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [showModeDropdown, setShowModeDropdown] = useState(false);
    const [showTierDropdown, setShowTierDropdown] = useState(false);
    const [showScreenContextModal, setShowScreenContextModal] = useState(false);

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
        activeModelTier,
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

    const isPro = !!quotaData?.isPro;

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
                language: isEnglishText(plainText) ? "en-US" : "vi-VN",
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
            <View style={{ width: "100%" }}>
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
                                <Text style={styles.retryText}>
                                    Gửi thất bại, chạm để thử lại
                                </Text>
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

                {item.isQuotaExceeded && (
                    <Pressable
                        style={styles.quotaNoteContainer}
                        onPress={() => setShowPremiumModal(true)}
                    >
                        <Text style={styles.quotaNoteText}>
                            Bạn đã dùng hết hạn mức AI Chat hôm nay.
                            {"\n"}
                            <Text style={styles.quotaNoteHighlight}>
                                Nâng cấp PRO
                            </Text>
                        </Text>
                    </Pressable>
                )}
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
                    <View style={[styles.header, isPro && styles.proHeader]}>
                        {isPro && <TwinklingStars mode="header" />}
                        <Pressable
                            style={styles.drawerToggleButton}
                            onPress={() => setShowSessionsDrawer(!showSessionsDrawer)}
                        >
                            <Ionicons
                                name={showSessionsDrawer ? "chevron-back-outline" : "menu-outline"}
                                size={24}
                                color={isPro ? colors.textLight : colors.textPrimary}
                            />
                        </Pressable>

                        <View style={styles.headerTitleContainer}>
                            <Text style={[styles.headerTitle, isPro && styles.proHeaderTitle]} numberOfLines={1}>
                                {showSessionsDrawer
                                    ? "Lịch sử trò chuyện"
                                    : sessions.find((s) => s.id === selectedSessionId)?.title || "Trợ lý AI Sử Việt"}
                            </Text>
                            {!showSessionsDrawer && screenContext?.isSupported && screenContext?.screenName && (
                                <Pressable
                                    style={{ flexDirection: "row", alignItems: "center", marginTop: 1 }}
                                    onPress={() => setShowScreenContextModal(true)}
                                >
                                    <Ionicons name="location-sharp" size={11} color={isPro ? colors.textLight : colors.primary} style={{ marginRight: 3 }} />
                                    <Text style={[styles.headerSubTitle, isPro && styles.proHeaderSubTitle]} numberOfLines={1}>
                                        Đang xem: <Text style={[styles.headerSubTitleHighlight, isPro && styles.proHeaderSubTitleHighlight]}>{screenContext.screenName}</Text>
                                    </Text>
                                </Pressable>
                            )}
                        </View>

                        <Pressable style={styles.newChatHeaderButton} onPress={() => handleCreateNewSession()}>
                            <Ionicons name="add-circle-outline" size={24} color={isPro ? colors.textLight : colors.primary} />
                        </Pressable>

                        <Pressable style={styles.closeButton} onPress={onClose}>
                            <Ionicons name="close-outline" size={26} color={isPro ? colors.textLight : colors.textSecondary} />
                        </Pressable>
                    </View>

                    {/* Mode & Tier Selector Sub-header */}
                    {!showSessionsDrawer && (
                        <View style={styles.subHeaderContainer}>
                            <View style={styles.dropdownHeaderRow}>
                                {(() => {
                                    const currentModeItem = MODES.find((m) => m.id === activeMode) || MODES[2];
                                    const currentTierItem = MODEL_TIERS.find((t) => t.id === activeModelTier) || MODEL_TIERS[0];
                                    return (
                                        <>
                                            <Pressable
                                                style={[styles.dropdownButton, showModeDropdown && styles.dropdownButtonActive]}
                                                onPress={() => {
                                                    setShowModeDropdown((prev) => !prev);
                                                    setShowTierDropdown(false);
                                                }}
                                            >
                                                <View style={{ flexDirection: "row", alignItems: "center", flex: 1, paddingRight: 4 }}>
                                                    <Ionicons name={currentModeItem.icon} size={14} color={colors.primary} style={{ marginRight: 6 }} />
                                                    <Text style={styles.dropdownButtonText} numberOfLines={1}>
                                                        {currentModeItem.label}
                                                    </Text>
                                                </View>
                                                <Ionicons name="chevron-down" size={14} color={colors.textSecondary} />
                                            </Pressable>

                                            <Pressable
                                                style={[styles.dropdownButton, showTierDropdown && styles.dropdownButtonActive]}
                                                onPress={() => {
                                                    setShowTierDropdown((prev) => !prev);
                                                    setShowModeDropdown(false);
                                                }}
                                            >
                                                <View style={{ flexDirection: "row", alignItems: "center", flex: 1, paddingRight: 4 }}>
                                                    <Ionicons name={currentTierItem.icon} size={14} color="#8E24AA" style={{ marginRight: 6 }} />
                                                    <Text style={styles.dropdownButtonText} numberOfLines={1}>
                                                        {currentTierItem.label}
                                                    </Text>
                                                </View>
                                                <Ionicons name="chevron-down" size={14} color={colors.textSecondary} />
                                            </Pressable>
                                        </>
                                    );
                                })()}
                            </View>

                            {/* Floating inline mode dropdown */}
                            {showModeDropdown && (
                                <>
                                    <Pressable
                                        style={styles.inlineDropdownBackdrop}
                                        onPress={() => setShowModeDropdown(false)}
                                    />
                                    <View style={styles.modeInlineDropdownMenu}>
                                        {MODES.map((mode) => {
                                            const isActive = activeMode === mode.id;
                                            return (
                                                <Pressable
                                                    key={mode.id}
                                                    style={[styles.inlineDropdownItem, isActive && styles.inlineDropdownItemActive]}
                                                    onPress={() => {
                                                        handleChangeMode(mode.id);
                                                        setShowModeDropdown(false);
                                                    }}
                                                >
                                                    <Ionicons
                                                        name={mode.icon}
                                                        size={14}
                                                        color={isActive ? colors.primary : colors.textSecondary}
                                                        style={{ marginRight: 8 }}
                                                    />
                                                    <Text style={[styles.inlineDropdownText, isActive && styles.inlineDropdownTextActive]}>
                                                        {mode.label}
                                                    </Text>
                                                    {isActive && <Ionicons name="checkmark" size={14} color={colors.primary} style={{ marginLeft: "auto" }} />}
                                                </Pressable>
                                            );
                                        })}
                                    </View>
                                </>
                            )}

                            {/* Floating inline tier dropdown */}
                            {showTierDropdown && (
                                <>
                                    <Pressable
                                        style={styles.inlineDropdownBackdrop}
                                        onPress={() => setShowTierDropdown(false)}
                                    />
                                    <View style={styles.tierInlineDropdownMenu}>
                                        {MODEL_TIERS.map((tier) => {
                                            const isActive = activeModelTier === tier.id;
                                            return (
                                                <Pressable
                                                    key={tier.id}
                                                    style={[styles.inlineDropdownItem, isActive && styles.inlineDropdownItemActive]}
                                                    onPress={() => {
                                                        handleChangeModelTier(tier.id);
                                                        setShowTierDropdown(false);
                                                    }}
                                                >
                                                    <Ionicons
                                                        name={tier.icon}
                                                        size={14}
                                                        color={isActive ? "#8E24AA" : colors.textSecondary}
                                                        style={{ marginRight: 8 }}
                                                    />
                                                    <Text style={[styles.inlineDropdownText, isActive && styles.inlineDropdownTextActive]}>
                                                        {tier.label}
                                                    </Text>
                                                    {isActive && <Ionicons name="checkmark" size={14} color="#8E24AA" style={{ marginLeft: "auto" }} />}
                                                </Pressable>
                                            );
                                        })}
                                    </View>
                                </>
                            )}
                        </View>
                    )}

                    {/* View Switch: Full Sessions List OR Chat View */}
                    {showSessionsDrawer ? (
                        <View style={styles.sessionsListFullContainer}>
                            {/* Quota Progress Card */}
                            {(() => {
                                const usedRatio = (quotaData?.tokensUsed || 0) / (quotaData?.dailyLimit || 50000);
                                const usedPercent = Math.min(100, Math.round(usedRatio * 100));
                                return (
                                    <>
                                        <View style={styles.quotaCardHeader}>
                                            <View style={{ flexDirection: "row", alignItems: "center" }}>
                                                <Ionicons name="sparkles" size={14} color={colors.primary} style={{ marginRight: 6 }} />
                                                <Text style={styles.quotaCardTitle}>
                                                    Hạn mức AI hôm nay
                                                </Text>
                                            </View>

                                            {quotaData?.isPro ? (
                                                <View style={{ position: "relative" }}>
                                                    <View style={styles.proBadgePill}>
                                                        <Ionicons name="ribbon" size={12} color={colors.textLight} style={{ marginRight: 4 }} />
                                                        <Text style={styles.proBadgeText}>
                                                            PRO (Hạn mức x10)
                                                        </Text>
                                                    </View>
                                                    <TwinklingStars mode="badge" />
                                                </View>
                                            ) : (
                                                <Pressable
                                                    style={styles.upgradeBtnPill}
                                                    onPress={() => {
                                                        onClose();
                                                        router.push("/(10_proflie)/10_8_subscription" as any);
                                                    }}
                                                >
                                                    <Ionicons name="flash" size={12} color={colors.textLight} style={{ marginRight: 4 }} />
                                                    <Text style={styles.upgradeBtnText}>
                                                        Nâng cấp PRO (x10)
                                                    </Text>
                                                </Pressable>
                                            )}
                                        </View>

                                        <View style={styles.quotaProgressTrack}>
                                            <View
                                                style={[
                                                    styles.quotaProgressFill,
                                                    {
                                                        width: `${usedPercent}%`,
                                                        backgroundColor: usedPercent >= 90 ? colors.error : colors.primary,
                                                    },
                                                ]}
                                            />
                                        </View>

                                        <View style={styles.quotaInfoRow}>
                                            <Text style={styles.quotaUsageText}>
                                                Đã dùng {usedPercent}% hạn mức ngày
                                            </Text>
                                        </View>
                                    </>
                                );
                            })()}

                            <View style={styles.divider} />
                            <View style={styles.drawerHeader}>
                                <Text style={styles.drawerTitle}>
                                    Danh sách hội thoại
                                </Text>
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
                                        <Text style={styles.emptyTitle}>
                                            Xin chào! Tôi có thể giúp gì cho bạn?
                                        </Text>
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
                            <Text style={styles.actionOptionText}>
                                Đổi tên
                            </Text>
                        </Pressable>
                        <View style={styles.actionOptionDivider} />
                        <Pressable style={styles.actionOptionRow} onPress={handleConfirmDelete}>
                            <Ionicons name="trash-outline" size={20} color={colors.error} style={{ marginRight: 12 }} />
                            <Text style={[styles.actionOptionText, { color: colors.error }]}>
                                Xóa hội thoại
                            </Text>
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
                        <Text style={styles.renameModalTitle}>
                            Đổi tên cuộc trò chuyện
                        </Text>
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
                                <Text style={styles.renameCancelText}>
                                    Hủy
                                </Text>
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
                                    <Text style={styles.renameSaveText}>
                                        Lưu
                                    </Text>
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

            {/* Quota Exceeded Premium Mascot Modal */}
            <PremiumModal
                visible={showPremiumModal}
                onClose={() => setShowPremiumModal(false)}
                title="Hạn mức AI Chat"
                description="Bạn đã đạt hạn mức AI Chat hôm nay. Nâng cấp PRO để nhận thêm hạn mức cao gấp 10 lần:"
            />

            {/* Screen Context Info Modal */}
            <CustomModal
                visible={showScreenContextModal}
                title="Ngữ cảnh màn hình"
                message={
                    `Đang xem: ${screenContext?.screenName || "Màn hình ứng dụng"}\n\n` +
                    (screenContext?.isSupported
                        ? "AI hỗ trợ đọc và giải đáp trực tiếp nội dung trên màn hình này (Bài học, nút kiến thức, sơ đồ tư duy, thẻ ghi nhớ)."
                        : "Màn hình này hiện chưa hỗ trợ AI đọc nội dung trực tiếp (Bài thi, bảng xếp hạng, cửa hàng, cá nhân,...). AI vẫn sẽ hỗ trợ bạn giải đáp kiến thức lịch sử tổng quan.")
                }
                confirmText="Đã hiểu"
                onConfirm={() => setShowScreenContextModal(false)}
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
        position: "relative",
    },
    proHeader: {
        backgroundColor: colors.primary,
        borderBottomColor: colors.primary,
        overflow: "hidden",
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
        fontFamily: typography.fonts.semiBold,
        fontSize: 15,
        color: colors.textPrimary,
    },
    proHeaderTitle: {
        color: colors.textLight,
    },
    headerSubTitle: {
        fontFamily: typography.fonts.regular,
        fontSize: 11,
        color: colors.textMuted,
        marginTop: 1,
    },
    proHeaderSubTitle: {
        color: "rgba(255, 255, 255, 0.85)",
    },
    headerSubTitleHighlight: {
        fontFamily: typography.fonts.semiBold,
        color: colors.primary,
    },
    proHeaderSubTitleHighlight: {
        color: colors.textLight,
    },
    newChatHeaderButton: {
        padding: 4,
        marginRight: 8,
    },
    closeButton: {
        padding: 4,
    },
    subHeaderContainer: {
        backgroundColor: colors.surfaceVariant,
        paddingHorizontal: 12,
        paddingVertical: 6,
        zIndex: 100,
        position: "relative",
    },
    dropdownHeaderRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    dropdownButton: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: colors.surface,
        paddingHorizontal: 10,
        paddingVertical: 7,
        borderRadius: 30,
        borderWidth: 1,
        borderColor: colors.borderMedium,
    },
    dropdownButtonActive: {
        borderColor: colors.primary,
        backgroundColor: colors.surfaceVariant,
    },
    dropdownButtonText: {
        fontFamily: typography.fonts.semiBold,
        fontSize: 11,
        color: colors.textPrimary,
    },
    inlineDropdownBackdrop: {
        position: "absolute",
        top: -100,
        left: -1000,
        right: -1000,
        bottom: -2000,
        zIndex: 1,
    },
    modeInlineDropdownMenu: {
        position: "absolute",
        top: 44,
        left: 12,
        right: "52%",
        backgroundColor: colors.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.borderMedium,
        paddingVertical: 4,
        paddingHorizontal: 4,
        zIndex: 2,
    },
    tierInlineDropdownMenu: {
        position: "absolute",
        top: 44,
        left: "52%",
        right: 12,
        backgroundColor: colors.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.borderMedium,
        paddingVertical: 4,
        paddingHorizontal: 4,
        zIndex: 2,
    },
    inlineDropdownItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderRadius: 8,
        marginVertical: 1,
    },
    inlineDropdownItemActive: {
        backgroundColor: colors.surfaceVariant,
    },
    inlineDropdownText: {
        fontFamily: typography.fonts.regular,
        fontSize: 12,
        color: colors.textPrimary,
    },
    inlineDropdownTextActive: {
        fontFamily: typography.fonts.semiBold,
        color: colors.textPrimary,
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
        fontFamily: typography.fonts.semiBold,
        fontSize: 14,
        color: colors.textSecondary,
    },
    sessionItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderRadius: 12,
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
        fontFamily: typography.fonts.regular,
        fontSize: 14,
        color: colors.textPrimary,
    },
    sessionItemTextActive: {
        fontFamily: typography.fonts.semiBold,
        color: colors.primary,
    },
    sessionItemModeText: {
        fontFamily: typography.fonts.regular,
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
        borderColor: colors.textLight,
        backgroundColor: colors.primary,
        justifyContent: "center",
        alignItems: "center",
        overflow: "visible",
    },
    emptyTitle: {
        fontFamily: typography.fonts.semiBold,
        fontSize: 16,
        color: colors.textPrimary,
        marginTop: 16,
        textAlign: "center",
    },
    emptySub: {
        fontFamily: typography.fonts.regular,
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
        fontFamily: typography.fonts.semiBold,
        fontSize: 11,
        color: colors.primary,
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
        fontFamily: typography.fonts.regular,
        fontSize: 14,
        lineHeight: 20,
    },
    userMessageText: {
        color: colors.textLight,
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
        fontFamily: typography.fonts.regular,
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
        fontFamily: typography.fonts.regular,
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
        fontFamily: typography.fonts.regular,
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
        fontFamily: typography.fonts.semiBold,
        fontSize: 15,
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
        fontFamily: typography.fonts.medium,
        fontSize: 15,
        color: colors.textPrimary,
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
        fontFamily: typography.fonts.semiBold,
        fontSize: 16,
        color: colors.textPrimary,
        marginBottom: 14,
    },
    renameInput: {
        fontFamily: typography.fonts.regular,
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
        fontFamily: typography.fonts.semiBold,
        fontSize: 14,
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
        fontFamily: typography.fonts.semiBold,
        fontSize: 14,
        color: colors.textLight,
    },
    quotaCardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    quotaCardTitle: {
        fontFamily: typography.fonts.semiBold,
        fontSize: 13,
        color: colors.textPrimary,
    },
    proBadgePill: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.orange,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 30,
    },
    proBadgeText: {
        fontFamily: typography.fonts.bold,
        fontSize: 11,
        color: colors.textLight,
    },
    upgradeBtnPill: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.orange,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 30,
    },
    upgradeBtnText: {
        fontFamily: typography.fonts.bold,
        fontSize: 11,
        color: colors.textLight,
    },
    quotaProgressTrack: {
        height: 10,
        backgroundColor: colors.inputBackground,
        borderWidth: 1.5,
        borderColor: colors.borderMedium,
        borderRadius: 5,
        overflow: "hidden",
        marginVertical: 6,
    },
    quotaProgressFill: {
        height: "100%",
        borderRadius: 4,
    },
    quotaInfoRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 4,
        marginBottom: 12,
    },
    quotaUsageText: {
        fontFamily: typography.fonts.regular,
        fontSize: 11,
        color: colors.textSecondary,
    },
    quotaNoteContainer: {
        alignSelf: "center",
        alignItems: "center",
        justifyContent: "center",
        marginTop: 6,
        marginBottom: 8,
        paddingHorizontal: 12,
    },
    quotaNoteText: {
        fontFamily: typography.fonts.regular,
        fontSize: 11,
        color: colors.textMuted,
        textAlign: "center",
        lineHeight: 16,
    },
    quotaNoteHighlight: {
        fontFamily: typography.fonts.semiBold,
        fontSize: 11,
        color: colors.primary,
    },
    divider: {
        height: 1,
        backgroundColor: colors.divider,
        marginVertical: 12,
    },
});
