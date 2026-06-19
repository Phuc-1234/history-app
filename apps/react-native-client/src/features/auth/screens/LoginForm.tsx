import React from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
} from "react-native";
import { User, Lock } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import Svg, { Path } from "react-native-svg";

import Input from "../../../components/Input";
import Button from "../../../components/Button";
import useAuthForm from "../hooks/useAuthForm";
import colors from "../../../theme/colors";

export default function LoginForm() {
    const {
        email,
        setEmail,
        password,
        setPassword,
        emailError,
        passwordError,
        isLoading,
        navigateToRegister,
        handleLoginSubmit,
        enterAsGuest,
        handleGoogleLogin,
        handleFacebookLogin,
    } = useAuthForm();

    const insets = useSafeAreaInsets();

    return (
        <KeyboardAvoidingView
            style={styles.keyboardAvoid}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <ScrollView
                bounces={false}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[
                    styles.scrollContainer,
                    {
                        paddingTop: Math.max(insets.top, 40),
                        paddingBottom: Math.max(insets.bottom, 20),
                    },
                ]}
            >
                {/* Abstract Background Shapes */}
                <View style={styles.bgShape1} pointerEvents="none" />
                <View style={styles.bgShape2} pointerEvents="none" />
                <View style={styles.bgShape3} pointerEvents="none" />

                {/* Logo Section */}
                <View style={styles.logoContainer}>
                    <Text style={styles.logoText}>Sắc Sử</Text>
                    <Text style={styles.logoSubtitle}>Ứng dụng học và làm đề lịch sử</Text>
                </View>

                {/* Welcome Heading */}
                <View style={styles.headerContainer}>
                    <Text style={styles.welcomeText}>Đăng Nhập</Text>
                    <Text style={styles.subText}>
                        Xin chào, chào mừng bạn trở lại!
                    </Text>
                </View>

                {/* Form Inputs Container */}
                <View style={styles.formContainer}>
                    {/* Email Input Field */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.fieldLabel}>Số điện thoại / Email</Text>
                        <View style={styles.emailContainer}>
                            <Input
                                value={email}
                                onChangeText={(text) => {
                                    setEmail(text.trim());
                                }}
                                icon={User}
                                placeholder="Nhập số điện thoại hoặc email"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                editable={!isLoading}
                                style={styles.customInput}
                            />
                            {email.length > 0 && !email.includes("@") && (
                                <View style={styles.ghostTextWrapper} pointerEvents="none">
                                    <Text style={styles.textMeasureHidden}>{email}</Text>
                                    <Text style={styles.ghostEmailText}>@gmail.com</Text>
                                </View>
                            )}
                        </View>
                        {emailError ? (
                            <Text style={styles.fieldErrorText}>{emailError}</Text>
                        ) : null}
                    </View>

                    {/* Password Input Field */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.fieldLabel}>Mật khẩu</Text>
                        <Input
                            value={password}
                            onChangeText={setPassword}
                            icon={Lock}
                            placeholder="Nhập mật khẩu của bạn"
                            isPassword
                            autoCapitalize="none"
                            editable={!isLoading}
                            style={styles.customInput}
                        />
                        {passwordError ? (
                            <Text style={styles.fieldErrorText}>{passwordError}</Text>
                        ) : null}
                    </View>

                    {/* Forgot Password Link */}
                    <TouchableOpacity
                        style={styles.forgotPassContainer}
                        activeOpacity={0.7}
                        onPress={() => router.push("/(1_auth)/1_3_forgot")}
                    >
                        <Text style={styles.forgotPassText}>
                            Quên mật khẩu?
                        </Text>
                    </TouchableOpacity>

                    {/* Submit Button */}
                    <Button
                        title={isLoading ? "Đang xử lý..." : "Đăng Nhập"}
                        variant="secondary"
                        onPress={handleLoginSubmit}
                        disabled={isLoading}
                    />

                    {/* Guest Login */}
                    <TouchableOpacity
                        style={styles.guestButton}
                        activeOpacity={0.7}
                        onPress={enterAsGuest}
                        disabled={isLoading}
                    >
                        <Text style={styles.guestText}>
                            Tiếp tục với tư cách Khách
                        </Text>
                    </TouchableOpacity>

                    {/* Divider */}
                    <View style={styles.dividerContainer}>
                        <View style={styles.line} />
                        <Text style={styles.dividerText}>Hoặc đăng nhập bằng</Text>
                        <View style={styles.line} />
                    </View>

                    {/* Social Login Buttons - styled as outlined buttons */}
                    <View style={styles.socialRow}>
                        <TouchableOpacity
                            style={styles.socialBtn}
                            activeOpacity={0.7}
                            onPress={handleGoogleLogin}
                            disabled={isLoading}
                        >
                            <Svg width="18" height="18" viewBox="0 0 24 24">
                                <Path
                                    fill="#FFFFFF"
                                    d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.13-5.136 4.13A5.727 5.727 0 0 1 8.24 12.8a5.727 5.727 0 0 1 5.751-5.73c2.44 0 4.296 1.1 5.074 2.1l3.22-3.22C20.165 3.9 17.26 2 13.991 2 7.92 2 3 6.92 3 13s4.92 11 10.991 11c6.28 0 10.459-4.41 10.459-10.636 0-.645-.06-1.08-.2-1.58H12.24z"
                                />
                            </Svg>
                            <Text style={styles.socialBtnText}>GOOGLE</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.socialBtn}
                            activeOpacity={0.7}
                            onPress={handleFacebookLogin}
                            disabled={isLoading}
                        >
                            <Svg width="18" height="18" fill="#FFFFFF" viewBox="0 0 24 24">
                                <Path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                            </Svg>
                            <Text style={styles.socialBtnText}>FACEBOOK</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <Text style={styles.footerText}>
                            Chưa có tài khoản?{" "}
                        </Text>
                        <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={navigateToRegister}
                            disabled={isLoading}
                        >
                            <Text style={styles.registerText}>
                                Đăng ký ngay
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
    bgShape1: {
        position: "absolute",
        width: 140,
        height: 140,
        borderRadius: 40,
        backgroundColor: "rgba(255, 255, 255, 0.08)",
        transform: [{ rotate: "45deg" }],
        top: 60,
        left: -40,
    },
    bgShape2: {
        position: "absolute",
        width: 180,
        height: 60,
        borderRadius: 30,
        backgroundColor: "rgba(255, 255, 255, 0.05)",
        transform: [{ rotate: "-35deg" }],
        bottom: 150,
        right: -60,
    },
    bgShape3: {
        position: "absolute",
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: "rgba(255, 255, 255, 0.04)",
        top: "40%",
        right: -30,
    },
    logoContainer: {
        alignItems: "center",
        justifyContent: "center",
        marginTop: 20,
        marginBottom: 30,
    },
    logoText: {
        fontSize: 38,
        fontWeight: "900",
        color: colors.secondary,
        letterSpacing: 2,
        textShadowColor: "rgba(0, 0, 0, 0.25)",
        textShadowOffset: { width: 0, height: 4 },
        textShadowRadius: 4,
    },
    logoSubtitle: {
        fontSize: 14,
        fontWeight: "600",
        color: colors.textMuted,
        marginTop: 6,
        textAlign: "center",
    },
    headerContainer: {
        marginBottom: 32,
    },
    welcomeText: {
        color: colors.textLight,
        fontSize: 28,
        fontWeight: "800",
        marginBottom: 6,
    },
    subText: {
        color: colors.textMuted,
        fontSize: 15,
        fontWeight: "500",
    },
    formContainer: {
        flex: 1,
    },
    inputGroup: {
        marginBottom: 18,
    },
    fieldLabel: {
        color: colors.textLight,
        fontSize: 15,
        fontWeight: "700",
        marginBottom: 8,
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
        left: 58,
        flexDirection: "row",
        alignItems: "center",
        height: "100%",
        paddingBottom: 2,
    },
    textMeasureHidden: {
        fontSize: 15,
        color: "transparent",
    },
    ghostEmailText: {
        fontSize: 15,
        color: colors.textPlaceholder,
        opacity: 0.6,
    },
    fieldErrorText: {
        color: "#FFD2D2",
        fontSize: 13,
        fontWeight: "600",
        marginTop: 6,
        paddingLeft: 4,
    },
    forgotPassContainer: {
        alignSelf: "flex-end",
        marginBottom: 20,
        marginTop: 2,
    },
    forgotPassText: {
        color: colors.textMuted,
        fontSize: 14,
        fontWeight: "600",
    },
    guestButton: {
        alignSelf: "center",
        marginVertical: 12,
    },
    guestText: {
        color: colors.textLight,
        fontSize: 14,
        fontWeight: "600",
        textDecorationLine: "underline",
    },
    dividerContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginVertical: 24,
    },
    line: {
        flex: 1,
        height: 1,
        backgroundColor: colors.divider,
    },
    dividerText: {
        fontSize: 13,
        fontWeight: "500",
        color: colors.textMuted,
        paddingHorizontal: 16,
    },
    socialRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 12,
        marginBottom: 24,
    },
    socialBtn: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: colors.googleBorder,
        borderRadius: 28,
        height: 56,
        gap: 10,
        backgroundColor: "transparent",
    },
    socialBtnText: {
        fontSize: 14,
        fontWeight: "700",
        color: colors.textLight,
        letterSpacing: 0.5,
    },
    footer: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginTop: 16,
        marginBottom: 20,
    },
    footerText: {
        fontSize: 14,
        color: colors.textMuted,
    },
    registerText: {
        fontSize: 14,
        fontWeight: "700",
        color: colors.secondary,
    },
});