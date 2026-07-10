import React from "react";
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { router } from "expo-router";
import { ArrowLeft, Mail } from "lucide-react-native";
import { useForgotPassword } from "../hooks/useForgotPassword";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Input from "../../../components/Input";
import colors from "../../../theme/colors";
import typography from "../../../theme/typography";
import Mascot from "../../../components/Mascot";
import HistoricalBackground from "../../../components/layout/HistoricalBackground";

const text = {
    headline: "Quên mật khẩu",
    description: "Nhập địa chỉ email đăng ký để nhận mã xác thực (OTP).",
    email: "Địa chỉ Email",
    emailPlaceholder: "Nhập địa chỉ email của bạn",
    send: "Gửi mã xác thực",
    sending: "Đang gửi...",
    backLogin: "Quay lại Đăng nhập",
};

export default function ForgotPasswordEmailScreen() {
    const { email, setEmail, emailError, isLoading, handleSendOtp } =
        useForgotPassword();
    const insets = useSafeAreaInsets();

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.keyboardAvoid}
        >
            <ScrollView
                bounces={false}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={[
                    styles.scrollContainer,
                    {
                        paddingTop: Math.max(insets.top, 20),
                        paddingBottom: Math.max(insets.bottom, 20),
                        justifyContent: "center",
                    },
                ]}
            >
                {/* Historical Background Motifs */}
                <HistoricalBackground />

                {/* Mascot Section */}
                <View style={styles.mascotContainer}>
                    <Mascot expression="thinking" width={100} height={100} />
                </View>

                {/* Welcome Heading */}
                <View style={styles.headerContainer}>
                    <Text style={styles.headlineText}>{text.headline}</Text>
                    <Text style={styles.subText}>{text.description}</Text>
                </View>

                {/* Form Inputs Container */}
                <View style={styles.formContainer}>
                    <View style={styles.inputGroup}>
                        <Input
                            icon={Mail}
                            placeholder={text.emailPlaceholder}
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            editable={!isLoading}
                            style={styles.customInput}
                        />
                        {emailError ? (
                            <Text style={styles.fieldErrorText}>{emailError}</Text>
                        ) : null}
                    </View>

                    {/* Submit Button */}
                    <Pressable
                        style={[
                            styles.primaryButton,
                            isLoading && styles.disabled,
                        ]}
                        onPress={handleSendOtp}
                        disabled={isLoading}
                    >
                        <Text style={styles.primaryButtonText}>
                            {isLoading ? text.sending : text.send}
                        </Text>
                    </Pressable>

                    {/* Back to Login */}
                    <Pressable
                        style={styles.backLogin}
                        onPress={() => router.replace("/(1_auth)/1_1_login")}
                    >
                        <ArrowLeft size={16} color={colors.primary} />
                        <Text style={styles.backLoginText}>
                            {text.backLogin}
                        </Text>
                    </Pressable>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    keyboardAvoid: {
        flex: 1,
        backgroundColor: colors.background,
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
    formContainer: {
    },
    inputGroup: {
        marginBottom: 12,
    },
    customInput: {
        backgroundColor: colors.inputBackground,
        color: colors.textDark,
        borderRadius: 30,
    },
    fieldErrorText: {
        ...typography.bodySmallSemiBold,
        color: colors.textError,
        marginTop: 6,
        paddingLeft: 4,
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
        marginBottom: 12,
    },
    primaryButtonText: {
        ...typography.bodyLargeBold,
        color: colors.textLight,
    },
    disabled: {
        opacity: 0.6,
    },
    backLogin: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        marginTop: 8,
        marginBottom: 12,
    },
    backLoginText: {
        ...typography.bodyLargeBold,
        color: colors.primary,
    },
});
