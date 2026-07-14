import React from "react";
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    useWindowDimensions,
    View,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useForgotPassword } from "../hooks/useForgotPassword";
import colors from "../../../theme/colors";
import typography from "../../../theme/typography";
import Mascot from "../../../components/Mascot";
import AppBackground from "../../../components/layout/AppBackground";

const text = {
    headline: "Xác thực OTP",
    sent: "Mã xác thực đã được gửi tới",
    
    subtitle: (length: number) =>
        `Vui lòng nhập mã OTP gồm ${length} số \n để đặt lại mật khẩu của bạn.`,
    confirm: "Xác thực",
    confirming: "Đang xác thực...",
    noCode: "Chưa nhận được mã?",
    resend: "Gửi lại mã",
};

interface ForgotPasswordOtpScreenProps {
    length?: number;
}

export default function ForgotPasswordOtpScreen({
    length = 6,
}: ForgotPasswordOtpScreenProps = {}) {
    const { email: paramEmail } = useLocalSearchParams<{ email: string }>();
    const emailToShow = paramEmail || "example@gmail.com";

    const insets = useSafeAreaInsets();
    const { width: screenWidth } = useWindowDimensions();

    const {
        otp,
        otpError,
        otpCountdown,
        isLoading,
        refs,
        handleOtpChange,
        handleOtpKeyPress,
        handleVerifyOtp,
        handleResendOtp,
        formatCountdown,
    } = useForgotPassword(emailToShow, "", length);

    // Calculate dynamic responsive width and height for OTP input boxes
    const gap = 8;
    const paddingHorizontal = 28;
    const totalGaps = length - 1;
    const availableWidth = screenWidth - (paddingHorizontal * 2);
    const calculatedWidth = (availableWidth - (totalGaps * gap)) / length;
    const boxWidth = Math.min(48, calculatedWidth);
    const boxHeight = boxWidth * 1.25;
    const fontSize = Math.max(16, Math.min(22, Math.floor(boxWidth * 0.45)));

    return (
        <View style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                style={styles.keyboardAvoid}
            >
                <ScrollView
                    bounces={false}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={[
                        styles.scrollContainer,
                        {
                            paddingTop: Math.max(insets.top, 20),
                            paddingBottom: Math.max(insets.bottom, 20),
                            justifyContent: "center",
                        },
                    ]}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Background Motifs (session-randomized) */}
                    <AppBackground />

                    {/* Mascot Section */}
                    <View style={styles.mascotContainer}>
                        <Mascot expression="thinking" width={100} height={100} />
                    </View>

                    {/* Headline */}
                    <View style={styles.headerContainer}>
                        <Text style={styles.headlineText}>{text.headline}</Text>
                        <Text style={styles.subText}>
                            {text.sent}{"\n"}
                            <Text style={styles.emailText}>{emailToShow}</Text>
                        </Text>
                    </View>

                    {/* Form Container */}
                    <View style={styles.formContainer}>
                       
                        <Text style={styles.cardSubtitle}>
                            {text.subtitle(length)}
                        </Text>

                        {/* OTP Boxes */}
                        <View style={[styles.otpRow, { gap }]}>
                            {otp.map((digit, index) => (
                                <TextInput
                                    key={index}
                                    ref={(ref) => {
                                        refs.current[index] = ref;
                                    }}
                                    value={digit}
                                    onChangeText={(value) =>
                                        handleOtpChange(value, index)
                                    }
                                    onKeyPress={(e) => handleOtpKeyPress(e, index)}
                                    keyboardType="numeric"
                                    maxLength={1}
                                    style={[
                                        styles.otpBox,
                                        {
                                            width: boxWidth,
                                            height: boxHeight,
                                            fontSize,
                                        },
                                        digit && styles.otpBoxFilled,
                                    ]}
                                />
                            ))}
                        </View>

                        {otpError ? (
                            <Text style={styles.errorText}>{otpError}</Text>
                        ) : null}

                        {/* Submit Button */}
                        <Pressable
                            style={[
                                styles.primaryButton,
                                isLoading && styles.disabled,
                            ]}
                            onPress={handleVerifyOtp}
                            disabled={isLoading}
                        >
                            <Text style={styles.primaryText}>
                                {isLoading ? text.confirming : text.confirm}
                            </Text>
                        </Pressable>

                        {/* Resend Row */}
                        <View style={styles.resendRow}>
                            <Text style={styles.resendText}>{text.noCode}</Text>
                            <Pressable
                                onPress={handleResendOtp}
                                disabled={otpCountdown > 0 || isLoading}
                            >
                                <Text style={styles.resendLink}>
                                    {otpCountdown > 0
                                        ? `${text.resend} (${formatCountdown()})`
                                        : text.resend}
                                </Text>
                            </Pressable>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    keyboardAvoid: {
        flex: 1,
    },
    scrollContainer: {
        flexGrow: 1,
        backgroundColor: colors.background,
        paddingHorizontal: 28,
        position: "relative",
    },
    mascotContainer: {
        alignItems: "center",
        justifyContent: "center",
        marginTop: 10,
        marginBottom: 16,
    },
    headerContainer: {
        marginBottom: 16,
    },
    headlineText: {
        ...typography.h2,
        color: colors.accent,
        textAlign: "center",
        marginBottom: 8,
    },
    subText: {
        ...typography.bodyMediumMedium,
        color: colors.textMuted,
        lineHeight: 22,
        textAlign: "center",
    },
    emailText: {
        ...typography.bodyMediumBold,
        color: colors.primary,
    },
    formContainer: {
    },
    cardTitle: {
        ...typography.h3,
        color: colors.textDark,
        textAlign: "center",
        marginBottom: 6,
    },
    cardSubtitle: {
        ...typography.bodyMedium,
        color: colors.textMuted,
        textAlign: "center",
        marginBottom: 16,
    },
    otpRow: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
        marginBottom: 16,
    },
    otpBox: {
        borderRadius: 14,
        backgroundColor: "rgba(0, 0, 0, 0.05)",
        borderWidth: 1.5,
        borderColor: "rgba(0, 0, 0, 0.1)",
        textAlign: "center",
        fontWeight: "800",
        color: colors.textDark,
        padding: 0,
    },
    otpBoxFilled: {
        backgroundColor: colors.inputBackground,
        borderColor: colors.primary,
        color: colors.textDark,
    },
    errorText: {
        ...typography.bodySmallSemiBold,
        color: colors.textError,
        textAlign: "center",
        marginBottom: 16,
    },
    primaryButton: {
        height: 56,
        borderRadius: 28,
        backgroundColor: colors.primary,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 5,
        elevation: 4,
        marginTop: 8,
    },
    primaryText: {
        ...typography.bodyLargeBold,
        color: colors.textLight,
    },
    disabled: {
        opacity: 0.6,
    },
    resendRow: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginTop: 16,
        gap: 6,
    },
    resendText: {
        ...typography.bodyMedium,
        color: colors.textMuted,
    },
    resendLink: {
        ...typography.bodyMediumBold,
        color: colors.primary,
    },
});
