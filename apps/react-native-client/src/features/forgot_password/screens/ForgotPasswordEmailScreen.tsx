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
import Mascot from "../../../components/Mascot";

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
                        paddingTop: Math.max(insets.top, 50),
                        paddingBottom: Math.max(insets.bottom, 20),
                        justifyContent: "center",
                    },
                ]}
            >
                {/* Abstract Background Shapes */}
                <View style={styles.bgShape1} pointerEvents="none" />
                <View style={styles.bgShape2} pointerEvents="none" />
                <View style={styles.bgShape3} pointerEvents="none" />

                {/* Mascot Section */}
                <View style={styles.mascotContainer}>
                    <Mascot expression="thinking" width={120} height={120} />
                </View>

                {/* Welcome Heading */}
                <View style={styles.headerContainer}>
                    <Text style={styles.headlineText}>{text.headline}</Text>
                    <Text style={styles.subText}>{text.description}</Text>
                </View>

                {/* Form Inputs Container */}
                <View style={styles.formContainer}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.fieldLabel}>{text.email}</Text>
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
    bgShape1: {
        position: "absolute",
        width: 140,
        height: 140,
        borderRadius: 40,
        backgroundColor: "rgba(184, 29, 24, 0.03)",
        transform: [{ rotate: "45deg" }],
        top: 60,
        left: -40,
    },
    bgShape2: {
        position: "absolute",
        width: 180,
        height: 60,
        borderRadius: 30,
        backgroundColor: "rgba(223, 155, 0, 0.03)",
        transform: [{ rotate: "-35deg" }],
        bottom: 150,
        right: -60,
    },
    bgShape3: {
        position: "absolute",
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: "rgba(184, 29, 24, 0.02)",
        top: "40%",
        right: -30,
    },
    mascotContainer: {
        alignItems: "center",
        justifyContent: "center",
        marginTop: 20,
        marginBottom: 24,
    },
    headerContainer: {
        marginBottom: 32,
    },
    headlineText: {
        color: colors.textDark,
        fontSize: 28,
        fontWeight: "800",
        textAlign: "center",
        marginBottom: 8,
    },
    subText: {
        color: colors.textMuted,
        fontSize: 15,
        lineHeight: 22,
        textAlign: "center",
    },
    formContainer: {
        flex: 1,
        maxHeight: 380,
    },
    inputGroup: {
        marginBottom: 18,
    },
    fieldLabel: {
        color: colors.textDark,
        fontSize: 15,
        fontWeight: "700",
        marginBottom: 8,
    },
    customInput: {
        backgroundColor: colors.inputBackground,
        color: colors.textDark,
        borderRadius: 30,
    },
    fieldErrorText: {
        color: colors.textError,
        fontSize: 13,
        fontWeight: "600",
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
        marginTop: 12,
        marginBottom: 20,
    },
    primaryButtonText: {
        color: colors.textLight,
        fontSize: 16,
        fontWeight: "800",
    },
    disabled: {
        opacity: 0.6,
    },
    backLogin: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        marginTop: 12,
        marginBottom: 20,
    },
    backLoginText: {
        color: colors.primary,
        fontSize: 15,
        fontWeight: "700",
    },
});
