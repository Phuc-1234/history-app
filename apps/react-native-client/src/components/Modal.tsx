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
        backgroundColor: "#FFFFFF",
        borderRadius: 24,
        padding: 24,
        width: "100%",
        maxWidth: 340,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 5,
    },
    title: {
        fontSize: 18,
        fontWeight: "800",
        color: "#1C1C1E",
        marginBottom: 10,
        textAlign: "center",
    },
    message: {
        fontSize: 14,
        color: "#718096",
        textAlign: "center",
        marginBottom: 24,
        lineHeight: 20,
        fontWeight: "500",
    },
    buttons: {
        flexDirection: "row",
        width: "100%",
        gap: 12,
    },
    cancelBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 16,
        backgroundColor: "#F3F4F6",
        alignItems: "center",
        justifyContent: "center",
    },
    cancelText: {
        fontSize: 15,
        fontWeight: "700",
        color: "#4B5563",
    },
    confirmBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 16,
        backgroundColor: "#5D45F9",
        alignItems: "center",
        justifyContent: "center",
    },
    confirmText: {
        fontSize: 15,
        fontWeight: "700",
        color: "#FFFFFF",
    },
    mascot: {
        marginBottom: 16,
    },
});
