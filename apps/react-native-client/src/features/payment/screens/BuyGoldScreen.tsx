// features/payment/screens/BuyGoldScreen.tsx
import React, { useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    ScrollView,
    Modal,
    SafeAreaView,
    Image,
    TextInput,
    Clipboard,
    Alert,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { usePayment } from "../hooks/usePayment";

// ─── Gold packages ────────────────────────────────────────────────────────────
import { PaymentProvider } from "../api/paymentApi";
import { API_BASE_URL } from "../../../services/config";
import { Ionicons } from "@expo/vector-icons";

// ─── Gold packages ────────────────────────────────────────────────────────────

interface GoldPackage {
    id: string;
    goldAmount: number;
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
    if (provider === "ZALOPAY") return "#0068FF";
    return "#E4002B";
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export const BuyGoldScreen: React.FC = () => {
    const { state, pay, reset } = usePayment();
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
                                    priceVnd: pkg.priceVnd,
                                    label: `${totalGold} Gold`,
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
        pay(selectedProvider, selectedPackage.goldAmount);
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
        <SafeAreaView style={styles.safe}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Mua Gold</Text>
                    <Text style={styles.headerSub}>
                        1 Gold = 2.000đ · Thanh toán an toàn qua ZaloPay hoặc Ngân hàng VietQR
                    </Text>
                </View>

                {/* Gold Package Selector */}
                <Text style={styles.sectionLabel}>Chọn gói</Text>
                {fetchingPackages ? (
                    <View style={{ paddingVertical: 24, alignItems: "center" }}>
                        <ActivityIndicator size="large" color="#4E3FE0" />
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
                                <Text style={styles.packageGoldLabel}>{pkg.label}</Text>
                                <Text style={styles.packagePrice}>
                                    {pkg.priceVnd.toLocaleString("vi-VN")}đ
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                ) : (
                    <View style={styles.emptyPackageCard}>
                        <Ionicons name="cube-outline" size={40} color="#8E8E93" style={{ marginBottom: 8 }} />
                        <Text style={styles.emptyPackageTitle}>Hiện chưa có gói nạp Gold nào</Text>
                        <Text style={styles.emptyPackageSub}>
                            Các gói nạp Gold đang được cập nhật hoặc tạm ẩn. Vui lòng quay lại sau!
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
                            <ActivityIndicator color="#4E3FE0" />
                            <Text style={styles.waitingText}>
                                Đang chờ xác nhận từ {getProviderLabel(selectedProvider)} (tối đa 60s)...
                            </Text>
                        </View>
                        <TouchableOpacity style={styles.cancelWaitingBtn} onPress={reset}>
                            <Text style={styles.cancelWaitingText}>Hủy / Thử lại</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* CTA Button */}
                <TouchableOpacity
                    style={[styles.payButton, (isLoading || !selectedPackage) && styles.payButtonDisabled]}
                    onPress={handlePay}
                    activeOpacity={0.85}
                    disabled={isLoading || !selectedPackage}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <Text style={styles.payButtonText}>
                            {selectedPackage ? `Thanh toán ${selectedPackage.priceVnd.toLocaleString("vi-VN")}đ` : "Đang tải gói nạp..."}
                        </Text>
                    )}
                </TouchableOpacity>

                <Text style={styles.footnote}>
                    Giao dịch được xử lý bởi{" "}
                    {getProviderLabel(selectedProvider)} · Sandbox mode
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
                            color={isSuccess ? "#22A45D" : "#E4002B"} 
                            style={{ marginBottom: 12 }} 
                        />
                        <Text style={styles.modalTitle}>
                            {isSuccess ? "Thanh toán thành công!" : "Thanh toán thất bại"}
                        </Text>
                        <Text style={styles.modalSub}>
                            {isSuccess
                                ? `Bạn đã nhận được ${
                                      state.phase === "success" ? state.result.goldAmount : ""
                                  } Gold`
                                : (state.phase === "failed" ? state.error : "")}
                        </Text>
                        <TouchableOpacity style={styles.modalButton} onPress={reset}>
                            <Text style={styles.modalButtonText}>
                                {isSuccess ? "Tuyệt vời!" : "Thử lại"}
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
        </SafeAreaView>
    );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const PRIMARY = "#4E3FE0";
const SURFACE = "#F7F6FF";

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: SURFACE,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 24,
        paddingBottom: 40,
    },

    header: {
        alignItems: "center",
        marginBottom: 28,
    },
    headerEmoji: {
        fontSize: 36,
    },
    headerTitle: {
        fontSize: 26,
        fontWeight: "800",
        color: "#1A1235",
        marginBottom: 6,
    },
    headerSub: {
        fontSize: 13,
        color: "#7B7490",
        textAlign: "center",
        lineHeight: 20,
        paddingHorizontal: 8,
    },

    // Section label
    sectionLabel: {
        fontSize: 13,
        fontWeight: "700",
        color: "#49435E",
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
        backgroundColor: "#FFFFFF",
        borderRadius: 18,
        padding: 16,
        alignItems: "center",
        borderWidth: 2,
        borderColor: "#E8E4F5",
        position: "relative",
    },
    packageCardSelected: {
        borderColor: PRIMARY,
        backgroundColor: "#EEF0FF",
    },
    packageCardPopular: {
        borderColor: "#F5A623",
    },
    popularBadge: {
        position: "absolute",
        top: -10,
        backgroundColor: "#F5A623",
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 20,
    },
    popularBadgeText: {
        fontSize: 11,
        fontWeight: "700",
        color: "#FFFFFF",
    },
    packageGoldIcon: {
        fontSize: 28,
        marginBottom: 4,
        marginTop: 6,
    },
    packageGoldLabel: {
        fontSize: 16,
        fontWeight: "700",
        color: "#1A1235",
        marginBottom: 4,
    },
    packagePrice: {
        fontSize: 13,
        color: "#7B7490",
        fontWeight: "500",
    },

    // Provider row — fixed text overflow
    providerRow: {
        flexDirection: "row",
        gap: 12,
        marginBottom: 24,
    },
    providerCard: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        paddingVertical: 16,
        paddingHorizontal: 8,
        borderWidth: 2,
        borderColor: "#E8E4F5",
        position: "relative",
        minHeight: 90,
    },
    providerIcon: {
        fontSize: 24,
        marginBottom: 6,
    },
    providerLabel: {
        fontSize: 14,
        fontWeight: "700",
        color: "#49435E",
        textAlign: "center",
    },
    providerSubLabel: {
        fontSize: 11,
        fontWeight: "500",
        color: "#ABA8B8",
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
        color: "#FFFFFF",
        fontSize: 10,
        fontWeight: "900",
    },

    // Summary card
    summaryCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 18,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: "#ECEAF7",
    },
    summaryRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 6,
    },
    summaryKey: {
        fontSize: 14,
        color: "#7B7490",
    },
    summaryValue: {
        fontSize: 14,
        color: "#1A1235",
        fontWeight: "600",
    },
    summaryKeyBold: {
        fontSize: 15,
        fontWeight: "700",
        color: "#1A1235",
    },
    summaryValueBold: {
        fontSize: 15,
        fontWeight: "800",
        color: PRIMARY,
    },
    summaryDivider: {
        height: 1,
        backgroundColor: "#F0EEF8",
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
        backgroundColor: "#EEF0FF",
        borderRadius: 14,
        padding: 14,
        marginBottom: 8,
    },
    waitingText: {
        fontSize: 14,
        color: PRIMARY,
        fontWeight: "500",
        flex: 1,
    },
    cancelWaitingBtn: {
        alignSelf: "center",
        paddingVertical: 6,
        paddingHorizontal: 16,
    },
    cancelWaitingText: {
        fontSize: 13,
        fontWeight: "600",
        color: "#E4002B",
    },

    // Pay button
    payButton: {
        backgroundColor: PRIMARY,
        borderRadius: 18,
        paddingVertical: 16,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 12,
    },
    payButtonDisabled: {
        opacity: 0.6,
    },
    payButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "800",
    },
    footnote: {
        fontSize: 11,
        color: "#ABA8B8",
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
        backgroundColor: "#FFFFFF",
        borderRadius: 28,
        padding: 32,
        alignItems: "center",
    },
    modalEmoji: {
        fontSize: 56,
        marginBottom: 12,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: "800",
        color: "#1A1235",
        marginBottom: 8,
        textAlign: "center",
    },
    modalSub: {
        fontSize: 14,
        color: "#7B7490",
        textAlign: "center",
        marginBottom: 24,
        lineHeight: 20,
    },
    modalButton: {
        backgroundColor: PRIMARY,
        borderRadius: 16,
        paddingVertical: 14,
        paddingHorizontal: 40,
    },
    modalButtonText: {
        color: "#FFFFFF",
        fontSize: 15,
        fontWeight: "700",
    },

    // ─── VietQR bottom sheet modal ────────────────────────────────────────────
    qrModalBackdrop: {
        flex: 1,
        backgroundColor: "rgba(20, 15, 40, 0.5)",
        justifyContent: "flex-end",
    },
    qrModalSheet: {
        backgroundColor: "#FFFFFF",
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingBottom: 32,
        maxHeight: "92%",
    },
    qrSheetHandle: {
        width: 40,
        height: 4,
        backgroundColor: "#E0DCF0",
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
        backgroundColor: "#FFF0F0",
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 5,
        marginBottom: 10,
    },
    qrBankBadgeText: {
        fontSize: 13,
        fontWeight: "700",
        color: "#E4002B",
    },
    qrTitle: {
        fontSize: 20,
        fontWeight: "800",
        color: "#1A1235",
        marginBottom: 4,
    },
    qrSubtitle: {
        fontSize: 13,
        color: "#7B7490",
        textAlign: "center",
        lineHeight: 18,
    },

    // QR Image
    qrImageContainer: {
        alignItems: "center",
        marginBottom: 6,
        backgroundColor: "#F7F6FF",
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: "#ECEAF7",
        width: "100%",
    },
    qrImage: {
        width: 200,
        height: 200,
    },
    qrAmountBadge: {
        marginTop: 10,
        backgroundColor: "#E8FFE8",
        borderRadius: 12,
        paddingHorizontal: 18,
        paddingVertical: 6,
    },
    qrAmountText: {
        fontSize: 22,
        fontWeight: "800",
        color: "#22A45D",
        textAlign: "center",
    },

    // Bank info card
    bankInfoCard: {
        width: "100%",
        backgroundColor: "#F7F6FF",
        borderRadius: 16,
        padding: 14,
        marginTop: 14,
        borderWidth: 1,
        borderColor: "#ECEAF7",
    },
    bankInfoRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 8,
    },
    bankInfoLabel: {
        fontSize: 13,
        color: "#7B7490",
        fontWeight: "500",
        flexShrink: 0,
    },
    bankInfoValue: {
        fontSize: 13,
        color: "#1A1235",
        fontWeight: "700",
        textAlign: "right",
        flexShrink: 1,
        marginLeft: 8,
    },
    bankInfoDivider: {
        height: 1,
        backgroundColor: "#ECEAF7",
    },
    copyRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        flexShrink: 1,
    },
    copyIcon: {
        fontSize: 16,
        color: PRIMARY,
    },

    // Transfer content card
    transferContentCard: {
        width: "100%",
        backgroundColor: "#FFF8ED",
        borderRadius: 16,
        padding: 14,
        marginTop: 12,
        borderWidth: 1,
        borderColor: "#F5A623",
    },
    transferContentLabel: {
        fontSize: 12,
        fontWeight: "700",
        color: "#B07000",
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
        fontWeight: "800",
        color: "#D4820A",
        flex: 1,
    },
    transferContentHint: {
        fontSize: 11,
        color: "#B07000",
        marginTop: 8,
        lineHeight: 16,
    },

    // Simulate button
    simulateButton: {
        backgroundColor: "#5856D6",
        borderRadius: 14,
        paddingVertical: 14,
        width: "100%",
        alignItems: "center",
        marginTop: 18,
    },
    simulateButtonText: {
        color: "#FFFFFF",
        fontSize: 14,
        fontWeight: "700",
    },

    // Cancel button
    cancelButton: {
        paddingVertical: 13,
        width: "100%",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#E8E4F5",
        borderRadius: 14,
        marginTop: 10,
    },
    cancelButtonText: {
        color: "#FF453A",
        fontSize: 14,
        fontWeight: "600",
    },

    // Empty package styles
    emptyPackageCard: {
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(255, 255, 255, 0.05)",
        borderRadius: 16,
        paddingVertical: 28,
        paddingHorizontal: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.08)",
        borderStyle: "dashed",
    },
    emptyPackageTitle: {
        fontSize: 15,
        fontWeight: "700",
        color: "#1C1C1E",
        marginBottom: 4,
        textAlign: "center",
    },
    emptyPackageSub: {
        fontSize: 12,
        fontWeight: "400",
        color: "#8E8E93",
        textAlign: "center",
        lineHeight: 18,
    },
});
