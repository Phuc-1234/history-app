import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { CheckCircle, Eye, EyeOff, Key, Lock } from "lucide-react-native";

import { TopBarWrapper } from "@/features/top_bar";
import { useChangePassword } from "../hooks/useChangePassword";

const text = {
    hierarchy: "C\u00e0i \u0111\u1eb7t t\u00e0i kho\u1ea3n",
    title: "S\u1eeda m\u1eadt kh\u1ea9u",
    description: "Vui l\u00f2ng nh\u1eadp m\u1eadt kh\u1ea9u c\u0169 v\u00e0 t\u1ea1o m\u1eadt kh\u1ea9u m\u1edbi \u0111\u1ec3 b\u1ea3o m\u1eadt t\u00e0i kho\u1ea3n c\u1ee7a b\u1ea1n.",
    currentLabel: "M\u1eadt kh\u1ea9u c\u0169",
    currentPlaceholder: "Nh\u1eadp m\u1eadt kh\u1ea9u c\u0169",
    newLabel: "M\u1eadt kh\u1ea9u m\u1edbi",
    newPlaceholder: "Nh\u1eadp m\u1eadt kh\u1ea9u m\u1edbi",
    confirmLabel: "X\u00e1c nh\u1eadn m\u1eadt kh\u1ea9u",
    confirmPlaceholder: "Nh\u1eadp l\u1ea1i m\u1eadt kh\u1ea9u m\u1edbi",
    save: "L\u01b0u",
    saving: "\u0110ang l\u01b0u...",
};

export default function ChangePasswordScreen() {
    const state = useChangePassword();

    return (
        <TopBarWrapper branchConfig={{ hierarchy: text.hierarchy, title: text.title, onBackPress: () => router.back() }}>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardAvoid}>
                <View style={styles.screen}>
                    <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                        <View style={styles.card}>
                            <Text style={styles.description}>{text.description}</Text>
                            <PasswordField label={text.currentLabel} placeholder={text.currentPlaceholder} value={state.currentPassword} onChangeText={state.setCurrentPassword} error={state.currentPasswordError} icon="lock" editable={!state.isLoading} />
                            <PasswordField label={text.newLabel} placeholder={text.newPlaceholder} value={state.newPassword} onChangeText={state.setNewPassword} error={state.newPasswordError} icon="key" editable={!state.isLoading} />
                            <PasswordField label={text.confirmLabel} placeholder={text.confirmPlaceholder} value={state.confirmPassword} onChangeText={state.setConfirmPassword} error={state.confirmPasswordError} icon="check" editable={!state.isLoading} />
                            {state.feedbackMessage ? <Text style={[styles.feedbackText, state.isSuccess ? styles.feedbackSuccess : styles.feedbackError]}>{state.feedbackMessage}</Text> : null}
                        </View>
                    </ScrollView>
                    <View style={styles.footer}>
                        <Pressable style={[styles.saveButton, state.isLoading && styles.saveButtonDisabled]} onPress={state.handleChangePassword} disabled={state.isLoading}>
                            <Text style={styles.saveButtonText}>{state.isLoading ? text.saving : text.save}</Text>
                        </Pressable>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </TopBarWrapper>
    );
}

interface PasswordFieldProps {
    label: string;
    placeholder: string;
    value: string;
    onChangeText: (value: string) => void;
    error?: string;
    icon: "lock" | "key" | "check";
    editable: boolean;
}

function PasswordField({ label, placeholder, value, onChangeText, error, icon, editable }: PasswordFieldProps) {
    const [secure, setSecure] = useState(true);
    const Icon = icon === "key" ? Key : icon === "check" ? CheckCircle : Lock;
    const EyeIcon = secure ? Eye : EyeOff;

    return (
        <View style={styles.fieldGroup}>
            <Text style={styles.inputLabel}>{label}</Text>
            <View style={[styles.inputBox, error && styles.inputBoxError]}>
                <Icon size={19} color="#A4A1B4" strokeWidth={2} />
                <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#A4A1B4" secureTextEntry={secure} editable={editable} style={styles.input} autoCapitalize="none" />
                <Pressable style={styles.eyeButton} onPress={() => setSecure((prev) => !prev)}>
                    <EyeIcon size={19} color="#8A8799" strokeWidth={2} />
                </Pressable>
            </View>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>
    );
}

const styles = StyleSheet.create({
    keyboardAvoid: { flex: 1 },
    screen: { flex: 1, backgroundColor: "#F8F5FC" },
    scrollContent: { flexGrow: 1, paddingHorizontal: 30, paddingTop: 32, paddingBottom: 120 },
    card: {
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        paddingHorizontal: 24,
        paddingTop: 26,
        paddingBottom: 24,
        shadowColor: "#7C6AF2",
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.12,
        shadowRadius: 24,
        elevation: 7,
    },
    description: { color: "#7C7787", fontSize: 14, lineHeight: 22, textAlign: "center", marginBottom: 26 },
    fieldGroup: { marginBottom: 20 },
    inputLabel: { color: "#242330", fontSize: 14, lineHeight: 20, fontWeight: "700", marginBottom: 10 },
    inputBox: { minHeight: 40, borderRadius: 12, backgroundColor: "#FFF8F5", flexDirection: "row", alignItems: "center", paddingHorizontal: 14 },
    inputBoxError: { borderWidth: 1, borderColor: "#E53E3E" },
    input: { flex: 1, color: "#242330", fontSize: 16, paddingVertical: 12, paddingHorizontal: 12 },
    eyeButton: { width: 34, height: 34, alignItems: "center", justifyContent: "center" },
    errorText: { color: "#E53E3E", fontSize: 12, lineHeight: 17, marginTop: 6, fontWeight: "500" },
    feedbackText: { fontSize: 14, fontWeight: "600", textAlign: "center", marginTop: 4 },
    feedbackSuccess: { color: "#38A169" },
    feedbackError: { color: "#E53E3E" },
    footer: { paddingHorizontal: 30, paddingBottom: 26, backgroundColor: "#F8F5FC" },
    saveButton: { height: 56, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: "#5A3CF0", shadowColor: "#5A3CF0", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.28, shadowRadius: 12, elevation: 7 },
    saveButtonDisabled: { opacity: 0.72 },
    saveButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" },
});
