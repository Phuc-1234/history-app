import React, { useEffect, useRef } from "react";
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
} from "react-native";
import { Flame, Sparkles } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

interface StreakCelebrationModalProps {
    visible: boolean;
    onClose: () => void;
    currentStreak?: number;
    onNext: () => void;
}

export default function StreakCelebrationModal({
    visible,
    onClose,
    currentStreak = 7,
    onNext,
}: StreakCelebrationModalProps) {
    // Animation Values
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const translateAnim = useRef(new Animated.Value(40)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            // 1. Reset Animation Values
            scaleAnim.setValue(0);
            fadeAnim.setValue(0);
            translateAnim.setValue(40);
            rotateAnim.setValue(0);

            // 2. Flame Spring & Bounce Animation
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 40,
                friction: 5,
                useNativeDriver: true,
            }).start();

            // 3. Staggered Text reveal (Fade + Slide up)
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 600,
                    useNativeDriver: true,
                }),
                Animated.timing(translateAnim, {
                    toValue: 0,
                    duration: 600,
                    useNativeDriver: true,
                }),
            ]).start();

            // 4. Infinite Rotation for Sparkles
            Animated.loop(
                Animated.timing(rotateAnim, {
                    toValue: 1,
                    duration: 10000,
                    useNativeDriver: true,
                })
            ).start();
        }
    }, [visible]);

    // Interpolate rotation value to degrees
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
                    colors={["#FFFFFF", "#FFF7F2"]}
                    style={styles.modalContainer}
                >
                    {/* Rotating Background Sparkles Effect */}
                    <Animated.View
                        style={[
                            styles.sparkleContainer,
                            { transform: [{ rotate: rotateDegree }] },
                        ]}
                    >
                        <Sparkles size={180} color="rgba(255, 142, 60, 0.22)" />
                    </Animated.View>

                    {/* Bouncing Flame Icon */}
                    <Animated.View
                        style={[
                            styles.flameContainer,
                            { transform: [{ scale: scaleAnim }] },
                        ]}
                    >
                        <LinearGradient
                            colors={["#FFB24A", "#FF4B6B"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.flameGlow}
                        >
                            <Flame size={76} color="#FFFFFF" fill="#FFFFFF" />
                        </LinearGradient>
                    </Animated.View>

                    {/* Fading & Sliding Text Content */}
                    <Animated.View
                        style={{
                            width: "100%",
                            alignItems: "center",
                            opacity: fadeAnim,
                            transform: [{ translateY: translateAnim }],
                        }}
                    >
                        <Text style={styles.streakTitle}>CHUỖI {currentStreak} NGÀY!</Text>
                        
                        <Text style={styles.congratsText}>Bạn đang bùng cháy cực hạn! 🔥</Text>
                        
                        <Text style={styles.descText}>
                            Tuyệt vời! Bạn đã tích cực duy trì việc học tập liên tục để bảo vệ ngọn lửa tri thức ngày hôm nay.
                        </Text>

                        {/* Premium Action Button */}
                        <TouchableOpacity
                            style={styles.actionButton}
                            activeOpacity={0.85}
                            onPress={() => {
                                onClose();
                                onNext();
                            }}
                        >
                            <LinearGradient
                                colors={["#FF8C37", "#FF4664"]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.gradientButton}
                            >
                                <Text style={styles.buttonText}>Xem Phần Thưởng Ngay ➔</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </Animated.View>
                </LinearGradient>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(15, 12, 38, 0.55)", // Rich luxury dim backdrop
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 28,
    },
    modalContainer: {
        width: "100%",
        maxWidth: 340,
        borderRadius: 32,
        paddingVertical: 38,
        paddingHorizontal: 24,
        alignItems: "center",
        position: "relative",
        overflow: "hidden",
        borderWidth: 1.5,
        borderColor: "#FFEAD9",
        shadowColor: "#FF8E3C",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.12,
        shadowRadius: 20,
        elevation: 6,
    },
    sparkleContainer: {
        position: "absolute",
        top: 0,
        alignSelf: "center",
        zIndex: 0,
    },
    flameContainer: {
        marginBottom: 24,
        zIndex: 1,
    },
    flameGlow: {
        width: 136,
        height: 136,
        borderRadius: 100,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#FF4B6B",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
        elevation: 4,
    },
    streakTitle: {
        fontSize: 28,
        fontWeight: "900",
        color: "#FF4B6B",
        textAlign: "center",
        letterSpacing: 0.8,
        marginBottom: 8,
        zIndex: 1,
    },
    congratsText: {
        fontSize: 16,
        fontWeight: "800",
        color: "#E27A00",
        marginBottom: 12,
        textAlign: "center",
        zIndex: 1,
    },
    descText: {
        fontSize: 13,
        color: "#4A5568",
        textAlign: "center",
        lineHeight: 18,
        paddingHorizontal: 12,
        marginBottom: 30,
        zIndex: 1,
        fontWeight: "600",
    },
    actionButton: {
        width: "100%",
        borderRadius: 100,
        overflow: "hidden",
        shadowColor: "#FF4B6B",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
        elevation: 3,
        zIndex: 1,
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
        letterSpacing: 0.2,
    },
});
