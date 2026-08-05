import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { colors, radii, spacing, typography } from "@/theme";
import { useJoinPvpRoomMutation } from "../services/pvpApi";
import type { PvpRoom } from "../types";

interface JoinRoomTabProps {
    onRoomJoined: (room: PvpRoom) => void;
}

export function JoinRoomTab({ onRoomJoined }: JoinRoomTabProps) {
    const [code, setCode] = useState("");
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const [joinRoomMut, { isLoading }] = useJoinPvpRoomMutation();

    const handleJoin = async () => {
        if (!code.trim() || code.trim().length !== 4) {
            setErrorMsg("Vui lòng nhập mã phòng 4 chữ số");
            return;
        }

        try {
            setErrorMsg(null);
            const room = await joinRoomMut({ roomCode: code.trim() }).unwrap();
            onRoomJoined(room);
        } catch (err: any) {
            console.error("Failed to join room:", err);
            setErrorMsg(err?.data?.error ?? err?.message ?? "Không thể vào phòng");
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Nhập mã phòng thi đấu</Text>

            <TextInput
                style={styles.codeInput}
                value={code}
                onChangeText={(text) => {
                    setCode(text.replace(/[^0-9]/g, "").slice(0, 4));
                    setErrorMsg(null);
                }}
                placeholder="1234"
                placeholderTextColor={colors.neutral400}
                keyboardType="number-pad"
                maxLength={4}
            />

            {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

            <TouchableOpacity
                style={[styles.submitButton, (isLoading || code.length !== 4) && styles.buttonDisabled]}
                onPress={handleJoin}
                disabled={isLoading || code.length !== 4}
            >
                {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" />
                ) : (
                    <Text style={styles.submitButtonText}>Vào phòng</Text>
                )}
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: spacing.lg,
        alignItems: "center",
    },
    title: {
        fontSize: 22,
        fontFamily: typography.fonts.extraBold,
        color: colors.neutral900,
        marginBottom: spacing.lg,
    },
    codeInput: {
        fontSize: 36,
        letterSpacing: 12,
        textAlign: "center",
        color: colors.primary700,
        backgroundColor: colors.neutral100,
        borderWidth: 2,
        borderColor: colors.primary500,
        borderRadius: radii.container,
        width: 220,
        paddingVertical: spacing.md,
        marginBottom: spacing.md,
        fontFamily: typography.fonts.bold,
    },
    errorText: {
        fontSize: 13,
        fontFamily: typography.fonts.regular,
        color: colors.error600,
        marginBottom: spacing.sm,
    },
    submitButton: {
        backgroundColor: colors.primary600,
        borderRadius: radii.pill,
        paddingVertical: spacing.md,
        width: "100%",
        alignItems: "center",
        marginTop: spacing.md,
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    submitButtonText: {
        fontSize: 15,
        fontFamily: typography.fonts.medium,
        color: "#FFFFFF",
    },
});
