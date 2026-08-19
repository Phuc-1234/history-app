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
import { Coins, Search, Package, ShoppingCart, Zap } from "lucide-react-native";
import { Ionicons } from "@expo/vector-icons";
import { useShop, ShopCategory } from "../hooks/useShop";
import { useRouter } from "expo-router";
import colors from "../../../theme/colors";
import typography from "../../../theme/typography";
import { CustomModal } from "../../../components/Modal";

const CATEGORIES: { key: ShopCategory; label: string }[] = [
    { key: "ALL", label: "Tất cả" },
    { key: "POWERUP", label: "Hiệu ứng" },
    { key: "AVT_FRAME", label: "Khung ảnh" },
    { key: "LEADERBOARD_BG", label: "Nền BXH" },
];

export const ShopView: React.FC = () => {
    const router = useRouter();

    const {
        searchQuery,
        setSearchQuery,
        selectedCategory,
        setSelectedCategory,
        filteredItems,
        selectedItem,
        setSelectedItem,
        handlePurchase,
        handlePurchaseAndUse,
        conflictModalData,
        handleConfirmReplace,
        handleCloseConflictModal,
        purchaseModal,
        closePurchaseModal,
        isLoading,
        isPurchasing,
        handleRefresh,
        isRefreshing,
    } = useShop();

    const { width } = useWindowDimensions();

    const paddingHorizontal = 16;
    const gap = 10;
    const numColumns = 3;
    const itemWidth = Math.floor((width - (paddingHorizontal * 2 + gap * (numColumns - 1))) / numColumns);

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

                {/* Category Filter Chips */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.categoryChipsContainer}
                >
                    {CATEGORIES.map((cat) => {
                        const isSelected = selectedCategory === cat.key;
                        return (
                            <TouchableOpacity
                                key={cat.key}
                                style={[
                                    styles.categoryChip,
                                    isSelected && styles.categoryChipActive,
                                ]}
                                activeOpacity={0.8}
                                onPress={() => setSelectedCategory(cat.key)}
                            >
                                <Text
                                    style={[
                                        styles.categoryChipText,
                                        isSelected && styles.categoryChipTextActive,
                                    ]}
                                >
                                    {cat.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                {/* Buy Gold Promo Banner */}
                <TouchableOpacity
                    style={styles.buyGoldBanner}
                    activeOpacity={0.8}
                    onPress={() => router.push("/(tabs)/8_2_buy_gold")}
                >
                    <View style={styles.buyGoldBannerLeft}>
                        <Coins size={24} color={colors.secondary} />
                        <View>
                            <Text style={styles.buyGoldBannerTitle}>Nạp thêm Gold</Text>
                        </View>
                    </View>
                    <Text style={styles.buyGoldBannerButton}>Nạp ngay</Text>
                </TouchableOpacity>

                {/* 3-Column Store Products Grid Matrix */}
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
                                        <Package size={28} color={colors.textMuted} />
                                    )}
                                    {item.isOwned && (
                                        <View style={styles.ownedBadge}>
                                            <Text style={styles.ownedBadgeText}>Đã có</Text>
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
                                                <Coins size={12} color={colors.secondary} style={styles.coinMiniIcon} />
                                                <Text style={styles.coinCostText} numberOfLines={1}>
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

                                {selectedItem.isOwned && selectedItem.itemType !== "XP_MUL" && selectedItem.itemType !== "GOLD_MUL" ? (
                                    <TouchableOpacity
                                        style={[styles.checkoutActionButton, styles.disabledCheckoutButton]}
                                        disabled={true}
                                    >
                                        <Text style={styles.checkoutButtonText}>Đã sở hữu</Text>
                                    </TouchableOpacity>
                                ) : (
                                    <View style={styles.modalActionButtonsGroup}>
                                        {/* Buy & Use Now Button for equippable/activatable items */}
                                        {selectedItem.itemType !== "BADGE" && (
                                            <TouchableOpacity
                                                style={[
                                                    styles.checkoutActionButton,
                                                    isPurchasing && styles.disabledCheckoutButton,
                                                ]}
                                                activeOpacity={0.85}
                                                onPress={() => !isPurchasing && handlePurchaseAndUse(selectedItem)}
                                                disabled={isPurchasing}
                                            >
                                                {isPurchasing ? (
                                                    <View style={styles.checkoutButtonInner}>
                                                        <ActivityIndicator size="small" color={colors.textLight} />
                                                        <Text style={styles.checkoutButtonText}>Đang xử lý...</Text>
                                                    </View>
                                                ) : (
                                                    <View style={styles.checkoutButtonInner}>
                                                        <Zap size={16} color={colors.textLight} />
                                                        <Text style={styles.checkoutButtonText}>
                                                            {selectedItem.itemType === "SKIN" ? "Mua & Dùng ngay" : "Mua & Kích hoạt"} •
                                                        </Text>
                                                        <Coins size={14} color={colors.secondary} />
                                                        <Text style={styles.checkoutButtonText}>
                                                            {selectedItem.cost.toLocaleString()}
                                                        </Text>
                                                    </View>
                                                )}
                                            </TouchableOpacity>
                                        )}

                                        {/* Standard Buy Only Button */}
                                        <TouchableOpacity
                                            style={[
                                                selectedItem.itemType === "BADGE" ? styles.checkoutActionButton : styles.buyOnlyOutlineButton,
                                                isPurchasing && styles.disabledCheckoutButton,
                                            ]}
                                            activeOpacity={0.85}
                                            onPress={() => !isPurchasing && handlePurchase(selectedItem)}
                                            disabled={isPurchasing}
                                        >
                                            {isPurchasing ? (
                                                <View style={styles.checkoutButtonInner}>
                                                    <ActivityIndicator size="small" color={selectedItem.itemType === "BADGE" ? colors.textLight : colors.primary} />
                                                    <Text style={selectedItem.itemType === "BADGE" ? styles.checkoutButtonText : styles.buyOnlyOutlineButtonText}>Đang xử lý...</Text>
                                                </View>
                                            ) : (
                                                <View style={styles.checkoutButtonInner}>
                                                    <ShoppingCart size={16} color={selectedItem.itemType === "BADGE" ? colors.textLight : colors.primary} />
                                                    <Text style={selectedItem.itemType === "BADGE" ? styles.checkoutButtonText : styles.buyOnlyOutlineButtonText}>
                                                        Mua ngay •
                                                    </Text>
                                                    <Coins size={14} color={colors.secondary} />
                                                    <Text style={selectedItem.itemType === "BADGE" ? styles.checkoutButtonText : styles.buyOnlyOutlineButtonText}>
                                                        {selectedItem.cost.toLocaleString()}
                                                    </Text>
                                                </View>
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        </View>
                    )}
                </View>
            </Modal>

            {/* Conflict Resolution Modal */}
            <Modal
                visible={Boolean(conflictModalData)}
                transparent
                animationType="fade"
                onRequestClose={handleCloseConflictModal}
            >
                <View style={styles.conflictModalOverlay}>
                    <View style={styles.conflictModalContainer}>
                        <Ionicons name="warning-outline" size={44} color={colors.warning} style={{ marginBottom: 12 }} />
                        <Text style={styles.conflictModalTitle}>Thay thế hiệu ứng?</Text>
                        <Text style={styles.conflictModalDesc}>
                            Bạn đang có hiệu ứng{" "}
                            <Text style={styles.conflictModalHighlightText}>
                                {conflictModalData?.activeItemName}
                            </Text>{" "}
                            đang hoạt động. Việc kích hoạt{" "}
                            <Text style={styles.conflictModalHighlightText}>
                                {conflictModalData?.itemName}
                            </Text>{" "}
                            sẽ hủy hiệu ứng hiện tại và bạn sẽ mất nó vĩnh viễn.
                        </Text>
                        <View style={styles.conflictModalActions}>
                            <TouchableOpacity
                                style={styles.conflictCancelBtn}
                                activeOpacity={0.8}
                                onPress={handleCloseConflictModal}
                            >
                                <Text style={styles.conflictCancelBtnText}>Hủy</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.conflictConfirmBtn}
                                activeOpacity={0.8}
                                onPress={handleConfirmReplace}
                            >
                                <Text style={styles.conflictConfirmBtnText}>Xác nhận</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
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
        paddingHorizontal: 16,
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
        height: 44,
        marginBottom: 10,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontFamily: typography.fonts.medium,
        fontSize: 14,
        color: colors.textPrimary,
    },
    categoryChipsContainer: {
        flexDirection: "row",
        gap: 8,
        paddingBottom: 12,
    },
    categoryChip: {
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 30,
        backgroundColor: colors.surfaceVariant,
        borderWidth: 1,
        borderColor: colors.borderMedium,
    },
    categoryChipActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    categoryChipText: {
        fontFamily: typography.fonts.medium,
        fontSize: 13,
        color: colors.textSecondary,
    },
    categoryChipTextActive: {
        fontFamily: typography.fonts.bold,
        color: colors.textLight,
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
        padding: 12,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: colors.secondaryHover,
    },
    buyGoldBannerLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        flex: 1,
    },
    buyGoldBannerTitle: {
        fontFamily: typography.fonts.extraBold,
        fontSize: 14,
        color: colors.textPrimary,
    },
    buyGoldBannerButton: {
        fontFamily: typography.fonts.bold,
        fontSize: 12,
        color: colors.textLight,
        backgroundColor: colors.secondary,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 30,
        overflow: "hidden",
    },
    gridContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
    },
    productCell: {
        backgroundColor: colors.surface,
        borderRadius: 12,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: colors.borderMedium,
        marginBottom: 2,
    },
    productCellOwned: {
        borderColor: colors.borderMedium,
        opacity: 0.85,
    },
    thumbnailWrapper: {
        width: "100%",
        aspectRatio: 1,
        backgroundColor: colors.surfaceVariant,
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        padding: 6,
    },
    cellImage: {
        width: "100%",
        height: "100%",
        resizeMode: "contain",
        zIndex: 2,
    },
    cellFooter: {
        padding: 8,
        backgroundColor: colors.surface,
    },
    cellName: {
        fontFamily: typography.fonts.bold,
        fontSize: 12,
        color: colors.textPrimary,
        marginBottom: 2,
        lineHeight: 15,
    },
    coinCostRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    coinMiniIcon: {
        marginRight: 3,
    },
    coinCostText: {
        fontFamily: typography.fonts.semiBold,
        fontSize: 11,
        color: colors.textSecondary,
    },
    ownedTextLabel: {
        fontFamily: typography.fonts.medium,
        fontSize: 11,
        color: colors.textMuted,
    },
    ownedBadge: {
        position: "absolute",
        bottom: 4,
        left: 4,
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        paddingHorizontal: 5,
        paddingVertical: 2,
        borderRadius: 30,
        zIndex: 3,
    },
    ownedBadgeText: {
        fontFamily: typography.fonts.bold,
        color: colors.textLight,
        fontSize: 8,
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
        maxWidth: 340,
        backgroundColor: colors.surface,
        borderRadius: 12,
        overflow: "hidden",
        position: "relative",
        borderWidth: 1,
        borderColor: colors.borderMedium,
    },
    closeButtonPin: {
        position: "absolute",
        top: 12,
        right: 12,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.surface,
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10,
        borderWidth: 1,
        borderColor: colors.borderMedium,
    },
    closeButtonText: {
        fontFamily: typography.fonts.bold,
        fontSize: 13,
        color: colors.textDark,
    },
    modalImageBanner: {
        width: "100%",
        aspectRatio: 1.1,
        backgroundColor: colors.surfaceVariant,
        justifyContent: "center",
        alignItems: "center",
        padding: 16,
    },
    modalLargeImage: {
        width: "100%",
        height: "100%",
        resizeMode: "contain",
    },
    modalDetailsWrapper: {
        padding: 18,
    },
    modalTitle: {
        fontFamily: typography.fonts.extraBold,
        fontSize: 18,
        color: colors.textPrimary,
        marginBottom: 6,
        lineHeight: 22,
    },
    modalDescription: {
        fontFamily: typography.fonts.regular,
        fontSize: 13,
        color: colors.textSecondary,
        lineHeight: 18,
        marginBottom: 16,
    },
    modalActionButtonsGroup: {
        gap: 8,
    },
    checkoutActionButton: {
        backgroundColor: colors.primary,
        borderRadius: 30,
        paddingVertical: 11,
        alignItems: "center",
        justifyContent: "center",
    },
    buyOnlyOutlineButton: {
        backgroundColor: colors.surface,
        borderWidth: 1.5,
        borderColor: colors.primary,
        borderRadius: 30,
        paddingVertical: 10,
        alignItems: "center",
        justifyContent: "center",
    },
    buyOnlyOutlineButtonText: {
        fontFamily: typography.fonts.bold,
        color: colors.primary,
        fontSize: 14,
    },
    checkoutButtonInner: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    checkoutButtonText: {
        fontFamily: typography.fonts.bold,
        color: colors.textLight,
        fontSize: 14,
    },
    disabledCheckoutButton: {
        backgroundColor: colors.textMuted,
        borderColor: colors.textMuted,
    },
    conflictModalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.45)",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    conflictModalContainer: {
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 24,
        width: "100%",
        maxWidth: 340,
        alignItems: "center",
        borderWidth: 1,
        borderColor: colors.borderMedium,
    },
    conflictModalTitle: {
        fontFamily: typography.fonts.bold,
        fontSize: 18,
        color: colors.textPrimary,
        marginBottom: 8,
    },
    conflictModalDesc: {
        fontFamily: typography.fonts.regular,
        fontSize: 14,
        color: colors.textSecondary,
        textAlign: "center",
        lineHeight: 20,
        marginBottom: 20,
    },
    conflictModalHighlightText: {
        fontFamily: typography.fonts.bold,
        color: colors.textPrimary,
    },
    conflictModalActions: {
        flexDirection: "row",
        width: "100%",
        gap: 12,
    },
    conflictCancelBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 30,
        borderWidth: 1,
        borderColor: colors.borderMedium,
        backgroundColor: colors.surfaceVariant,
        alignItems: "center",
    },
    conflictCancelBtnText: {
        fontFamily: typography.fonts.bold,
        fontSize: 14,
        color: colors.textSecondary,
    },
    conflictConfirmBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 30,
        backgroundColor: colors.error,
        alignItems: "center",
    },
    conflictConfirmBtnText: {
        fontFamily: typography.fonts.bold,
        fontSize: 14,
        color: colors.textLight,
    },
});

