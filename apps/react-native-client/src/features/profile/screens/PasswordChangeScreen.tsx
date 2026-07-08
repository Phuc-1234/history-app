import React from "react";
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { useRouter } from "expo-router";
import { CheckCircle, KeyRound, Lock } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Button from "../../../components/Button";
import Input from "../../../components/Input";
import { useChangePassword } from "../hooks/useChangePassword";
import { ScreenWrapper } from "../../../components/layout/ScreenWrapper";
import { colors } from "../../../theme/colors";

const text = {
    title: "Sửa mật khẩu",
    description:
        "Vui lòng nhập mật khẩu cũ và tạo mật khẩu mới để bảo mật tài khoản của bạn.",
    currentLabel: "Mật khẩu cũ",
    currentPlaceholder: "Nhập mật khẩu cũ",
    newLabel: "Mật khẩu mới",
    newPlaceholder: "Nhập mật khẩu mới",
    confirmLabel: "Xác nhận mật khẩu",
    confirmPlaceholder: "Nhập lại mật khẩu mới",
    save: "Lưu",
};

export default function PasswordChangeScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const state = useChangePassword();

    return (
        <ScreenWrapper
            showTopBar={false}
            branchConfig={{
                hierarchy: "Cá nhân",
                title: text.title,
                onBackPress: () => router.back(),
            }}
        >

            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
            >
                <ScrollView
                    style={styles.flex}
                    contentContainerStyle={styles.scrollContent}
                    bounces={false}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.card}>
                        <Text style={styles.description}>{text.description}</Text>

                        <Text style={styles.fieldLabel}>{text.currentLabel}</Text>
                        <Input
                            icon={Lock}
                            placeholder={text.currentPlaceholder}
                            isPassword
                            value={state.currentPassword}
                            onChangeText={state.setCurrentPassword}
                            style={styles.inputField}
                            containerStyle={styles.inputContainer}
                        />
                        {state.currentPasswordError ? (
                            <Text style={styles.errorText}>{state.currentPasswordError}</Text>
                        ) : null}

                        <Text style={styles.fieldLabel}>{text.newLabel}</Text>
                        <Input
                            icon={KeyRound}
                            placeholder={text.newPlaceholder}
                            isPassword
                            value={state.newPassword}
                            onChangeText={state.setNewPassword}
                            style={styles.inputField}
                            containerStyle={styles.inputContainer}
                        />
                        {state.newPasswordError ? (
                            <Text style={styles.errorText}>{state.newPasswordError}</Text>
                        ) : null}

                        <Text style={styles.fieldLabel}>{text.confirmLabel}</Text>
                        <Input
                            icon={CheckCircle}
                            placeholder={text.confirmPlaceholder}
                            isPassword
                            value={state.confirmPassword}
                            onChangeText={state.setConfirmPassword}
                            style={styles.inputField}
                            containerStyle={styles.inputContainer}
                        />
                        {state.confirmPasswordError ? (
                            <Text style={styles.errorText}>{state.confirmPasswordError}</Text>
                        ) : null}

                        {state.feedbackMessage ? (
                            <Text
                                style={[
                                    styles.feedbackText,
                                    state.isSuccess ? styles.feedbackSuccess : styles.feedbackError,
                                ]}
                            >
                                {state.feedbackMessage}
                            </Text>
                        ) : null}
                    </View>
                </ScrollView>

                <Button
                    title={state.isLoading ? "Đang lưu..." : text.save}
                    onPress={state.handleChangePassword}
                    style={[
                        styles.saveButton,
                        {
                            bottom:
                                Platform.OS === "android"
                                    ? insets.bottom + 20
                                    : insets.bottom + 16,
                        },
                    ]}
                />
            </KeyboardAvoidingView>
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "transparent",
    },
    flex: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 16,
        paddingTop: 32,
        paddingBottom: 120,
    },
    card: {
        backgroundColor: colors.primaryContainer,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingTop: 26,
        paddingBottom: 24,
    },
    description: {
        color: colors.textSecondary,
        fontSize: 14,
        lineHeight: 22,
        textAlign: "center",
        marginBottom: 26,
    },
    fieldLabel: {
        color: colors.textPrimary,
        fontSize: 14,
        lineHeight: 20,
        fontWeight: "700",
        marginBottom: 6,
        marginTop: 6,
    },
    errorText: {
        color: colors.error,
        fontSize: 12,
        lineHeight: 17,
        marginTop: -4,
        marginBottom: 6,
        fontWeight: "500",
    },
    feedbackText: {
        fontSize: 14,
        fontWeight: "600",
        textAlign: "center",
        marginTop: 4,
    },
    feedbackSuccess: {
        color: colors.success,
    },
    feedbackError: {
        color: colors.error,
    },
    saveButton: {
        position: "absolute",
        left: 16,
        right: 16,
        width: "auto",
        marginVertical: 0,
    },
    inputField: {
        backgroundColor: colors.surface,
    },
    inputContainer: {
        marginVertical: 4,
    },
});
