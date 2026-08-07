import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { colors, radii, spacing, typography } from "@/theme";
import { useCreatePvpRoomMutation } from "../services/pvpApi";
import type { PvpRoom } from "../types";

interface CreateRoomTabProps {
    onRoomCreated: (room: PvpRoom) => void;
}

export function CreateRoomTab({ onRoomCreated }: CreateRoomTabProps) {
    const [questionCount, setQuestionCount] = useState<number>(10);
    const [timePerQuestion, setTimePerQuestion] = useState<number>(15);
    const [autoNext, setAutoNext] = useState<boolean>(true);
    const [transitionInterval, setTransitionInterval] = useState<number>(5);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const [createRoomMut, { isLoading }] = useCreatePvpRoomMutation();

    const handleCreate = async () => {
        try {
            setErrorMsg(null);
            const room = await createRoomMut({
                questionCount,
                timePerQuestion,
                autoNext,
                transitionInterval,
            }).unwrap();
            onRoomCreated(room);
        } catch (err: any) {
            console.error("Failed to create room:", err);
            setErrorMsg(err?.data?.error ?? err?.message ?? "Không thể tạo phòng");
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Cấu hình phòng thi đấu</Text>

            {/* Question Count Selection */}
            <Text style={styles.label}>Số lượng câu hỏi</Text>
            <View style={styles.optionsRow}>
                {[5, 10, 15].map((cnt) => (
                    <TouchableOpacity
                        key={cnt}
                        style={[styles.pill, questionCount === cnt && styles.pillActive]}
                        onPress={() => setQuestionCount(cnt)}
                    >
                        <Text style={[styles.pillText, questionCount === cnt && styles.pillTextActive]}>
                            {cnt} câu
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Time Per Question Selection */}
            <Text style={styles.label}>Thời gian mỗi câu</Text>
            <View style={styles.optionsRow}>
                {[10, 15, 30].map((t) => (
                    <TouchableOpacity
                        key={t}
                        style={[styles.pill, timePerQuestion === t && styles.pillActive]}
                        onPress={() => setTimePerQuestion(t)}
                    >
                        <Text style={[styles.pillText, timePerQuestion === t && styles.pillTextActive]}>
                            {t} giây
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Auto Next Selection */}
            <Text style={styles.label}>Chuyển câu</Text>
            <View style={styles.optionsRow}>
                {[
                    { key: true, label: "Tự động" },
                    { key: false, label: "Thủ công" },
                ].map((opt) => (
                    <TouchableOpacity
                        key={opt.key ? "auto" : "manual"}
                        style={[styles.pill, autoNext === opt.key && styles.pillActive]}
                        onPress={() => setAutoNext(opt.key)}
                    >
                        <Text style={[styles.pillText, autoNext === opt.key && styles.pillTextActive]}>
                            {opt.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Transition Interval Selection */}
            <Text style={styles.label}>Thời gian chờ chuyển câu</Text>
            <View style={styles.optionsRow}>
                {[3, 5, 8, 12].map((sec) => (
                    <TouchableOpacity
                        key={sec}
                        style={[styles.pill, transitionInterval === sec && styles.pillActive]}
                        onPress={() => setTransitionInterval(sec)}
                    >
                        <Text style={[styles.pillText, transitionInterval === sec && styles.pillTextActive]}>
                            {sec} giây
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

            <TouchableOpacity
                style={[styles.submitButton, isLoading && styles.buttonDisabled]}
                onPress={handleCreate}
                disabled={isLoading}
            >
                {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" />
                ) : (
                    <Text style={styles.submitButtonText}>Tạo phòng mới</Text>
                )}
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: spacing.lg,
    },
    title: {
        fontSize: 22,
        fontFamily: typography.fonts.extraBold,
        color: colors.neutral900,
        marginBottom: spacing.md,
        textAlign: "center",
    },
    label: {
        fontSize: 14,
        fontFamily: typography.fonts.medium,
        color: colors.neutral700,
        marginTop: spacing.md,
        marginBottom: spacing.xs,
    },
    optionsRow: {
        flexDirection: "row",
        gap: spacing.sm,
    },
    pill: {
        flex: 1,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: radii.pill,
        borderWidth: 1,
        borderColor: colors.neutral300,
        backgroundColor: colors.neutral100,
        alignItems: "center",
    },
    pillActive: {
        backgroundColor: colors.primary600,
        borderColor: colors.primary600,
    },
    pillText: {
        fontSize: 14,
        fontFamily: typography.fonts.medium,
        color: colors.neutral700,
    },
    pillTextActive: {
        color: "#FFFFFF",
    },
    errorText: {
        fontSize: 13,
        fontFamily: typography.fonts.regular,
        color: colors.error600,
        marginTop: spacing.sm,
    },
    submitButton: {
        backgroundColor: colors.primary600,
        borderRadius: radii.pill,
        paddingVertical: spacing.md,
        alignItems: "center",
        marginTop: spacing.xl,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    submitButtonText: {
        fontSize: 15,
        fontFamily: typography.fonts.medium,
        color: "#FFFFFF",
    },
});
