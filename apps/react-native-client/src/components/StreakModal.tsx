import React, { useState, useEffect, useRef } from "react";
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    Animated,
} from "react-native";
import { X, Info, Check, Lock, Flame, Award } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

interface Reward {
    id: number;
    title: string;
    description: string;
    type: "coin" | "badge";
    amount?: number;
    claimed: boolean;
}

interface StreakMilestone {
    day: number;
    status: "completed" | "active" | "locked";
}

interface StreakModalProps {
    visible: boolean;
    onClose: () => void;
    currentStreak?: number;
    onClaimCoin?: () => void;
}

export default function StreakModal({
    visible,
    onClose,
    currentStreak = 7,
    onClaimCoin,
}: StreakModalProps) {
    const [rewards, setRewards] = useState<Reward[]>([
        {
            id: 1,
            title: "50 xu vàng",
            description: "Nhận 50 xu khi hoàn thành chuỗi",
            type: "coin",
            amount: 50,
            claimed: false,
        },
        {
            id: 2,
            title: "Huy hiệu Chăm Chỉ",
            description: "Huy hiệu vinh danh chuyên cần",
            type: "badge",
            claimed: true,
        },
    ]);

    const milestones: StreakMilestone[] = [
        { day: 3, status: "completed" },
        { day: 5, status: "completed" },
        { day: 7, status: "active" },
        { day: 10, status: "locked" },
        { day: 15, status: "locked" },
    ];

    // Pulsing Animation Value for Active Milestone Checkpoint
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (visible) {
            pulseAnim.setValue(1);
            // Loop scale pulsing
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.12,
                        duration: 750,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 750,
                        useNativeDriver: true,
                    }),
                ]),
            ).start();
        }
    }, [visible]);

    const handleClaimReward = (id: number) => {
        setRewards((prev) =>
            prev.map((r) => (r.id === id ? { ...r, claimed: true } : r)),
        );
        if (id === 1 && onClaimCoin) {
            setTimeout(() => {
                onClaimCoin();
            }, 600);
        }
    };

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    <View style={styles.topIndicator} />

                    {/* Header */}
                    <View style={styles.header}>
                        <View>
                            <Text style={styles.headerTitle}>
                                Chuỗi học tập 🔥
                            </Text>
                            <Text style={styles.headerSubtitle}>
                                Duy trì ngọn lửa học tập để rinh quà khủng
                            </Text>
                        </View>
                        <TouchableOpacity
                            onPress={onClose}
                            style={styles.closeButton}
                            activeOpacity={0.7}
                        >
                            <X size={18} color="#718096" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContent}
                    >
                        {/* 3D Glowing Streak Card */}
                        <LinearGradient
                            colors={["#FFA84A", "#FF5274"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.streakCard}
                        >
                            <View style={styles.glassInnerBorder}>
                                <View style={styles.flameIconBg}>
                                    <Flame
                                        size={36}
                                        color="#FFFFFF"
                                        fill="#FFFFFF"
                                    />
                                </View>
                                <Text style={styles.streakTitle}>
                                    Chuỗi {currentStreak} ngày
                                </Text>
                                <Text style={styles.streakDesc}>
                                    Bạn đang làm rất xuất sắc! Hãy tiếp tục làm
                                    tối thiểu 1 bài test hôm nay để giữ lửa học
                                    tập nhé.
                                </Text>
                            </View>
                        </LinearGradient>

                        {/* Enhanced High-end Info Box */}
                        <View style={styles.infoBox}>
                            <LinearGradient
                                colors={["#5D45F9", "#7B4FFF"]}
                                style={styles.infoIconBg}
                            >
                                <Info size={16} color="#FFFFFF" />
                            </LinearGradient>
                            <Text style={styles.infoText}>
                                Làm ít nhất 1 bài test mỗi ngày để duy trì
                                chuỗi. Chuỗi càng dài, phần quà nâng cấp càng
                                lớn!
                            </Text>
                        </View>

                        {/* Milestones Pathway */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>
                                Mốc chuỗi tiến trình
                            </Text>
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.milestoneRow}
                            >
                                {milestones.map((item, index) => {
                                    const isCompleted =
                                        item.status === "completed";
                                    const isActive = item.status === "active";
                                    const isLocked = item.status === "locked";

                                    return (
                                        <View
                                            key={index}
                                            style={styles.milestoneItem}
                                        >
                                            {isCompleted && (
                                                <LinearGradient
                                                    colors={[
                                                        "#E8E5FF",
                                                        "#D2C9FF",
                                                    ]}
                                                    style={[
                                                        styles.circle,
                                                        styles.circleCompleted,
                                                    ]}
                                                >
                                                    <Check
                                                        size={20}
                                                        color="#5D45F9"
                                                        strokeWidth={3.5}
                                                    />
                                                </LinearGradient>
                                            )}

                                            {isActive && (
                                                <Animated.View
                                                    style={[
                                                        styles.circle,
                                                        styles.circleActive,
                                                        {
                                                            transform: [
                                                                {
                                                                    scale: pulseAnim,
                                                                },
                                                            ],
                                                        },
                                                    ]}
                                                >
                                                    <LinearGradient
                                                        colors={[
                                                            "#FFF9F5",
                                                            "#FFEADB",
                                                        ]}
                                                        style={
                                                            styles.circleActiveInner
                                                        }
                                                    >
                                                        <Text
                                                            style={
                                                                styles.activeText
                                                            }
                                                        >
                                                            {item.day}
                                                        </Text>
                                                    </LinearGradient>
                                                </Animated.View>
                                            )}

                                            {isLocked && (
                                                <View
                                                    style={[
                                                        styles.circle,
                                                        styles.circleLocked,
                                                    ]}
                                                >
                                                    <Lock
                                                        size={16}
                                                        color="#A0AEC0"
                                                    />
                                                </View>
                                            )}

                                            <Text
                                                style={[
                                                    styles.milestoneLabel,
                                                    isActive &&
                                                        styles.activeLabel,
                                                    isCompleted &&
                                                        styles.completedLabel,
                                                ]}
                                            >
                                                Chuỗi {item.day}
                                            </Text>
                                        </View>
                                    );
                                })}
                            </ScrollView>
                        </View>

                        {/* Beautiful Reward List */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>
                                Phần thưởng mốc {currentStreak} ngày
                            </Text>

                            {rewards.map((reward) => (
                                <View key={reward.id} style={styles.rewardCard}>
                                    <View style={styles.rewardLeft}>
                                        <LinearGradient
                                            colors={
                                                reward.type === "coin"
                                                    ? ["#FFFBEB", "#FEF3C7"]
                                                    : ["#EEF2FF", "#E0E7FF"]
                                            }
                                            style={styles.rewardIconContainer}
                                        >
                                            {reward.type === "coin" ? (
                                                <LinearGradient
                                                    colors={[
                                                        "#FBBF24",
                                                        "#D97706",
                                                    ]}
                                               //     style={styles.goldBadge}
                                                >
                                                    <Text
                                                        style={styles.coinText}
                                                    >
                                                        $
                                                    </Text>
                                                </LinearGradient>
                                            ) : (
                                                <Award
                                                    size={22}
                                                    color="#5D45F9"
                                                    fill="#C7D2FE"
                                                />
                                            )}
                                        </LinearGradient>

                                        <View style={styles.rewardInfo}>
                                            <Text style={styles.rewardTitle}>
                                                {reward.title}
                                            </Text>
                                            <Text
                                                style={styles.rewardDesc}
                                                numberOfLines={1}
                                            >
                                                {reward.description}
                                            </Text>
                                        </View>
                                    </View>

                                    {reward.claimed ? (
                                        <View style={styles.claimedButton}>
                                            <Text style={styles.claimedText}>
                                                Đã nhận
                                            </Text>
                                        </View>
                                    ) : (
                                        <TouchableOpacity
                                            style={styles.claimButton}
                                            activeOpacity={0.8}
                                            onPress={() =>
                                                handleClaimReward(reward.id)
                                            }
                                        >
                                            <LinearGradient
                                                colors={["#FF9B42", "#FF4F6B"]}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 0 }}
                                                style={styles.claimBtnGradient}
                                            >
                                                <Text
                                                    style={
                                                        styles.claimButtonText
                                                    }
                                                >
                                                    Nhận
                                                </Text>
                                            </LinearGradient>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            ))}
                        </View>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

const screenHeight = Dimensions.get("window").height;

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(15, 12, 38, 0.45)",
        justifyContent: "flex-end",
    },
    modalContainer: {
        backgroundColor: "#FFFFFF",
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        maxHeight: screenHeight * 0.85,
        paddingBottom: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    topIndicator: {
        width: 44,
        height: 5,
        backgroundColor: "#E2E8F0",
        borderRadius: 100,
        alignSelf: "center",
        marginTop: 10,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#F1F5F9",
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: "800",
        color: "#1A202C",
        marginBottom: 2,
    },
    headerSubtitle: {
        fontSize: 12,
        color: "#718096",
        fontWeight: "500",
    },
    closeButton: {
        padding: 8,
        borderRadius: 100,
        backgroundColor: "#F8FAFC",
        borderWidth: 1,
        borderColor: "#E2E8F0",
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: 16,
    },
    streakCard: {
        borderRadius: 26,
        padding: 2,
        shadowColor: "#FF5274",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.28,
        shadowRadius: 12,
        elevation: 6,
        marginBottom: 16,
    },
    glassInnerBorder: {
        backgroundColor: "rgba(255, 255, 255, 0.08)",
        borderRadius: 24,
        paddingVertical: 24,
        paddingHorizontal: 20,
        alignItems: "center",
        justifyContent: "center",
    },
    flameIconBg: {
        backgroundColor: "rgba(255, 255, 255, 0.25)",
        borderRadius: 100,
        padding: 12,
        marginBottom: 10,
        borderWidth: 1.5,
        borderColor: "rgba(255, 255, 255, 0.3)",
    },
    streakTitle: {
        color: "#FFFFFF",
        fontSize: 28,
        fontWeight: "900",
        marginBottom: 6,
        textShadowColor: "rgba(0,0,0,0.15)",
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    streakDesc: {
        color: "#FFF0F2",
        fontSize: 13,
        fontWeight: "600",
        textAlign: "center",
        opacity: 0.95,
        paddingHorizontal: 10,
        lineHeight: 18,
    },
    infoBox: {
        flexDirection: "row",
        backgroundColor: "#F5F3FF",
        borderWidth: 1,
        borderColor: "#E0DBFF",
        borderRadius: 20,
        padding: 14,
        alignItems: "center",
        gap: 12,
        marginBottom: 24,
    },
    infoIconBg: {
        borderRadius: 100,
        padding: 6,
        alignItems: "center",
        justifyContent: "center",
    },
    infoText: {
        flex: 1,
        fontSize: 12,
        color: "#5D45F9",
        lineHeight: 17,
        fontWeight: "600",
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "800",
        color: "#1A202C",
        marginBottom: 16,
    },
    milestoneRow: {
        paddingRight: 10,
        gap: 16,
    },
    milestoneItem: {
        alignItems: "center",
        width: 72,
    },
    circle: {
        width: 56,
        height: 56,
        borderRadius: 100,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 8,
    },
    circleCompleted: {
        borderWidth: 2,
        borderColor: "#7B4FFF",
        shadowColor: "#7B4FFF",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 2,
    },
    circleActive: {
        backgroundColor: "#FF8E3C",
        borderWidth: 3,
        borderColor: "#FFFFFF",
        shadowColor: "#FF8E3C",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.45,
        shadowRadius: 6,
        elevation: 5,
    },
    circleActiveInner: {
        width: "100%",
        height: "100%",
        borderRadius: 100,
        alignItems: "center",
        justifyContent: "center",
    },
    circleLocked: {
        backgroundColor: "#F8FAFC",
        borderWidth: 1.5,
        borderColor: "#E2E8F0",
    },
    activeText: {
        fontSize: 19,
        fontWeight: "900",
        color: "#FF7E40",
    },
    milestoneLabel: {
        fontSize: 11,
        fontWeight: "600",
        color: "#A0AEC0",
    },
    activeLabel: {
        color: "#FF7E40",
        fontWeight: "800",
    },
    completedLabel: {
        color: "#5D45F9",
        fontWeight: "700",
    },
    rewardCard: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        borderWidth: 1.5,
        borderColor: "#F1F5F9",
        borderRadius: 22,
        padding: 14,
        marginBottom: 12,
        shadowColor: "#1A202C",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 6,
        elevation: 2,
    },
    rewardLeft: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
        gap: 14,
    },
    rewardIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 100,
        alignItems: "center",
        justifyContent: "center",
    },
    coinBadge: {
        width: 32,
        height: 32,
        borderRadius: 100,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#D97706",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 2,
        borderWidth: 1,
        borderColor: "#FFFbeb",
    },
    coinText: {
        fontSize: 17,
        fontWeight: "900",
        color: "#FFFFFF",
    },
    rewardInfo: {
        flex: 1,
    },
    rewardTitle: {
        fontSize: 15,
        fontWeight: "800",
        color: "#1A202C",
        marginBottom: 2,
    },
    rewardDesc: {
        fontSize: 11,
        color: "#718096",
        fontWeight: "500",
    },
    claimButton: {
        borderRadius: 100,
        overflow: "hidden",
        shadowColor: "#FF5274",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 6,
        elevation: 3,
    },
    claimBtnGradient: {
        paddingVertical: 9,
        paddingHorizontal: 22,
        alignItems: "center",
        justifyContent: "center",
    },
    claimButtonText: {
        color: "#FFFFFF",
        fontSize: 13,
        fontWeight: "800",
    },
    claimedButton: {
        backgroundColor: "#F1F5F9",
        paddingVertical: 9,
        paddingHorizontal: 18,
        borderRadius: 100,
        borderWidth: 1,
        borderColor: "#E2E8F0",
    },
    claimedText: {
        color: "#A0AEC0",
        fontSize: 13,
        fontWeight: "700",
    },
});
export {};
