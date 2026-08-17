import React from "react";
import {
    View,
    Text,
    Image,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
} from "react-native";
import { User, Lock, Mail } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

import Input from "../../../components/Input";
import Button from "../../../components/Button";
import useRegisterForm from "../hooks/useRegisterForm";
import useAuthForm from "../hooks/useAuthForm";
import colors from "../../../theme/colors";
import typography from "../../../theme/typography";
import AppBackground from "../../../components/layout/AppBackground";

export default function RegisterForm() {
    const {
        name,
        setName,
        email,
        setEmail,
        password,
        setPassword,
        confirmPassword,
        setConfirmPassword,
        nameError,
        emailError,
        passwordError,
        confirmPasswordError,
        isLoading,
        navigateToLogin,
        handleRegisterSubmit,
    } = useRegisterForm();

    const { handleGoogleLogin, handleFacebookLogin, isGoogleLoading, isFacebookLoading } = useAuthForm();
    const isAnyLoading = isLoading || isGoogleLoading || isFacebookLoading;

    const insets = useSafeAreaInsets();

    return (
        <KeyboardAvoidingView
            style={styles.keyboardAvoid}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
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
                    },
                ]}
            >
                {/* Background Motifs (session-randomized) */}
                <AppBackground />

                {/* Logo Section */}
                <View style={styles.logoContainer}>
                    <Image
                        source={require("../../../../assets/images/logo-main.png")}
                        style={styles.logoImage}
                        resizeMode="contain"
                    />
                   
                </View>

                {/* Welcome Heading */}
                <View style={styles.headerContainer}>
                    <Text style={styles.welcomeText}>Đăng ký tài khoản Sắc Sử</Text>
                </View>

                {/* Form Inputs Container */}
                <View style={styles.formContainer}>
                    {/* Name Input */}
                    <View style={styles.inputGroup}>
                        <Input
                            icon={User}
                            placeholder="Nhập họ và tên của bạn"
                            value={name}
                            autoCapitalize="words"
                            maxLength={30}
                            onChangeText={setName}
                            editable={!isAnyLoading}
                            style={styles.customInput}
                        />
                        {nameError ? (
                            <Text style={styles.fieldErrorText}>{nameError}</Text>
                        ) : null}
                    </View>

                    {/* Email Input */}
                    <View style={styles.inputGroup}>
                        <View style={styles.emailContainer}>
                            <Input
                                icon={Mail}
                                placeholder="Nhập địa chỉ email"
                                value={email}
                                onChangeText={(text) => setEmail(text.trim())}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                editable={!isAnyLoading}
                                // Thêm paddingRight vừa đủ
                                style={[styles.customInput, { paddingRight: (email.length > 0 && email.length < 15 && !email.includes("@")) ? 95 : 24 }]}
                            />
                            {email.length > 0 && email.length < 14 && !email.includes("@") && (
                                <View style={styles.ghostTextWrapper} pointerEvents="none">
                                    <Text style={styles.ghostEmailText}>@gmail.com</Text>
                                </View>
                            )}
                        </View>
                        {emailError ? (
                            <Text style={styles.fieldErrorText}>{emailError}</Text>
                        ) : null}
                    </View>

                    {/* Password Input */}
                    <View style={styles.inputGroup}>
                        <Input
                            icon={Lock}
                            placeholder="Nhập mật khẩu"
                            isPassword
                            value={password}
                            onChangeText={setPassword}
                            autoCapitalize="none"
                            editable={!isAnyLoading}
                            style={styles.customInput}
                        />
                        {passwordError ? (
                            <Text style={styles.fieldErrorText}>{passwordError}</Text>
                        ) : null}
                    </View>

                    {/* Confirm Password Input */}
                    <View style={styles.inputGroup}>
                        <Input
                            icon={Lock}
                            placeholder="Nhập lại mật khẩu"
                            isPassword
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            autoCapitalize="none"
                            editable={!isAnyLoading}
                            style={styles.customInput}
                        />
                        {confirmPasswordError ? (
                            <Text style={styles.fieldErrorText}>{confirmPasswordError}</Text>
                        ) : null}
                    </View>

                    {/* Register Button */}
                    <Button
                        title={isAnyLoading ? "Đang xử lý..." : "Đăng ký"}
                        variant="primary"
                        onPress={isAnyLoading ? () => {} : handleRegisterSubmit}
                        disabled={isAnyLoading}
                    />

                    {/* Divider */}
                    <View style={styles.dividerContainer}>
                        <View style={styles.line} />
                        <Text style={styles.dividerText}>Hoặc đăng ký bằng</Text>
                        <View style={styles.line} />
                    </View>

                    {/* Social Registration */}
                    <View style={styles.socialRow}>
                        <TouchableOpacity
                            style={styles.socialBtn}
                            activeOpacity={0.7}
                            onPress={handleGoogleLogin}
                            disabled={isAnyLoading}
                        >
                            <Svg width="18" height="18" viewBox="0 0 24 24">
                                <Path
                                    fill={colors.textDark}
                                    d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.13-5.136 4.13A5.727 5.727 0 0 1 8.24 12.8a5.727 5.727 0 0 1 5.751-5.73c2.44 0 4.296 1.1 5.074 2.1l3.22-3.22C20.165 3.9 17.26 2 13.991 2 7.92 2 3 6.92 3 13s4.92 11 10.991 11c6.28 0 10.459-4.41 10.459-10.636 0-.645-.06-1.08-.2-1.58H12.24z"
                                />
                            </Svg>
                            <Text style={styles.socialBtnText}>GOOGLE</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.socialBtn}
                            activeOpacity={0.7}
                            onPress={handleFacebookLogin}
                            disabled={isAnyLoading}
                        >
                            <Svg width="18" height="18" fill={colors.facebookBackground} viewBox="0 0 24 24">
                                <Path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                            </Svg>
                            <Text style={styles.socialBtnText}>FACEBOOK</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <Text style={styles.footerText}>
                            Đã có tài khoản?{" "}
                        </Text>
                        <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={navigateToLogin}
                            disabled={isAnyLoading}
                        >
                            <Text style={styles.loginText}>
                                Đăng nhập
                            </Text>
                        </TouchableOpacity>
                    </View>
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
    logoContainer: {
        alignItems: "center",
        justifyContent: "center",
        marginTop: 10,
        marginBottom: 16,
    },
    logoImage: {
        width: 120,
        height: 120,
    },
    logoSubtitle: {
        ...typography.bodyMediumSemiBold,
        color: colors.textMuted,
        marginTop: 6,
        textAlign: "center",
    },
    headerContainer: {
        marginBottom: 0,
    },
    welcomeText: {
        ...typography.h2,
        color: colors.accent,
        marginBottom: 6,
        textAlign: "center",
    },
    subText: {
        ...typography.bodyMediumMedium,
        color: colors.textMuted,
    },
    formContainer: {},
    inputGroup: {
        marginBottom: 12,
    },

    customInput: {
        backgroundColor: colors.inputBackground,
        color: colors.textDark,
        borderRadius: 30,
    },
    emailContainer: {
        position: "relative",
        justifyContent: "center",
    },
    ghostTextWrapper: {
        position: "absolute",
        right: 25,
        top: 0,
        bottom: 0,
        justifyContent: "center",
    },
    ghostEmailText: {
        ...typography.bodyLarge,
        color: colors.textPlaceholder,
        opacity: 0.6,
    },
    fieldErrorText: {
        ...typography.bodySmallSemiBold,
        color: colors.textError,
        marginTop: 6,
        paddingLeft: 4,
    },
    dividerContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginVertical: 16,
    },
    line: {
        flex: 1,
        height: 1,
        backgroundColor: colors.divider,
    },
    dividerText: {
        ...typography.bodySmall,
        color: colors.textMuted,
        paddingHorizontal: 16,
    },
    socialRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 12,
        marginBottom: 16,
    },
    socialBtn: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: colors.googleBorder,
        borderRadius: 28,
        height: 48,
        gap: 10,
        backgroundColor: "transparent",
    },
    socialBtnText: {
        ...typography.bodyMediumBold,
        color: colors.textDark,
        letterSpacing: 0.5,
    },
    footer: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginTop: 12,
        marginBottom: 16,
    },
    footerText: {
        ...typography.bodyMedium,
        color: colors.textMuted,
    },
    loginText: {
        ...typography.bodyMediumBold,
        color: colors.primary,
    },
});