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
                        <Ionicons name="layers-outline" size={36} color="#5856D6" />
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
                                <Ionicons name="school-outline" size={28} color="#059669" />
                            </View>
                            <View style={styles.optionTextContainer}>
                                <Text style={styles.optionTitle}>Học thuộc</Text>
                                <Text style={styles.optionDescription}>
                                    Ghi nhớ 2 lần mỗi thẻ để hoàn thành
                                </Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
                        </TouchableOpacity>

                        {/* Free Mode */}
                        <TouchableOpacity
                            style={styles.optionCard}
                            activeOpacity={0.7}
                            onPress={() => onSelectMode("free")}
                        >
                            <View style={[styles.optionIconWrapper, styles.freeIconBg]}>
                                <Ionicons name="albums-outline" size={28} color="#5856D6" />
                            </View>
                            <View style={styles.optionTextContainer}>
                                <Text style={styles.optionTitle}>Tự do</Text>
                                <Text style={styles.optionDescription}>
                                    Lướt qua lại thoải mái như slide
                                </Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
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
        backgroundColor: "#FFF",
        borderRadius: 24,
        padding: 28,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.12,
        shadowRadius: 32,
        elevation: 12,
    },
    headerIcon: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: "#F0EFFF",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: "800",
        color: "#1C1C1E",
        marginBottom: 6,
    },
    subtitle: {
        fontSize: 14,
        color: "#8E8E93",
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
        backgroundColor: "#F9F9FB",
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: "#E5E5EA",
        gap: 14,
    },
    optionIconWrapper: {
        width: 52,
        height: 52,
        borderRadius: 14,
        justifyContent: "center",
        alignItems: "center",
    },
    memorizeIconBg: {
        backgroundColor: "#D1FAE5",
    },
    freeIconBg: {
        backgroundColor: "#EDE9FE",
    },
    optionTextContainer: {
        flex: 1,
    },
    optionTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#1C1C1E",
        marginBottom: 3,
    },
    optionDescription: {
        fontSize: 12,
        color: "#8E8E93",
        lineHeight: 17,
    },
    cancelButton: {
        paddingVertical: 12,
        paddingHorizontal: 32,
    },
    cancelButtonText: {
        fontSize: 15,
        fontWeight: "600",
        color: "#8E8E93",
    },
});
