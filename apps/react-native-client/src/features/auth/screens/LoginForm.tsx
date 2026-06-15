import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { User, Lock } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Input from "../../../components/Input";
import Button from "../../../components/Button";
import SocialLoginButtons from "../components/SocialLoginButtons";
import useAuthForm from "../hooks/useAuthForm";

export default function LoginForm() {
    const {
        email,
        setEmail,
        password,
        setPassword,
        isLoading,
        navigateToRegister,
        submitAndEnterApp,
        enterAsGuest,
        handleGoogleLogin,
        handleFacebookLogin,
    } = useAuthForm(); // Hoàn toàn sạch lỗi TypeScript do không gọi formError từ hook

    const insets = useSafeAreaInsets();

    // Tách riêng biệt 2 lỗi dưới chân ô nhập liệu
    const [emailError, setEmailError] = useState<string>("");
    const [passwordError, setPasswordError] = useState<string>("");

    // Hàm xử lý khi nhấn Đăng nhập
    const onLoginPress = () => {
        const cleanEmail = email.trim();
        let hasError = false;

        // Kiểm tra ô Email
        if (!cleanEmail) {
            setEmailError("Vui lòng nhập email hoặc số điện thoại!");
            hasError = true;
        } else {
            setEmailError("");
        }

        // Kiểm tra ô Mật khẩu
        if (!password) {
            setPasswordError("Vui lòng nhập mật khẩu!");
            hasError = true;
        } else {
            setPasswordError("");
        }

        // Nếu có bất kỳ lỗi nào thì dừng lại không chạy tiếp
        if (hasError) return;

        // Nếu không chứa ký tự @, tự động đính thêm đuôi @gmail.com ra phía sau
        if (!cleanEmail.includes("@")) {
            const finalEmail = `${cleanEmail}@gmail.com`;
            setEmail(finalEmail);

            // Delay 100ms để React cập nhật kịp dữ liệu email mới rồi tiến hành submit
            setTimeout(() => {
                submitAndEnterApp();
            }, 100);
        } else {
            submitAndEnterApp();
        }
    };

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
                        paddingBottom: Math.max(insets.bottom, 20),
                    },
                ]}
            >
                <LinearGradient
                    colors={["#4332eb", "#593df2", "#7b4fff"]}
                    style={styles.banner}
                >
                    <View style={styles.logoContainer}>
                        <Svg width="50" height="40" viewBox="0 0 24 24">
                            <Path
                                d="M12 21C12 21 7 18 2 20V5C7 3 12 6 12 6C12 6 17 3 22 5V20C17 18 12 21 12 21Z"
                                fill="white"
                            />
                        </Svg>

                        <Text style={styles.star}>★</Text>
                    </View>

                    <Text style={styles.welcomeText}>
                        Chào mừng trở lại!
                    </Text>

                    <Text style={styles.subText}>
                        Đăng nhập để tiếp tục học tập
                    </Text>
                </LinearGradient>

                <View style={styles.formContainer}>
                    <Text style={styles.title}>Đăng nhập</Text>

                    {/* KHU VỰC Ô EMAIL THÔNG MINH */}
                    <View style={styles.inputGroup}>
                        <View style={styles.emailContainer}>
                            <Input
                                value={email}
                                onChangeText={(text) => {
                                    setEmail(text.trim());
                                    if (emailError) setEmailError(""); // Người dùng gõ lại thì xóa lỗi đi
                                }}
                                icon={User}
                                placeholder="Email hoặc số điện thoại"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                editable={!isLoading}
                            />

                            {/* Hiện chữ @gmail.com mờ ảo bám đuôi text thực tế */}
                            {email.length > 0 && !email.includes("@") && (
                                <View style={styles.ghostTextWrapper} pointerEvents="none">
                                    <Text style={styles.textMeasureHidden}>{email}</Text>
                                    <Text style={styles.ghostEmailText}>@gmail.com</Text>
                                </View>
                            )}
                        </View>
                        {/* Dòng chữ báo lỗi nhỏ, đỏ ngay dưới chân ô Email */}
                        {emailError ? (
                            <Text style={styles.fieldErrorText}> {emailError}</Text>
                        ) : null}
                    </View>

                    {/* KHU VỰC Ô MẬT KHẨU */}
                    <View style={styles.inputGroup}>
                        <Input
                            value={password}
                            onChangeText={(text) => {
                                setPassword(text);
                                if (passwordError) setPasswordError(""); // Người dùng gõ lại thì xóa lỗi đi
                            }}
                            icon={Lock}
                            placeholder="Mật khẩu"
                            isPassword
                            autoCapitalize="none"
                            editable={!isLoading}
                        />
                        {/* Dòng chữ báo lỗi nhỏ, đỏ ngay dưới chân ô Mật khẩu */}
                        {passwordError ? (
                            <Text style={styles.fieldErrorText}> {passwordError}</Text>
                        ) : null}
                    </View>

                    <TouchableOpacity
                        style={styles.forgotPassContainer}
                        activeOpacity={0.7}
                        onPress={() =>
                            router.push("/(1_auth)/1_3_forgot")
                        }
                    >
                        <Text style={styles.forgotPassText}>
                            Quên mật khẩu?
                        </Text>
                    </TouchableOpacity>

                    <Button
                        title={isLoading ? "Đang xử lý..." : "Đăng nhập"}
                        onPress={onLoginPress}
                    />

                    <TouchableOpacity
                        style={styles.guestButton}
                        activeOpacity={0.7}
                        onPress={enterAsGuest}
                        disabled={isLoading}
                    >
                        <Text style={styles.guestText}>
                            Tiếp tục với tư cách khách
                        </Text>
                    </TouchableOpacity>

                    <View style={styles.dividerContainer}>
                        <View style={styles.line} />

                        <Text style={styles.dividerText}>
                            HOẶC ĐĂNG NHẬP BẰNG
                        </Text>

                        <View style={styles.line} />
                    </View>
                       <SocialLoginButtons onGooglePress={handleGoogleLogin} onFacebookPress={handleFacebookLogin} />

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
        backgroundColor: "#FFFFFF",
    },

    scrollContainer: {
        flexGrow: 1,
        backgroundColor: "#FFFFFF",
    },

    banner: {
        paddingTop: 65,
        paddingBottom: 55,
        alignItems: "center",
        justifyContent: "center",
    },

    logoContainer: {
        position: "relative",
        marginBottom: 12,
    },

    star: {
        position: "absolute",
        top: -10,
        alignSelf: "center",
        color: "#FFA800",
        fontSize: 16,
    },

    welcomeText: {
        color: "#FFFFFF",
        fontSize: 22,
        fontWeight: "700",
        marginBottom: 4,
    },

    subText: {
        color: "#E0DBFF",
        fontSize: 12,
        opacity: 0.85,
    },

    formContainer: {
        flex: 1,
        backgroundColor: "#FFFFFF",
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        marginTop: -26,
        paddingHorizontal: 24,
        paddingTop: 28,
    },

    title: {
        fontSize: 20,
        fontWeight: "700",
        color: "#1A202C",
        marginBottom: 16,
    },

    // Gom cụm ô nhập và chữ lỗi lại để tạo khoảng cách hợp lý
    inputGroup: {
        marginBottom: 12,
    },

    // Style cho dòng chữ báo lỗi nhỏ dưới chân ô nhập liệu
    fieldErrorText: {
        color: "#E53E3E",
        fontSize: 12,
        fontWeight: "500",
        marginTop: 4,
        paddingLeft: 4,
    },

    emailContainer: {
        position: "relative",
        justifyContent: "center",
    },

    ghostTextWrapper: {
        position: "absolute",
        left: 54, 
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
        color: "#A0AEC0", 
        opacity: 0.55,
    },

    forgotPassContainer: {
        alignSelf: "flex-end",
        marginBottom: 14,
        marginTop: 4,
    },

    forgotPassText: {
        color: "#4B3BF6",
        fontSize: 12,
        fontWeight: "600",
    },

    guestButton: {
        alignSelf: "center",
        marginTop: 14,
        marginBottom: 14,
    },

    guestText: {
        color: "#718096",
        fontSize: 13,
        fontWeight: "600",
        textDecorationLine: "underline",
    },

    dividerContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginVertical: 20,
    },

    line: {
        flex: 1,
        height: 1,
        backgroundColor: "#E2E8F0",
    },

    dividerText: {
        fontSize: 10,
        fontWeight: "700",
        color: "#A0AEC0",
        paddingHorizontal: 12,
        letterSpacing: 0.5,
    },

    footer: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginTop: 30,
        marginBottom: 20,
    },

    footerText: {
        fontSize: 13,
        color: "#718096",
    },

    registerText: {
        fontSize: 13,
        fontWeight: "700",
        color: "#4B3BF6",
    },
});