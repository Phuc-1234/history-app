import React, { useEffect, useState, useRef } from "react";
import { View, Text, Modal, StyleSheet, TouchableOpacity } from "react-native";
import { usePathname, useRouter } from "expo-router";
import { useSelector } from "react-redux";
import { Swords } from "lucide-react-native";
import { colors, radii, spacing, typography } from "@/theme";
import { useGetActivePvpRoomQuery, useLeavePvpRoomMutation } from "../services/pvpApi";

export function PvpActiveRoomPromptModal() {
    const router = useRouter();
    const pathname = usePathname();
    const isAuthenticated = useSelector((state: any) => !!state.auth?.token);
    const [visible, setVisible] = useState(false);
    const hasPromptedRef = useRef(false);

    const { data: activeRoom, isSuccess } = useGetActivePvpRoomQuery(undefined, {
        skip: !isAuthenticated,
    });
    const [leavePvpRoom] = useLeavePvpRoomMutation();

    useEffect(() => {
        if (isAuthenticated && isSuccess && activeRoom && !hasPromptedRef.current) {
            hasPromptedRef.current = true;
            setVisible(true);
        }
    }, [isAuthenticated, isSuccess, activeRoom]);

    if (!visible || !activeRoom || pathname === "/pvp") return null;

    const isMatchInProgress = activeRoom.status === "IN_PROGRESS";
    const statusText = isMatchInProgress ? "Đang thi đấu" : "Phòng chờ";

    const handleReturnToRoom = () => {
        setVisible(false);
        router.push("/pvp");
    };

    const handleLeaveRoom = async () => {
        try {
            await leavePvpRoom({ roomCode: activeRoom.code }).unwrap();
        } catch (err) {
            console.error("Failed to leave active room:", err);
        } finally {
            setVisible(false);
        }
    };

    const handleDismiss = () => {
        setVisible(false);
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={handleDismiss}
        >
            <View style={styles.overlay}>
                <View style={styles.modalCard}>
                    <View style={styles.iconContainer}>
                        <Swords size={32} color={colors.primary600 || "#C37938"} />
                    </View>
                    <Text style={styles.title}>Phòng thi đấu đang diễn ra</Text>
                    <Text style={styles.description}>
                        Bạn đang tham gia phòng #{activeRoom.code} ({statusText}). Bạn có muốn quay lại phòng thi đấu không?
                    </Text>

                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={handleReturnToRoom}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.primaryButtonText}>Quay lại phòng</Text>
                    </TouchableOpacity>

                    <View style={styles.secondaryActions}>
                        <TouchableOpacity
                            style={styles.leaveButton}
                            onPress={handleLeaveRoom}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.leaveButtonText}>Rời phòng</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.dismissButton}
                            onPress={handleDismiss}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.dismissButtonText}>Để sau</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "center",
        alignItems: "center",
        padding: spacing.lg,
    },
    modalCard: {
        width: "100%",
        maxWidth: 340,
        backgroundColor: "#FFFFFF",
        borderRadius: radii.lg,
        padding: spacing.xl,
        alignItems: "center",
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: radii.pill,
        backgroundColor: colors.primary100 || "#FDF3EA",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: spacing.md,
    },
    title: {
        ...typography.h3,
        color: colors.neutral900,
        textAlign: "center",
        marginBottom: spacing.xs,
    },
    description: {
        ...typography.bodyMedium,
        color: colors.neutral600,
        textAlign: "center",
        marginBottom: spacing.lg,
    },
    primaryButton: {
        width: "100%",
        backgroundColor: colors.primary600 || "#C37938",
        paddingVertical: spacing.md,
        borderRadius: radii.pill,
        alignItems: "center",
        marginBottom: spacing.sm,
    },
    primaryButtonText: {
        ...typography.labelLarge,
        color: "#FFFFFF",
        fontWeight: "700",
    },
    secondaryActions: {
        flexDirection: "row",
        justifyContent: "space-between",
        width: "100%",
        gap: spacing.sm,
    },
    leaveButton: {
        flex: 1,
        paddingVertical: spacing.sm,
        borderRadius: radii.pill,
        backgroundColor: colors.neutral100,
        alignItems: "center",
    },
    leaveButtonText: {
        ...typography.caption,
        color: colors.error600 || "#D9383A",
        fontWeight: "600",
    },
    dismissButton: {
        flex: 1,
        paddingVertical: spacing.sm,
        borderRadius: radii.pill,
        backgroundColor: colors.neutral100,
        alignItems: "center",
    },
    dismissButtonText: {
        ...typography.caption,
        color: colors.neutral700,
        fontWeight: "600",
    },
});
