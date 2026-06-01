import React, { useEffect, useRef } from "react";
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    Animated,
} from "react-native";
import { Award, Trophy } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

interface RewardModalProps {
    visible: boolean;
    onClose: () => void;
    goldAmount?: number;
    badgeName?: string;
}

export default function RewardModal({
    visible,
    onClose,
    goldAmount = 50,
    badgeName = "Huy hiệu Chăm Chỉ",
}: RewardModalProps) {
    // Animation Values
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim1 = useRef(new Animated.Value(0)).current;
    const fadeAnim2 = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            // Reset animations
            scaleAnim.setValue(0);
            rotateAnim.setValue(0);
            fadeAnim1.setValue(0);
            fadeAnim2.setValue(0);

            // 1. Trophy Bounce Spring
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 40,
                friction: 5,
                useNativeDriver: true,
            }).start();

            // 2. Trophy Spin 360 degrees
            Animated.timing(rotateAnim, {
                toValue: 1,
                duration: 900,
                useNativeDriver: true,
            }).start();

            // 3. Staggered Fade-in for Rewards
            Animated.sequence([
                Animated.delay(400),
                Animated.timing(fadeAnim1, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim2, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [visible]);

    // Interpolate spin value
    const rotateDegree = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ["0deg", "360deg"],
    });

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <LinearGradient
                    colors={["#FFFFFF", "#FFF9F6"]}
                    style={styles.modalContainer}
                >
                    {/* Bouncing & Spinning Trophy Container */}
                    <Animated.View
                        style={[
                            styles.iconContainer,
                            { transform: [{ scale: scaleAnim }, { rotate: rotateDegree }] },
                        ]}
                    >
                        <LinearGradient
                            colors={["#FFB94A", "#FF7E40"]}
                            style={styles.circleBg}
                        >
                            <Trophy size={44} color="#FFFFFF" fill="#FFFFFF" />
                        </LinearGradient>
                        <View style={styles.badgeMiniContainer}>
                            <Award size={20} color="#FFFFFF" fill="#5D45F9" />
                        </View>
                    </Animated.View>

                    {/* Celebration Typography */}
                    <Text style={styles.title}>Chúc mừng! 🎉</Text>
                    <Text style={styles.subtitle}>
                        Bạn đã đạt mốc chuỗi học tập xuất sắc và nhận được các phần quà danh giá sau:
                    </Text>

                    {/* Reward Details Card (Staggered Fade-in) */}
                    <View style={styles.rewardCard}>
                        {/* Gold Coin Row (Fades in first) */}
                        <Animated.View style={[styles.rewardRow, { opacity: fadeAnim1 }]}>
                            <LinearGradient
                                colors={["#FFFBEB", "#FEF3C7"]}
                                style={styles.emojiBg}
                            >
                                <LinearGradient
                                    colors={["#FBBF24", "#D97706"]}
                                    style={styles.goldBadge}
                                >
                                    <Text style={styles.coinSymbol}>$</Text>
                                </LinearGradient>
                            </LinearGradient>
                            <View style={styles.rewardInfo}>
                                <Text style={styles.rewardLabel}>Phần thưởng xu vàng</Text>
                                <Text style={styles.rewardValue}>+{goldAmount} Xu</Text>
                            </View>
                        </Animated.View>

                        {/* Medal Row (Fades in second) */}
                        <Animated.View style={[styles.rewardRow, styles.borderTop, { opacity: fadeAnim2 }]}>
                            <View style={[styles.emojiBg, styles.badgeBgColor]}>
                                <Award size={22} color="#5D45F9" fill="#C7D2FE" />
                            </View>
                            <View style={styles.rewardInfo}>
                                <Text style={styles.rewardLabel}>Danh hiệu đã mở khóa</Text>
                                <Text style={styles.rewardValue}>{badgeName}</Text>
                            </View>
                        </Animated.View>
                    </View>

                    {/* Premium Wide Action Button */}
                    <TouchableOpacity
                        style={styles.confirmButton}
                        activeOpacity={0.85}
                        onPress={onClose}
                    >
                        <LinearGradient
                            colors={["#5D45F9", "#8E76FF"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.gradientButton}
                        >
                            <Text style={styles.buttonText}>Tuyệt vời!</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </LinearGradient>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(15, 12, 38, 0.65)",
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 28,
    },
    modalContainer: {
        width: "100%",
        maxWidth: 330,
        borderRadius: 30,
        paddingVertical: 36,
        paddingHorizontal: 24,
        alignItems: "center",
        shadowColor: "#5D45F9",
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.22,
        shadowRadius: 24,
        elevation: 8,
        borderWidth: 1.5,
        borderColor: "#FFF0E6",
    },
    iconContainer: {
        position: "relative",
        marginBottom: 24,
    },
    circleBg: {
        width: 96,
        height: 96,
        borderRadius: 100,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#FF7E40",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 5,
        borderWidth: 3,
        borderColor: "#FFFFFF",
    },
    badgeMiniContainer: {
        position: "absolute",
        bottom: -2,
        right: -2,
        backgroundColor: "#5D45F9",
        borderRadius: 100,
        padding: 7,
        borderWidth: 3.5,
        borderColor: "#FFFFFF",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
    },
    title: {
        fontSize: 24,
        fontWeight: "900",
        color: "#5D45F9",
        marginBottom: 8,
        textAlign: "center",
    },
    subtitle: {
        fontSize: 13,
        color: "#718096",
        textAlign: "center",
        lineHeight: 18,
        marginBottom: 24,
        paddingHorizontal: 12,
        fontWeight: "500",
    },
    rewardCard: {
        width: "100%",
        backgroundColor: "#F8FAFC",
        borderWidth: 1.5,
        borderColor: "#EDF2F7",
        borderRadius: 22,
        paddingVertical: 10,
        paddingHorizontal: 16,
        marginBottom: 28,
    },
    rewardRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        gap: 14,
    },
    borderTop: {
        borderTopWidth: 1.5,
        borderTopColor: "#EDF2F7",
    },
    emojiBg: {
        width: 44,
        height: 44,
        borderRadius: 100,
        alignItems: "center",
        justifyContent: "center",
    },
    badgeBgColor: {
        backgroundColor: "#EEF2FF",
        borderWidth: 1,
        borderColor: "#C7D2FE",
    },
    goldBadge: {
        width: 30,
        height: 30,
        borderRadius: 100,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#D97706",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3,
        elevation: 2,
    },
    coinSymbol: {
        fontSize: 16,
        fontWeight: "900",
        color: "#FFFFFF",
    },
    rewardInfo: {
        flex: 1,
    },
    rewardLabel: {
        fontSize: 11,
        color: "#718096",
        fontWeight: "600",
        marginBottom: 2,
    },
    rewardValue: {
        fontSize: 15,
        fontWeight: "800",
        color: "#1A202C",
    },
    confirmButton: {
        width: "100%",
        borderRadius: 100,
        overflow: "hidden",
        shadowColor: "#5D45F9",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
        elevation: 4,
    },
    gradientButton: {
        paddingVertical: 14,
        alignItems: "center",
        justifyContent: "center",
    },
    buttonText: {
        color: "#FFFFFF",
        fontSize: 15,
        fontWeight: "800",
        letterSpacing: 0.3,
    },
});
export {};
