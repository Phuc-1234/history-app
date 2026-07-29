import React, { useState, useEffect, useRef } from "react";
import {
    Modal as RNModal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Pressable,
    TextInput,
    ActivityIndicator,
} from "react-native";
import { Mail } from "lucide-react-native";
import colors from "../theme/colors";
import typography from "../theme/typography";

interface OtpModalProps {
    visible: boolean;
    email: string;
    onClose: () => void;
    onVerify: (otp: string) => Promise<void>;
    onResend?: () => Promise<void>;
    error?: string | null;
    isLoading?: boolean;
}

const OTP_LENGTH = 6;
const RESEND_INTERVAL = 60;

export function OtpModal({
    visible,
    email,
    onClose,
    onVerify,
    onResend,
    error,
    isLoading = false,
}: OtpModalProps) {
    const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
    const [localError, setLocalError] = useState<string | null>(null);
    const [countdown, setCountdown] = useState(RESEND_INTERVAL);
    const inputRefs = useRef<Array<TextInput | null>>([]);

    useEffect(() => {
        if (visible) {
            setOtp(Array(OTP_LENGTH).fill(""));
            setLocalError(null);
            setCountdown(RESEND_INTERVAL);
            setTimeout(() => {
                inputRefs.current[0]?.focus();
            }, 150);
        }
    }, [visible]);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (visible && countdown > 0) {
            timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
        }
        return () => clearTimeout(timer);
    }, [visible, countdown]);

    const handleOtpChange = (value: string, index: number) => {
        setLocalError(null);
        const cleanVal = value.replace(/[^0-9]/g, "");

        if (cleanVal.length > 1) {
            // Handle paste action
            const chars = cleanVal.slice(0, OTP_LENGTH).split("");
            const nextOtp = [...otp];
            chars.forEach((char, i) => {
                if (index + i < OTP_LENGTH) {
                    nextOtp[index + i] = char;
                }
            });
            setOtp(nextOtp);
            const nextIndex = Math.min(index + chars.length, OTP_LENGTH - 1);
            inputRefs.current[nextIndex]?.focus();
            return;
        }

        const nextOtp = [...otp];
        nextOtp[index] = cleanVal;
        setOtp(nextOtp);

        if (cleanVal && index < OTP_LENGTH - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyPress = (e: any, index: number) => {
        if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleSubmit = async () => {
        const fullOtp = otp.join("");
        if (fullOtp.length < OTP_LENGTH) {
            setLocalError(`Vui lòng nhập đủ ${OTP_LENGTH} chữ số OTP.`);
            return;
        }
        setLocalError(null);
        await onVerify(fullOtp);
    };

    const handleResend = async () => {
        if (countdown > 0 || !onResend) return;
        setCountdown(RESEND_INTERVAL);
        setOtp(Array(OTP_LENGTH).fill(""));
        setLocalError(null);
        await onResend();
    };

    const displayError = error || localError;

    return (
        <RNModal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <Pressable style={styles.overlay} onPress={onClose}>
                <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
                    <View style={styles.iconContainer}>
                        <Mail color={colors.primary} size={32} />
                    </View>

                    <Text style={styles.title}>Xác thực Email</Text>
                    <Text style={styles.message}>
                        Mã OTP đã được gửi đến{"\n"}
                        <Text style={styles.emailText}>{email}</Text>
                    </Text>

                    <View style={styles.otpRow}>
                        {otp.map((digit, index) => (
                            <TextInput
                                key={index}
                                ref={(ref) => {
                                    inputRefs.current[index] = ref;
                                }}
                                style={[
                                    styles.otpInput,
                                    digit ? styles.otpInputFilled : null,
                                    displayError ? styles.otpInputError : null,
                                ]}
                                value={digit}
                                onChangeText={(val) => handleOtpChange(val, index)}
                                onKeyPress={(e) => handleKeyPress(e, index)}
                                keyboardType="number-pad"
                                maxLength={6}
                                selectTextOnFocus
                            />
                        ))}
                    </View>

                    {displayError ? <Text style={styles.errorText}>{displayError}</Text> : null}

                    <View style={styles.resendContainer}>
                        {countdown > 0 ? (
                            <Text style={styles.resendTimerText}>
                                Gửi lại mã sau <Text style={styles.boldTimer}>{countdown}s</Text>
                            </Text>
                        ) : (
                            <TouchableOpacity onPress={handleResend} activeOpacity={0.7}>
                                <Text style={styles.resendLinkText}>Gửi lại mã OTP</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    <View style={styles.buttons}>
                        <TouchableOpacity
                            style={styles.cancelBtn}
                            onPress={onClose}
                            activeOpacity={0.8}
                            disabled={isLoading}
                        >
                            <Text style={styles.cancelText}>Hủy</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.confirmBtn, isLoading && styles.disabledBtn]}
                            onPress={handleSubmit}
                            activeOpacity={0.8}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color={colors.textLight} size="small" />
                            ) : (
                                <Text style={styles.confirmText}>Xác nhận</Text>
                            )}
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
        padding: 20,
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
    iconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: colors.surfaceVariant,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 16,
    },
    title: {
        fontFamily: typography.fonts.bold,
        fontSize: 18,
        color: colors.textDark,
        marginBottom: 8,
        textAlign: "center",
    },
    message: {
        fontFamily: typography.fonts.medium,
        fontSize: 14,
        color: colors.textSecondary,
        textAlign: "center",
        marginBottom: 20,
        lineHeight: 20,
    },
    emailText: {
        fontFamily: typography.fonts.bold,
        color: colors.textDark,
    },
    otpRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        width: "100%",
        marginBottom: 12,
    },
    otpInput: {
        width: 42,
        height: 48,
        borderRadius: 8,
        borderWidth: 1.5,
        borderColor: colors.borderMedium,
        backgroundColor: colors.background,
        textAlign: "center",
        fontSize: 20,
        fontFamily: typography.fonts.bold,
        color: colors.textDark,
    },
    otpInputFilled: {
        borderColor: colors.primary,
        backgroundColor: colors.surface,
    },
    otpInputError: {
        borderColor: colors.error,
    },
    errorText: {
        fontFamily: typography.fonts.medium,
        fontSize: 13,
        color: colors.error,
        marginBottom: 12,
        textAlign: "center",
    },
    resendContainer: {
        marginBottom: 20,
        alignItems: "center",
    },
    resendTimerText: {
        fontFamily: typography.fonts.medium,
        fontSize: 13,
        color: colors.textSecondary,
    },
    boldTimer: {
        fontFamily: typography.fonts.bold,
        color: colors.primary,
    },
    resendLinkText: {
        fontFamily: typography.fonts.bold,
        fontSize: 13,
        color: colors.primary,
        textDecorationLine: "underline",
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
    disabledBtn: {
        opacity: 0.7,
    },
    confirmText: {
        fontFamily: typography.fonts.bold,
        fontSize: 15,
        color: colors.textLight,
    },
});
