import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { User, Mail } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppSelector } from "@/store/storeHook";
import {
    useUpdateUserDataMutation,
    useUpdateUserEmailMutation,
} from "@/features/auth/services/authApi";
import Input from "../../../components/Input";
import Button from "../../../components/Button";
import ProfileAvatar from "../components/ProfileAvatar";
import SubPageHeader from "../components/SubPageHeader";
import * as ImagePicker from "expo-image-picker";
import { colors } from "../../../theme/colors";

export default function ProfileEditScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const profile = useAppSelector((state) => state.auth.profile);
    const [name, setName] = useState(profile?.name ?? "");
    const [email, setEmail] = useState(profile?.email ?? "");
    const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [updateUserData] = useUpdateUserDataMutation();
    const [updateUserEmail] = useUpdateUserEmailMutation();

    useEffect(() => {
        setName(profile?.name ?? "");
        setEmail(profile?.email ?? "");
    }, [profile?.email, profile?.name]);

    const handlePickImage = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (permissionResult.granted === false) {
            if (Platform.OS === 'web') {
                alert("Bạn cần cấp quyền truy cập thư viện ảnh để thay đổi ảnh đại diện!");
            } else {
                Alert.alert(
                    "Quyền truy cập",
                    "Bạn cần cấp quyền truy cập thư viện ảnh để thay đổi ảnh đại diện!"
                );
            }
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            const selectedImage = result.assets[0];
            setSelectedImageUri(selectedImage.uri); // Only preview locally
        }
    };

    const handleUploadImage = async (imageUri: string): Promise<string> => {
        const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
        const uploadPreset = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

        if (!cloudName || !uploadPreset) {
            throw new Error("Chưa cấu hình Cloudinary Cloud Name hoặc Upload Preset trong file .env!");
        }

        const formData = new FormData();

        const uriParts = imageUri.split('.');
        const fileType = uriParts[uriParts.length - 1];
        const fileName = imageUri.split('/').pop() || `avatar.${fileType}`;

        if (Platform.OS === 'web') {
            if (imageUri.startsWith('data:')) {
                formData.append('file', imageUri);
            } else {
                const res = await fetch(imageUri);
                const blob = await res.blob();
                formData.append('file', blob, fileName);
            }
        } else {
            formData.append('file', {
                uri: Platform.OS === 'ios' ? imageUri.replace('file://', '') : imageUri,
                name: fileName,
                type: `image/${fileType === 'jpg' ? 'jpeg' : fileType}`,
            } as any);
        }

        formData.append('upload_preset', uploadPreset);

        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`);
            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const response = JSON.parse(xhr.responseText);
                        resolve(response.secure_url);
                    } catch (err) {
                        reject(new Error("Lỗi đọc phản hồi từ Cloudinary"));
                    }
                } else {
                    try {
                        const errorData = JSON.parse(xhr.responseText);
                        reject(new Error(errorData?.error?.message || "Lỗi tải ảnh lên Cloudinary"));
                    } catch {
                        reject(new Error("Lỗi tải ảnh lên Cloudinary"));
                    }
                }
            };
            xhr.onerror = () => {
                reject(new Error("Lỗi kết nối mạng khi tải ảnh"));
            };
            xhr.send(formData);
        });
    };

    const handleSave = async () => {
        const trimmedName = name.trim();
        const trimmedEmail = email.trim();

        if (trimmedName === "") {
            setErrorMsg("Tên không được để trống");
            return;
        }
        if (trimmedEmail === "") {
            setErrorMsg("Email không được để trống");
            return;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmedEmail)) {
            setErrorMsg("Email không đúng định dạng");
            return;
        }

        setErrorMsg(null);
        setIsLoading(true);

        try {
            let finalProfileImgUrl = profile?.profileImgUrl;

            // 1. Upload to Cloudinary if new image selected
            if (selectedImageUri) {
                setIsUploading(true);
                finalProfileImgUrl = await handleUploadImage(selectedImageUri);
                setIsUploading(false);
            }

            // 2. Save updates to database
            if (trimmedName !== profile?.name || finalProfileImgUrl !== profile?.profileImgUrl) {
                await updateUserData({
                    name: trimmedName,
                    profileImgUrl: finalProfileImgUrl
                }).unwrap();
            }

            if (trimmedEmail !== profile?.email) {
                await updateUserEmail({ newEmail: trimmedEmail }).unwrap();
            }

            if (Platform.OS === 'web') {
                alert("Đã cập nhật thông tin thành công!");
            } else {
                Alert.alert("Thành công", "Đã cập nhật thông tin thành công!");
            }

            router.back();
        } catch (err: any) {
            console.error("Save error:", err);
            setErrorMsg(err.message || err?.data?.error || "Cập nhật thông tin thất bại");
            setIsUploading(false);
        } finally {
            setIsLoading(false);
        }
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
                            <View style={{ position: "relative" }}>
                                <ProfileAvatar
                                    uri={selectedImageUri || profile?.profileImgUrl}
                                    size={78}
                                    onEditPress={isUploading ? undefined : handlePickImage}
                                    showEditButton={!isUploading}
                                />
                                {isUploading && (
                                    <View style={[StyleSheet.absoluteFill, styles.loaderContainer]}>
                                        <ActivityIndicator size="small" color={colors.primary} />
                                    </View>
                                )}
                            </View>
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
                                style={styles.inputField}
                            />

                            <Text style={styles.fieldLabel}>Email</Text>
                            <Input
                                icon={Mail}
                                placeholder="Nhập email"
                                value={email}
                                keyboardType="email-address"
                                onChangeText={(text) => {
                                    setEmail(text);
                                    if (errorMsg) setErrorMsg(null);
                                }}
                                style={styles.inputField}
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
                        onPress={isLoading ? () => { } : handleSave}
                    />
                </View>
            </KeyboardAvoidingView>
        </View>
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
        paddingTop: 8,
        paddingBottom: 120,
    },

    card: {
        backgroundColor: colors.primaryContainer,
        borderRadius: 12,
        paddingHorizontal: 18,
        paddingTop: 22,
        paddingBottom: 24,
    },

    avatarSection: {
        alignItems: "center",
        marginBottom: 24,
    },

    loaderContainer: {
        backgroundColor: "rgba(255, 255, 255, 0.7)",
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 5,
    },

    formSection: {
        width: "100%",
    },

    fieldLabel: {
        fontSize: 13,
        fontWeight: "600",
        color: colors.textSecondary,
        marginBottom: 6,
        marginTop: 8,
    },

    errorText: {
        color: colors.error,
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

        backgroundColor: "transparent",
    },
    inputField: {
        backgroundColor: colors.surface,
    },
});
