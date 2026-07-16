import React, { useEffect, useState, useRef } from "react";
import {
    Modal,
    StyleSheet,
    Text,
    View,
    Animated,
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
    const [animStyle, setAnimStyle] = useState<"mascots" | "trong_dong">("mascots");
    const [selectedMascots, setSelectedMascots] = useState<any[]>([]);
    const [currentMascotIdx, setCurrentMascotIdx] = useState(0);
    const [tip, setTip] = useState("");

    // Animation values
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;
    const progressAnim = useRef(new Animated.Value(0)).current;
    const shineAnim = useRef(new Animated.Value(0)).current;

    const progressTimingRef = useRef<Animated.CompositeAnimation | null>(null);

    useEffect(() => {
        if (visible) {
            setLocalVisible(true);

            // 1. Choose animation style randomly
            const chosenStyle = Math.random() < 0.5 ? "mascots" : "trong_dong";
            setAnimStyle(chosenStyle);

            // 2. Select 3 unique random mascots if mascots is selected
            const shuffled = [...MASCOTS].sort(() => 0.5 - Math.random());
            setSelectedMascots(shuffled.slice(0, 3));
            setCurrentMascotIdx(0);

            // 3. Choose a random tip
            const randomTip = TIPS[Math.floor(Math.random() * TIPS.length)];
            setTip(randomTip);

            // 4. Start progress animation (fake progress: 0 to 95% over 6 seconds - 2x faster than 12s)
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

        // 5. Start shine animation looping
        shineAnim.setValue(0);
        const shineLoop = Animated.loop(
            Animated.timing(shineAnim, {
                toValue: 1,
                duration: 2000,
                useNativeDriver: false,
            })
        );
        shineLoop.start();

        // 6. Scale loop for breathing mascot
        scaleAnim.setValue(1);
        const scaleLoop = Animated.loop(
            Animated.sequence([
                Animated.timing(scaleAnim, {
                    toValue: 1.06,
                    duration: 1500,
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 0.94,
                    duration: 1500,
                    useNativeDriver: true,
                }),
            ])
        );
        scaleLoop.start();

        // 7. Rotation loop for trong_dong
        rotateAnim.setValue(0);
        const rotateLoop = Animated.loop(
            Animated.timing(rotateAnim, {
                toValue: 1,
                duration: 10000, // 10 seconds per rotation
                useNativeDriver: true,
            })
        );
        rotateLoop.start();

        return () => {
            shineLoop.stop();
            scaleLoop.stop();
            rotateLoop.stop();
        };
    }, [localVisible, shineAnim, scaleAnim, rotateAnim]);

    // Mascot switching every 3 seconds
    useEffect(() => {
        if (!localVisible || animStyle !== "mascots") return;

        const interval = setInterval(() => {
            setCurrentMascotIdx((prev) => (prev + 1) % 3);
        }, 3000);

        return () => clearInterval(interval);
    }, [localVisible, animStyle]);

    if (!localVisible) return null;

    const spin = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ["0deg", "360deg"],
    });

    const shineLeft = shineAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ["-150%", "250%"],
    });

    const progressWidth = progressAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ["0%", "100%"],
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
                        {animStyle === "mascots" && selectedMascots.length > 0 ? (
                            <Animated.Image
                                source={selectedMascots[currentMascotIdx]}
                                style={[
                                    styles.mascotImage,
                                    { transform: [{ scale: scaleAnim }] },
                                ]}
                                resizeMode="contain"
                            />
                        ) : (
                            <Animated.Image
                                source={require("../../../../assets/images/trong_dong.png")}
                                style={[
                                    styles.trongDongImage,
                                    { transform: [{ rotate: spin }] },
                                ]}
                                resizeMode="contain"
                            />
                        )}
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
