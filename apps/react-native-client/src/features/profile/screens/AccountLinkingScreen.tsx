import React, { useState } from "react";
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    Modal,
    TouchableOpacity,
    TouchableWithoutFeedback,
} from "react-native";
import { useRouter } from "expo-router";
import { Mail, Link2, KeyRound, X } from "lucide-react-native";
import { useAppSelector } from "@/store/storeHook";
import { useLinkFacebookAccountMutation } from "@/features/auth/services/authApi";
import { ScreenWrapper } from "../../../components/layout/ScreenWrapper";
import { Card } from "../../../components/Card";
import Button from "../../../components/Button";
import Input from "../../../components/Input";
import { Toast } from "../../../components/Toast";
import { colors } from "../../../theme/colors";
import typography from "../../../theme/typography";

export default function AccountLinkingScreen() {
    const router = useRouter();
    const profile = useAppSelector((state) => state.auth.profile);
    const [linkFacebook, { isLoading: isLinkingFb }] = useLinkFacebookAccountMutation();

    const [fbModalVisible, setFbModalVisible] = useState(false);
    const [fbAccessToken, setFbAccessToken] = useState("");
    const [fbError, setFbError] = useState<string | null>(null);

    const [toastVisible, setToastVisible] = useState(false);
    const [toastMessage, setToastMessage] = useState("");
    const [toastType, setToastType] = useState<"success" | "error">("success");

    const handleOpenFbModal = () => {
        setFbAccessToken("");
        setFbError(null);
        setFbModalVisible(true);
    };

    const handleConfirmLinkFacebook = async () => {
        const trimmedToken = fbAccessToken.trim();
        if (!trimmedToken) {
            setFbError("Vui lòng nhập Facebook Access Token.");
            return;
        }

        try {
            setFbError(null);
            const res = await linkFacebook({ accessToken: trimmedToken }).unwrap();
            setFbModalVisible(false);
            setToastMessage(res.message || "Liên kết Facebook thành công!");
            setToastType("success");
            setToastVisible(true);
        } catch (err: any) {
            setFbError(err?.data?.error || "Liên kết Facebook thất bại.");
        }
    };

    return (
        <ScreenWrapper
            showTopBar={false}
            branchConfig={{
                hierarchy: "Cá nhân",
                title: "Liên kết tài khoản",
                onBackPress: () => router.back(),
            }}
        >
            <ScrollView
                style={styles.flex}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <Text style={styles.sectionHeader}>Phương thức đăng nhập & liên kết</Text>

                {/* Email Section */}
                <Card variant="soft" style={styles.itemCard}>
                    <View style={styles.itemHeader}>
                        <View style={styles.iconWrapper}>
                            <Mail size={22} color={colors.primary} />
                        </View>
                        <View style={styles.itemTextContainer}>
                            <Text style={styles.itemTitle}>Địa chỉ Email</Text>
                            <Text style={styles.itemSubtitle}>
                                {profile?.email ? profile.email : "Chưa liên kết Email"}
                            </Text>
                        </View>
                    </View>
                    {!profile?.email && (
                        <Button
                            title="Thêm Email"
                            variant="outline"
                            onPress={() => router.push("/(10_proflie)/10_2_profile_edit")}
                            style={styles.actionBtn}
                        />
                    )}
                </Card>

                {/* Facebook Section */}
                <Card variant="soft" style={styles.itemCard}>
                    <View style={styles.itemHeader}>
                        <View style={styles.iconWrapper}>
                            <Link2 size={22} color={colors.primary} />
                        </View>
                        <View style={styles.itemTextContainer}>
                            <Text style={styles.itemTitle}>Tài khoản Facebook</Text>
                            <Text style={styles.itemSubtitle}>
                                {profile?.facebookId
                                    ? `Đã liên kết (ID: ${profile.facebookId})`
                                    : "Chưa liên kết Facebook"}
                            </Text>
                        </View>
                    </View>
                    {!profile?.facebookId && (
                        <Button
                            title={isLinkingFb ? "Đang liên kết..." : "Liên kết Facebook"}
                            variant="primary"
                            onPress={handleOpenFbModal}
                            disabled={isLinkingFb}
                            style={styles.actionBtn}
                        />
                    )}
                </Card>

                {/* Password Status Section */}
                <Card variant="soft" style={styles.itemCard}>
                    <View style={styles.itemHeader}>
                        <View style={styles.iconWrapper}>
                            <KeyRound size={22} color={colors.primary} />
                        </View>
                        <View style={styles.itemTextContainer}>
                            <Text style={styles.itemTitle}>Mật khẩu đăng nhập</Text>
                            <Text style={styles.itemSubtitle}>
                                {profile?.hasPassword !== false
                                    ? "Đã thiết lập mật khẩu"
                                    : "Chưa thiết lập mật khẩu"}
                            </Text>
                        </View>
                    </View>
                    <Button
                        title={profile?.hasPassword !== false ? "Đổi mật khẩu" : "Tạo mật khẩu"}
                        variant="outline"
                        onPress={() => router.push("/(10_proflie)/10_3_password_change")}
                        style={styles.actionBtn}
                    />
                </Card>
            </ScrollView>

            {/* Facebook Token Link Modal */}
            <Modal
                visible={fbModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setFbModalVisible(false)}
            >
                <TouchableWithoutFeedback onPress={() => setFbModalVisible(false)}>
                    <View style={styles.modalOverlay}>
                        <TouchableWithoutFeedback>
                            <View style={styles.modalContent}>
                                <View style={styles.modalHeader}>
                                    <Text style={styles.modalTitle}>Liên kết Facebook</Text>
                                    <TouchableOpacity onPress={() => setFbModalVisible(false)}>
                                        <X size={20} color={colors.textMuted} />
                                    </TouchableOpacity>
                                </View>

                                <Text style={styles.modalDesc}>
                                    Nhập Facebook Access Token để xác nhận và liên kết tài khoản Facebook của bạn:
                                </Text>

                                <Input
                                    placeholder="Dán Facebook Access Token tại đây"
                                    value={fbAccessToken}
                                    onChangeText={setFbAccessToken}
                                    style={styles.input}
                                />

                                {fbError ? <Text style={styles.errorText}>{fbError}</Text> : null}

                                <View style={styles.modalActions}>
                                    <Button
                                        title="Hủy"
                                        variant="outline"
                                        onPress={() => setFbModalVisible(false)}
                                        style={styles.modalBtn}
                                    />
                                    <Button
                                        title={isLinkingFb ? "Đang xử lý..." : "Xác nhận"}
                                        variant="primary"
                                        onPress={handleConfirmLinkFacebook}
                                        disabled={isLinkingFb}
                                        style={styles.modalBtn}
                                    />
                                </View>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>

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
    flex: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        gap: 12,
    },
    sectionHeader: {
        ...typography.bodyLargeBold,
        color: colors.textPrimary,
        marginBottom: 8,
    },
    itemCard: {
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
    },
    itemHeader: {
        flexDirection: "row",
        alignItems: "center",
    },
    iconWrapper: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: colors.surfaceVariant || "rgba(139, 92, 246, 0.1)",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    itemTextContainer: {
        flex: 1,
    },
    itemTitle: {
        ...typography.bodyMedium,
        fontWeight: "600",
        color: colors.textPrimary,
    },
    itemSubtitle: {
        ...typography.caption,
        color: colors.textMuted,
        marginTop: 2,
    },
    actionBtn: {
        marginTop: 12,
        borderRadius: 30,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
    },
    modalContent: {
        width: "100%",
        backgroundColor: colors.background || "#FFFFFF",
        borderRadius: 16,
        padding: 20,
        gap: 12,
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    modalTitle: {
        ...typography.h3,
        color: colors.textPrimary,
    },
    modalDesc: {
        ...typography.bodyMedium,
        color: colors.textSecondary,
        marginBottom: 4,
    },
    input: {
        marginBottom: 4,
    },
    errorText: {
        ...typography.caption,
        color: colors.error || "#EF4444",
    },
    modalActions: {
        flexDirection: "row",
        gap: 12,
        marginTop: 8,
    },
    modalBtn: {
        flex: 1,
        borderRadius: 30,
    },
});
