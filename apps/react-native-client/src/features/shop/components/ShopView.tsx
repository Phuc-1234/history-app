import React from "react";
import {
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    Image,
    View,
    Modal,
    useWindowDimensions,
} from "react-native";
import { useShop, ShopItem } from "../hooks/useShop";
import { useRouter } from "expo-router";
import { ScreenWrapper } from "../../../components/layout/ScreenWrapper";
import { colors } from "../../../theme/colors";

export const ShopView: React.FC = () => {
    const router = useRouter();

    const {
        searchQuery,
        setSearchQuery,
        filteredItems,
        selectedItem,
        setSelectedItem,
        handlePurchase,
    } = useShop();

    const { width } = useWindowDimensions();

    // Grid calculation layout for 2 uniform columns
    const paddingHorizontal = 18;
    const gap = 14;
    const itemWidth = (width - (paddingHorizontal * 2 + gap)) / 2;

    return (
        <ScreenWrapper
            enableScroll
            contentContainerStyle={styles.scrollContent}
            style={styles.screenWrapper}
        >
            {/* Search Bar Group */}
            <View style={styles.searchBarRow}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                    placeholder="Search"
                    placeholderTextColor={colors.textPlaceholder}
                    style={styles.searchInput}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            {/* Buy Gold Promo Banner */}
            <TouchableOpacity
                style={styles.buyGoldBanner}
                activeOpacity={0.8}
                onPress={() => router.push("/(tabs)/8_2_buy_gold")}
            >
                <View style={styles.buyGoldBannerLeft}>
                    <Text style={styles.buyGoldBannerIcon}>🪙</Text>
                    <View>
                        <Text style={styles.buyGoldBannerTitle}>Nạp thêm Gold</Text>
                        <Text style={styles.buyGoldBannerSub}>Mua vật phẩm đặc biệt trong cửa hàng</Text>
                    </View>
                </View>
                <Text style={styles.buyGoldBannerButton}>Nạp ngay</Text>
            </TouchableOpacity>

            {/* Mock Filter Controls Dropdown Row */}
            <View style={styles.filterRow}>
                <TouchableOpacity
                    style={styles.filterButton}
                    activeOpacity={0.7}
                >
                    <Text style={styles.filterButtonText}>
                        ⏳ Sort filter
                    </Text>
                </TouchableOpacity>
            </View>

            {/* 2-Column Store Products Grid Matrix */}
            <View style={styles.gridContainer}>
                {filteredItems.map((item) => (
                    <TouchableOpacity
                        key={item.id}
                        activeOpacity={0.8}
                        style={[styles.productCell, { width: itemWidth }]}
                        onPress={() => setSelectedItem(item)}
                    >
                        <View style={styles.thumbnailWrapper}>
                            <Image
                                source={{ uri: item.imageUrl }}
                                style={styles.cellImage}
                            />
                            <Text style={styles.fallbackBoxIcon}>📦</Text>
                        </View>
                        <View style={styles.cellFooter}>
                            <Text style={styles.cellName} numberOfLines={1}>
                                {item.name}
                            </Text>
                            <View style={styles.coinCostRow}>
                                <Text style={styles.coinMiniIcon}>🪙</Text>
                                <Text style={styles.coinCostText}>
                                    {item.cost.toLocaleString()}
                                </Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Dynamic Native Overlay Modal view sheet */}
            <Modal
                visible={selectedItem !== null}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setSelectedItem(null)}
            >
                <View style={styles.modalBackdrop}>
                    {selectedItem && (
                        <View style={styles.modalCardContainer}>
                            {/* Close Button Pin */}
                            <TouchableOpacity
                                style={styles.closeButtonPin}
                                onPress={() => setSelectedItem(null)}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.closeButtonText}>✕</Text>
                            </TouchableOpacity>

                            {/* Top Banner Cover Photo */}
                            <View style={styles.modalImageBanner}>
                                <Image
                                    source={{ uri: selectedItem.imageUrl }}
                                    style={styles.modalLargeImage}
                                />
                            </View>

                            {/* Bottom Purchase Details block */}
                            <View style={styles.modalDetailsWrapper}>
                                <Text style={styles.modalTitle}>
                                    {selectedItem.name}
                                </Text>
                                <Text style={styles.modalDescription}>
                                    {selectedItem.description}
                                </Text>

                                {/* Amount Row Label Indicator */}
                                <View style={styles.modalCostIndicatorRow}>
                                    <Text style={styles.modalCoinIcon}>🪙</Text>
                                    <Text style={styles.modalCostLabelText}>
                                        {selectedItem.cost.toLocaleString()} xu
                                    </Text>
                                </View>

                                {/* Final Checkout Call-To-Action Button */}
                                <TouchableOpacity
                                    style={styles.checkoutActionButton}
                                    activeOpacity={0.85}
                                    onPress={() => handlePurchase(selectedItem)}
                                >
                                    <Text style={styles.checkoutButtonText}>
                                        Mua ngay 🛒
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </View>
            </Modal>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    screenWrapper: {
        flex: 1,
        backgroundColor: colors.background,
    },
    scrollContent: {
        paddingHorizontal: 18,
        paddingTop: 16,
        paddingBottom: 32,
    },
    searchBarRow: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.surface,
        borderWidth: 2,
        borderColor: colors.borderDark,
        borderRadius: 12,
        paddingHorizontal: 14,
        height: 48,
        marginBottom: 12,
    },
    searchIcon: {
        fontSize: 16,
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: colors.textPrimary,
        fontWeight: "400",
    },
    filterRow: {
        flexDirection: "row",
        justifyContent: "flex-end",
        marginBottom: 20,
    },
    filterButton: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 2,
        borderColor: colors.borderDark,
        borderRadius: 30,
        paddingHorizontal: 14,
        paddingVertical: 6,
        backgroundColor: colors.surface,
    },
    filterButtonText: {
        fontSize: 13,
        fontWeight: "400",
        color: colors.textPrimary,
    },
    gridContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 14,
    },
    productCell: {
        backgroundColor: colors.surface,
        borderRadius: 12,
        overflow: "hidden",
        borderWidth: 2,
        borderColor: colors.borderDark,
        marginBottom: 4,
    },
    thumbnailWrapper: {
        width: "100%",
        aspectRatio: 1.1,
        backgroundColor: colors.surfaceVariant,
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
    },
    cellImage: {
        width: "100%",
        height: "100%",
        resizeMode: "cover",
        position: "absolute",
        zIndex: 2,
    },
    fallbackBoxIcon: {
        fontSize: 36,
        color: colors.textMuted,
        zIndex: 1,
    },
    cellFooter: {
        padding: 12,
        backgroundColor: colors.surface,
    },
    cellName: {
        fontSize: 14,
        fontWeight: "500",
        color: colors.textPrimary,
        marginBottom: 4,
    },
    coinCostRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    coinMiniIcon: {
        fontSize: 13,
        marginRight: 4,
    },
    coinCostText: {
        fontSize: 13,
        fontWeight: "400",
        color: colors.textSecondary,
    },

    /* Modal Architectural System Overrides */
    modalBackdrop: {
        flex: 1,
        backgroundColor: "rgba(34, 32, 38, 0.45)",
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 28,
    },
    modalCardContainer: {
        width: "100%",
        maxWidth: 360,
        backgroundColor: colors.surface,
        borderRadius: 12,
        overflow: "hidden",
        position: "relative",
        borderWidth: 2,
        borderColor: colors.borderDark,
    },
    closeButtonPin: {
        position: "absolute",
        top: 14,
        right: 14,
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: colors.surface,
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10,
        borderWidth: 2,
        borderColor: colors.borderDark,
    },
    closeButtonText: {
        fontSize: 14,
        fontWeight: "400",
        color: colors.textPrimary,
    },
    modalImageBanner: {
        width: "100%",
        aspectRatio: 1,
        backgroundColor: colors.surfaceVariant,
        justifyContent: "center",
        alignItems: "center",
    },
    modalLargeImage: {
        width: "100%",
        height: "100%",
        resizeMode: "cover",
    },
    modalDetailsWrapper: {
        padding: 24,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: "600",
        color: colors.textPrimary,
        marginBottom: 8,
        lineHeight: 28,
    },
    modalDescription: {
        fontSize: 14,
        color: colors.textSecondary,
        lineHeight: 20,
        marginBottom: 20,
    },
    modalCostIndicatorRow: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.surface,
        borderWidth: 2,
        borderColor: colors.borderDark,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        marginBottom: 16,
    },
    modalCoinIcon: {
        fontSize: 16,
        marginRight: 8,
    },
    modalCostLabelText: {
        fontSize: 15,
        fontWeight: "500",
        color: colors.textPrimary,
    },
    checkoutActionButton: {
        backgroundColor: colors.primary,
        borderRadius: 30,
        paddingVertical: 14,
        alignItems: "center",
        justifyContent: "center",
    },
    checkoutButtonText: {
        color: colors.textLight,
        fontSize: 15,
        fontWeight: "500",
    },
    buyGoldBanner: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 14,
        marginBottom: 16,
        borderWidth: 2,
        borderColor: colors.borderDark,
    },
    buyGoldBannerLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        flex: 1,
    },
    buyGoldBannerIcon: {
        fontSize: 28,
    },
    buyGoldBannerTitle: {
        fontSize: 15,
        fontWeight: "500",
        color: colors.textPrimary,
    },
    buyGoldBannerSub: {
        fontSize: 11,
        color: colors.textSecondary,
        fontWeight: "400",
        marginTop: 2,
    },
    buyGoldBannerButton: {
        fontSize: 13,
        fontWeight: "500",
        color: colors.textLight,
        backgroundColor: colors.secondary,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 30,
        overflow: "hidden",
    },
});

