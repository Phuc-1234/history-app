import React from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    Image,
    View,
    useWindowDimensions,
    ActivityIndicator,
    RefreshControl,
    Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useInventory, InventoryCategory } from "../hooks/useInventory";
import { Ionicons } from "@expo/vector-icons";
import { Search, Package } from "lucide-react-native";
import colors from "../../../theme/colors";
import typography from "../../../theme/typography";

const CATEGORIES: { key: InventoryCategory; label: string }[] = [
    { key: "ALL", label: "Tất cả" },
    { key: "POWERUP", label: "Hiệu ứng" },
    { key: "AVT_FRAME", label: "Khung ảnh" },
    { key: "LEADERBOARD_BG", label: "Nền BXH" },
];

export const InventoryView: React.FC = () => {
    const {
        inventory,
        searchQuery,
        setSearchQuery,
        selectedCategory,
        setSelectedCategory,
        selectedItem,
        setSelectedItemId,
        handleUseItem,
        isLoading,
        isActivating,
        handleRefresh,
        isRefreshing,
        conflictModalData,
        handleConfirmReplace,
        handleCloseConflictModal,
    } = useInventory();

    const { width } = useWindowDimensions();
    const insets = useSafeAreaInsets();

    const paddingHorizontal = 16;
    const gap = 10;
    const gridWidth = width - paddingHorizontal * 2 - insets.left - insets.right;
    const cellWidth = Math.floor((gridWidth - gap * 2) / 3);

    if (isLoading) {
        return (
            <View style={styles.loadingWrapper}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.screenWrapper}>
            {/* Pinned Top Controls Area */}
            <View style={styles.pinnedHeaderArea}>
                {/* Search Bar */}
                <View style={styles.searchBarRow}>
                    <Search size={18} color={colors.textPlaceholder} style={styles.searchIcon} />
                    <TextInput
                        placeholder="Tìm kiếm trong túi đồ..."
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

                {/* Pinned Compact Selected Item Preview */}
                {selectedItem && (
                    <View style={styles.compactFeaturedCard}>
                        {selectedItem.imageUrl ? (
                            <View style={styles.compactThumbnailWrapper}>
                                <Image
                                    source={{ uri: selectedItem.imageUrl }}
                                    style={styles.compactThumbnailImage}
                                    resizeMode="contain"
                                />
                            </View>
                        ) : (
                            <View style={[styles.compactThumbnailWrapper, styles.iconFallbackCircle]}>
                                <Package size={22} color={colors.textMuted} />
                            </View>
                        )}

                        <View style={styles.compactFeaturedInfo}>
                            <View style={styles.compactTitleRow}>
                                <Text style={styles.compactFeaturedName} numberOfLines={1}>
                                    {selectedItem.name}
                                </Text>
                                {selectedItem.quantity > 0 && (
                                    <View style={styles.qtyBadge}>
                                        <Text style={styles.qtyBadgeText}>x{selectedItem.quantity}</Text>
                                    </View>
                                )}
                            </View>
                            <Text style={styles.compactFeaturedDescription} numberOfLines={1}>
                                {selectedItem.description || "Vật phẩm hữu ích cho hành trình"}
                            </Text>
                        </View>

                        {selectedItem.itemType === "BADGE" ? (
                            <View style={styles.badgeLabelContainer}>
                                <Text style={styles.badgeLabelText}>Đã sở hữu</Text>
                            </View>
                        ) : (
                            <TouchableOpacity
                                style={[
                                    styles.compactUseButton,
                                    selectedItem.isActivated && styles.activatedButton,
                                    isActivating && styles.disabledButton,
                                ]}
                                activeOpacity={0.8}
                                onPress={() => handleUseItem(selectedItem.id)}
                                disabled={isActivating || (selectedItem.isActivated && selectedItem.itemType !== "SKIN")}
                            >
                                {isActivating ? (
                                    <ActivityIndicator size="small" color={colors.textLight} />
                                ) : (
                                    <Text style={styles.compactUseButtonText}>
                                        {selectedItem.itemType === "SKIN"
                                            ? (selectedItem.isEquipped ? "Tháo" : "Trang bị")
                                            : (selectedItem.isActivated ? "Đang dùng" : "Kích hoạt")}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            </View>

            {/* Scrollable Grid Section */}
            <ScrollView
                showsVerticalScrollIndicator={false}
                style={styles.scrollView}
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
                {inventory.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="briefcase-outline" size={48} color={colors.textMuted} style={{ marginBottom: 12 }} />
                        <Text style={styles.emptyTitle}>Túi đồ trống</Text>
                        <Text style={styles.emptySubtitle}>
                            {searchQuery || selectedCategory !== "ALL"
                                ? "Không tìm thấy vật phẩm phù hợp với bộ lọc."
                                : "Hãy hoàn thành các bài học hoặc ghé cửa hàng để nhận vật phẩm!"}
                        </Text>
                    </View>
                ) : (
                    <View style={styles.gridContainer}>
                        {inventory.map((item) => {
                            const isSelected = item.id === selectedItem?.id;
                            return (
                                <TouchableOpacity
                                    key={item.id}
                                    activeOpacity={0.7}
                                    onPress={() => setSelectedItemId(item.id)}
                                    style={[
                                        styles.gridCell,
                                        { width: cellWidth },
                                        isSelected && styles.selectedGridCell,
                                    ]}
                                >
                                    {item.isActivated && (
                                        <View style={styles.equippedGridBadge}>
                                            <Text style={styles.equippedGridBadgeText}>
                                                {item.itemType === "SKIN" ? "Đang dùng" : "Đã bật"}
                                            </Text>
                                        </View>
                                    )}

                                    {item.quantity > 0 && (
                                        <Text style={styles.badgeCount}>
                                            x{item.quantity}
                                        </Text>
                                    )}

                                    {item.imageUrl ? (
                                        <View style={styles.cellImageWrapper}>
                                            <Image
                                                source={{ uri: item.imageUrl }}
                                                style={styles.cellImageInside}
                                                resizeMode="contain"
                                            />
                                        </View>
                                    ) : (
                                        <View style={styles.cellIconWrapper}>
                                            <Package size={24} color={colors.textMuted} />
                                        </View>
                                    )}

                                    <Text style={styles.cellName} numberOfLines={1}>
                                        {item.name}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                )}
            </ScrollView>

            {/* Conflict Resolution Modal */}
            <Modal
                visible={Boolean(conflictModalData)}
                transparent
                animationType="fade"
                onRequestClose={handleCloseConflictModal}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <Ionicons name="warning-outline" size={44} color={colors.warning} style={{ marginBottom: 12 }} />
                        <Text style={styles.modalTitle}>Thay thế hiệu ứng?</Text>
                        <Text style={styles.modalDesc}>
                            Bạn đang có hiệu ứng{" "}
                            <Text style={styles.modalHighlightText}>
                                {conflictModalData?.activeItemName}
                            </Text>{" "}
                            đang hoạt động. Việc kích hoạt{" "}
                            <Text style={styles.modalHighlightText}>
                                {conflictModalData?.itemName}
                            </Text>{" "}
                            sẽ hủy hiệu ứng hiện tại và bạn sẽ mất nó vĩnh viễn.
                        </Text>
                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={styles.cancelBtn}
                                activeOpacity={0.8}
                                onPress={handleCloseConflictModal}
                            >
                                <Text style={styles.cancelBtnText}>Hủy</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.confirmBtn}
                                activeOpacity={0.8}
                                onPress={handleConfirmReplace}
                            >
                                <Text style={styles.confirmBtnText}>Xác nhận</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    screenWrapper: {
        flex: 1,
        backgroundColor: colors.background,
    },
    loadingWrapper: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: colors.background,
    },
    pinnedHeaderArea: {
        paddingHorizontal: 16,
        paddingTop: 14,
        paddingBottom: 8,
        backgroundColor: colors.background,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderMedium,
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
        paddingBottom: 10,
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
    compactFeaturedCard: {
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 10,
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: colors.primary,
        marginTop: 2,
    },
    compactThumbnailWrapper: {
        width: 44,
        height: 44,
        borderRadius: 10,
        backgroundColor: colors.surfaceVariant,
        padding: 4,
        alignItems: "center",
        justifyContent: "center",
    },
    compactThumbnailImage: {
        width: "100%",
        height: "100%",
    },
    iconFallbackCircle: {
        alignItems: "center",
        justifyContent: "center",
    },
    compactFeaturedInfo: {
        flex: 1,
        marginLeft: 10,
        marginRight: 8,
        justifyContent: "center",
    },
    compactTitleRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginBottom: 2,
    },
    compactFeaturedName: {
        fontFamily: typography.fonts.bold,
        fontSize: 14,
        color: colors.textPrimary,
        flexShrink: 1,
    },
    qtyBadge: {
        backgroundColor: colors.surfaceVariant,
        paddingHorizontal: 6,
        paddingVertical: 1,
        borderRadius: 30,
        borderWidth: 1,
        borderColor: colors.borderMedium,
    },
    qtyBadgeText: {
        fontFamily: typography.fonts.bold,
        fontSize: 10,
        color: colors.textSecondary,
    },
    compactFeaturedDescription: {
        fontFamily: typography.fonts.regular,
        fontSize: 11,
        color: colors.textMuted,
    },
    compactUseButton: {
        backgroundColor: colors.primary,
        borderRadius: 30,
        paddingVertical: 7,
        paddingHorizontal: 14,
        alignItems: "center",
        justifyContent: "center",
    },
    activatedButton: {
        backgroundColor: colors.textMuted,
    },
    disabledButton: {
        opacity: 0.6,
    },
    compactUseButtonText: {
        fontFamily: typography.fonts.bold,
        color: colors.textLight,
        fontSize: 12,
    },
    badgeLabelContainer: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        backgroundColor: colors.surfaceVariant,
        borderRadius: 30,
    },
    badgeLabelText: {
        fontFamily: typography.fonts.medium,
        color: colors.textMuted,
        fontSize: 11,
    },
    scrollView: {
        flex: 1,
        backgroundColor: colors.background,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 14,
        paddingBottom: 32,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: 40,
    },
    emptyTitle: {
        fontFamily: typography.fonts.bold,
        fontSize: 16,
        color: colors.textSecondary,
    },
    emptySubtitle: {
        fontFamily: typography.fonts.regular,
        fontSize: 14,
        color: colors.textMuted,
        textAlign: "center",
        marginTop: 4,
        paddingHorizontal: 24,
    },
    gridContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
    },
    gridCell: {
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 8,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: colors.borderMedium,
        height: 104,
        position: "relative",
    },
    selectedGridCell: {
        borderColor: colors.primary,
        backgroundColor: colors.primaryContainer,
    },
    badgeCount: {
        position: "absolute",
        top: 6,
        right: 8,
        fontFamily: typography.fonts.semiBold,
        fontSize: 11,
        color: colors.textMuted,
    },
    cellImageWrapper: {
        width: 38,
        height: 38,
        borderRadius: 8,
        marginBottom: 6,
        marginTop: 4,
        backgroundColor: colors.surfaceVariant,
        padding: 4,
        alignItems: "center",
        justifyContent: "center",
    },
    cellImageInside: {
        width: "100%",
        height: "100%",
    },
    cellIconWrapper: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: colors.surfaceVariant,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 6,
        marginTop: 4,
    },
    cellName: {
        fontFamily: typography.fonts.semiBold,
        fontSize: 11,
        color: colors.textPrimary,
        textAlign: "center",
        lineHeight: 14,
    },
    equippedGridBadge: {
        position: "absolute",
        top: 5,
        left: 5,
        backgroundColor: colors.primary,
        paddingHorizontal: 5,
        paddingVertical: 1,
        borderRadius: 30,
        zIndex: 2,
    },
    equippedGridBadgeText: {
        fontFamily: typography.fonts.bold,
        color: colors.textLight,
        fontSize: 7.5,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.45)",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    modalContainer: {
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 24,
        width: "100%",
        maxWidth: 340,
        alignItems: "center",
        borderWidth: 1,
        borderColor: colors.borderMedium,
    },
    modalTitle: {
        fontFamily: typography.fonts.bold,
        fontSize: 18,
        color: colors.textPrimary,
        marginBottom: 8,
    },
    modalDesc: {
        fontFamily: typography.fonts.regular,
        fontSize: 14,
        color: colors.textSecondary,
        textAlign: "center",
        lineHeight: 20,
        marginBottom: 20,
    },
    modalHighlightText: {
        fontFamily: typography.fonts.bold,
        color: colors.textPrimary,
    },
    modalActions: {
        flexDirection: "row",
        width: "100%",
        gap: 12,
    },
    cancelBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 30,
        borderWidth: 1,
        borderColor: colors.borderMedium,
        backgroundColor: colors.surfaceVariant,
        alignItems: "center",
    },
    cancelBtnText: {
        fontFamily: typography.fonts.bold,
        fontSize: 14,
        color: colors.textSecondary,
    },
    confirmBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 30,
        backgroundColor: colors.error,
        alignItems: "center",
    },
    confirmBtnText: {
        fontFamily: typography.fonts.bold,
        fontSize: 14,
        color: colors.textLight,
    },
});
