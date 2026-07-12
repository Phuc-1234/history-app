import React from "react";
import { StyleSheet, Text, TouchableOpacity, View, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Mascot from "../../../components/Mascot";
import { colors } from "../../../theme/colors";
import { typography } from "../../../theme/typography";

const { width } = Dimensions.get("window");
const MODAL_WIDTH = width * 0.85;

export default function FlashcardCompleteScreen() {
    const router = useRouter();

    const handleRelearn = () => {
        // Go back to play screen
        router.replace("/(3_4_lessons)/4_4_fcard");
    };

    const handleBack = () => {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace("/(tabs)/lesson" as any);
        }
    };

    return (
        <View style={styles.container}>
                <View style={styles.cardModal}>
                    {/* --- Mascot Illustration --- */}
                    <Mascot
                        event={{ type: "complete-flashcard", correctRatio: 1.0 }}
                        width={130}
                        height={130}
                        style={{ marginBottom: 16 }}
                    />

                    {/* --- Congratulatory Text --- */}
                    <Text style={styles.successTitle}>Tuyệt vời!</Text>
                    <Text style={styles.successDescription}>
                        Chúc mừng đã hoàn thành bài học thẻ lật này!
                    </Text>

                    {/* --- Action Buttons --- */}
                    <View style={styles.buttonsContainer}>
                        {/* Học lại (Relearn) Button */}
                        <TouchableOpacity
                            style={styles.relearnButton}
                            onPress={handleRelearn}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="refresh" size={20} color={colors.primary} />
                            <Text style={styles.relearnButtonText}>Học lại</Text>
                        </TouchableOpacity>

                        {/* Quay lại (Go Back) Button */}
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={handleBack}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.backButtonText}>Thoát</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 20,
    },
    cardModal: {
        width: MODAL_WIDTH,
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 32,
        alignItems: "center",
        borderWidth: 1,
        borderColor: colors.borderMedium,
    },
    successTitle: {
        ...typography.h2,
        color: colors.textPrimary,
        marginBottom: 10,
    },
    successDescription: {
        ...typography.bodyLarge,
        color: colors.textSecondary,
        textAlign: "center",
        lineHeight: 22,
        marginBottom: 32,
        paddingHorizontal: 12,
    },
    buttonsContainer: {
        width: "100%",
        gap: 12,
    },
    relearnButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.primaryContainer,
        paddingVertical: 15,
        borderRadius: 30,
        gap: 8,
        width: "100%",
    },
    relearnButtonText: {
        ...typography.bodyLargeBold,
        color: colors.primary,
    },
    backButton: {
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.surface,
        paddingVertical: 15,
        borderRadius: 30,
        borderWidth: 1,
        borderColor: colors.borderMedium,
        width: "100%",
    },
    backButtonText: {
        ...typography.bodyLargeBold,
        color: colors.textMuted,
    },
});
