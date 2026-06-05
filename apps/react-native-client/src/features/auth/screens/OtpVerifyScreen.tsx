import React, { useEffect, useRef } from "react";
import {
    Image,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { TopBarWrapper } from "@/features/top_bar";
import { useRegisterOtp } from "../hooks/useRegisterOtp"; // Path to your new custom hook

const text = {
    headline: "Xác thực tài khoản",
    sent: "Mã xác thực đăng ký đã được gửi đến email",
    enter: "Nhập mã OTP",
    subtitle: "Vui lòng nhập mã 6 số để kích hoạt tài khoản.",
    confirm: "Kích hoạt",
    confirming: "Đang xác thực...",
    noCode: "Chưa nhận được mã?",
    resend: "Gửi lại mã",
};

export default function RegisterOtpScreen() {
    const { email: paramEmail, autoSend } = useLocalSearchParams<{ 
        email: string; 
        autoSend?: string; 
    }>();
    const emailToShow = paramEmail || "example@gmail.com";

    const shouldAutoSend = autoSend === "true";
    const refs = useRef<Array<TextInput | null>>([]);

    const {
        otp,
        setOtp,
        otpError,
        otpCountdown,
        isLoading,
        handleVerifyOtp,
        handleResendOtp,
        formatCountdown,
    } = useRegisterOtp(emailToShow, shouldAutoSend);

    // Auto-focus first input box when screen loads
    useEffect(() => {
        const timer = setTimeout(() => refs.current[0]?.focus(), 100);
        return () => clearTimeout(timer);
    }, []);

    const onChange = (value: string, index: number) => {
        const clean = value.replace(/[^0-9]/g, "");
        const next = [...otp];
        
        next[index] = clean ? clean[clean.length - 1] : "";
        setOtp(next);
        
        // Dynamic Focus adjustments for 8 entries (index boundaries shift up to 7)
        if (clean && index < 7) {
            refs.current[index + 1]?.focus();
        }
    };

    // Backspace fallback navigation support tracker
    const onKeyPress = (e: any, index: number) => {
        if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
            refs.current[index - 1]?.focus();
        }
    };

    return (
        <TopBarWrapper>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.keyboardAvoid}
            >
                <ScrollView
                    contentContainerStyle={styles.screen}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.hero}>
                        <View style={styles.heroIcon}>
                            {/* Replaced ic_lock with a shield/verify concept asset reference if available */}
                            <Image
                                source={require("../../../../assets/images/ic_lock.png")}
                                style={styles.heroImage}
                                resizeMode="contain"
                            />
                        </View>
                        <Text style={styles.headline}>{text.headline}</Text>
                        <Text style={styles.heroDescription}>
                            {text.sent}
                            {"\n"}
                            <Text style={styles.emailText}>{emailToShow}</Text>
                        </Text>
                    </View>

                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>{text.enter}</Text>
                        <Text style={styles.cardSubtitle}>{text.subtitle}</Text>

                        <View style={styles.otpRow}>
                            {otp.map((digit, index) => (
                                <TextInput
                                    key={index}
                                    ref={(ref) => {
                                        refs.current[index] = ref;
                                    }}
                                    value={digit}
                                    onChangeText={(value) =>
                                        onChange(value, index)
                                    }
                                    onKeyPress={(e) => onKeyPress(e, index)}
                                    keyboardType="numeric"
                                    maxLength={1}
                                    style={[
                                        styles.otpBox,
                                        digit && styles.otpBoxFilled,
                                    ]}
                                />
                            ))}
                        </View>

                        {otpError ? (
                            <Text style={styles.errorText}>{otpError}</Text>
                        ) : null}

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
        </TopBarWrapper>
    );
}

const styles = StyleSheet.create({
    keyboardAvoid: { flex: 1 },
    screen: { flexGrow: 1, backgroundColor: "#F8F6F3" },
    hero: {
        minHeight: 348,
        backgroundColor: "#5732DD",
        alignItems: "center",
        paddingTop: 42,
        paddingHorizontal: 26,
        borderBottomLeftRadius: 34,
        borderBottomRightRadius: 34,
    },
    heroIcon: {
        width: 90,
        height: 90,
        borderRadius: 45,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(255,255,255,0.13)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.28)",
        marginBottom: 26,
    },
    heroImage: { width: 38, height: 38 },
    headline: {
        color: "#FFFFFF",
        fontSize: 26,
        lineHeight: 34,
        fontWeight: "800",
        textAlign: "center",
    },
    heroDescription: {
        color: "#FFFFFF",
        opacity: 0.92,
        fontSize: 15,
        lineHeight: 22,
        textAlign: "center",
        marginTop: 8,
    },
    emailText: { fontWeight: "800" },
    card: {
        flex: 1,
        marginHorizontal: 14,
        marginTop: -28,
        backgroundColor: "#FFFFFF",
        borderRadius: 36,
        paddingHorizontal: 32,
        paddingTop: 54,
        paddingBottom: 40,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.14,
        shadowRadius: 24,
        elevation: 8,
    },
    cardTitle: {
        color: "#1D1B18",
        fontSize: 26,
        lineHeight: 34,
        fontWeight: "800",
        textAlign: "center",
    },
    cardSubtitle: {
        color: "#5F5B6B",
        fontSize: 16,
        lineHeight: 24,
        textAlign: "center",
        marginTop: 8,
        marginBottom: 62,
    },
    otpRow: {
        flexDirection: "row",
        gap: 2,
        justifyContent: "center",
        marginBottom: 34,
    },
    otpBox: {
        width: 48,
        height: 64,
        borderRadius: 22,
        backgroundColor: "#EFEEEC",
        textAlign: "center",
        fontSize: 20,
        fontWeight: "800",
        color: "#242330",
    },
    otpBoxFilled: {
        backgroundColor: "#F0ECFF",
        borderWidth: 1,
        borderColor: "#5732DD",
    },
    errorText: {
        color: "#E53E3E",
        fontSize: 12,
        textAlign: "center",
        marginBottom: 10,
    },
    primaryButton: {
        height: 56,
        borderRadius: 28,
        backgroundColor: "#4B32D9",
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#4B32D9",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 14,
        elevation: 7,
    },
    primaryText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },
    disabled: { opacity: 0.7 },
    resendRow: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginTop: 28,
        flexWrap: "wrap",
    },
    resendText: { color: "#4D4A5F", fontSize: 16 },
    resendLink: { color: "#4F32DD", fontSize: 16, fontWeight: "800" },
});
