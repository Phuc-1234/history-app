import React, { useState, useEffect, useRef } from "react";
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    TextInput,
    Alert,
    ActivityIndicator,
    Modal,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Pressable,
    Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import typography from "../theme/typography";
import Button from "./Button";
import { useCreateFeedbackMutation } from "../features/profile/services/feedbackApi";
import { Toast } from "./Toast";
import { stripHtml } from "@/utils/htmlUtils";

type FeedbackType = "BUG" | "FEATURE" | "OTHER" | "INCORRECT_INFO";

interface FeedbackModalProps {
    visible: boolean;
    onClose: () => void;
    targetType?: "GRADE" | "LESSON" | "NODE" | "QUESTION" | null;
    targetId?: string | number | null;
    targetTitle?: string | null;
}

export default function FeedbackModal({
    visible,
    onClose,
    targetType,
    targetId,
    targetTitle,
}: FeedbackModalProps) {
    const [feedbackType, setFeedbackType] = useState<FeedbackType>("INCORRECT_INFO");
    const [content, setContent] = useState("");
    const [createFeedback, { isLoading }] = useCreateFeedbackMutation();
    const [toastVisible, setToastVisible] = useState(false);
    const scrollViewRef = useRef<ScrollView>(null);
    const [isInputFocused, setIsInputFocused] = useState(false);

    useEffect(() => {
        if (visible) {
            setContent("");
            setFeedbackType(targetType ? "INCORRECT_INFO" : "BUG");
            setToastVisible(false);
        }
    }, [visible, targetType]);

    const handleSubmit = async () => {
        if (!content.trim()) {
            Alert.alert("Thông báo", "Vui lòng nhập nội dung góp ý.");
            return;
        }

        try {
            await createFeedback({
                type: feedbackType,
                content: content,
                targetType: targetType || null,
                targetId: targetId ? String(targetId) : null,
            }).unwrap();

            setToastVisible(true);
            setTimeout(() => {
                onClose();
            }, 1800);
        } catch (error: any) {
            console.error("Lỗi khi gửi góp ý:", error);
            Alert.alert("Lỗi", error?.data?.error || "Gửi góp ý thất bại. Vui lòng thử lại.");
        }
    };

    const typesList: { key: FeedbackType; label: string; icon: keyof typeof Ionicons.glyphMap; color: string; bgColor: string }[] = [
        // ... (Giữ nguyên mảng typesList của bạn)
        { key: "INCORRECT_INFO", label: "Thông tin sai", icon: "alert-circle-outline", color: colors.error, bgColor: colors.errorContainer },
        { key: "BUG", label: "Báo lỗi", icon: "bug-outline", color: colors.error, bgColor: colors.errorContainer },
        { key: "FEATURE", label: "Tính năng", icon: "bulb-outline", color: colors.warning, bgColor: colors.warningContainer },
        { key: "OTHER", label: "Ý kiến khác", icon: "chatbubble-outline", color: colors.info, bgColor: colors.infoContainer },
    ];

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                style={styles.modalOverlay}
            >
                <Pressable 
                    style={styles.backdropPressable} 
                    onPress={() => {
                        Keyboard.dismiss();
                        onClose();
                    }} 
                />
                
                <View style={styles.modalContent}>
                    <View style={styles.sheetHandle} />

                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Gửi góp ý</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={22} color={colors.textPrimary} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        ref={scrollViewRef}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContainer}
                        keyboardShouldPersistTaps="handled"
                    >
                        {targetTitle && stripHtml(targetTitle) ? (
                            <View style={styles.contextBox}>
                                <View style={styles.contextHeader}>
                                    <Ionicons name="flag" size={14} color={colors.primary} />
                                    <Text style={styles.contextLabel}>Ngữ cảnh góp ý:</Text>
                                </View>
                                <Text style={styles.contextValue} numberOfLines={3}>
                                    {stripHtml(targetTitle)}
                                </Text>
                            </View>
                        ) : null}

                        <Text style={styles.sectionLabel}>Chọn loại góp ý</Text>
                        <View style={styles.typeGrid}>
                            {typesList.map((typeItem) => {
                                const isSelected = feedbackType === typeItem.key;
                                return (
                                    <TouchableOpacity
                                        key={typeItem.key}
                                        style={[
                                            styles.typeCard,
                                            isSelected
                                                ? { borderColor: typeItem.color, backgroundColor: typeItem.bgColor }
                                                : { borderColor: colors.borderMedium },
                                        ]}
                                        onPress={() => setFeedbackType(typeItem.key)}
                                        activeOpacity={0.8}
                                    >
                                        <Ionicons
                                            name={typeItem.icon}
                                            size={20}
                                            color={isSelected ? typeItem.color : colors.textMuted}
                                        />
                                        <Text
                                            style={[
                                                styles.typeText,
                                                isSelected ? { color: typeItem.color, fontFamily: typography.fonts.bold } : null,
                                            ]}
                                        >
                                            {typeItem.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        <Text style={styles.sectionLabel}>Nội dung góp ý</Text>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="Hãy chia sẻ suy nghĩ của bạn với chúng tôi..."
                                placeholderTextColor={colors.textPlaceholder}
                                multiline={true}
                                numberOfLines={6}
                                value={content}
                                onChangeText={setContent}
                                maxLength={1000}
                                onFocus={() => {
                                    setIsInputFocused(true);
                                    setTimeout(() => {
                                        scrollViewRef.current?.scrollToEnd({ animated: true });
                                    }, 120);
                                }}
                                onBlur={() => setIsInputFocused(false)}
                            />
                            <Text style={styles.charCount}>{content.length}/1000</Text>
                        </View>

                        <View style={styles.buttonWrapper}>
                            {isLoading ? (
                                <ActivityIndicator size="large" color={colors.primary} />
                            ) : (
                                <View style={styles.actionsRow}>
                                    <Button
                                        title="Hủy"
                                        variant="outline"
                                        onPress={onClose}
                                        style={styles.actionBtn}
                                    />
                                    <Button
                                        title="Gửi góp ý"
                                        variant="primary"
                                        onPress={handleSubmit}
                                        disabled={!content.trim()}
                                        style={styles.actionBtn}
                                    />
                                </View>
                            )}
                        </View>
                        {isInputFocused && Platform.OS === "android" && (
                            <View style={{ height: 160 }} />
                        )}
                    </ScrollView>
                </View>
            </KeyboardAvoidingView>
            <Toast
                visible={toastVisible}
                message="Cảm ơn bạn đã gửi góp ý cho chúng tôi!"
                onHide={() => setToastVisible(false)}
            />
        </Modal>
    );
}

// ... Giữ nguyên phần styles

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        justifyContent: "flex-end",
        backgroundColor: "rgba(15, 23, 42, 0.4)",
    },
    backdropPressable: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    modalContent: {
        backgroundColor: colors.background,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: Platform.OS === "ios" ? 36 : 24,
        maxHeight: "85%",
        width: "100%",
        borderWidth: 1,
        borderColor: colors.borderMedium,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    sheetHandle: {
        width: 36,
        height: 5,
        backgroundColor: colors.borderMedium,
        borderRadius: 3,
        alignSelf: "center",
        marginVertical: 10,
    },
    scrollContainer: {
        paddingBottom: 20,
    },

    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottomWidth: 1,
        borderBottomColor: colors.borderLight,
        paddingBottom: 12,
        marginBottom: 16,
    },
    headerTitle: {
        fontFamily: typography.fonts.bold,
        fontSize: 18,
        color: colors.textPrimary,
    },
    closeButton: {
        padding: 4,
    },
    contextBox: {
        backgroundColor: colors.primaryContainer,
        borderRadius: 12,
        padding: 12,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: colors.borderLight,
    },
    contextHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginBottom: 4,
    },
    contextLabel: {
        fontFamily: typography.fonts.semiBold,
        fontSize: 13,
        color: colors.primary,
    },
    contextValue: {
        fontFamily: typography.fonts.bold,
        fontSize: 14,
        color: colors.textPrimary,
        lineHeight: 18,
    },
    sectionLabel: {
        fontFamily: typography.fonts.semiBold,
        fontSize: 15,
        color: colors.textPrimary,
        marginBottom: 8,
    },
    typeGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
        marginBottom: 20,
        gap: 8,
    },
    typeCard: {
        width: "48%",
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        paddingHorizontal: 10,
        borderRadius: 12,
        borderWidth: 1.5,
        backgroundColor: colors.surface,
        gap: 8,
    },
    typeText: {
        fontFamily: typography.fonts.medium,
        fontSize: 13,
        color: colors.textSecondary,
    },
    inputContainer: {
        backgroundColor: colors.inputBackground,
        borderRadius: 16,
        paddingHorizontal: 14,
        paddingVertical: 10,
        minHeight: 120,
    },
    input: {
        fontFamily: typography.fonts.regular,
        fontSize: 14,
        color: colors.textDark,
        textAlignVertical: "top",
        flex: 1,
        minHeight: 90,
    },
    charCount: {
        fontFamily: typography.fonts.regular,
        fontSize: 11,
        color: colors.textMuted,
        alignSelf: "flex-end",
    },
    buttonWrapper: {
        marginTop: 24,
    },
    actionsRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 12,
    },
    actionBtn: {
        flex: 1,
    },
});
