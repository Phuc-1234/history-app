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
    TouchableOpacity,
    Switch,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { User, Mail } from "lucide-react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppSelector } from "@/store/storeHook";
import {
    useUpdateUserDataMutation,
    useUpdateUserEmailMutation,
    useVerifyUserEmailMutation,
} from "@/features/auth/services/authApi";
import {
    useGetUserInventoryQuery,
    useActivateItemMutation,
} from "@/features/inventory/services/itemApi";
import Input from "../../../components/Input";
import Button from "../../../components/Button";
import ProfileAvatar from "../components/ProfileAvatar";
import { AvatarWithFrame } from "@/components/ui";
import { ScreenWrapper } from "../../../components/layout/ScreenWrapper";
import * as ImagePicker from "expo-image-picker";
import { colors } from "../../../theme/colors";
import typography from "../../../theme/typography";
import { Toast } from "../../../components/Toast";
import { OtpModal } from "../../../components/OtpModal";

export default function ProfileEditScreen() {
    const router = useRouter();
    const { triggerImagePicker } = useLocalSearchParams<{ triggerImagePicker?: string }>();
    const insets = useSafeAreaInsets();
    const [toastVisible, setToastVisible] = useState(false);
    const [toastMessage, setToastMessage] = useState("");
    const profile = useAppSelector((state) => state.auth.profile);
    const [name, setName] = useState(profile?.name ?? "");
    const [email, setEmail] = useState(profile?.email ?? "");
    const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
    const [selectedFrameUrl, setSelectedFrameUrl] = useState<string | null>(
        profile?.equippedFrameUrl ?? null
    );
    const [isHidden, setIsHidden] = useState<boolean>(profile?.isHidden ?? false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [updateUserData] = useUpdateUserDataMutation();
    const [updateUserEmail] = useUpdateUserEmailMutation();
    const [verifyUserEmail] = useVerifyUserEmailMutation();
    const { data: inventoryData } = useGetUserInventoryQuery();
    const [activateItem] = useActivateItemMutation();

    const frameItems = (inventoryData?.inventory ?? []).filter(
        (ui) => ui.itemDefinition?.equipmentSlot === "AVT_FRAME"
    );

    const [otpModalVisible, setOtpModalVisible] = useState(false);
    const [pendingEmail, setPendingEmail] = useState("");
    const [otpError, setOtpError] = useState<string | null>(null);
    const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

    useEffect(() => {
        setName(profile?.name ?? "");
        setEmail(profile?.email ?? "");
        setSelectedFrameUrl(profile?.equippedFrameUrl ?? null);
        setIsHidden(profile?.isHidden ?? false);
    }, [profile?.email, profile?.equippedFrameUrl, profile?.isHidden, profile?.name]);

    const handleSelectFrame = (targetFrameUrl: string | null) => {
        const previousFrameUrl = selectedFrameUrl;
        if (previousFrameUrl === targetFrameUrl) return;

        // 1. Optimistic update (instant local change)
        setSelectedFrameUrl(targetFrameUrl);

        // 2. Auto-save in background
        if (!targetFrameUrl) {
            const currentItem = frameItems.find(
                (ui) => ui.itemDefinition?.imgUrl === previousFrameUrl
            );
            if (currentItem) {
                activateItem({
                    itemDefinitionId: currentItem.itemDefinitionId,
                    forceReplace: true,
                })
                    .unwrap()
                    .catch(() => setSelectedFrameUrl(previousFrameUrl));
            }
        } else {
            const targetItem = frameItems.find(
                (ui) => ui.itemDefinition?.imgUrl === targetFrameUrl
            );
            if (targetItem) {
                activateItem({
                    itemDefinitionId: targetItem.itemDefinitionId,
                    forceReplace: true,
                })
                    .unwrap()
                    .catch(() => setSelectedFrameUrl(previousFrameUrl));
            }
        }
    };

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

    useEffect(() => {
        if (triggerImagePicker === "true") {
            handlePickImage();
        }
    }, []);

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
        if (trimmedName.length > 30) {
            setErrorMsg("Tên không được vượt quá 30 ký tự");
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

            // 2. Save updates for name, image, and privacy
            if (
                trimmedName !== profile?.name ||
                finalProfileImgUrl !== profile?.profileImgUrl ||
                isHidden !== (profile?.isHidden ?? false)
            ) {
                await updateUserData({
                    name: trimmedName,
                    profileImgUrl: finalProfileImgUrl,
                    isHidden,
                }).unwrap();
            }

            // 3. If email changed, request OTP code
            if (trimmedEmail !== profile?.email) {
                await updateUserEmail({ newEmail: trimmedEmail }).unwrap();
                setPendingEmail(trimmedEmail);
                setOtpError(null);
                setOtpModalVisible(true);
                setIsLoading(false);
                return;
            }

            if (Platform.OS === 'web') {
                alert("Đã cập nhật thông tin thành công!");
            } else {
                setToastMessage("Đã cập nhật thông tin thành công!");
                setToastVisible(true);
            }

            setTimeout(() => {
                router.back();
            }, 1800);
        } catch (err: any) {
            console.error("Save error:", err);
            setErrorMsg(err?.data?.error || err.message || "Cập nhật thông tin thất bại");
            setIsUploading(false);
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOtp = async (token: string) => {
        setIsVerifyingOtp(true);
        setOtpError(null);
        try {
            await verifyUserEmail({ newEmail: pendingEmail, token }).unwrap();
            setOtpModalVisible(false);

            if (Platform.OS === 'web') {
                alert("Đã cập nhật email thành công!");
            } else {
                setToastMessage("Đã cập nhật email thành công!");
                setToastVisible(true);
            }

            setTimeout(() => {
                router.back();
            }, 1800);
        } catch (err: any) {
            console.error("Verify OTP error:", err);
            setOtpError(err?.data?.error || err.message || "Mã OTP không chính xác hoặc đã hết hạn.");
        } finally {
            setIsVerifyingOtp(false);
        }
    };

    const handleResendOtp = async () => {
        try {
            await updateUserEmail({ newEmail: pendingEmail }).unwrap();
        } catch (err: any) {
            setOtpError(err?.data?.error || err.message || "Gửi lại mã OTP thất bại.");
        }
    };

    return (
        <ScreenWrapper
            showTopBar={false}
            branchConfig={{
                hierarchy: "Cá nhân",
                title: "Sửa thông tin",
                onBackPress: () => router.back(),
            }}
        >

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
                                    frameUri={selectedFrameUrl}
                                    size={78}
                                    name={profile?.name}
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

                        {/* List of obtained avatar frames for quick local selection */}
                        {frameItems.length > 0 && (
                            <View style={styles.framePickerSection}>
                                <Text style={styles.fieldLabel}>Khung avatar sở hữu</Text>
                                <ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    contentContainerStyle={styles.frameListContent}
                                >
                                    {/* Default / None Option */}
                                    <TouchableOpacity
                                        style={[
                                            styles.frameOptionCard,
                                            !selectedFrameUrl && styles.frameOptionSelected,
                                        ]}
                                        onPress={() => handleSelectFrame(null)}
                                        activeOpacity={0.8}
                                    >
                                        <View style={styles.noFrameCircle}>
                                            <Ionicons name="ban-outline" size={22} color={colors.textMuted} />
                                        </View>
                                        <Text style={styles.frameOptionText} numberOfLines={1}>
                                            Mặc định
                                        </Text>
                                    </TouchableOpacity>

                                    {/* Obtained Frames */}
                                    {frameItems.map((item) => {
                                        const def = item.itemDefinition;
                                        const isSelected = selectedFrameUrl === def.imgUrl;
                                        return (
                                            <TouchableOpacity
                                                key={def.id}
                                                style={[
                                                    styles.frameOptionCard,
                                                    isSelected && styles.frameOptionSelected,
                                                ]}
                                                onPress={() => handleSelectFrame(def.imgUrl)}
                                                activeOpacity={0.8}
                                            >
                                                <AvatarWithFrame
                                                    uri={selectedImageUri || profile?.profileImgUrl}
                                                    frameUri={def.imgUrl}
                                                    size={40}
                                                    name={profile?.name}
                                                    borderWidth={1}
                                                />
                                                <Text style={styles.frameOptionText} numberOfLines={1}>
                                                    {def.name}
                                                </Text>
                                                {isSelected && (
                                                    <View style={styles.equippedCheckBadge}>
                                                        <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                                                    </View>
                                                )}
                                            </TouchableOpacity>
                                        );
                                    })}
                                </ScrollView>
                            </View>
                        )}

                        <View style={styles.formSection}>
                            <Text style={styles.fieldLabel}>Họ và tên</Text>
                            <Input
                                icon={User}
                                placeholder="Nhập họ và tên"
                                value={name}
                                maxLength={30}
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

                            <View style={styles.privacyContainer}>
                                <View style={styles.privacyTextGroup}>
                                    <View style={styles.privacyHeaderRow}>
                                        <Ionicons name="lock-closed-outline" size={16} color={colors.primary} style={{ marginRight: 6 }} />
                                        <Text style={styles.privacyTitle}>Tài khoản riêng tư</Text>
                                    </View>
                                    <Text style={styles.privacySubtext}>
                                        Không hiển thị trên Bảng xếp hạng và ẩn khỏi tìm kiếm bạn bè.
                                    </Text>
                                </View>
                                <Switch
                                    value={isHidden}
                                    onValueChange={setIsHidden}
                                    trackColor={{ false: colors.borderMedium, true: colors.primary }}
                                    thumbColor="#FFFFFF"
                                />
                            </View>

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
            <Toast
                visible={toastVisible}
                message={toastMessage}
                onHide={() => setToastVisible(false)}
            />
            <OtpModal
                visible={otpModalVisible}
                email={pendingEmail}
                onClose={() => setOtpModalVisible(false)}
                onVerify={handleVerifyOtp}
                onResend={handleResendOtp}
                error={otpError}
                isLoading={isVerifyingOtp}
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
        fontFamily: typography.fonts.semiBold,
        fontSize: 13,
        color: colors.textSecondary,
        marginBottom: 6,
        marginTop: 8,
    },

    errorText: {
        fontFamily: typography.fonts.medium,
        color: colors.error,
        fontSize: 13,
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
    framePickerSection: {
        marginBottom: 16,
        marginTop: -8,
    },
    frameListContent: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        paddingVertical: 6,
    },
    frameOptionCard: {
        width: 76,
        paddingVertical: 8,
        paddingHorizontal: 6,
        borderRadius: 12,
        backgroundColor: colors.surface,
        borderWidth: 1.5,
        borderColor: colors.borderMedium,
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
    },
    frameOptionSelected: {
        borderColor: colors.primary,
        backgroundColor: "#FFF5EC",
    },
    noFrameCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: colors.borderMedium,
        borderStyle: "dashed",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.surfaceVariant,
    },
    frameOptionText: {
        fontFamily: typography.fonts.medium,
        fontSize: 10,
        color: colors.textSecondary,
        marginTop: 4,
        textAlign: "center",
    },
    equippedCheckBadge: {
        position: "absolute",
        top: 4,
        right: 4,
        backgroundColor: colors.primary,
        width: 16,
        height: 16,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
    },
    privacyContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 14,
        marginTop: 14,
        borderWidth: 1,
        borderColor: colors.borderMedium,
    },
    privacyTextGroup: {
        flex: 1,
        marginRight: 12,
    },
    privacyHeaderRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 4,
    },
    privacyTitle: {
        fontFamily: typography.fonts.semiBold,
        fontSize: 14,
        color: colors.textPrimary,
    },
    privacySubtext: {
        fontFamily: typography.fonts.regular,
        fontSize: 12,
        color: colors.textMuted,
        lineHeight: 16,
    },
});
