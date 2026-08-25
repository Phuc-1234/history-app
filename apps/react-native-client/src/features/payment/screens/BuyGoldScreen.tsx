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
import { useRouter, useFocusEffect } from "expo-router";
import { usePayment } from "../hooks/usePayment";
import { PaymentProvider } from "../api/paymentApi";
import { API_BASE_URL } from "../../../services/config";
import { colors } from "../../../theme/colors";
import { typography } from "../../../theme/typography";
import { ScreenWrapper } from "../../../components/layout/ScreenWrapper";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

// ─── Gold packages ────────────────────────────────────────────────────────────

interface GoldPackage {
    id: string;
    goldAmount: number;
    baseGoldAmount: number;
    bonusGold: number;
    priceVnd: number;
    label: string;
}

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

// ─── Screen ───────────────────────────────────────────────────────────────────

export const BuyGoldScreen: React.FC = () => {
    const router = useRouter();
    const { state, pay, resumePayment, reset } = usePayment();
    const [goldPackages, setGoldPackages] = useState<GoldPackage[]>([]);
    const [selectedPackage, setSelectedPackage] = useState<GoldPackage | null>(null);
    const [selectedProvider, setSelectedProvider] = useState<PaymentProvider>("ZALOPAY");
    const [isSimulating, setIsSimulating] = useState(false);
    const [fetchingPackages, setFetchingPackages] = useState(true);

    useFocusEffect(
        React.useCallback(() => {
            const fetchGoldPackages = async () => {
                try {
                    setFetchingPackages(true);
                    const res = await fetch(`${API_BASE_URL}/api/packages/gold`);
                    if (res.ok) {
                        const data = await res.json();
                        if (Array.isArray(data) && data.length > 0) {
                            const formattedList: GoldPackage[] = data.map((pkg: any) => {
                                const totalGold = pkg.goldAmount + (pkg.bonusGold || 0);
                                return {
                                    id: pkg.id,
                                    goldAmount: totalGold,
                                    baseGoldAmount: pkg.goldAmount,
                                    bonusGold: pkg.bonusGold || 0,
                                    priceVnd: pkg.priceVnd,
                                    label: pkg.name || `${totalGold} Vàng`,
                                };
                            });
                            setGoldPackages(formattedList);
                            setSelectedPackage(formattedList[0]);
                        } else {
                            setGoldPackages([]);
                            setSelectedPackage(null);
                        }
                    } else {
                        setGoldPackages([]);
                        setSelectedPackage(null);
                    }
                } catch (e) {
                    console.error("Failed to fetch dynamic gold packages:", e);
                    setGoldPackages([]);
                    setSelectedPackage(null);
                } finally {
                    setFetchingPackages(false);
                }
            };
            fetchGoldPackages();
        }, [])
    );

    const isLoading = state.phase === "loading" || (state.phase === "waiting" && !state.vietQrUrl);

    const handlePay = () => {
        if (!selectedPackage) return;
        pay(selectedProvider, selectedPackage.goldAmount, selectedPackage.id);
    };

    const copyToClipboard = (value: string | undefined, label: string) => {
        if (!value) return;
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
                    referenceCode: "SIM_FT_" + Math.random().toString(36).substring(2, 10).toUpperCase(),
                }),
            });
            if (!response.ok) {
                const errData = await response.json();
                console.error("Simulation failed:", errData);
            }
        } catch (e) {
            console.error("Simulation connection error:", e);
        } finally {
            setIsSimulating(false);
        }
    };

    // ─── Result modal ─────────────────────────────────────────────────────────

    const showResultModal = state.phase === "success" || state.phase === "failed";
    const isSuccess = state.phase === "success";

    return (
        <ScreenWrapper
            showHistoricalBackground={false}
            backgroundColor={colors.background}
            style={styles.safe}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Mua Vàng</Text>
                    <Text style={styles.headerSub}>
                        Thanh toán an toàn qua ZaloPay hoặc Ngân hàng VietQR
                    </Text>
                </View>

                {/* Gold Package Selector */}
                <Text style={styles.sectionLabel}>Chọn gói</Text>
                {fetchingPackages ? (
                    <View style={{ paddingVertical: 24, alignItems: "center" }}>
                        <ActivityIndicator size="large" color={colors.primary} />
                    </View>
                ) : goldPackages.length > 0 ? (
                    <View style={styles.packagesGrid}>
                        {goldPackages.map((pkg) => (
                            <TouchableOpacity
                                key={pkg.id}
                                style={[
                                    styles.packageCard,
                                    selectedPackage?.id === pkg.id && styles.packageCardSelected,
                                ]}
                                onPress={() => setSelectedPackage(pkg)}
                                activeOpacity={0.8}
                            >
                                {pkg.bonusGold > 0 ? (
                                    <View style={{ alignItems: "center", marginBottom: 4 }}>
                                        <Text style={[styles.packageGoldLabel, { fontSize: 13, textDecorationLine: "line-through", color: colors.textSecondary, marginBottom: 2 }]}>
                                            {pkg.baseGoldAmount} Vàng
                                        </Text>
                                        <Text style={styles.packageGoldLabel}>
                                            {pkg.goldAmount} Vàng
                                        </Text>
                                    </View>
                                ) : (
                                    <Text style={styles.packageGoldLabel}>{pkg.label}</Text>
                                )}
                                <Text style={styles.packagePrice}>
                                    {pkg.priceVnd.toLocaleString("vi-VN")}đ
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                ) : (
                    <View style={styles.emptyPackageCard}>
                        <Ionicons name="cube-outline" size={40} color={colors.textMuted} style={{ marginBottom: 8 }} />
                        <Text style={styles.emptyPackageTitle}>Hiện chưa có gói nạp Vàng nào</Text>
                        <Text style={styles.emptyPackageSub}>
                            Các gói nạp Vàng đang được cập nhật hoặc tạm ẩn. Vui lòng quay lại sau!
                        </Text>
                    </View>
                )}

                {/* Provider Selector */}
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

                {/* Order Summary */}
                {selectedPackage && (
                    <View style={styles.summaryCard}>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryKey}>Gói</Text>
                            <Text style={styles.summaryValue}>{selectedPackage.label}</Text>
                        </View>
                        <View style={styles.summaryDivider} />
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryKey}>Thanh toán qua</Text>
                            <Text style={styles.summaryValue}>
                                {getProviderLabel(selectedProvider)}
                            </Text>
                        </View>
                        <View style={styles.summaryDivider} />
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryKeyBold}>Tổng cộng</Text>
                            <Text style={styles.summaryValueBold}>
                                {selectedPackage.priceVnd.toLocaleString("vi-VN")}đ
                            </Text>
                        </View>
                    </View>
                )}

                {/* Status while waiting */}
                {state.phase === "waiting" && (
                    <View style={styles.waitingContainer}>
                        <View style={styles.waitingBanner}>
                            <ActivityIndicator color={colors.primary} />
                            <Text style={styles.waitingText}>
                                Đang chờ xác nhận từ {getProviderLabel(selectedProvider)}...
                            </Text>
                        </View>
                        {!!state.payUrl && (
                            <TouchableOpacity style={styles.resumeBtn} onPress={resumePayment} activeOpacity={0.8}>
                                <Ionicons name="open-outline" size={16} color={colors.textLight} style={{ marginRight: 6 }} />
                                <Text style={styles.resumeBtnText}>Mở lại trang thanh toán</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity style={styles.cancelWaitingBtn} onPress={reset}>
                            <Text style={styles.cancelWaitingText}>Hủy</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* CTA Button */}
                <TouchableOpacity
                    style={[styles.payButtonWrapper, (isLoading || !selectedPackage) && styles.payButtonDisabled]}
                    onPress={handlePay}
                    activeOpacity={0.85}
                    disabled={isLoading || !selectedPackage}
                >
                    <LinearGradient
                        colors={[colors.primary, colors.secondary]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.payButton}
                    >
                        {isLoading ? (
                            <ActivityIndicator color={colors.textLight} />
                        ) : (
                            <Text style={styles.payButtonText}>
                                {selectedPackage ? `Thanh toán ${selectedPackage.priceVnd.toLocaleString("vi-VN")}đ` : "Đang tải gói nạp..."}
                            </Text>
                        )}
                    </LinearGradient>
                </TouchableOpacity>

                <Text style={styles.footnote}>
                    Giao dịch được xử lý bởi{" "}
                    {getProviderLabel(selectedProvider)}
                </Text>
            </ScrollView>

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
                            color={isSuccess ? colors.success : colors.vietqr}
                            style={{ marginBottom: 12 }}
                        />
                        <Text style={styles.modalTitle}>
                            {isSuccess ? "Thanh toán thành công!" : "Thanh toán thất bại"}
                        </Text>
                        <Text style={styles.modalSub}>
                            {isSuccess
                                ? `Bạn đã nhận được ${state.phase === "success" ? state.result.goldAmount : ""
                                } Vàng`
                                : (state.phase === "failed" ? state.error : "")}
                        </Text>
                        <TouchableOpacity style={styles.modalButtonWrapper} onPress={reset} activeOpacity={0.85}>
                            <LinearGradient
                                colors={[colors.primary, colors.secondary]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.modalButton}
                            >
                                <Text style={styles.modalButtonText}>
                                    {isSuccess ? "Tuyệt vời!" : "Thử lại"}
                                </Text>
                            </LinearGradient>
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
                        {/* Handle bar */}
                        <View style={styles.qrSheetHandle} />

                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.qrScrollContent}
                        >
                            {/* Header */}
                            <View style={styles.qrHeader}>
                                <View style={[styles.qrBankBadge, { flexDirection: "row", alignItems: "center", gap: 4 }]}>
                                    <Ionicons name="business-outline" size={14} color="#E4002B" />
                                    <Text style={styles.qrBankBadgeText}>MB Bank</Text>
                                </View>
                                <Text style={styles.qrTitle}>Quét mã VietQR</Text>
                                <Text style={styles.qrSubtitle}>
                                    Mở app ngân hàng và quét mã để thanh toán
                                </Text>
                            </View>

                            {/* QR Image */}
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

                            {/* Bank info */}
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
                                                onPress={() => copyToClipboard(state.accountNo, "Số tài khoản")}
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

                                    {/* Transfer content — highlighted */}
                                    <View style={styles.transferContentCard}>
                                        <Text style={styles.transferContentLabel}>Nội dung chuyển khoản</Text>
                                        <TouchableOpacity
                                            onPress={() => copyToClipboard(state.providerOrderId, "Nội dung chuyển khoản")}
                                            style={styles.transferContentRow}
                                            activeOpacity={0.7}
                                        >
                                            <Text style={styles.transferContentValue} numberOfLines={2}>{state.providerOrderId}</Text>
                                            <Text style={styles.copyIcon}>⎘</Text>
                                        </TouchableOpacity>
                                        <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 8 }}>
                                            <Ionicons name="warning-outline" size={12} color="#F5A623" />
                                            <Text style={[styles.transferContentHint, { marginTop: 0 }]}>
                                                Nhập đúng nội dung để hệ thống xác nhận tự động
                                            </Text>
                                        </View>
                                    </View>



                                    {/* Cancel */}
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

// ─── Styles ───────────────────────────────────────────────────────────────────

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
    headerEmoji: {
        fontSize: 36,
    },
    headerTitle: {
        fontSize: 26,
        fontFamily: typography.fonts.extraBold,
        color: colors.primary,
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

    // Section label
    sectionLabel: {
        fontSize: 13,
        fontFamily: typography.fonts.bold,
        color: colors.textPrimary,
        marginBottom: 10,
        textTransform: "uppercase",
        letterSpacing: 0.8,
    },

    // Packages grid
    packagesGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
        marginBottom: 24,
    },
    packageCard: {
        width: "47%",
        backgroundColor: colors.cardBackground,
        borderRadius: 16,
        padding: 16,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 2,
        borderColor: colors.borderMedium,
        position: "relative",
        minHeight: 90,
    },
    packageCardSelected: {
        borderColor: colors.primary,
        backgroundColor: colors.secondaryContainer,
    },
    packageCardPopular: {
        borderColor: colors.secondary,
    },
    popularBadge: {
        position: "absolute",
        top: -10,
        backgroundColor: colors.secondary,
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 20,
    },
    popularBadgeText: {
        fontSize: 11,
        fontFamily: typography.fonts.bold,
        color: colors.textLight,
    },
    packageGoldIcon: {
        fontSize: 28,
        marginBottom: 4,
        marginTop: 6,
    },
    packageGoldLabel: {
        fontSize: 16,
        fontFamily: typography.fonts.bold,
        color: colors.primary,
        marginBottom: 4,
    },
    packagePrice: {
        fontSize: 13,
        color: colors.textSecondary,
        fontFamily: typography.fonts.medium,
    },

    // Provider row
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
        borderRadius: 16,
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

    // Summary card
    summaryCard: {
        backgroundColor: colors.cardBackground,
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: colors.borderMedium,
    },
    summaryRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 6,
    },
    summaryKey: {
        fontSize: 14,
        color: colors.textSecondary,
        fontFamily: typography.fonts.regular,
    },
    summaryValue: {
        fontSize: 14,
        color: colors.textPrimary,
        fontFamily: typography.fonts.semiBold,
    },
    summaryKeyBold: {
        fontSize: 15,
        fontFamily: typography.fonts.bold,
        color: colors.textPrimary,
    },
    summaryValueBold: {
        fontSize: 15,
        fontFamily: typography.fonts.extraBold,
        color: colors.primary,
    },
    summaryDivider: {
        height: 1,
        backgroundColor: colors.divider,
        marginVertical: 2,
    },

    // Waiting banner
    waitingContainer: {
        marginBottom: 16,
    },
    waitingBanner: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        backgroundColor: colors.infoContainer,
        borderRadius: 14,
        padding: 14,
        marginBottom: 8,
    },
    waitingText: {
        fontSize: 14,
        color: colors.primary,
        fontFamily: typography.fonts.medium,
        flex: 1,
    },
    cancelWaitingBtn: {
        alignSelf: "center",
        paddingVertical: 6,
        paddingHorizontal: 16,
    },
    cancelWaitingText: {
        fontSize: 13,
        fontFamily: typography.fonts.semiBold,
        color: colors.error,
    },

    // Pay button
    payButtonWrapper: {
        borderRadius: 30,
        overflow: "hidden",
        marginBottom: 12,
    },
    payButton: {
        borderRadius: 30,
        paddingVertical: 16,
        alignItems: "center",
        justifyContent: "center",
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
    },

    // Result Modal
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
        borderRadius: 24,
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
    modalButtonWrapper: {
        borderRadius: 30,
        overflow: "hidden",
    },
    modalButton: {
        borderRadius: 30,
        paddingVertical: 14,
        paddingHorizontal: 40,
        alignItems: "center",
        justifyContent: "center",
    },
    modalButtonText: {
        color: colors.textLight,
        fontSize: 15,
        fontFamily: typography.fonts.bold,
    },

    // VietQR bottom sheet modal
    qrModalBackdrop: {
        flex: 1,
        backgroundColor: "rgba(20, 15, 40, 0.5)",
        justifyContent: "flex-end",
    },
    qrModalSheet: {
        backgroundColor: colors.cardBackground,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
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

    // QR Header
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

    // QR Image
    qrImageContainer: {
        alignItems: "center",
        marginBottom: 6,
        backgroundColor: colors.secondaryContainer,
        borderRadius: 20,
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
        color: colors.success,
        textAlign: "center",
    },

    // Bank info card
    bankInfoCard: {
        width: "100%",
        backgroundColor: colors.secondaryContainer,
        borderRadius: 16,
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
        fontFamily: typography.fonts.medium,
        flexShrink: 0,
    },
    bankInfoValue: {
        fontSize: 13,
        color: colors.textPrimary,
        fontFamily: typography.fonts.bold,
        textAlign: "right",
        flexShrink: 1,
        marginLeft: 8,
    },
    bankInfoDivider: {
        height: 1,
        backgroundColor: colors.divider,
    },
    copyRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        flexShrink: 1,
    },
    copyIcon: {
        fontSize: 16,
        color: colors.primary,
    },

    // Transfer content card
    transferContentCard: {
        width: "100%",
        backgroundColor: colors.secondaryContainer,
        borderRadius: 16,
        padding: 14,
        marginTop: 12,
        borderWidth: 1,
        borderColor: colors.warning,
    },
    transferContentLabel: {
        fontSize: 12,
        fontFamily: typography.fonts.bold,
        color: colors.textWarning,
        textTransform: "uppercase",
        letterSpacing: 0.5,
        marginBottom: 8,
    },
    transferContentRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
    },
    transferContentValue: {
        fontSize: 15,
        fontFamily: typography.fonts.extraBold,
        color: colors.textWarning,
        flex: 1,
    },
    transferContentHint: {
        fontSize: 11,
        color: colors.textWarning,
        fontFamily: typography.fonts.regular,
        marginTop: 8,
        lineHeight: 16,
    },

    // Simulate button
    simulateButton: {
        backgroundColor: colors.primary,
        borderRadius: 14,
        paddingVertical: 14,
        width: "100%",
        alignItems: "center",
        marginTop: 18,
    },
    simulateButtonText: {
        color: colors.textLight,
        fontSize: 14,
        fontFamily: typography.fonts.bold,
    },

    // Cancel button
    cancelButton: {
        paddingVertical: 13,
        width: "100%",
        alignItems: "center",
        borderWidth: 1,
        borderColor: colors.borderMedium,
        borderRadius: 14,
        marginTop: 10,
    },
    cancelButtonText: {
        color: colors.error,
        fontSize: 14,
        fontFamily: typography.fonts.semiBold,
    },

    // Resume button
    resumeBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.primary,
        borderRadius: 14,
        paddingVertical: 12,
        paddingHorizontal: 20,
        marginBottom: 8,
        width: "100%",
    },
    resumeBtnText: {
        color: colors.textLight,
        fontSize: 14,
        fontFamily: typography.fonts.bold,
    },

    // Empty package styles
    emptyPackageCard: {
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.cardBackground,
        borderRadius: 16,
        paddingVertical: 28,
        paddingHorizontal: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: colors.borderMedium,
        borderStyle: "dashed",
    },
    emptyPackageTitle: {
        fontSize: 15,
        fontFamily: typography.fonts.bold,
        color: colors.textPrimary,
        marginBottom: 4,
        textAlign: "center",
    },
    emptyPackageSub: {
        fontSize: 12,
        fontFamily: typography.fonts.regular,
        color: colors.textMuted,
        textAlign: "center",
        lineHeight: 18,
    },
});
