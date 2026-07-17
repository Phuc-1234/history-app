import React, { useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    ScrollView,
    Modal,
    Image,
    Clipboard,
    Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useSubscriptionPayment } from "../hooks/useSubscriptionPayment";
import { PaymentProvider } from "../api/paymentApi";
import { useAppSelector } from "@/store/storeHook";
import { API_BASE_URL } from "../../../services/config";
import { colors } from "../../../theme/colors";
import { typography } from "../../../theme/typography";
import { ScreenWrapper } from "../../../components/layout/ScreenWrapper";
import { Ionicons } from "@expo/vector-icons";

const PAYMENT_PROVIDERS: PaymentProvider[] = ["ZALOPAY", "SEPAY"];

function getProviderLabel(provider: PaymentProvider) {
    if (provider === "ZALOPAY") return "ZaloPay";
    return "VietQR";
}

function getProviderSubLabel(provider: PaymentProvider) {
    if (provider === "ZALOPAY") return "Ví điện tử";
    return "Ngân hàng";
}

function getProviderIconName(provider: PaymentProvider) {
    if (provider === "ZALOPAY") return "wallet-outline";
    return "business-outline";
}

function getProviderColor(provider: PaymentProvider) {
    if (provider === "ZALOPAY") return colors.zalopay;
    return colors.vietqr;
}

export const SubscriptionScreen: React.FC = () => {
    const router = useRouter();
    const profile = useAppSelector((state) => state.auth.profile);
    const { state, subscribe, cancelSubscription, reset } = useSubscriptionPayment();
    const [selectedProvider, setSelectedProvider] = useState<PaymentProvider>("ZALOPAY");
    const [isSimulating, setIsSimulating] = useState(false);

    const isLoading = state.phase === "loading" || (state.phase === "waiting" && !state.vietQrUrl);
    const showResultModal = state.phase === "success" || state.phase === "failed";
    const isSuccess = state.phase === "success";

    const handleSubscribe = () => {
        subscribe(selectedProvider);
    };

    const handleCancel = () => {
        Alert.alert(
            "Hủy gia hạn gói Pro",
            "Bạn có chắc muốn hủy tự động gia hạn? Bạn vẫn có thể dùng các quyền lợi của gói Pro đến hết chu kỳ hiện tại.",
            [
                { text: "Bỏ qua", style: "cancel" },
                {
                    text: "Đồng ý hủy",
                    style: "destructive",
                    onPress: async () => {
                        const res = await cancelSubscription();
                        if (res.success) {
                            Alert.alert("Thành công", "Đã hủy tự động gia hạn thành công.");
                        } else {
                            Alert.alert("Lỗi", res.error || "Không thể hủy gói.");
                        }
                    },
                },
            ]
        );
    };

    const copyToClipboard = (value: string, label: string) => {
        Clipboard.setString(value);
        Alert.alert("Đã sao chép", `${label} đã được sao chép.`);
    };

    const simulateNativePayment = async () => {
        if (state.phase !== "waiting" || !state.vietQrUrl) return;
        setIsSimulating(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/payment/sepay/webhook`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Apikey history_app_secure_token_2026",
                },
                body: JSON.stringify({
                    id: Math.floor(Math.random() * 100000),
                    gateway: state.bankId,
                    transactionDate: new Date().toISOString().slice(0, 19).replace("T", " "),
                    accountNumber: state.accountNo,
                    transferType: "in",
                    transferAmount: state.amountVnd,
                    content: state.providerOrderId,
                    referenceCode: "SIM_SUB_" + Math.random().toString(36).substring(2, 10).toUpperCase(),
                }),
            });
            if (response.ok) {
                console.log("[Simulation] Webhook success processed");
            } else {
                const errData = await response.json();
                console.error("Simulation failed:", errData);
            }
        } catch (e) {
            console.error("Simulation connection error:", e);
        } finally {
            setIsSimulating(false);
        }
    };

    const formatDate = (dateString?: string | null) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
    };

    const renderActiveSubscription = () => {
        const expiresStr = formatDate(profile?.proExpiresAt);
        return (
            <View style={styles.activeContainer}>
                <View style={styles.proCrownCard}>
                    <Ionicons name="ribbon-outline" size={64} color={colors.secondary} style={{ marginBottom: 16 }} />
                    <Text style={styles.proCardTitle}>Bạn là Thành Viên Pro</Text>
                    <Text style={styles.proCardSubtitle}>
                        Bạn đang tận hưởng toàn bộ đặc quyền cao cấp của HistoryApp.
                    </Text>
                </View>

                <View style={styles.infoCard}>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Trạng thái gói</Text>
                        <Text style={[styles.infoValue, { color: colors.success }]}>Hoạt động</Text>
                    </View>
                    <View style={styles.infoDivider} />
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Ngày hết hạn</Text>
                        <Text style={styles.infoValue}>{expiresStr}</Text>
                    </View>
                </View>

                <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={handleCancel}
                    activeOpacity={0.8}
                >
                    <Text style={styles.cancelBtnText}>Hủy tự động gia hạn</Text>
                </TouchableOpacity>

                <Text style={styles.footnote}>
                    Nếu hủy tự động gia hạn, bạn vẫn có thể dùng các tính năng Pro cho đến ngày {expiresStr}.
                </Text>
            </View>
        );
    };

    return (
        <ScreenWrapper
            showTopBar={false}
            showHistoricalBackground={false}
            backgroundColor={colors.background}
            style={styles.safe}
        >
            <View style={styles.backHeader}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                    activeOpacity={0.7}
                >
                    <Text style={styles.backArrow}>←</Text>
                    <Text style={styles.backLabel}>Quay lại</Text>
                </TouchableOpacity>
            </View>
            {profile?.isPro ? (
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {renderActiveSubscription()}
                </ScrollView>
            ) : (
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.header}>
                        <View style={styles.headerIconBg}>
                            <Ionicons name="ribbon-outline" size={36} color={colors.secondary} />
                        </View>
                        <Text style={styles.headerTitle}>Gói Premium Pro</Text>
                        <Text style={styles.headerSub}>
                            Nâng tầm trải nghiệm học tập lịch sử với các đặc quyền cao cấp
                        </Text>
                    </View>

                    <View style={styles.featuresContainer}>
                        <View style={styles.featureItem}>
                            <Ionicons name="ban-outline" size={24} color={colors.error} style={{ marginRight: 14 }} />
                            <View style={styles.featureTextContainer}>
                                <Text style={styles.featureTitle}>Không quảng cáo</Text>
                                <Text style={styles.featureDesc}>Học tập mượt mà, không bị gián đoạn quảng cáo.</Text>
                            </View>
                        </View>
                        <View style={styles.featureItem}>
                            <Ionicons name="flash-outline" size={24} color={colors.warning} style={{ marginRight: 14 }} />
                            <View style={styles.featureTextContainer}>
                                <Text style={styles.featureTitle}>Nhân đôi kinh nghiệm (X2 XP)</Text>
                                <Text style={styles.featureDesc}>Tăng tốc thăng hạng giải đấu nhanh gấp đôi.</Text>
                            </View>
                        </View>
                        <View style={styles.featureItem}>
                            <Ionicons name="trophy-outline" size={24} color={colors.secondary} style={{ marginRight: 14 }} />
                            <View style={styles.featureTextContainer}>
                                <Text style={styles.featureTitle}>Nhân đôi Gold thưởng</Text>
                                <Text style={styles.featureDesc}>Nhận thêm nhiều Gold hơn khi vượt qua bài thi.</Text>
                            </View>
                        </View>
                        <View style={styles.featureItem}>
                            <Ionicons name="key-outline" size={24} color={colors.primary} style={{ marginRight: 14 }} />
                            <View style={styles.featureTextContainer}>
                                <Text style={styles.featureTitle}>Mở khóa Video lịch sử</Text>
                                <Text style={styles.featureDesc}>Xem không giới hạn kho nội dung bài giảng độc quyền.</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.priceContainer}>
                        <Text style={styles.pricePeriod}>Gói tháng</Text>
                        <Text style={styles.priceAmount}>2.000đ<Text style={styles.priceUnit}>/tháng</Text></Text>
                    </View>

                    <Text style={styles.sectionLabel}>Phương thức thanh toán</Text>
                    <View style={styles.providerRow}>
                        {PAYMENT_PROVIDERS.map((provider) => {
                            const isSelected = selectedProvider === provider;
                            const color = getProviderColor(provider);
                            return (
                                <TouchableOpacity
                                    key={provider}
                                    style={[
                                        styles.providerCard,
                                        isSelected && { borderColor: color, backgroundColor: color + "10" },
                                    ]}
                                    onPress={() => setSelectedProvider(provider)}
                                    activeOpacity={0.8}
                                >
                                    <Ionicons name={getProviderIconName(provider)} size={24} color={color} style={{ marginBottom: 6 }} />
                                    <Text
                                        style={[
                                            styles.providerLabel,
                                            isSelected && { color: color },
                                        ]}
                                        numberOfLines={1}
                                    >
                                        {getProviderLabel(provider)}
                                    </Text>
                                    <Text
                                        style={[
                                            styles.providerSubLabel,
                                            isSelected && { color: color + "AA" },
                                        ]}
                                        numberOfLines={1}
                                    >
                                        {getProviderSubLabel(provider)}
                                    </Text>
                                    {isSelected && (
                                        <View style={[styles.providerCheckDot, { backgroundColor: color }]}>
                                            <Text style={styles.providerCheckMark}>✓</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* Status while waiting */}
                    {state.phase === "waiting" && (
                        <View style={styles.waitingBanner}>
                            <ActivityIndicator color={colors.primary} />
                            <Text style={styles.waitingText}>
                                Đang chờ xác nhận từ {getProviderLabel(selectedProvider)}...
                            </Text>
                        </View>
                    )}

                    {/* CTA Button */}
                    <TouchableOpacity
                        style={[styles.payButton, isLoading && styles.payButtonDisabled]}
                        onPress={handleSubscribe}
                        activeOpacity={0.85}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color={colors.textLight} />
                        ) : (
                            <Text style={styles.payButtonText}>
                                Đăng ký ngay (2.000đ/tháng)
                            </Text>
                        )}
                    </TouchableOpacity>

                    <Text style={styles.footnote}>
                        Hệ thống tự động gia hạn hàng tháng (Mô phỏng) · Hủy gói bất cứ lúc nào trong Profile.
                    </Text>
                </ScrollView>
            )}

            {/* Result Modal */}
            <Modal
                visible={showResultModal}
                transparent
                animationType="fade"
                onRequestClose={reset}
            >
                <View style={styles.modalBackdrop}>
                    <View style={styles.modalCard}>
                        <Ionicons 
                            name={isSuccess ? "checkmark-circle-outline" : "close-circle-outline"} 
                            size={56} 
                            color={isSuccess ? colors.success : colors.error} 
                            style={{ marginBottom: 12 }} 
                        />
                        <Text style={styles.modalTitle}>
                            {isSuccess ? "Đăng ký thành công!" : "Đăng ký thất bại"}
                        </Text>
                        <Text style={styles.modalSub}>
                            {isSuccess
                                ? "Tài khoản của bạn đã được nâng cấp lên gói Premium Pro."
                                : (state.phase === "failed" ? state.error : "")}
                        </Text>
                        <TouchableOpacity style={styles.modalButton} onPress={reset}>
                            <Text style={styles.modalButtonText}>
                                {isSuccess ? "Bắt đầu học ngay!" : "Thử lại"}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* VietQR Modal */}
            <Modal
                visible={state.phase === "waiting" && !!state.vietQrUrl}
                transparent
                animationType="slide"
                onRequestClose={reset}
            >
                <View style={styles.qrModalBackdrop}>
                    <View style={styles.qrModalSheet}>
                        <View style={styles.qrSheetHandle} />

                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.qrScrollContent}
                        >
                            <View style={styles.qrHeader}>
                                <View style={[styles.qrBankBadge, { flexDirection: "row", alignItems: "center", gap: 4 }]}>
                                    <Ionicons name="business-outline" size={14} color={colors.vietqr} />
                                    <Text style={styles.qrBankBadgeText}>MB Bank</Text>
                                </View>
                                <Text style={styles.qrTitle}>Quét mã VietQR</Text>
                                <Text style={styles.qrSubtitle}>
                                    Mở app ngân hàng và quét mã để kích hoạt Pro
                                </Text>
                            </View>

                            {state.phase === "waiting" && state.vietQrUrl && (
                                <View style={styles.qrImageContainer}>
                                    <Image
                                        source={{ uri: state.vietQrUrl }}
                                        style={styles.qrImage}
                                        resizeMode="contain"
                                    />
                                    <View style={styles.qrAmountBadge}>
                                        <Text style={styles.qrAmountText}>
                                            {state.amountVnd.toLocaleString("vi-VN")}đ
                                        </Text>
                                    </View>
                                </View>
                            )}

                            {state.phase === "waiting" && (
                                <>
                                    <View style={styles.bankInfoCard}>
                                        <View style={styles.bankInfoRow}>
                                            <Text style={styles.bankInfoLabel}>Ngân hàng</Text>
                                            <Text style={styles.bankInfoValue}>{state.bankId}</Text>
                                        </View>
                                        <View style={styles.bankInfoDivider} />
                                        <View style={styles.bankInfoRow}>
                                            <Text style={styles.bankInfoLabel}>Số tài khoản</Text>
                                            <TouchableOpacity
                                                onPress={() => copyToClipboard(state.accountNo || "", "Số tài khoản")}
                                                style={styles.copyRow}
                                            >
                                                <Text style={styles.bankInfoValue} numberOfLines={1}>{state.accountNo}</Text>
                                                <Text style={styles.copyIcon}>⎘</Text>
                                            </TouchableOpacity>
                                        </View>
                                        <View style={styles.bankInfoDivider} />
                                        <View style={styles.bankInfoRow}>
                                            <Text style={styles.bankInfoLabel}>Chủ tài khoản</Text>
                                            <Text style={styles.bankInfoValue} numberOfLines={1}>{state.accountName}</Text>
                                        </View>
                                    </View>

                                    <View style={styles.transferContentCard}>
                                        <Text style={styles.transferContentLabel}>Nội dung chuyển khoản</Text>
                                        <TouchableOpacity
                                            onPress={() => copyToClipboard(state.providerOrderId || "", "Nội dung chuyển khoản")}
                                            style={styles.transferContentRow}
                                            activeOpacity={0.7}
                                        >
                                            <Text style={styles.transferContentValue} numberOfLines={2}>{state.providerOrderId}</Text>
                                            <Text style={styles.copyIcon}>⎘</Text>
                                        </TouchableOpacity>
                                        <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 8 }}>
                                            <Ionicons name="warning-outline" size={12} color={colors.textWarning} />
                                            <Text style={[styles.transferContentHint, { marginTop: 0 }]}>
                                                Nhập đúng nội dung để hệ thống tự động kích hoạt gói Pro
                                            </Text>
                                        </View>
                                    </View>

                                    <TouchableOpacity
                                        style={[styles.simulateButton, isSimulating && { opacity: 0.7 }]}
                                        onPress={simulateNativePayment}
                                        disabled={isSimulating}
                                    >
                                        {isSimulating ? (
                                            <ActivityIndicator color={colors.textLight} size="small" />
                                        ) : (
                                            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                                                <Ionicons name="flask-outline" size={16} color={colors.textLight} />
                                                <Text style={styles.simulateButtonText}>
                                                    Mô phỏng chuyển khoản gói Pro
                                                </Text>
                                            </View>
                                        )}
                                    </TouchableOpacity>

                                    <TouchableOpacity style={styles.cancelButton} onPress={reset}>
                                        <Text style={styles.cancelButtonText}>Hủy giao dịch</Text>
                                    </TouchableOpacity>
                                </>
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: colors.background,
    },
    backHeader: {
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 4,
    },
    backButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        alignSelf: "flex-start",
        paddingVertical: 8,
        paddingHorizontal: 4,
    },
    backArrow: {
        fontSize: 20,
        color: colors.primary,
        fontFamily: typography.fonts.bold,
    },
    backLabel: {
        fontSize: 15,
        color: colors.primary,
        fontFamily: typography.fonts.semiBold,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 40,
    },
    header: {
        alignItems: "center",
        marginBottom: 24,
    },
    headerIconBg: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: colors.secondaryContainer,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 12,
    },
    headerEmoji: {
        fontSize: 36,
    },
    headerTitle: {
        fontSize: 26,
        fontFamily: typography.fonts.extraBold,
        color: colors.textPrimary,
        marginBottom: 6,
    },
    headerSub: {
        fontSize: 13,
        color: colors.textSecondary,
        fontFamily: typography.fonts.regular,
        textAlign: "center",
        lineHeight: 20,
        paddingHorizontal: 8,
    },
    featuresContainer: {
        backgroundColor: colors.cardBackground,
        borderRadius: 12,
        padding: 20,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: colors.borderMedium,
    },
    featureItem: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 18,
    },
    featureIcon: {
        fontSize: 24,
        marginRight: 14,
    },
    featureTextContainer: {
        flex: 1,
    },
    featureTitle: {
        fontSize: 15,
        fontFamily: typography.fonts.bold,
        color: colors.textPrimary,
        marginBottom: 2,
    },
    featureDesc: {
        fontSize: 12,
        fontFamily: typography.fonts.regular,
        color: colors.textSecondary,
    },
    priceContainer: {
        alignItems: "center",
        marginBottom: 24,
        backgroundColor: colors.secondaryContainer,
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: colors.borderMedium,
    },
    pricePeriod: {
        fontSize: 12,
        fontFamily: typography.fonts.bold,
        color: colors.primary,
        textTransform: "uppercase",
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    priceAmount: {
        fontSize: 32,
        fontFamily: typography.fonts.extraBold,
        color: colors.textPrimary,
    },
    priceUnit: {
        fontSize: 16,
        fontFamily: typography.fonts.medium,
        color: colors.textSecondary,
    },
    sectionLabel: {
        fontSize: 13,
        fontFamily: typography.fonts.bold,
        color: colors.textPrimary,
        marginBottom: 10,
        textTransform: "uppercase",
        letterSpacing: 0.8,
    },
    providerRow: {
        flexDirection: "row",
        gap: 12,
        marginBottom: 24,
    },
    providerCard: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.cardBackground,
        borderRadius: 12,
        paddingVertical: 16,
        paddingHorizontal: 8,
        borderWidth: 2,
        borderColor: colors.borderMedium,
        position: "relative",
        minHeight: 90,
    },
    providerIcon: {
        fontSize: 24,
        marginBottom: 6,
    },
    providerLabel: {
        fontSize: 14,
        fontFamily: typography.fonts.bold,
        color: colors.textSecondary,
        textAlign: "center",
    },
    providerSubLabel: {
        fontSize: 11,
        fontFamily: typography.fonts.medium,
        color: colors.textMuted,
        textAlign: "center",
        marginTop: 2,
    },
    providerCheckDot: {
        position: "absolute",
        top: 8,
        right: 8,
        width: 18,
        height: 18,
        borderRadius: 9,
        alignItems: "center",
        justifyContent: "center",
    },
    providerCheckMark: {
        color: colors.textLight,
        fontSize: 10,
        fontFamily: typography.fonts.black,
    },
    waitingBanner: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        backgroundColor: colors.infoContainer,
        borderRadius: 12,
        padding: 14,
        marginBottom: 16,
    },
    waitingText: {
        fontSize: 14,
        color: colors.primary,
        fontFamily: typography.fonts.medium,
        flex: 1,
    },
    payButton: {
        backgroundColor: colors.primary,
        borderRadius: 30,
        paddingVertical: 16,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 12,
    },
    payButtonDisabled: {
        opacity: 0.6,
    },
    payButtonText: {
        color: colors.textLight,
        fontSize: 16,
        fontFamily: typography.fonts.extraBold,
    },
    footnote: {
        fontSize: 11,
        color: colors.textMuted,
        fontFamily: typography.fonts.regular,
        textAlign: "center",
        lineHeight: 16,
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: "rgba(20, 15, 40, 0.55)",
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 32,
    },
    modalCard: {
        width: "100%",
        backgroundColor: colors.cardBackground,
        borderRadius: 12,
        padding: 32,
        alignItems: "center",
    },
    modalEmoji: {
        fontSize: 56,
        marginBottom: 12,
    },
    modalTitle: {
        fontSize: 22,
        fontFamily: typography.fonts.extraBold,
        color: colors.textPrimary,
        marginBottom: 8,
        textAlign: "center",
    },
    modalSub: {
        fontSize: 14,
        color: colors.textSecondary,
        fontFamily: typography.fonts.regular,
        textAlign: "center",
        marginBottom: 24,
        lineHeight: 20,
    },
    modalButton: {
        backgroundColor: colors.primary,
        borderRadius: 30,
        paddingVertical: 14,
        paddingHorizontal: 40,
    },
    modalButtonText: {
        color: colors.textLight,
        fontSize: 15,
        fontFamily: typography.fonts.bold,
    },
    qrModalBackdrop: {
        flex: 1,
        backgroundColor: "rgba(20, 15, 40, 0.5)",
        justifyContent: "flex-end",
    },
    qrModalSheet: {
        backgroundColor: colors.cardBackground,
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
        paddingBottom: 32,
        maxHeight: "92%",
    },
    qrSheetHandle: {
        width: 40,
        height: 4,
        backgroundColor: colors.divider,
        borderRadius: 2,
        alignSelf: "center",
        marginTop: 12,
        marginBottom: 4,
    },
    qrScrollContent: {
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: 12,
        alignItems: "center",
    },
    qrHeader: {
        alignItems: "center",
        marginBottom: 16,
        width: "100%",
    },
    qrBankBadge: {
        backgroundColor: colors.errorContainer,
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 5,
        marginBottom: 10,
    },
    qrBankBadgeText: {
        fontSize: 13,
        fontFamily: typography.fonts.bold,
        color: colors.vietqr,
    },
    qrTitle: {
        fontSize: 20,
        fontFamily: typography.fonts.extraBold,
        color: colors.textPrimary,
        marginBottom: 4,
    },
    qrSubtitle: {
        fontSize: 13,
        color: colors.textSecondary,
        fontFamily: typography.fonts.regular,
        textAlign: "center",
        lineHeight: 18,
    },
    qrImageContainer: {
        alignItems: "center",
        marginBottom: 6,
        backgroundColor: colors.surfaceVariant,
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: colors.borderMedium,
        width: "100%",
    },
    qrImage: {
        width: 200,
        height: 200,
    },
    qrAmountBadge: {
        marginTop: 10,
        backgroundColor: colors.successContainer,
        borderRadius: 12,
        paddingHorizontal: 18,
        paddingVertical: 6,
    },
    qrAmountText: {
        fontSize: 22,
        fontFamily: typography.fonts.extraBold,
        color: colors.textSuccess,
        textAlign: "center",
    },
    bankInfoCard: {
        width: "100%",
        backgroundColor: colors.surfaceVariant,
        borderRadius: 12,
        padding: 14,
        marginTop: 14,
        borderWidth: 1,
        borderColor: colors.borderMedium,
    },
    bankInfoRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 8,
    },
    bankInfoLabel: {
        fontSize: 13,
        color: colors.textSecondary,
        fontFamily: typography.fonts.regular,
    },
    bankInfoValue: {
        fontSize: 14,
        fontFamily: typography.fonts.bold,
        color: colors.textPrimary,
    },
    copyRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    copyIcon: {
        fontSize: 16,
        color: colors.primary,
    },
    bankInfoDivider: {
        height: 1,
        backgroundColor: colors.divider,
        marginVertical: 4,
    },
    transferContentCard: {
        width: "100%",
        backgroundColor: colors.secondaryContainer,
        borderRadius: 12,
        padding: 16,
        marginTop: 14,
        borderWidth: 1,
        borderColor: colors.borderMedium,
        alignItems: "center",
    },
    transferContentLabel: {
        fontSize: 12,
        fontFamily: typography.fonts.bold,
        color: colors.secondary,
        textTransform: "uppercase",
        letterSpacing: 0.5,
        marginBottom: 6,
    },
    transferContentRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: colors.surface,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.borderMedium,
        width: "100%",
        justifyContent: "center",
    },
    transferContentValue: {
        fontSize: 18,
        fontFamily: typography.fonts.extraBold,
        color: colors.textWarning,
        textAlign: "center",
    },
    transferContentHint: {
        fontSize: 11,
        color: colors.textWarning,
        fontFamily: typography.fonts.medium,
        marginTop: 8,
        textAlign: "center",
    },
    simulateButton: {
        width: "100%",
        backgroundColor: colors.secondary,
        borderRadius: 30,
        paddingVertical: 14,
        alignItems: "center",
        justifyContent: "center",
        marginTop: 20,
    },
    simulateButtonText: {
        color: colors.textLight,
        fontSize: 15,
        fontFamily: typography.fonts.bold,
    },
    cancelButton: {
        width: "100%",
        paddingVertical: 14,
        alignItems: "center",
        justifyContent: "center",
        marginTop: 8,
    },
    cancelButtonText: {
        color: colors.error,
        fontSize: 14,
        fontFamily: typography.fonts.semiBold,
    },
    activeContainer: {
        alignItems: "center",
        width: "100%",
        paddingTop: 16,
    },
    proCrownCard: {
        backgroundColor: colors.cardBackground,
        borderRadius: 12,
        padding: 24,
        alignItems: "center",
        width: "100%",
        marginBottom: 20,
        borderWidth: 1,
        borderColor: colors.borderMedium,
    },
    crownEmoji: {
        fontSize: 64,
        marginBottom: 16,
    },
    proCardTitle: {
        fontSize: 22,
        fontFamily: typography.fonts.extraBold,
        color: colors.textPrimary,
        marginBottom: 8,
    },
    proCardSubtitle: {
        fontSize: 13,
        color: colors.textSecondary,
        fontFamily: typography.fonts.regular,
        textAlign: "center",
        lineHeight: 18,
    },
    infoCard: {
        width: "100%",
        backgroundColor: colors.cardBackground,
        borderRadius: 12,
        padding: 20,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: colors.borderMedium,
    },
    infoRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 6,
    },
    infoLabel: {
        fontSize: 14,
        color: colors.textSecondary,
        fontFamily: typography.fonts.medium,
    },
    infoValue: {
        fontSize: 14,
        color: colors.textPrimary,
        fontFamily: typography.fonts.bold,
    },
    infoDivider: {
        height: 1,
        backgroundColor: colors.divider,
        marginVertical: 10,
    },
    cancelBtn: {
        width: "100%",
        backgroundColor: colors.errorContainer,
        borderWidth: 1,
        borderColor: colors.errorContainer,
        borderRadius: 30,
        paddingVertical: 16,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16,
    },
    cancelBtnText: {
        color: colors.error,
        fontSize: 15,
        fontFamily: typography.fonts.bold,
    },
});
