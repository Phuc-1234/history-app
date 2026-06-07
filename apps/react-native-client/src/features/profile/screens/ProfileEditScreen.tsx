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
import { User } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppSelector } from "@/store/storeHook";
import Input from "../../../components/Input";
import Button from "../../../components/Button";
import ProfileAvatar from "../components/ProfileAvatar";
import SubPageHeader from "../components/SubPageHeader";

export default function ProfileEditScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const profile = useAppSelector((state) => state.auth.profile);
    const [name, setName] = useState(profile?.name ?? "");
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSave = async () => {
        const trimmedName = name.trim();
        if (trimmedName === "") {
            setErrorMsg("Tên không được để trống");
            return;
        }
        setErrorMsg(null);
        setIsLoading(true);

        // Simulate local save loading
        await new Promise((resolve) => setTimeout(resolve, 600));
        setIsLoading(false);
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
                behavior={Platform.OS === "ios" ? "padding" : undefined}
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
                            <ProfileAvatar
                                uri={profile?.profileImgUrl}
                                size={78}
                                onEditPress={() => {}}
                            />
                        </View>

                        <View style={styles.formSection}>
                            <Text style={styles.fieldLabel}>Họ và tên</Text>
                            <Input
                                icon={User}
                                placeholder="Nhập họ và tên"
                                value={name}
                                onChangeText={(text) => {
                                    setName(text);
                                    if (errorMsg) setErrorMsg(null);
                                }}
                            />
                            {errorMsg && (
                                <Text style={styles.errorText}>{errorMsg}</Text>
                            )}
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
                    <Button
                        title={isLoading ? "Đang lưu..." : "Lưu"}
                        onPress={isLoading ? () => {} : handleSave}
                    />
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

    errorText: {
        color: "#EF4444",
        fontSize: 13,
        fontWeight: "500",
        marginTop: 8,
        marginLeft: 4,
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
