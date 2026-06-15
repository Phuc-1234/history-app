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
import { User, Lock, Mail } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Input from "../../../components/Input";
import Button from "../../../components/Button";
import SocialLoginButtons from "../components/SocialLoginButtons";
import useRegisterForm from "../hooks/useRegisterForm";
import useAuthForm from "../hooks/useAuthForm";

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
        isLoading,
        navigateToLogin,
        handleRegister,
    } = useRegisterForm(); // Đã gỡ bỏ formError/setFormError của hook để tránh lỗi chặt chẽ của TypeScript

    const { handleGoogleLogin, handleFacebookLogin, isGoogleLoading, isFacebookLoading } = useAuthForm();
    const isAnyLoading = isLoading || isGoogleLoading || isFacebookLoading;

    const insets = useSafeAreaInsets();

    // Khởi tạo các trạng thái báo lỗi riêng biệt dưới chân từng ô nhập liệu
    const [nameError, setNameError] = useState<string>("");
    const [emailError, setEmailError] = useState<string>("");
    const [passwordError, setPasswordError] = useState<string>("");
    const [confirmPasswordError, setConfirmPasswordError] = useState<string>("");

    // Hàm kiểm tra dữ liệu riêng cho từng ô trước khi tiến hành đăng ký
    const onRegisterPress = () => {
        const cleanName = name.trim();
        const cleanEmail = email.trim();
        let hasError = false;

        // 1. Kiểm tra ô Tên
        if (!cleanName) {
            setNameError("Bạn chưa nhập tên!");
            hasError = true;
        } else {
            setNameError("");
        }

        // 2. Kiểm tra ô Email
        if (!cleanEmail) {
            setEmailError("Vui lòng nhập email!");
            hasError = true;
        } else {
            setEmailError("");
        }

        // 3. Kiểm tra ô Mật khẩu
        if (!password) {
            setPasswordError("Vui lòng nhập mật khẩu!");
            hasError = true;
        } else if (password.length < 6) {
            setPasswordError("Mật khẩu phải có ít nhất 6 ký tự!");
            hasError = true;
        } else {
            setPasswordError("");
        }

        // 4. Kiểm tra ô Xác nhận mật khẩu
        if (!confirmPassword) {
            setConfirmPasswordError("Vui lòng nhập xác nhận mật khẩu!");
            hasError = true;
        } else if (password !== confirmPassword) {
            setConfirmPasswordError("Mật khẩu xác nhận không trùng khớp!");
            hasError = true;
        } else {
            setConfirmPasswordError("");
        }

        // Nếu dính bất kỳ lỗi nào thì dừng lại, không gọi API đăng ký
        if (hasError) return;

        // Nếu email hợp lệ và không chứa kí tự @, tự động nối thêm đuôi @gmail.com
        if (!cleanEmail.includes("@")) {
            const finalEmail = `${cleanEmail}@gmail.com`;
            setEmail(finalEmail);

            // Chờ 100ms cho state cập nhật xong rồi mới submit form
            setTimeout(() => {
                handleRegister();
            }, 100);
        } else {
            handleRegister();
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.keyboardAvoid}
        >
            <ScrollView
                contentContainerStyle={[
                    styles.scrollContainer,
                    { paddingBottom: Math.max(insets.bottom, 20) }
                ]}
                bounces={false}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
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
                    <Text style={styles.welcomeText}>Chào mừng!</Text>
                    <Text style={styles.subText}>Tạo tài khoản để bắt đầu học</Text>
                </LinearGradient>

                <View style={styles.formContainer}>
                    <Text style={styles.title}>Đăng ký</Text>

                    {/* Ô NHẬP TÊN */}
                    <View style={styles.inputGroup}>
                        <Input
                            icon={User}
                            placeholder="Tên"
                            value={name}
                            autoCapitalize="words"
                            onChangeText={(text) => {
                                setName(text);
                                if (nameError) setNameError(""); // Người dùng gõ lại thì xóa chữ báo lỗi đi
                            }}
                            editable={!isAnyLoading}
                        />
                        {nameError ? (
                            <Text style={styles.fieldErrorText}> {nameError}</Text>
                        ) : null}
                    </View>
                    
                    {/* Ô NHẬP EMAIL THÔNG MINH */}
                    <View style={styles.inputGroup}>
                        <View style={styles.emailContainer}>
                            <Input
                                icon={Mail}
                                placeholder="Email"
                                value={email}
                                onChangeText={(text) => {
                                    setEmail(text.trim());
                                    if (emailError) setEmailError(""); // Người dùng gõ lại thì xóa chữ báo lỗi đi
                                }}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                editable={!isAnyLoading}
                            />

                            {/* Phần chữ @gmail.com mờ bám đuôi theo tay gõ */}
                            {email.length > 0 && !email.includes("@") && (
                                <View style={styles.ghostTextWrapper} pointerEvents="none">
                                    <Text style={styles.textMeasureHidden}>{email}</Text>
                                    <Text style={styles.ghostEmailText}>@gmail.com</Text>
                                </View>
                            )}
                        </View>
                        {emailError ? (
                            <Text style={styles.fieldErrorText}> {emailError}</Text>
                        ) : null}
                    </View>
                    
                    {/* Ô NHẬP MẬT KHẨU */}
                    <View style={styles.inputGroup}>
                        <Input
                            icon={Lock}
                            placeholder="Mật khẩu"
                            isPassword
                            value={password}
                            onChangeText={(text) => {
                                setPassword(text);
                                if (passwordError) setPasswordError(""); // Người dùng gõ lại thì xóa chữ báo lỗi đi
                            }}
                            autoCapitalize="none"
                            editable={!isAnyLoading}
                        />
                        {passwordError ? (
                            <Text style={styles.fieldErrorText}> {passwordError}</Text>
                        ) : null}
                    </View>
                    
                    {/* Ô XÁC NHẬN MẬT KHẨU */}
                    <View style={styles.inputGroup}>
                        <Input
                            icon={Lock}
                            placeholder="Xác nhận mật khẩu"
                            isPassword
                            value={confirmPassword}
                            onChangeText={(text) => {
                                setConfirmPassword(text);
                                if (confirmPasswordError) setConfirmPasswordError(""); // Người dùng gõ lại thì xóa chữ báo lỗi đi
                            }}
                            autoCapitalize="none"
                            editable={!isAnyLoading}
                        />
                        {confirmPasswordError ? (
                            <Text style={styles.fieldErrorText}> {confirmPasswordError}</Text>
                        ) : null}
                    </View>

                    <Button
                        title={isAnyLoading ? "Đang xử lý..." : "Đăng ký"}
                        onPress={isAnyLoading ? () => {} : onRegisterPress}
                    />

                    <View style={styles.dividerContainer}>
                        <View style={styles.line} />
                        <Text style={styles.dividerText}>HOẶC ĐĂNG KÝ BẰNG</Text>
                        <View style={styles.line} />
                    </View>

                    <SocialLoginButtons onGooglePress={handleGoogleLogin} onFacebookPress={handleFacebookLogin} />

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Đã có tài khoản? </Text>
                        <TouchableOpacity
                            activeOpacity={0.6}
                            onPress={navigateToLogin}
                            disabled={isAnyLoading}
                        >
                            <Text style={styles.registerText}>Đăng nhập</Text>
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
    scrollContainer: { flexGrow: 1, backgroundColor: "#FFFFFF" },
    banner: {
        paddingTop: 65,
        paddingBottom: 55,
        alignItems: "center",
        justifyContent: "center",
    },
    logoContainer: { position: "relative", marginBottom: 12 },
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
        fontWeight: "400",
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

    // Gom nhóm ô nhập liệu và chữ lỗi để tạo khoảng cách hợp lý
    inputGroup: {
        marginBottom: 12,
    },
    // Dòng chữ lỗi nhỏ kèm icon cảnh báo nằm dưới chân ô nhập liệu
    fieldErrorText: {
        color: "#E53E3E",
        fontSize: 12,
        fontWeight: "500",
        marginTop: 4,
        paddingLeft: 4,
    },

    // CSS cho tính năng gợi ý email mờ bám đuôi
    emailContainer: {
        position: "relative",
        justifyContent: "center",
    },
    ghostTextWrapper: {
        position: "absolute",
        left: 54, // Khoảng cách vượt qua Icon Mail rìa trái ô Input
        flexDirection: "row",
        alignItems: "center",
        height: "100%",
        paddingBottom: 2, 
    },
    textMeasureHidden: {
        fontSize: 15, // Cài đặt cỡ chữ bằng chuẩn với Component <Input /> của bạn
        color: "transparent", 
    },
    ghostEmailText: {
        fontSize: 15, 
        color: "#A0AEC0", 
        opacity: 0.55, 
    },

    dividerContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginVertical: 20,
    },
    line: { flex: 1, height: 1, backgroundColor: "#E2E8F0" },
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
    footerText: { fontSize: 13, color: "#718096", fontWeight: "400" },
    registerText: { fontSize: 13, fontWeight: "700", color: "#4B3BF6" },
});