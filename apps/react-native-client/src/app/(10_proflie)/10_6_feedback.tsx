import React, { useState } from "react";
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    TextInput,
    Alert,
    ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ScreenWrapper } from "../../components/layout/ScreenWrapper";
import { colors } from "../../theme/colors";
import typography from "../../theme/typography";
import Button from "../../components/Button";
import { useCreateFeedbackMutation } from "../../features/profile/services/feedbackApi";

type FeedbackType = "BUG" | "FEATURE" | "OTHER";

export default function SendFeedbackScreen() {
    const router = useRouter();
    const [feedbackType, setFeedbackType] = useState<FeedbackType>("BUG");
    const [content, setContent] = useState("");
    const [createFeedback, { isLoading }] = useCreateFeedbackMutation();

    const handleSubmit = async () => {
        if (!content.trim()) {
            Alert.alert("Thông báo", "Vui lòng nhập nội dung góp ý.");
            return;
        }

        try {
            await createFeedback({
                type: feedbackType,
                content: content,
            }).unwrap();

            Alert.alert("Thành công", "Cảm ơn bạn đã gửi góp ý cho chúng tôi!", [
                {
                    text: "OK",
                    onPress: () => {
                        setContent("");
                        router.back();
                    },
                },
            ]);
        } catch (error: any) {
            console.error("Lỗi khi gửi góp ý:", error);
            Alert.alert("Lỗi", error?.data?.error || "Gửi góp ý thất bại. Vui lòng thử lại.");
        }
    };

    const typesList: { key: FeedbackType; label: string; icon: keyof typeof Ionicons.glyphMap; color: string; bgColor: string }[] = [
        {
            key: "BUG",
            label: "Báo lỗi",
            icon: "bug-outline",
            color: colors.error,
            bgColor: colors.errorContainer,
        },
        {
            key: "FEATURE",
            label: "Tính năng",
            icon: "bulb-outline",
            color: colors.warning,
            bgColor: colors.warningContainer,
        },
        {
            key: "OTHER",
            label: "Ý kiến khác",
            icon: "chatbubble-outline",
            color: colors.info,
            bgColor: colors.infoContainer,
        },
    ];

    return (
        <ScreenWrapper
            enableScroll={true}
            enableKeyboardAvoiding={true}
            showTopBar={false}
            branchConfig={{
                hierarchy: "Hồ sơ",
                title: "Gửi góp ý",
                onBackPress: () => router.back(),
            }}
            style={styles.container}
            contentContainerStyle={styles.contentContainer}
        >
            {/* Content Body */}
            <View style={styles.body}>
                {/* Link to feedback history */}
                <TouchableOpacity
                    style={styles.historyLinkCard}
                    onPress={() => router.push("/(10_proflie)/10_7_feedback_history")}
                    activeOpacity={0.8}
                >
                    <View style={styles.historyLinkLeft}>
                        <Ionicons name="time-outline" size={20} color={colors.primary} />
                        <Text style={styles.historyLinkText}>Xem lịch sử góp ý của bạn</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.primary} />
                </TouchableOpacity>

                <Text style={styles.sectionLabel}>Chọn loại góp ý</Text>
                <View style={styles.typeContainer}>
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
                                    size={24}
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
                        numberOfLines={8}
                        value={content}
                        onChangeText={setContent}
                        maxLength={1000}
                    />
                    <Text style={styles.charCount}>{content.length}/1000</Text>
                </View>

                <View style={styles.buttonWrapper}>
                    {isLoading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={colors.primary} />
                        </View>
                    ) : (
                        <Button
                            title="Gửi góp ý"
                            variant="primary"
                            onPress={handleSubmit}
                            disabled={!content.trim()}
                        />
                    )}
                </View>
            </View>
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    contentContainer: {
        paddingBottom: 30,
    },
    historyLinkCard: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: colors.primaryContainer,
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginBottom: 24,
        borderWidth: 1.5,
        borderColor: colors.borderLight,
    },
    historyLinkLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    historyLinkText: {
        fontFamily: typography.fonts.semiBold,
        fontSize: 15,
        color: colors.primary,
    },
    body: {
        paddingHorizontal: 20,
        marginTop: 20,
    },
    sectionLabel: {
        fontFamily: typography.fonts.semiBold,
        fontSize: 16,
        color: colors.textPrimary,
        marginBottom: 12,
    },
    typeContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 24,
        gap: 8,
    },
    typeCard: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 16,
        borderRadius: 16,
        borderWidth: 1.5,
        backgroundColor: colors.surface,
    },
    typeText: {
        fontFamily: typography.fonts.medium,
        fontSize: 14,
        color: colors.textSecondary,
        marginTop: 8,
    },
    inputContainer: {
        backgroundColor: colors.inputBackground,
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderWidth: 1.5,
        borderColor: "transparent",
        minHeight: 180,
    },
    input: {
        fontFamily: typography.fonts.regular,
        fontSize: 15,
        color: colors.textDark,
        textAlignVertical: "top",
        flex: 1,
        minHeight: 140,
    },
    charCount: {
        fontFamily: typography.fonts.regular,
        fontSize: 12,
        color: colors.textMuted,
        alignSelf: "flex-end",
        marginTop: 4,
    },
    buttonWrapper: {
        marginTop: 32,
    },
    loadingContainer: {
        height: 56,
        alignItems: "center",
        justifyContent: "center",
    },
});
