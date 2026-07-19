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
    RefreshControl,
} from "react-native";
import { Coins, Search, Package, ShoppingCart } from "lucide-react-native";
import { useShop } from "../hooks/useShop";
import { useRouter } from "expo-router";
import colors from "../../../theme/colors";
import typography from "../../../theme/typography";
import { CustomModal } from "../../../components/Modal";

export const ShopView: React.FC = () => {
    const router = useRouter();

    const {
        searchQuery,
        setSearchQuery,
        filteredItems,
        selectedItem,
        setSelectedItem,
        handlePurchase,
        purchaseModal,
        closePurchaseModal,
        isLoading,
        handleRefresh,
        isRefreshing,
    } = useShop();

    const { width } = useWindowDimensions();

    const paddingHorizontal = 18;
    const gap = 14;
    const itemWidth = (width - (paddingHorizontal * 2 + gap)) / 2;

    return (
        <View style={styles.screenWrapper}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={handleRefresh}
                        colors={[colors.primary]}
                        tintColor={colors.primary}
                    />
                }
            >
                {/* Search Bar */}
                <View style={styles.searchBarRow}>
                    <Search size={18} color={colors.textPlaceholder} style={styles.searchIcon} />
                    <TextInput
                        placeholder="Tìm kiếm vật phẩm..."
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
                        <Coins size={28} color={colors.secondary} />
                        <View>
                            <Text style={styles.buyGoldBannerTitle}>Nạp thêm Gold</Text>
                        </View>
                    </View>
                    <Text style={styles.buyGoldBannerButton}>Nạp ngay</Text>
                </TouchableOpacity>

                {/* 2-Column Store Products Grid Matrix */}
                {isLoading ? (
                    <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 24 }} />
                ) : filteredItems.length === 0 ? (
                    <Text style={styles.emptyText}>Không tìm thấy vật phẩm nào.</Text>
                ) : (
                    <View style={styles.gridContainer}>
                        {filteredItems.map((item) => (
                            <TouchableOpacity
                                key={item.id}
                                activeOpacity={0.8}
                                style={[styles.productCell, { width: itemWidth }, item.isOwned && styles.productCellOwned]}
                                onPress={() => setSelectedItem(item)}
                            >
                                <View style={styles.thumbnailWrapper}>
                                    {item.imageUrl ? (
                                        <Image
                                            source={{ uri: item.imageUrl }}
                                            style={[styles.cellImage, item.isOwned && { opacity: 0.5 }]}
                                        />
                                    ) : (
                                        <Package size={36} color={colors.textMuted} />
                                    )}
                                    {item.isOwned && (
                                        <View style={styles.ownedBadge}>
                                            <Text style={styles.ownedBadgeText}>Đã sở hữu</Text>
                                        </View>
                                    )}
                                </View>
                                <View style={styles.cellFooter}>
                                    <Text style={styles.cellName} numberOfLines={1}>
                                        {item.name}
                                    </Text>
                                    <View style={styles.coinCostRow}>
                                        {item.isOwned ? (
                                            <Text style={styles.ownedTextLabel}>Đã sở hữu</Text>
                                        ) : (
                                            <>
                                                <Coins size={14} color={colors.secondary} style={styles.coinMiniIcon} />
                                                <Text style={styles.coinCostText}>
                                                    {item.cost.toLocaleString()}
                                                </Text>
                                            </>
                                        )}
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </ScrollView>

            {/* Item Details Overlay Modal */}
            <Modal
                visible={selectedItem !== null}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setSelectedItem(null)}
            >
                <View style={styles.modalBackdrop}>
                    {selectedItem && (
                        <View style={styles.modalCardContainer}>
                            <TouchableOpacity
                                style={styles.closeButtonPin}
                                onPress={() => setSelectedItem(null)}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.closeButtonText}>✕</Text>
                            </TouchableOpacity>

                            <View style={styles.modalImageBanner}>
                                {selectedItem.imageUrl ? (
                                    <Image
                                        source={{ uri: selectedItem.imageUrl }}
                                        style={styles.modalLargeImage}
                                    />
                                ) : (
                                    <Package size={64} color={colors.textMuted} />
                                )}
                            </View>

                            <View style={styles.modalDetailsWrapper}>
                                <Text style={styles.modalTitle}>
                                    {selectedItem.name}
                                </Text>
                                <Text style={styles.modalDescription}>
                                    {selectedItem.description}
                                </Text>

                                <View style={styles.modalCostIndicatorRow}>
                                    <Coins size={18} color={colors.secondary} style={styles.modalCoinIcon} />
                                    <Text style={styles.modalCostLabelText}>
                                        {selectedItem.cost.toLocaleString()} xu
                                    </Text>
                                </View>

                                <TouchableOpacity
                                    style={[
                                        styles.checkoutActionButton,
                                        selectedItem.isOwned && styles.disabledCheckoutButton
                                    ]}
                                    activeOpacity={0.85}
                                    onPress={() => !selectedItem.isOwned && handlePurchase(selectedItem)}
                                    disabled={selectedItem.isOwned}
                                >
                                    {selectedItem.isOwned ? (
                                        <Text style={styles.checkoutButtonText}>Đã sở hữu</Text>
                                    ) : (
                                        <View style={styles.checkoutButtonInner}>
                                            <ShoppingCart size={16} color={colors.textLight} />
                                            <Text style={styles.checkoutButtonText}>Mua ngay</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </View>
            </Modal>

            {/* Purchase Result Modal */}
            {purchaseModal && (
                <CustomModal
                    visible={purchaseModal.visible}
                    title={purchaseModal.title}
                    message={purchaseModal.message}
                    confirmText="Đồng ý"
                    onConfirm={closePurchaseModal}
                    showMascot={true}
                    mascotExpression={purchaseModal.isSuccess ? "happy" : "focused"}
                />
            )}
        </View>
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
        borderWidth: 1,
        borderColor: colors.borderMedium,
        borderRadius: 12,
        paddingHorizontal: 14,
        height: 48,
        marginBottom: 12,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontFamily: typography.fonts.medium,
        fontSize: 15,
        color: colors.textPrimary,
    },
    emptyText: {
        textAlign: "center",
        fontFamily: typography.fonts.regular,
        fontSize: 14,
        color: colors.textMuted,
        marginTop: 24,
    },
    buyGoldBanner: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: colors.secondaryContainer,
        borderRadius: 12,
        padding: 14,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: colors.secondaryHover,
    },
    buyGoldBannerLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        flex: 1,
    },
    buyGoldBannerTitle: {
        fontFamily: typography.fonts.extraBold,
        fontSize: 15,
        color: colors.textPrimary,
    },
    buyGoldBannerButton: {
        fontFamily: typography.fonts.bold,
        fontSize: 13,
        color: colors.textLight,
        backgroundColor: colors.secondary,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 30,
        overflow: "hidden",
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
        borderWidth: 1,
        borderColor: colors.borderMedium,
        marginBottom: 4,
    },
    productCellOwned: {
        borderColor: colors.borderMedium,
        opacity: 0.85,
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
    cellFooter: {
        padding: 12,
        backgroundColor: colors.surface,
    },
    cellName: {
        fontFamily: typography.fonts.bold,
        fontSize: 14,
        color: colors.textPrimary,
        marginBottom: 4,
    },
    coinCostRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    coinMiniIcon: {
        marginRight: 4,
    },
    coinCostText: {
        fontFamily: typography.fonts.semiBold,
        fontSize: 13,
        color: colors.textSecondary,
    },
    ownedTextLabel: {
        fontFamily: typography.fonts.medium,
        fontSize: 13,
        color: colors.textMuted,
    },
    ownedBadge: {
        position: "absolute",
        bottom: 8,
        left: 8,
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 30,
        zIndex: 3,
    },
    ownedBadgeText: {
        fontFamily: typography.fonts.bold,
        color: colors.textLight,
        fontSize: 10,
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.45)",
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 24,
    },
    modalCardContainer: {
        width: "100%",
        maxWidth: 360,
        backgroundColor: colors.surface,
        borderRadius: 12,
        overflow: "hidden",
        position: "relative",
        borderWidth: 1,
        borderColor: colors.borderMedium,
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
        borderWidth: 1,
        borderColor: colors.borderMedium,
    },
    closeButtonText: {
        fontFamily: typography.fonts.bold,
        fontSize: 14,
        color: colors.textDark,
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
        fontFamily: typography.fonts.extraBold,
        fontSize: 22,
        color: colors.textPrimary,
        marginBottom: 8,
        lineHeight: 28,
    },
    modalDescription: {
        fontFamily: typography.fonts.regular,
        fontSize: 14,
        color: colors.textSecondary,
        lineHeight: 20,
        marginBottom: 20,
    },
    modalCostIndicatorRow: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.surfaceVariant,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        marginBottom: 16,
    },
    modalCoinIcon: {
        marginRight: 8,
    },
    modalCostLabelText: {
        fontFamily: typography.fonts.bold,
        fontSize: 15,
        color: colors.textPrimary,
    },
    checkoutActionButton: {
        backgroundColor: colors.primary,
        borderRadius: 30,
        paddingVertical: 14,
        alignItems: "center",
        justifyContent: "center",
    },
    checkoutButtonInner: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    checkoutButtonText: {
        fontFamily: typography.fonts.bold,
        color: colors.textLight,
        fontSize: 15,
    },
    disabledCheckoutButton: {
        backgroundColor: colors.textMuted,
    },
});

