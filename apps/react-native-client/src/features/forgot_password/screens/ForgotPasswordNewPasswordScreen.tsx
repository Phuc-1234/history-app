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
import { useLocalSearchParams } from "expo-router";
import { CheckCircle2, Lock } from "lucide-react-native";
import { useForgotPassword } from "../hooks/useForgotPassword";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Input from "../../../components/Input";
import colors from "../../../theme/colors";
import typography from "../../../theme/typography";
import Mascot from "../../../components/Mascot";
import AppBackground from "../../../components/layout/AppBackground";

const text = {
    cardTitle: "Tạo mật khẩu mới",
    subtitle: "Mật khẩu mới phải khác so với các mật khẩu đã sử dụng trước đây.",
    newPassword: "Mật khẩu mới",
    confirmPassword: "Xác nhận mật khẩu mới",
    minLength: "Ít nhất 6 ký tự",
    submit: "Đặt lại mật khẩu",
    updating: "Đang cập nhật...",
};

export default function ForgotPasswordNewPasswordScreen() {
    const { email: paramEmail, token: paramToken } = useLocalSearchParams<{
        email: string;
        token: string;
    }>();
    const state = useForgotPassword(paramEmail || "", paramToken || "");
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
                {/* Background Motifs (session-randomized) */}
                <AppBackground />

                {/* Mascot Section */}
                <View style={styles.mascotContainer}>
                    <Mascot expression="thinking" width={100} height={100} />
                </View>

                {/* Welcome Heading */}
                <View style={styles.headerContainer}>
                    <Text style={styles.headlineText}>{text.cardTitle}</Text>
                    <Text style={styles.subText}>{text.subtitle}</Text>
                </View>

                {/* Form Inputs Container */}
                <View style={styles.formContainer}>
                    {/* New Password */}
                    <View style={styles.inputGroup}>
                        <Input
                            placeholder="Nhập mật khẩu mới"
                            value={state.newPassword}
                            onChangeText={state.setNewPassword}
                            icon={Lock}
                            isPassword
                            style={styles.customInput}
                        />
                        {state.newPasswordError ? (
                            <Text style={styles.fieldErrorText}>
                                {state.newPasswordError}
                            </Text>
                        ) : null}
                    </View>

                    {/* Confirm Password */}
                    <View style={styles.inputGroup}>
                        <Input
                            placeholder="Xác nhận lại mật khẩu"
                            value={state.newPasswordConfirm}
                            onChangeText={state.setNewPasswordConfirm}
                            icon={Lock}
                            isPassword
                            style={styles.customInput}
                        />
                        {state.newPasswordConfirmError ? (
                            <Text style={styles.fieldErrorText}>
                                {state.newPasswordConfirmError}
                            </Text>
                        ) : null}
                    </View>

                    {/* Rules Checklist */}
                    <View style={styles.rules}>
                        <Rule
                            active={state.hasMinLength}
                            label={text.minLength}
                        />
                    </View>

                    {/* Submit Button */}
                    <Pressable
                        style={[
                            styles.primaryButton,
                            state.isLoading && styles.disabled,
                        ]}
                        onPress={state.handleResetPassword}
                        disabled={state.isLoading}
                    >
                        <Text style={styles.primaryButtonText}>
                            {state.isLoading ? text.updating : text.submit}
                        </Text>
                    </Pressable>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

function Rule({ active, label }: { active: boolean; label: string }) {
    return (
        <View style={styles.ruleItem}>
            <CheckCircle2 size={16} color={active ? colors.primary : "rgba(0, 0, 0, 0.2)"} />
            <Text style={[styles.ruleText, active && styles.ruleTextActive]}>
                {label}
            </Text>
        </View>
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
    rules: {
        gap: 10,
        marginTop: 4,
        marginBottom: 16,
    },
    ruleItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    ruleText: {
        ...typography.bodyMedium,
        color: colors.textMuted,
    },
    ruleTextActive: {
        ...typography.bodyMediumBold,
        color: colors.textDark,
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
});
