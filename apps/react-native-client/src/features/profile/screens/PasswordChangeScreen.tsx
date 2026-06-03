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
import SubPageHeader from "../components/SubPageHeader";

const text = {
    title: "S\u1eeda m\u1eadt kh\u1ea9u",
    description:
        "Vui l\u00f2ng nh\u1eadp m\u1eadt kh\u1ea9u c\u0169 v\u00e0 t\u1ea1o m\u1eadt kh\u1ea9u m\u1edbi \u0111\u1ec3 b\u1ea3o m\u1eadt t\u00e0i kho\u1ea3n c\u1ee7a b\u1ea1n.",
    currentLabel: "M\u1eadt kh\u1ea9u c\u0169",
    currentPlaceholder: "Nh\u1eadp m\u1eadt kh\u1ea9u c\u0169",
    newLabel: "M\u1eadt kh\u1ea9u m\u1edbi",
    newPlaceholder: "Nh\u1eadp m\u1eadt kh\u1ea9u m\u1edbi",
    confirmLabel: "X\u00e1c nh\u1eadn m\u1eadt kh\u1ea9u",
    confirmPlaceholder: "Nh\u1eadp l\u1ea1i m\u1eadt kh\u1ea9u m\u1edbi",
    save: "L\u01b0u",
};

export default function PasswordChangeScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const state = useChangePassword();

    return (
        <View style={styles.container}>
            <SubPageHeader title={text.title} onBackPress={() => router.back()} />

            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
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

                <View
                    style={[
                        styles.buttonContainer,
                        {
                            paddingBottom:
                                Platform.OS === "android"
                                    ? insets.bottom + 20
                                    : insets.bottom + 16,
                        },
                    ]}
                >
                    <Button
                        title={state.isLoading ? "\u0110ang l\u01b0u..." : text.save}
                        onPress={state.handleChangePassword}
                    />
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F8F5FC",
    },
    flex: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 30,
        paddingTop: 32,
        paddingBottom: 24,
    },
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
    description: {
        color: "#7C7787",
        fontSize: 14,
        lineHeight: 22,
        textAlign: "center",
        marginBottom: 26,
    },
    fieldLabel: {
        color: "#242330",
        fontSize: 14,
        lineHeight: 20,
        fontWeight: "700",
        marginBottom: 10,
        marginTop: 8,
    },
    errorText: {
        color: "#E53E3E",
        fontSize: 12,
        lineHeight: 17,
        marginTop: -8,
        marginBottom: 10,
        fontWeight: "500",
    },
    feedbackText: {
        fontSize: 14,
        fontWeight: "600",
        textAlign: "center",
        marginTop: 4,
    },
    feedbackSuccess: {
        color: "#38A169",
    },
    feedbackError: {
        color: "#E53E3E",
    },
    buttonContainer: {
        paddingHorizontal: 30,
        paddingTop: 12,
        backgroundColor: "#F8F5FC",
    },
});
