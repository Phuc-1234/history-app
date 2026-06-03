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
import { User, Mail } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Input from "../../../components/Input";
import Button from "../../../components/Button";
import ProfileAvatar from "../components/ProfileAvatar";
import SubPageHeader from "../components/SubPageHeader";

export default function ProfileEditScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [name, setName] = useState("Nguyễn Văn A");
    const [email, setEmail] = useState("nguyenvana@example.com");

    const handleSave = () => {
        // TODO: Save profile changes via API
        router.back();
    };

    return (
        <View style={styles.container}>
            <SubPageHeader
                title="Sửa thông tin"
                onBackPress={() => router.back()}
            />

            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
                <ScrollView
                    style={styles.flex}
                    contentContainerStyle={styles.scrollContent}
                    bounces={false}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.card}>
                        <View style={styles.avatarSection}>
                            <ProfileAvatar size={78} onEditPress={() => {}} />
                        </View>

                        <View style={styles.formSection}>
                            <Text style={styles.fieldLabel}>Họ và tên</Text>
                            <Input
                                icon={User}
                                placeholder="Nhập họ và tên"
                                value={name}
                                onChangeText={setName}
                            />

                            <Text style={styles.fieldLabel}>Email</Text>
                            <Input
                                icon={Mail}
                                placeholder="Nhập email"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>
                    </View>
                </ScrollView>

                <View
                    style={[
                        styles.buttonContainer,
                        {
                            paddingBottom:
                                insets.bottom > 0 ? insets.bottom + 12 : 16,
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
        paddingBottom: 120,
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

    avatarSection: {
        alignItems: "center",
        marginBottom: 24,
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
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        paddingHorizontal: 16,
        paddingTop: 12,
        
        backgroundColor: "#F8F7FF",
    },
});
