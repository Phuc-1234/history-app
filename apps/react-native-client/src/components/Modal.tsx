import React from "react";
import {
    Modal as RNModal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Pressable,
} from "react-native";
import Mascot, { MascotExpression } from "./Mascot";
import colors from "../theme/colors";
import typography from "../theme/typography";

interface CustomModalProps {
    visible: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel?: () => void;
    showMascot?: boolean;
    mascotExpression?: MascotExpression;
}

export function CustomModal({
    visible,
    title,
    message,
    confirmText = "Đồng ý",
    cancelText = "Hủy",
    onConfirm,
    onCancel,
    showMascot = false,
    mascotExpression = "focused",
}: CustomModalProps) {
    const handleClose = onCancel || onConfirm;
    const showCancel = !!onCancel;

    return (
        <RNModal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={handleClose}
        >
            <Pressable style={styles.overlay} onPress={handleClose}>
                <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
                    {showMascot && (
                        <Mascot
                            expression={mascotExpression}
                            width={100}
                            height={100}
                            style={styles.mascot}
                        />
                    )}
                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.message}>{message}</Text>
                    <View style={styles.buttons}>
                        {showCancel && (
                            <TouchableOpacity
                                style={styles.cancelBtn}
                                onPress={onCancel}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.cancelText}>{cancelText}</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            style={styles.confirmBtn}
                            onPress={onConfirm}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.confirmText}>{confirmText}</Text>
                        </TouchableOpacity>
                    </View>
                </Pressable>
            </Pressable>
        </RNModal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.45)",
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
    },
    card: {
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 24,
        width: "100%",
        maxWidth: 340,
        alignItems: "center",
        borderWidth: 1,
        borderColor: colors.borderMedium,
    },
    title: {
        fontFamily: typography.fonts.bold,
        fontSize: 18,
        color: colors.textDark,
        marginBottom: 10,
        textAlign: "center",
    },
    message: {
        fontFamily: typography.fonts.medium,
        fontSize: 14,
        color: colors.textSecondary,
        textAlign: "center",
        marginBottom: 24,
        lineHeight: 20,
    },
    buttons: {
        flexDirection: "row",
        width: "100%",
        gap: 12,
    },
    cancelBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: colors.surfaceVariant,
        alignItems: "center",
        justifyContent: "center",
    },
    cancelText: {
        fontFamily: typography.fonts.bold,
        fontSize: 15,
        color: colors.textSecondary,
    },
    confirmBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: colors.primary,
        alignItems: "center",
        justifyContent: "center",
    },
    confirmText: {
        fontFamily: typography.fonts.bold,
        fontSize: 15,
        color: colors.textLight,
    },
    mascot: {
        marginBottom: 16,
    },
});
