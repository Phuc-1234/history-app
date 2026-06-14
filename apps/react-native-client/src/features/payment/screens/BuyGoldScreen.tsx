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
} from "react-native";
import { usePayment } from "../hooks/usePayment";
import { PaymentProvider } from "../api/paymentApi";

// ─── Gold packages ────────────────────────────────────────────────────────────

interface GoldPackage {
    id: string;
    goldAmount: number;
    priceVnd: number;
    label: string;
    popular?: boolean;
}

const GOLD_PACKAGES: GoldPackage[] = [
    { id: "pkg-1", goldAmount: 1, priceVnd: 10_000, label: "1 Gold" },
    { id: "pkg-2", goldAmount: 5, priceVnd: 50_000, label: "5 Gold", popular: true },
    { id: "pkg-3", goldAmount: 10, priceVnd: 100_000, label: "10 Gold" },
    { id: "pkg-4", goldAmount: 20, priceVnd: 200_000, label: "20 Gold" },
];

// ─── Screen ───────────────────────────────────────────────────────────────────

export const BuyGoldScreen: React.FC = () => {
    const { state, pay, reset } = usePayment();
    const [selectedPackage, setSelectedPackage] = useState<GoldPackage>(GOLD_PACKAGES[1]);
    const [selectedProvider, setSelectedProvider] = useState<PaymentProvider>("MOMO");

    const isLoading = state.phase === "loading" || state.phase === "waiting";

    const handlePay = () => {
        pay(selectedProvider, selectedPackage.goldAmount);
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
                    <Text style={styles.headerEmoji}>🪙</Text>
                    <Text style={styles.headerTitle}>Mua Gold</Text>
                    <Text style={styles.headerSub}>
                        1 Gold = 10.000đ · Thanh toán an toàn qua MoMo hoặc ZaloPay
                    </Text>
                </View>

                {/* Gold Package Selector */}
                <Text style={styles.sectionLabel}>Chọn gói</Text>
                <View style={styles.packagesGrid}>
                    {GOLD_PACKAGES.map((pkg) => (
                        <TouchableOpacity
                            key={pkg.id}
                            style={[
                                styles.packageCard,
                                selectedPackage.id === pkg.id && styles.packageCardSelected,
                                pkg.popular && styles.packageCardPopular,
                            ]}
                            onPress={() => setSelectedPackage(pkg)}
                            activeOpacity={0.8}
                        >
                            {pkg.popular && (
                                <View style={styles.popularBadge}>
                                    <Text style={styles.popularBadgeText}>Phổ biến</Text>
                                </View>
                            )}
                            <Text style={styles.packageGoldIcon}>🥇</Text>
                            <Text style={styles.packageGoldLabel}>{pkg.label}</Text>
                            <Text style={styles.packagePrice}>
                                {pkg.priceVnd.toLocaleString("vi-VN")}đ
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Provider Selector */}
                <Text style={styles.sectionLabel}>Phương thức thanh toán</Text>
                <View style={styles.providerRow}>
                    {(["MOMO", "ZALOPAY"] as PaymentProvider[]).map((provider) => (
                        <TouchableOpacity
                            key={provider}
                            style={[
                                styles.providerCard,
                                selectedProvider === provider && styles.providerCardSelected,
                            ]}
                            onPress={() => setSelectedProvider(provider)}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.providerIcon}>
                                {provider === "MOMO" ? "💜" : "🔵"}
                            </Text>
                            <Text
                                style={[
                                    styles.providerLabel,
                                    selectedProvider === provider && styles.providerLabelSelected,
                                ]}
                            >
                                {provider === "MOMO" ? "MoMo" : "ZaloPay"}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Order Summary */}
                <View style={styles.summaryCard}>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryKey}>Gói</Text>
                        <Text style={styles.summaryValue}>{selectedPackage.label}</Text>
                    </View>
                    <View style={styles.summaryDivider} />
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryKey}>Thanh toán qua</Text>
                        <Text style={styles.summaryValue}>
                            {selectedProvider === "MOMO" ? "MoMo" : "ZaloPay"}
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

                {/* Status while waiting */}
                {state.phase === "waiting" && (
                    <View style={styles.waitingBanner}>
                        <ActivityIndicator color="#4E3FE0" />
                        <Text style={styles.waitingText}>
                            Đang chờ xác nhận từ {selectedProvider === "MOMO" ? "MoMo" : "ZaloPay"}…
                        </Text>
                    </View>
                )}

                {/* CTA Button */}
                <TouchableOpacity
                    style={[styles.payButton, isLoading && styles.payButtonDisabled]}
                    onPress={handlePay}
                    activeOpacity={0.85}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <Text style={styles.payButtonText}>
                            Thanh toán {selectedPackage.priceVnd.toLocaleString("vi-VN")}đ
                        </Text>
                    )}
                </TouchableOpacity>

                <Text style={styles.footnote}>
                    Giao dịch được xử lý bởi{" "}
                    {selectedProvider === "MOMO" ? "MoMo" : "ZaloPay"} · Sandbox mode
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
                        <Text style={styles.modalEmoji}>{isSuccess ? "🎉" : "❌"}</Text>
                        <Text style={styles.modalTitle}>
                            {isSuccess ? "Thanh toán thành công!" : "Thanh toán thất bại"}
                        </Text>
                        <Text style={styles.modalSub}>
                            {isSuccess
                                ? `Bạn đã nhận được ${
                                      state.phase === "success" ? state.result.goldAmount : ""
                                  } Gold 🥇`
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

    // Header
    header: {
        alignItems: "center",
        marginBottom: 28,
    },
    headerEmoji: {
        fontSize: 48,
        marginBottom: 8,
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
        lineHeight: 18,
    },

    // Section label
    sectionLabel: {
        fontSize: 14,
        fontWeight: "700",
        color: "#49435E",
        marginBottom: 10,
        textTransform: "uppercase",
        letterSpacing: 0.5,
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

    // Provider row
    providerRow: {
        flexDirection: "row",
        gap: 12,
        marginBottom: 24,
    },
    providerCard: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        paddingVertical: 14,
        borderWidth: 2,
        borderColor: "#E8E4F5",
    },
    providerCardSelected: {
        borderColor: PRIMARY,
        backgroundColor: "#EEF0FF",
    },
    providerIcon: {
        fontSize: 20,
    },
    providerLabel: {
        fontSize: 15,
        fontWeight: "600",
        color: "#7B7490",
    },
    providerLabelSelected: {
        color: PRIMARY,
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
    waitingBanner: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        backgroundColor: "#EEF0FF",
        borderRadius: 14,
        padding: 14,
        marginBottom: 16,
    },
    waitingText: {
        fontSize: 14,
        color: PRIMARY,
        fontWeight: "500",
        flex: 1,
    },

    // Pay button
    payButton: {
        backgroundColor: PRIMARY,
        borderRadius: 18,
        paddingVertical: 16,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 12,
        shadowColor: PRIMARY,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 5,
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

    // Modal
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
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.2,
        shadowRadius: 32,
        elevation: 12,
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
});
