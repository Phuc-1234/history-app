import React from "react";
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
import { router } from "expo-router";
import { ArrowLeft, Mail } from "lucide-react-native";
import { useForgotPassword } from "../hooks/useForgotPassword";

import { useSafeAreaInsets } from "react-native-safe-area-context";

const text = {
    description: "Nhập email đã đăng ký của bạn để\nnhận mã xác thực (OTP).",
    email: "Email",
    emailPlaceholder: "Email của bạn",
    send: "Gửi mã xác thực",
    sending: "Đang gửi...",
    backLogin: "Quay lại đăng nhập",
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
                contentContainerStyle={[
                    styles.screen,
                    { paddingBottom: Math.max(insets.bottom, 20) },
                ]}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.hero}>
                    <View style={styles.heroIcon}>
                        <Image
                            source={require("../assets/ic_lock_reload.png")}
                            style={styles.heroImage}
                            resizeMode="contain"
                        />
                    </View>
                    <Text style={styles.heroDescription}>
                        {text.description}
                    </Text>
                </View>
                <View style={styles.card}>
                    <Text style={styles.label}>{text.email}</Text>
                    <View
                        style={[
                            styles.inputBox,
                            emailError && styles.inputBoxError,
                        ]}
                    >
                        <Mail size={21} color="#4E4A60" />
                        <TextInput
                            value={email}
                            onChangeText={setEmail}
                            placeholder={text.emailPlaceholder}
                            placeholderTextColor="#747184"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            editable={!isLoading}
                            style={styles.input}
                        />
                    </View>
                    {emailError ? (
                        <Text style={styles.errorText}>{emailError}</Text>
                    ) : null}
                    <Pressable
                        style={[
                            styles.primaryButton,
                            isLoading && styles.disabled,
                        ]}
                        onPress={handleSendOtp}
                        disabled={isLoading}
                    >
                        <Text style={styles.primaryText}>
                            {isLoading ? text.sending : text.send}
                        </Text>
                    </Pressable>
                    <Pressable
                        style={styles.backLogin}
                        onPress={() => router.replace("/(1_auth)/1_1_login")}
                    >
                        <ArrowLeft size={17} color="#4F32DD" />
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
    keyboardAvoid: { flex: 1 },
    screen: { flexGrow: 1, backgroundColor: "#F8F6F3" },
    hero: {
        minHeight: 260,
        backgroundColor: "#5732DD",
        alignItems: "center",
        paddingTop: 42,
        paddingHorizontal: 26,
        borderBottomLeftRadius: 34,
        borderBottomRightRadius: 34,
    },
    heroIcon: {
        width: 82,
        height: 82,
        borderRadius: 41,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(255,255,255,0.13)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.28)",
        marginBottom: 28,
    },
    heroImage: { width: 38, height: 38 },
    heroDescription: {
        color: "#FFFFFF",
        opacity: 0.92,
        fontSize: 16,
        lineHeight: 24,
        textAlign: "center",
        fontWeight: "500",
    },
    card: {
        flex: 1,
        marginHorizontal: 14,
        marginTop: -28,
        backgroundColor: "#FFFFFF",
        borderRadius: 36,
        paddingHorizontal: 32,
        paddingTop: 36,
        paddingBottom: 40,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.14,
        shadowRadius: 24,
        elevation: 8,
    },
    label: {
        color: "#3D394A",
        fontSize: 14,
        fontWeight: "800",
        marginBottom: 10,
    },
    inputBox: {
        height: 56,
        borderRadius: 28,
        backgroundColor: "#F2F0EF",
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 18,
        marginBottom: 6,
    },
    inputBoxError: { borderWidth: 1, borderColor: "#E53E3E" },
    input: { flex: 1, fontSize: 16, color: "#242330", paddingHorizontal: 14 },
    errorText: {
        color: "#E53E3E",
        fontSize: 12,
        marginBottom: 10,
        fontWeight: "500",
    },
    primaryButton: {
        height: 64,
        borderRadius: 32,
        backgroundColor: "#4B32D9",
        alignItems: "center",
        justifyContent: "center",
        marginTop: 28,
        shadowColor: "#4B32D9",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 14,
        elevation: 7,
    },
    primaryText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },
    disabled: { opacity: 0.7 },
    backLogin: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        marginTop: 30,
    },
    backLoginText: { color: "#4F32DD", fontSize: 15, fontWeight: "800" },
});
