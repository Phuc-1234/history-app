import React from "react";
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Modal,
    Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../../theme/colors";
import { typography } from "../../../theme/typography";

export type FlashcardMode = "memorize" | "free";

interface FlashcardModeModalProps {
    visible: boolean;
    onSelectMode: (mode: FlashcardMode) => void;
    onClose: () => void;
}

const { width } = Dimensions.get("window");
const MODAL_WIDTH = width * 0.85;

export function FlashcardModeModal({
    visible,
    onSelectMode,
    onClose,
}: FlashcardModeModalProps) {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            statusBarTranslucent
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    {/* --- Header Icon --- */}
                    <View style={styles.headerIcon}>
                        <Ionicons name="layers-outline" size={36} color={colors.primary} />
                    </View>

                    {/* --- Title --- */}
                    <Text style={styles.title}>Chọn chế độ học</Text>
                    <Text style={styles.subtitle}>
                        Chọn cách bạn muốn ôn tập thẻ lật
                    </Text>

                    {/* --- Mode Options --- */}
                    <View style={styles.optionsContainer}>
                        {/* Memorize Mode */}
                        <TouchableOpacity
                            style={styles.optionCard}
                            activeOpacity={0.7}
                            onPress={() => onSelectMode("memorize")}
                        >
                            <View style={[styles.optionIconWrapper, styles.memorizeIconBg]}>
                                <Ionicons name="school-outline" size={28} color={colors.success} />
                            </View>
                            <View style={styles.optionTextContainer}>
                                <Text style={styles.optionTitle}>Học thuộc</Text>
                                <Text style={styles.optionDescription}>
                                    Ghi nhớ 2 lần mỗi thẻ để hoàn thành
                                </Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={colors.textPlaceholder} />
                        </TouchableOpacity>

                        {/* Free Mode */}
                        <TouchableOpacity
                            style={styles.optionCard}
                            activeOpacity={0.7}
                            onPress={() => onSelectMode("free")}
                        >
                            <View style={[styles.optionIconWrapper, styles.freeIconBg]}>
                                <Ionicons name="albums-outline" size={28} color={colors.primary} />
                            </View>
                            <View style={styles.optionTextContainer}>
                                <Text style={styles.optionTitle}>Tự do</Text>
                                <Text style={styles.optionDescription}>
                                    Lướt qua lại thoải mái như slide
                                </Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={colors.textPlaceholder} />
                        </TouchableOpacity>
                    </View>

                    {/* --- Cancel Button --- */}
                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={onClose}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.cancelButtonText}>Huỷ</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.45)",
        justifyContent: "center",
        alignItems: "center",
    },
    modalContainer: {
        width: MODAL_WIDTH,
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 28,
        alignItems: "center",
    },
    headerIcon: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: colors.primaryContainer,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 16,
    },
    title: {
        ...typography.h2,
        color: colors.textPrimary,
        marginBottom: 6,
    },
    subtitle: {
        ...typography.bodyMedium,
        color: colors.textMuted,
        textAlign: "center",
        marginBottom: 24,
    },
    optionsContainer: {
        width: "100%",
        gap: 12,
        marginBottom: 20,
    },
    optionCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.surfaceVariant,
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: colors.borderMedium,
        gap: 14,
    },
    optionIconWrapper: {
        width: 52,
        height: 52,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
    },
    memorizeIconBg: {
        backgroundColor: colors.successContainer,
    },
    freeIconBg: {
        backgroundColor: colors.primaryContainer,
    },
    optionTextContainer: {
        flex: 1,
    },
    optionTitle: {
        ...typography.bodyLargeBold,
        color: colors.textPrimary,
        marginBottom: 3,
    },
    optionDescription: {
        ...typography.bodySmall,
        color: colors.textMuted,
        lineHeight: 17,
    },
    cancelButton: {
        paddingVertical: 12,
        paddingHorizontal: 32,
    },
    cancelButtonText: {
        ...typography.bodyMediumMedium,
        color: colors.textMuted,
    },
});
