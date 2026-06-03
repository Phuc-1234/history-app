import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Lock, KeyRound, ShieldCheck } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Input from "../../../components/Input";
import Button from "../../../components/Button";
import SubPageHeader from "../components/SubPageHeader";

export default function PasswordChangeScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const handleSave = () => {
        // TODO: Validate passwords and call API
        if (newPassword !== confirmPassword) {
            // TODO: Show error message
            return;
        }

        router.back();
    };

    return (
        <View style={styles.container}>
            <SubPageHeader
                title="Sửa mật khẩu"
                onBackPress={() => router.back()}
            />

            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0} // Accounts for the top native header bounds
            >
                <ScrollView
                    style={styles.flex}
                    contentContainerStyle={styles.scrollContent}
                    bounces={false}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.card}>
                        <Text style={styles.description}>
                            Vui lòng nhập mật khẩu cũ và tạo mật khẩu mới để bảo
                            mật tài khoản của bạn.
                        </Text>

                        <View style={styles.formSection}>
                            <Text style={styles.fieldLabel}>Mật khẩu cũ</Text>
                            <Input
                                icon={Lock}
                                placeholder="Nhập mật khẩu cũ"
                                isPassword
                                value={oldPassword}
                                onChangeText={setOldPassword}
                            />

                            <Text style={styles.fieldLabel}>Mật khẩu mới</Text>
                            <Input
                                icon={KeyRound}
                                placeholder="Nhập mật khẩu mới"
                                isPassword
                                value={newPassword}
                                onChangeText={setNewPassword}
                            />

                            <Text style={styles.fieldLabel}>
                                Xác nhận mật khẩu
                            </Text>
                            <Input
                                icon={ShieldCheck}
                                placeholder="Nhập lại mật khẩu mới"
                                isPassword
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                            />
                        </View>
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
                    <Button title="Lưu" onPress={handleSave} />
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F8F7FF",
    },

    flex: {
        flex: 1,
    },

    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 24,
    },

    card: {
        backgroundColor: "#FFFFFF",
        borderRadius: 18,
        paddingHorizontal: 18,
        paddingTop: 22,
        paddingBottom: 24,

        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 14,
        shadowOffset: {
            width: 0,
            height: 6,
        },
        elevation: 4,
    },

    description: {
        fontSize: 14,
        color: "#8E8E93",
        lineHeight: 21,
        textAlign: "center",
        paddingHorizontal: 8,
        marginBottom: 18,
    },

    formSection: {
        width: "100%",
    },

    fieldLabel: {
        fontSize: 13,
        fontWeight: "600",
        color: "#374151",
        marginBottom: 6,
        marginTop: 8,
    },

    buttonContainer: {
        // REMOVED: position: "absolute", left: 0, right: 0, bottom: 0,
        paddingHorizontal: 16,
        paddingTop: 12,
        backgroundColor: "#F8F7FF",
        // Optional: Add a top border or light shadow if you want to retain the pinned look
        borderTopWidth: 1,
        borderColor: "#E5E7EB",
    },
});
