import React from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    Image,
    View,
    Modal,
    useWindowDimensions,
    ActivityIndicator,
} from "react-native";
import { useShop, ShopItem } from "../hooks/useShop";
import { useRouter } from "expo-router";

export const ShopView: React.FC = () => {
    const router = useRouter();

    const {
        searchQuery,
        setSearchQuery,
        filteredItems,
        selectedItem,
        setSelectedItem,
        handlePurchase,
        isLoading,
    } = useShop();

    const { width } = useWindowDimensions();

    // Grid calculation layout for 2 uniform columns
    const paddingHorizontal = 18;
    const gap = 14;
    const itemWidth = (width - (paddingHorizontal * 2 + gap)) / 2;

    return (
        <View style={styles.screenWrapper}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Search Bar Group */}
                <View style={styles.searchBarRow}>
                    <Text style={styles.searchIcon}>🔍</Text>
                    <TextInput
                        placeholder="Search"
                        placeholderTextColor="#9A9A9A"
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
                {isLoading ? (
                    <ActivityIndicator size="large" color="#4E3FE0" style={{ marginTop: 24 }} />
                ) : filteredItems.length === 0 ? (
                    <Text style={{ textAlign: "center", color: "#666", marginTop: 24 }}>Không tìm thấy vật phẩm nào.</Text>
                ) : (
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
                )}
            </ScrollView>

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
        </View>
    );
};

const styles = StyleSheet.create({
    screenWrapper: {
        flex: 1,
        backgroundColor: "#FAF8F5",
    },
    scrollContent: {
        paddingHorizontal: 18,
        paddingTop: 16,
        paddingBottom: 32,
    },
    searchBarRow: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#E2DDD7",
        borderRadius: 14,
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
        color: "#2C2A2E",
        fontWeight: "500",
    },
    filterRow: {
        flexDirection: "row",
        justifyContent: "flex-end",
        marginBottom: 20,
    },
    filterButton: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#D2CBDC",
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 6,
        backgroundColor: "#FFFFFF",
    },
    filterButtonText: {
        fontSize: 13,
        fontWeight: "500",
        color: "#5C5665",
    },
    gridContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 14,
    },
    productCell: {
        backgroundColor: "#ECEAF7",
        borderRadius: 20,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "#E3E0F2",
        marginBottom: 4,
    },
    thumbnailWrapper: {
        width: "100%",
        aspectRatio: 1.1,
        backgroundColor: "#EDE7E1",
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
        color: "#AEA9B5",
        zIndex: 1,
    },
    cellFooter: {
        padding: 12,
        backgroundColor: "#FAF9FE",
    },
    cellName: {
        fontSize: 14,
        fontWeight: "700",
        color: "#202020",
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
        fontWeight: "600",
        color: "#7E7686",
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
        backgroundColor: "#FCFAF7",
        borderRadius: 32,
        overflow: "hidden",
        position: "relative",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.2,
        shadowRadius: 24,
        elevation: 10,
    },
    closeButtonPin: {
        position: "absolute",
        top: 14,
        right: 14,
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: "rgba(255, 255, 255, 0.85)",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10,
        borderWidth: 1,
        borderColor: "#EBEBEB",
    },
    closeButtonText: {
        fontSize: 14,
        fontWeight: "700",
        color: "#333333",
    },
    modalImageBanner: {
        width: "100%",
        aspectRatio: 1,
        backgroundColor: "#D9D0F7",
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
        fontWeight: "800",
        color: "#18141C",
        marginBottom: 8,
        lineHeight: 28,
    },
    modalDescription: {
        fontSize: 14,
        color: "#5C5666",
        lineHeight: 20,
        marginBottom: 20,
    },
    modalCostIndicatorRow: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F3EFF5",
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 14,
        marginBottom: 16,
    },
    modalCoinIcon: {
        fontSize: 16,
        marginRight: 8,
    },
    modalCostLabelText: {
        fontSize: 15,
        fontWeight: "700",
        color: "#24202B",
    },
    checkoutActionButton: {
        backgroundColor: "#4E3FE0", // Branding Primary Purple Accent Block
        borderRadius: 16,
        paddingVertical: 14,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#4E3FE0",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 3,
    },
    checkoutButtonText: {
        color: "#FFFFFF",
        fontSize: 15,
        fontWeight: "700",
    },
    buyGoldBanner: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "#FFF4E5",
        borderRadius: 16,
        padding: 14,
        marginBottom: 16,
        borderWidth: 1.5,
        borderColor: "#FFE0B2",
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
        fontWeight: "800",
        color: "#E65100",
    },
    buyGoldBannerSub: {
        fontSize: 11,
        color: "#F57C00",
        fontWeight: "500",
        marginTop: 2,
    },
    buyGoldBannerButton: {
        fontSize: 13,
        fontWeight: "800",
        color: "#FFFFFF",
        backgroundColor: "#FF9800",
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        overflow: "hidden",
    },
});

