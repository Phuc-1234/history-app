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
        navigateToLogin,
        submitAndEnterApp,
        enterAsGuest,
        handleGoogleLogin,
    } = useAuthForm();
    const insets = useSafeAreaInsets();

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
                    <Text style={styles.welcomeText}>Chào mừng trở lại!</Text>
                    <Text style={styles.subText}>
                        Đăng nhập để tiếp tục học tập
                    </Text>
                </LinearGradient>

                <View style={styles.formContainer}>
                    <Text style={styles.title}>Đăng nhập</Text>
                    <Input
                        value={email}
                        onChangeText={setEmail}
                        icon={User}
                        placeholder="Email hoặc số điện thoại"
                    />
                    <Input
                        value={password}
                        onChangeText={setPassword}
                        icon={Lock}
                        placeholder="Mật khẩu"
                        isPassword
                    />
                    <TouchableOpacity
                        style={styles.forgotPassContainer}
                        activeOpacity={0.6}
                        onPress={() => router.push("/(1_auth)/1_3_forgot")}
                    >
                        <Text style={styles.forgotPassText}>Quên mật khẩu?</Text>
                    </TouchableOpacity>
                    <Button
                        title={isLoading ? "Đang xử lý..." : "Đăng nhập"}
                        onPress={submitAndEnterApp}
                    />

                    <TouchableOpacity
                        style={{ alignSelf: "center", marginTop: 14, marginBottom: 14 }}
                        activeOpacity={0.6}
                        onPress={enterAsGuest}
                    >
                        <Text
                            style={{
                                color: "#718096",
                                fontSize: 13,
                                fontWeight: "600",
                                textDecorationLine: "underline",
                            }}
                        >
                            Tiếp tục với tư cách khách
                        </Text>
                    </TouchableOpacity>
                    <View style={styles.dividerContainer}>
                        <View style={styles.line} />
                        <Text style={styles.dividerText}>HOẶC ĐĂNG NHẬP BẰNG</Text>
                        <View style={styles.line} />
                    </View>
                    <SocialLoginButtons onGooglePress={handleGoogleLogin} />
                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Chưa có tài khoản? </Text>
                        <TouchableOpacity
                            activeOpacity={0.6}
                            onPress={navigateToRegister}
                        >
                            <Text style={styles.registerText}>Đăng ký ngay</Text>
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
    forgotPassContainer: {
        alignSelf: "flex-end",
        marginVertical: 8,
    },
    forgotPassText: {
        color: "#4B3BF6",
        fontSize: 12,
        fontWeight: "600",
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
        fontWeight: "400",
    },
    registerText: {
        fontSize: 13,
        fontWeight: "700",
        color: "#4B3BF6",
    },
});
