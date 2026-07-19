import React, { useEffect, useState, useRef } from "react";
import {
    Modal,
    StyleSheet,
    Text,
    View,
    Animated,
    Easing,
} from "react-native";
import colors from "../../../theme/colors";
import typography from "../../../theme/typography";

// Mascot image imports
const MASCOTS = [
    require("../../../../assets/images/mascot/aLong_hoivui.png"),
    require("../../../../assets/images/mascot/aLong_ratvui.png"),
    require("../../../../assets/images/mascot/aLong_tuyetvoi.png"),
    require("../../../../assets/images/mascot/aLong_taptrung.png"),
    require("../../../../assets/images/mascot/aLong_colen.png"),
    require("../../../../assets/images/mascot/aLong_suynghi.png"),
    require("../../../../assets/images/mascot/aLong_tutin.png"),
];

// Historical Tips List
const TIPS = [
    "Bạn có biết: Trống đồng Đông Sơn là biểu tượng rực rỡ của nền văn minh sông Hồng cổ đại?",
    "Lịch sử không chỉ là những con số, đó là hành trình đầy tự hào của thế hệ đi trước.",
    "Hãy ôn tập flashcard mỗi ngày để đạt điểm cao trong kỳ thi sắp tới nhé!",
    "Vua Quang Trung đại phá 29 vạn quân Thanh vào dịp Tết Kỷ Dậu năm 1789.",
    "Chiến thắng Điện Biên Phủ năm 1954 lừng lẫy năm châu, chấn động địa cầu.",
    "Bản Tuyên ngôn Độc lập đầu tiên của nước ta được cho là bài thơ thần 'Nam quốc sơn hà'.",
    "Hội nghị Diên Hồng là biểu tượng cho ý chí đoàn kết toàn dân tộc trước nguy cơ ngoại xâm.",
    "Kỳ thi tốt nghiệp THPT Quốc gia môn Lịch sử thường kiểm tra kiến thức lịch sử Việt Nam và thế giới.",
    "Bạn có thể đổi số XP tích lũy được để nhận những khung ảnh đại diện độc quyền trong Cửa hàng.",
    "Hãy luyện đề thường xuyên để làm quen với cấu trúc đề thi chính thức nhé!",
];

interface SpecialLoadingProps {
    visible: boolean;
}

export default function SpecialLoading({ visible }: SpecialLoadingProps) {
    const [localVisible, setLocalVisible] = useState(false);
    const [currentMascot, setCurrentMascot] = useState(MASCOTS[0]);
    const [tip, setTip] = useState("");

    // Animation values
    const progressAnim = useRef(new Animated.Value(0)).current;
    const shineAnim = useRef(new Animated.Value(0)).current;
    const mascotOpacity = useRef(new Animated.Value(1)).current;
    const vibrateAnim = useRef(new Animated.Value(0)).current;

    const progressTimingRef = useRef<Animated.CompositeAnimation | null>(null);

    useEffect(() => {
        if (visible) {
            setLocalVisible(true);

            // 1. Select a random initial mascot
            const randomInitial = MASCOTS[Math.floor(Math.random() * MASCOTS.length)];
            setCurrentMascot(randomInitial);
            mascotOpacity.setValue(1);

            // 2. Choose a random tip
            const randomTip = TIPS[Math.floor(Math.random() * TIPS.length)];
            setTip(randomTip);

            // 3. Start progress animation (fake progress: 0 to 95% over 6 seconds - 2x faster than 12s)
            progressAnim.setValue(0);
            if (progressTimingRef.current) progressTimingRef.current.stop();
            progressTimingRef.current = Animated.timing(progressAnim, {
                toValue: 0.95,
                duration: 6000,
                useNativeDriver: false,
            });
            progressTimingRef.current.start();
        } else {
            // When visible is false (hideLoading called)
            // Animate progress to 100% over 1.5 seconds (1500ms)
            if (progressTimingRef.current) progressTimingRef.current.stop();
            progressTimingRef.current = Animated.timing(progressAnim, {
                toValue: 1.0,
                duration: 1500,
                useNativeDriver: false,
            });
            progressTimingRef.current.start(({ finished }) => {
                if (finished) {
                    setLocalVisible(false);
                }
            });
        }
    }, [visible, progressAnim]);

    // Constant running auxiliary loops while localVisible is true
    useEffect(() => {
        if (!localVisible) return;

        // 4. Start shine animation looping
        shineAnim.setValue(0);
        const shineLoop = Animated.loop(
            Animated.timing(shineAnim, {
                toValue: 1,
                duration: 2000,
                useNativeDriver: false,
            })
        );
        shineLoop.start();

        // 5. Start mascot vibration (scale loop)
        vibrateAnim.setValue(0);
        const scaleLoop = Animated.loop(
            Animated.timing(vibrateAnim, {
                toValue: 1,
                duration: 1700,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        );
        scaleLoop.start();

        return () => {
            shineLoop.stop();
            scaleLoop.stop();
        };
    }, [localVisible, shineAnim, vibrateAnim]);

    // Mascot switching every 2.25 seconds with smooth fade transition
    useEffect(() => {
        if (!localVisible) return;

        const interval = setInterval(() => {
            // Fade out (200ms)
            Animated.timing(mascotOpacity, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }).start(() => {
                // Switch mascot source to a random one (excluding the current one to ensure it changes)
                setCurrentMascot((prev: any) => {
                    const available = MASCOTS.filter((m) => m !== prev);
                    return available[Math.floor(Math.random() * available.length)];
                });

                // Fade in (200ms)
                Animated.timing(mascotOpacity, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }).start();
            });
        }, 2250);

        return () => clearInterval(interval);
    }, [localVisible]);

    if (!localVisible) return null;

    const shineLeft = shineAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ["-150%", "250%"],
    });

    const progressWidth = progressAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ["0%", "100%"],
    });

    const scaleAnim = vibrateAnim.interpolate({
        inputRange: [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1],
        outputRange: [1, 1.021, 1.03, 1.021, 1, 0.979, 0.97, 0.979, 1],
    });

    return (
        <Modal
            visible={localVisible}
            transparent={false}
            animationType="fade"
            statusBarTranslucent={true}
        >
            <View style={styles.container}>
                <View style={styles.content}>
                    {/* 1. Animation Area */}
                    <View style={styles.animationContainer}>
                        <Animated.Image
                            source={currentMascot}
                            style={[
                                styles.mascotImage,
                                {
                                    opacity: mascotOpacity,
                                    transform: [{ scale: scaleAnim }],
                                },
                            ]}
                            resizeMode="contain"
                        />
                    </View>

                    {/* 2. Loading Bar */}
                    <View style={styles.loadingBarContainer}>
                        <View style={styles.loadingBarOuter}>
                            <Animated.View
                                style={[
                                    styles.loadingBarFill,
                                    { width: progressWidth },
                                ]}
                            >
                                <Animated.View
                                    style={[
                                        styles.shineOverlay,
                                        { left: shineLeft },
                                    ]}
                                />
                            </Animated.View>
                        </View>
                    </View>

                    {/* 3. Random Tip */}
                    <View style={styles.tipContainer}>
                        <Text style={styles.tipTitle}>Mách nhỏ lịch sử</Text>
                        <Text style={styles.tipText}>{tip}</Text>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFFFFF",
        justifyContent: "center",
        alignItems: "center",
    },
    content: {
        width: "75%",
        maxWidth: 320,
        alignItems: "center",
        gap: 32,
    },
    animationContainer: {
        height: 180,
        justifyContent: "center",
        alignItems: "center",
    },
    mascotImage: {
        width: 150,
        height: 150,
    },
    trongDongImage: {
        width: 140,
        height: 140,
    },
    loadingBarContainer: {
        width: "100%",
        paddingHorizontal: 8,
    },
    loadingBarOuter: {
        height: 20,
        backgroundColor: "#F2F3F5",
        borderRadius: 10,
        overflow: "hidden",
        borderWidth: 2,
        borderColor: "#EADFD5",
    },
    loadingBarFill: {
        height: "100%",
        backgroundColor: colors.primary, // main brand orange
        borderRadius: 8,
        overflow: "hidden",
        position: "relative",
    },
    shineOverlay: {
        position: "absolute",
        top: 0,
        bottom: 0,
        width: "40%",
        backgroundColor: "rgba(255, 255, 255, 0.45)",
        transform: [{ skewX: "-25deg" }],
    },
    tipContainer: {
        alignItems: "center",
        paddingHorizontal: 12,
    },
    tipTitle: {
        fontFamily: typography.fonts.bold,
        fontSize: 15,
        color: colors.primary,
        marginBottom: 8,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    tipText: {
        fontFamily: typography.fonts.medium,
        fontSize: 14,
        color: colors.textSecondary,
        textAlign: "center",
        lineHeight: 20,
    },
});
