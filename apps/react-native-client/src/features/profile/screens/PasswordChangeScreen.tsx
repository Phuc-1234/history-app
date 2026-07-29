import React from "react";
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useRouter } from "expo-router";
import { Check, CheckCircle, Circle, KeyRound, Lock } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Button from "../../../components/Button";
import Input from "../../../components/Input";
import { useChangePassword } from "../hooks/useChangePassword";
import { ScreenWrapper } from "../../../components/layout/ScreenWrapper";
import { colors } from "../../../theme/colors";
import { Toast } from "../../../components/Toast";
import { useState, useEffect } from "react";

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
    requirementsTitle: "Mật khẩu mới cần thỏa:",
    reqMinLength: "Có ít nhất 8 ký tự",
    reqNotSame: "Khác mật khẩu cũ",
    reqConfirm: "Xác nhận mật khẩu khớp",
};

type Requirement = {
    key: string;
    label: string;
    met: boolean;
};

function PasswordRequirementList({ items }: { items: Requirement[] }) {
    return (
        <View style={styles.requirementList}>
            <Text style={styles.requirementTitle}>{text.requirementsTitle}</Text>
            {items.map((item) => {
                const Icon = item.met ? Check : Circle;
                return (
                    <View key={item.key} style={styles.requirementRow}>
                        <Icon
                            size={16}
                            color={item.met ? colors.success : colors.textMuted}
                            strokeWidth={item.met ? 3 : 2}
                        />
                        <Text
                            style={[
                                styles.requirementText,
                                item.met && styles.requirementTextMet,
                            ]}
                        >
                            {item.label}
                        </Text>
                    </View>
                );
            })}
        </View>
    );
}

export default function PasswordChangeScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const state = useChangePassword();
    const [toastVisible, setToastVisible] = useState(false);
    const [toastMessage, setToastMessage] = useState("");
    const [toastType, setToastType] = useState<"success" | "error">("success");

    useEffect(() => {
        if (state.feedbackMessage) {
            setToastMessage(state.feedbackMessage);
            setToastType(state.isSuccess ? "success" : "error");
            setToastVisible(true);
        }
    }, [state.feedbackMessage, state.isSuccess]);

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
                        <TouchableOpacity
                            onPress={() => router.push("/(1_auth)/1_3_forgot")}
                            style={styles.forgotButton}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.forgotText}>Quên mật khẩu?</Text>
                        </TouchableOpacity>

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
                        <PasswordRequirementList
                            items={[
                                {
                                    key: "min",
                                    label: text.reqMinLength,
                                    met: state.newPassword.length >= 8,
                                },
                                {
                                    key: "notSame",
                                    label: text.reqNotSame,
                                    met:
                                        state.newPassword.length > 0 &&
                                        state.newPassword !== state.currentPassword,
                                },
                                {
                                    key: "confirm",
                                    label: text.reqConfirm,
                                    met:
                                        state.confirmPassword.length > 0 &&
                                        state.confirmPassword === state.newPassword,
                                },
                            ]}
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
            <Toast
                visible={toastVisible}
                message={toastMessage}
                type={toastType}
                onHide={() => setToastVisible(false)}
            />
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
    requirementList: {
        marginTop: 10,
        paddingHorizontal: 4,
    },
    requirementTitle: {
        fontSize: 12,
        fontWeight: "600",
        color: colors.textSecondary,
        marginBottom: 6,
    },
    requirementRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 3,
    },
    requirementText: {
        marginLeft: 8,
        fontSize: 13,
        color: colors.textMuted,
        lineHeight: 18,
    },
    requirementTextMet: {
        color: colors.success,
        fontWeight: "600",
    },
    forgotButton: {
        alignSelf: "flex-end",
        marginTop: 4,
        marginBottom: 10,
    },
    forgotText: {
        color: colors.primary,
        fontSize: 13,
        fontWeight: "600",
    },
});
