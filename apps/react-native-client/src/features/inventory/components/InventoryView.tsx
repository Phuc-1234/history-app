import React from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    Image,
    View,
    useWindowDimensions,
    ActivityIndicator,
    RefreshControl,
    Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useInventory } from "../hooks/useInventory";
import { Ionicons } from "@expo/vector-icons";
import { Package } from "lucide-react-native";
import colors from "../../../theme/colors";
import typography from "../../../theme/typography";

export const InventoryView: React.FC = () => {
    const {
        inventory,
        selectedItem,
        setSelectedItemId,
        handleUseItem,
        isLoading,
        handleRefresh,
        isRefreshing,
        conflictModalData,
        handleConfirmReplace,
        handleCloseConflictModal,
    } = useInventory();
    const { width } = useWindowDimensions();
    const insets = useSafeAreaInsets();

    const paddingHorizontal = 20;
    const gap = 12;
    const gridWidth = width - paddingHorizontal * 2 - insets.left - insets.right;
    const cellWidth = Math.floor((gridWidth - gap * 2) / 3) - 1;

    if (isLoading) {
        return (
            <View style={styles.loadingWrapper}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
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
                        Hãy hoàn thành các bài học hoặc ghé cửa hàng để nhận vật phẩm!
                    </Text>
                </View>
            ) : (
                <>
                    {/* 1. Featured Item Preview Card */}
                    {selectedItem && (
                        <View style={styles.featuredCard}>
                            {selectedItem.imageUrl ? (
                                <Image
                                    source={{ uri: selectedItem.imageUrl }}
                                    style={styles.featuredImage}
                                />
                            ) : (
                                <View style={[styles.featuredImage, styles.iconFallbackCircle]}>
                                    <Package size={40} color={colors.textMuted} />
                                </View>
                            )}
                            <View style={styles.featuredInfo}>
                                <Text style={styles.featuredName}>
                                    {selectedItem.name}
                                </Text>
                                <Text
                                    style={styles.featuredDescription}
                                    numberOfLines={3}
                                >
                                    {selectedItem.description}
                                </Text>

                                {selectedItem.quantity > 0 && (
                                    <Text style={styles.featuredQuantity}>
                                        Số lượng:{" "}
                                        <Text style={styles.boldQty}>
                                            x {String(selectedItem.quantity).padStart(2, "0")}
                                        </Text>
                                    </Text>
                                )}

                                <TouchableOpacity
                                    style={[
                                        styles.useButton,
                                        selectedItem.isActivated && styles.activatedButton,
                                    ]}
                                    activeOpacity={0.8}
                                    onPress={() => handleUseItem(selectedItem.id)}
                                    disabled={selectedItem.isActivated && selectedItem.itemType !== "SKIN"}
                                >
                                    <Text style={styles.useButtonText}>
                                        {selectedItem.itemType === "SKIN"
                                            ? (selectedItem.isEquipped ? "Tháo" : "Trang bị")
                                            : (selectedItem.isActivated ? "Đã kích hoạt" : "Kích hoạt")}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    {/* 2. Grid Header Text */}
                    <Text style={styles.sectionTitle}>Tất cả vật phẩm</Text>

                    {/* 3. Items 3-Column Grid Matrix */}
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
                                                {item.itemType === "SKIN" ? "Đang dùng" : "Đã kích hoạt"}
                                            </Text>
                                        </View>
                                    )}

                                    {item.quantity > 0 && (
                                        <Text style={styles.badgeCount}>
                                            x{item.quantity}
                                        </Text>
                                    )}

                                    {item.imageUrl ? (
                                        <Image
                                            source={{ uri: item.imageUrl }}
                                            style={styles.cellImage}
                                            resizeMode="contain"
                                        />
                                    ) : (
                                        <View style={styles.cellIconWrapper}>
                                            <Package size={28} color={colors.textMuted} />
                                        </View>
                                    )}

                                    <Text style={styles.cellName} numberOfLines={2}>
                                        {item.name}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </>
            )}

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
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    loadingWrapper: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: colors.background,
    },
    scrollView: {
        flex: 1,
        backgroundColor: colors.background,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 32,
        backgroundColor: colors.background,
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
    featuredCard: {
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 16,
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: colors.borderMedium,
        marginBottom: 28,
    },
    featuredImage: {
        width: 100,
        height: 100,
        borderRadius: 12,
        backgroundColor: colors.surfaceVariant,
    },
    iconFallbackCircle: {
        alignItems: "center",
        justifyContent: "center",
    },
    featuredInfo: {
        flex: 1,
        marginLeft: 16,
        justifyContent: "center",
    },
    featuredName: {
        fontFamily: typography.fonts.bold,
        fontSize: 18,
        color: colors.textPrimary,
        marginBottom: 4,
    },
    featuredDescription: {
        fontFamily: typography.fonts.regular,
        fontSize: 13,
        color: colors.textSecondary,
        lineHeight: 18,
        marginBottom: 6,
    },
    featuredQuantity: {
        fontFamily: typography.fonts.regular,
        fontSize: 13,
        color: colors.textSecondary,
        marginBottom: 8,
    },
    boldQty: {
        fontFamily: typography.fonts.bold,
        color: colors.textPrimary,
    },
    useButton: {
        backgroundColor: colors.primary,
        borderRadius: 30,
        paddingVertical: 8,
        paddingHorizontal: 20,
        alignSelf: "flex-start",
    },
    activatedButton: {
        backgroundColor: colors.textMuted,
    },
    useButtonText: {
        fontFamily: typography.fonts.bold,
        color: colors.textLight,
        fontSize: 13,
    },
    sectionTitle: {
        fontFamily: typography.fonts.bold,
        fontSize: 16,
        color: colors.textPrimary,
        marginBottom: 16,
    },
    gridContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
    },
    gridCell: {
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 12,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: colors.borderMedium,
        height: 124,
        position: "relative",
    },
    selectedGridCell: {
        borderColor: colors.primary,
        backgroundColor: colors.primaryContainer,
    },
    badgeCount: {
        position: "absolute",
        top: 8,
        right: 10,
        fontFamily: typography.fonts.semiBold,
        fontSize: 12,
        color: colors.textMuted,
    },
    cellImage: {
        width: 44,
        height: 44,
        borderRadius: 10,
        marginBottom: 10,
        marginTop: 6,
        backgroundColor: colors.surfaceVariant,
    },
    cellIconWrapper: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.surfaceVariant,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 10,
        marginTop: 6,
    },
    cellName: {
        fontFamily: typography.fonts.semiBold,
        fontSize: 13,
        color: colors.textPrimary,
        textAlign: "center",
        lineHeight: 16,
    },
    equippedGridBadge: {
        position: "absolute",
        top: 6,
        left: 6,
        backgroundColor: colors.primary,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 30,
        zIndex: 2,
    },
    equippedGridBadgeText: {
        fontFamily: typography.fonts.bold,
        color: colors.textLight,
        fontSize: 8,
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
