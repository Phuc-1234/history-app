import React from "react";
import { StyleSheet, Text, TouchableOpacity, View, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Mascot from "../../../components/Mascot";



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
                            <Ionicons name="refresh" size={20} color="#5C4033" />
                            <Text style={styles.relearnButtonText}>Học lại</Text>
                        </TouchableOpacity>

                        {/* Quay lại (Go Back) Button */}
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={handleBack}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.backButtonText}>Quay lại</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F8F9FA",
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 20,
    },
    cardModal: {
        width: MODAL_WIDTH,
        backgroundColor: "#FFF",
        borderRadius: 24,
        padding: 32,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.08,
        shadowRadius: 24,
        elevation: 8,
        borderWidth: 1,
        borderColor: "#F2F2F7",
    },
    badgeWrapper: {
        marginBottom: 24,
        shadowColor: "#10B981",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 4,
    },
    badgeCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: "#A7F3D0", // Light emerald green background
        justifyContent: "center",
        alignItems: "center",
    },
    successTitle: {
        fontSize: 22,
        fontWeight: "800",
        color: "#1C1C1E",
        marginBottom: 10,
    },
    successDescription: {
        fontSize: 15,
        color: "#48484A",
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
        backgroundColor: "#F5EBE6", // Soft cream/beige color
        paddingVertical: 15,
        borderRadius: 24,
        gap: 8,
        width: "100%",
    },
    relearnButtonText: {
        fontSize: 16,
        fontWeight: "700",
        color: "#5C4033", // Coffee brown text
    },
    backButton: {
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#FFF",
        paddingVertical: 15,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: "#D1D1D6",
        width: "100%",
    },
    backButtonText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#8E8E93",
    },
});
