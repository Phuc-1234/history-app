import React, { useState } from "react";
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { CheckCircle2, Eye, EyeOff, Lock } from "lucide-react-native";
import { TopBarWrapper } from "@/features/top_bar";
import { useForgotPassword } from "../hooks/useForgotPassword";

const text = {
    cardTitle: "T\u1ea1o m\u1eadt kh\u1ea9u m\u1edbi",
    subtitle: "M\u1eadt kh\u1ea9u m\u1edbi ph\u1ea3i kh\u00e1c v\u1edbi m\u1eadt kh\u1ea9u \u0111\u00e3 s\u1eed d\u1ee5ng tr\u01b0\u1edbc \u0111\u00f3.",
    newPassword: "M\u1eadt kh\u1ea9u m\u1edbi",
    confirmPassword: "X\u00e1c nh\u1eadn m\u1eadt kh\u1ea9u m\u1edbi",
    minLength: "\u00cdt nh\u1ea5t 8 k\u00fd t\u1ef1",
    uppercase: "C\u00f3 \u00edt nh\u1ea5t 1 ch\u1eef hoa",
    number: "C\u00f3 \u00edt nh\u1ea5t 1 ch\u1eef s\u1ed1",
    submit: "\u0110\u1eb7t l\u1ea1i m\u1eadt kh\u1ea9u",
    updating: "\u0110ang \u0111\u1eb7t l\u1ea1i...",
};

export default function ForgotPasswordNewPasswordScreen() {
    const { email: paramEmail } = useLocalSearchParams<{ email: string }>();
    const state = useForgotPassword(paramEmail || "");

    return (
        <TopBarWrapper>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardAvoid}>
                <ScrollView contentContainerStyle={styles.screen} keyboardShouldPersistTaps="handled">
                    <View style={styles.hero}>
                        <View style={styles.heroIcon}>
                            <Image source={require("../assets/ic_lock.png")} style={styles.heroImage} resizeMode="contain" />
                        </View>
                    </View>
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>{text.cardTitle}</Text>
                        <Text style={styles.subtitle}>{text.subtitle}</Text>
                        <PasswordInput placeholder={text.newPassword} value={state.newPassword} onChangeText={state.setNewPassword} />
                        {state.newPasswordError ? <Text style={styles.errorText}>{state.newPasswordError}</Text> : null}
                        <PasswordInput placeholder={text.confirmPassword} value={state.newPasswordConfirm} onChangeText={state.setNewPasswordConfirm} />
                        {state.newPasswordConfirmError ? <Text style={styles.errorText}>{state.newPasswordConfirmError}</Text> : null}
                        <View style={styles.rules}>
                            <Rule active={state.hasMinLength} label={text.minLength} />
                            <Rule active={state.hasUppercase} label={text.uppercase} />
                            <Rule active={state.hasNumber} label={text.number} />
                        </View>
                        <Pressable style={[styles.primaryButton, state.isLoading && styles.disabled]} onPress={state.handleResetPassword} disabled={state.isLoading}>
                            <Text style={styles.primaryText}>{state.isLoading ? text.updating : text.submit}</Text>
                        </Pressable>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </TopBarWrapper>
    );
}

function PasswordInput({ placeholder, value, onChangeText }: { placeholder: string; value: string; onChangeText: (value: string) => void }) {
    const [secure, setSecure] = useState(true);
    const EyeIcon = secure ? EyeOff : Eye;

    return (
        <View style={styles.inputBox}>
            <Lock size={18} color="#8B879B" />
            <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#777384" secureTextEntry={secure} style={styles.input} autoCapitalize="none" />
            <Pressable style={styles.eyeButton} onPress={() => setSecure((prev) => !prev)}>
                <EyeIcon size={19} color="#8B879B" />
            </Pressable>
        </View>
    );
}

function Rule({ active, label }: { active: boolean; label: string }) {
    return (
        <View style={styles.ruleItem}>
            <CheckCircle2 size={15} color={active ? "#4CCB7A" : "#BDB8CA"} />
            <Text style={[styles.ruleText, active && styles.ruleTextActive]}>{label}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    keyboardAvoid: { flex: 1 },
    screen: { flexGrow: 1, backgroundColor: "#F8F6F3" },
    hero: { minHeight: 274, backgroundColor: "#5732DD", alignItems: "center", paddingTop: 52, borderBottomLeftRadius: 34, borderBottomRightRadius: 34 },
    heroIcon: { width: 82, height: 82, borderRadius: 41, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.13)", borderWidth: 1, borderColor: "rgba(255,255,255,0.28)", marginTop: 28 },
    heroImage: { width: 38, height: 38 },
    card: { flex: 1, marginHorizontal: 14, marginTop: -28, backgroundColor: "#FFFFFF", borderRadius: 36, paddingHorizontal: 32, paddingTop: 36, paddingBottom: 40, shadowColor: "#000", shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.14, shadowRadius: 24, elevation: 8 },
    cardTitle: { color: "#1D1B18", fontSize: 26, lineHeight: 34, fontWeight: "800", textAlign: "center" },
    subtitle: { color: "#4F4B5E", fontSize: 15, lineHeight: 22, textAlign: "center", marginTop: 8, marginBottom: 30 },
    inputBox: { height: 56, borderRadius: 28, backgroundColor: "#F2F0EF", flexDirection: "row", alignItems: "center", paddingHorizontal: 18, marginBottom: 18 },
    input: { flex: 1, color: "#242330", fontSize: 16, paddingHorizontal: 14 },
    eyeButton: { width: 34, height: 34, alignItems: "center", justifyContent: "center" },
    errorText: { color: "#E53E3E", fontSize: 12, marginTop: -12, marginBottom: 10, fontWeight: "500" },
    rules: { gap: 8, marginTop: 4, marginBottom: 30 },
    ruleItem: { flexDirection: "row", alignItems: "center", gap: 8 },
    ruleText: { color: "#8B879B", fontSize: 14, fontWeight: "500" },
    ruleTextActive: { color: "#4F4B5E", fontWeight: "700" },
    primaryButton: { height: 56, borderRadius: 28, backgroundColor: "#5B47EA", alignItems: "center", justifyContent: "center", shadowColor: "#5B47EA", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25, shadowRadius: 14, elevation: 7 },
    primaryText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },
    disabled: { opacity: 0.7 },
});
