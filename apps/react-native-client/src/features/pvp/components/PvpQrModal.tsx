import React, { useState } from "react";
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Clipboard,
    Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { QrCode, Copy, Check } from "lucide-react-native";
import QRCode from "react-native-qrcode-svg";
import { colors, radii, spacing, typography } from "@/theme";
import { API_BASE_URL } from "@/services/config";
import { toastService } from "@/services/toastService";

interface PvpQrModalProps {
    visible: boolean;
    onClose: () => void;
    roomCode: string;
}

export function PvpQrModal({ visible, onClose, roomCode }: PvpQrModalProps) {
    const [isCopied, setIsCopied] = useState(false);

    const inviteLink = `${API_BASE_URL}/pvp/${roomCode}`;

    const handleCopy = () => {
        Clipboard.setString(inviteLink);
        setIsCopied(true);
        toastService.show("Đã sao chép liên kết phòng!", "success");
        setTimeout(() => setIsCopied(false), 2000);
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <Pressable style={styles.backdrop} onPress={onClose} />
                <View style={styles.modalContent}>
                    {/* Header */}
                    <View style={styles.headerRow}>
                        <View style={styles.headerTitleContainer}>
                            <QrCode size={20} color={colors.primary} />
                            <Text style={styles.headerTitle}>Mã QR phòng</Text>
                        </View>
                        <TouchableOpacity
                            onPress={onClose}
                            style={styles.closeButton}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Ionicons name="close" size={22} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    {/* QR Code Frame (Offline Pure SVG) */}
                    <View style={styles.qrCard}>
                        <QRCode
                            value={inviteLink}
                            size={190}
                            color={colors.textDark || "#2B1D12"}
                            backgroundColor="#FFFFFF"
                        />
                    </View>

                    {/* Room Info */}
                    <View style={styles.codeBadge}>
                        <Text style={styles.codeBadgeLabel}>Mã phòng:</Text>
                        <Text style={styles.codeBadgeText}>{roomCode}</Text>
                    </View>

                    <Text style={styles.helperText}>
                        Quét mã QR để tham gia phòng thi đấu nhanh chóng
                    </Text>

                    {/* Copy Link Button */}
                    <TouchableOpacity
                        style={styles.copyButton}
                        onPress={handleCopy}
                        activeOpacity={0.8}
                    >
                        {isCopied ? (
                            <>
                                <Check size={16} color="#FFFFFF" />
                                <Text style={styles.copyButtonText}>Đã sao chép</Text>
                            </>
                        ) : (
                            <>
                                <Copy size={16} color="#FFFFFF" />
                                <Text style={styles.copyButtonText}>Sao chép liên kết</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.55)",
        justifyContent: "center",
        alignItems: "center",
        padding: spacing.xl,
    },
    backdrop: {
        ...StyleSheet.absoluteFill,
    },
    modalContent: {
        width: "100%",
        maxWidth: 340,
        backgroundColor: colors.surface,
        borderRadius: radii.container,
        padding: spacing.lg,
        borderWidth: 1.5,
        borderColor: colors.borderMedium,
        alignItems: "center",
    },
    headerRow: {
        width: "100%",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: spacing.md,
    },
    headerTitleContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
    },
    headerTitle: {
        fontFamily: typography.fonts.bold,
        fontSize: 16,
        color: colors.textPrimary,
    },
    closeButton: {
        padding: spacing.xxs,
    },
    qrCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: radii.container,
        borderWidth: 1,
        borderColor: colors.borderMedium,
        padding: spacing.md,
        alignItems: "center",
        justifyContent: "center",
        marginVertical: spacing.xs,
    },
    codeBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.xs,
        backgroundColor: colors.primary50,
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.md,
        borderRadius: radii.pill,
        borderWidth: 1,
        borderColor: colors.primary200,
        marginTop: spacing.md,
    },
    codeBadgeLabel: {
        fontFamily: typography.fonts.medium,
        fontSize: 13,
        color: colors.primary700,
    },
    codeBadgeText: {
        fontFamily: typography.fonts.bold,
        fontSize: 15,
        color: colors.primary800,
        letterSpacing: 2,
    },
    helperText: {
        fontFamily: typography.fonts.regular,
        fontSize: 13,
        color: colors.textMuted,
        textAlign: "center",
        marginTop: spacing.sm,
        marginBottom: spacing.md,
        lineHeight: 18,
    },
    copyButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.xs + 2,
        backgroundColor: colors.primary,
        borderRadius: radii.pill,
        paddingVertical: spacing.sm + 2,
        paddingHorizontal: spacing.xl,
        width: "100%",
    },
    copyButtonText: {
        fontFamily: typography.fonts.bold,
        fontSize: 14,
        color: "#FFFFFF",
    },
});
