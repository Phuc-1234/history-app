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
import { useInventory, InventoryItem } from "../hooks/useInventory";
import { Ionicons } from "@expo/vector-icons";

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

    // Grid spacing math
    const paddingHorizontal = 20;
    const gap = 12;
    const gridWidth = width - paddingHorizontal * 2 - insets.left - insets.right;
    const cellWidth = Math.floor((gridWidth - gap * 2) / 3) - 1;

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#FAF8F5" }}>
                <ActivityIndicator size="large" color="#58CC02" />
            </View>
        );
    }

    return (
        <ScrollView
            showsVerticalScrollIndicator={false}
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
                <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
            }
        >
            {inventory.length === 0 ? (
                <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 40 }}>
                    <Ionicons name="briefcase-outline" size={48} color="#666" style={{ marginBottom: 12 }} />
                    <Text style={{ fontSize: 16, fontWeight: "600", color: "#666" }}>Túi đồ trống</Text>
                    <Text style={{ fontSize: 14, color: "#888", textAlign: "center", marginTop: 4, paddingHorizontal: 24 }}>
                        Hãy hoàn thành các bài học hoặc ghé cửa hàng để nhận vật phẩm!
                    </Text>
                </View>
            ) : (
                <>
                    {/* 1. Featured Item Preview Card */}
                    {selectedItem && (
                        <View style={styles.featuredCard}>
                            <Image
                                source={{ uri: selectedItem.imageUrl }}
                                style={styles.featuredImage}
                            />
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
                                        <View
                                            style={[
                                                styles.iconCircle,
                                                { backgroundColor: item.iconBgColor },
                                            ]}
                                        >
                                            <Ionicons
                                                name={item.icon as any}
                                                size={24}
                                                color={item.iconColor}
                                            />
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
                        <Ionicons name="warning-outline" size={44} color="#FF9800" style={{ marginBottom: 12 }} />
                        <Text style={styles.modalTitle}>Thay thế hiệu ứng?</Text>
                        <Text style={styles.modalDesc}>
                            Bạn đang có hiệu ứng{" "}
                            <Text style={{ fontWeight: "700", color: "#1F1F1F" }}>
                                {conflictModalData?.activeItemName}
                            </Text>{" "}
                            đang hoạt động. Việc kích hoạt{" "}
                            <Text style={{ fontWeight: "700", color: "#1F1F1F" }}>
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
    scrollView: {
        flex: 1,
        backgroundColor: "#FAF8F5",
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 32,
        backgroundColor: "#FAF8F5",
    },
    featuredCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 12, // Container border radius = 12
        padding: 16,
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#EAEAEA",
        marginBottom: 28,
    },
    featuredImage: {
        width: 100,
        height: 100,
        borderRadius: 12,
        backgroundColor: "#F0F0F0",
    },
    featuredInfo: {
        flex: 1,
        marginLeft: 16,
        justifyContent: "center",
    },
    featuredName: {
        fontSize: 18,
        fontWeight: "700",
        color: "#1F1F1F",
        marginBottom: 4,
    },
    featuredDescription: {
        fontSize: 13,
        color: "#666666",
        lineHeight: 18,
        marginBottom: 6,
    },
    featuredQuantity: {
        fontSize: 13,
        color: "#444444",
        marginBottom: 8,
    },
    boldQty: {
        fontWeight: "700",
        color: "#1F1F1F",
    },
    useButton: {
        backgroundColor: "#58CC02",
        borderRadius: 30, // Pill button border radius = 30
        paddingVertical: 8,
        paddingHorizontal: 20,
        alignSelf: "flex-start",
    },
    activatedButton: {
        backgroundColor: "#9E9E9E",
    },
    useButtonText: {
        color: "#FFFFFF",
        fontSize: 13,
        fontWeight: "700",
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#2C2C2C",
        marginBottom: 16,
    },
    gridContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
    },
    gridCell: {
        backgroundColor: "#FFFFFF",
        borderRadius: 12, // Container border radius = 12
        padding: 12,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 2,
        borderColor: "#E5E5E5",
        height: 124,
        position: "relative",
    },
    selectedGridCell: {
        borderColor: "#58CC02",
        backgroundColor: "#F7FFF0",
    },
    badgeCount: {
        position: "absolute",
        top: 8,
        right: 10,
        fontSize: 12,
        fontWeight: "600",
        color: "#777777",
    },
    cellImage: {
        width: 44,
        height: 44,
        borderRadius: 10,
        marginBottom: 10,
        marginTop: 6,
        backgroundColor: "#F5F6F8",
    },
    iconCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 10,
        marginTop: 6,
    },
    cellName: {
        fontSize: 13,
        fontWeight: "600",
        color: "#3C3C3C",
        textAlign: "center",
        lineHeight: 16,
    },
    equippedGridBadge: {
        position: "absolute",
        top: 6,
        left: 6,
        backgroundColor: "#58CC02",
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 30, // Pill badge
        zIndex: 2,
    },
    equippedGridBadgeText: {
        color: "#FFFFFF",
        fontSize: 8,
        fontWeight: "700",
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    modalContainer: {
        backgroundColor: "#FFFFFF",
        borderRadius: 12, // Container border radius = 12
        padding: 24,
        width: "100%",
        maxWidth: 340,
        alignItems: "center",
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#1F1F1F",
        marginBottom: 8,
    },
    modalDesc: {
        fontSize: 14,
        color: "#666666",
        textAlign: "center",
        lineHeight: 20,
        marginBottom: 20,
    },
    modalActions: {
        flexDirection: "row",
        width: "100%",
        gap: 12,
    },
    cancelBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 30, // Pill button border radius = 30
        borderWidth: 1.5,
        borderColor: "#E5E5E5",
        alignItems: "center",
    },
    cancelBtnText: {
        fontSize: 14,
        fontWeight: "700",
        color: "#666666",
    },
    confirmBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 30, // Pill button border radius = 30
        backgroundColor: "#E53935",
        alignItems: "center",
    },
    confirmBtnText: {
        fontSize: 14,
        fontWeight: "700",
        color: "#FFFFFF",
    },
});
