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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useInventory, InventoryItem } from "../hooks/useInventory";
import { Ionicons } from "@expo/vector-icons";

export const InventoryView: React.FC = () => {
    const { inventory, selectedItem, setSelectedItemId, handleUseItem, isLoading, handleRefresh, isRefreshing } =
        useInventory();
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
                                <Text style={styles.featuredQuantity}>
                                    Số lượng:{" "}
                                    <Text style={styles.boldQty}>
                                        x{" "}
                                        {String(selectedItem.quantity).padStart(2, "0")}
                                    </Text>
                                </Text>
                                <TouchableOpacity
                                    style={[
                                        styles.useButton,
                                        selectedItem.isEquipped && styles.unequipButton
                                    ]}
                                    activeOpacity={0.8}
                                    onPress={() => handleUseItem(selectedItem.id)}
                                >
                                    <Text style={styles.useButtonText}>
                                        {selectedItem.itemType === "SKIN"
                                            ? (selectedItem.isEquipped ? "Tháo" : "Trang bị")
                                            : "Sử dụng"}
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
                                    {item.isEquipped && (
                                        <View style={styles.equippedGridBadge}>
                                            <Text style={styles.equippedGridBadgeText}>Đang dùng</Text>
                                        </View>
                                    )}

                                    <Text style={styles.badgeCount}>
                                        x{item.quantity}
                                    </Text>

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
        borderRadius: 20,
        padding: 16,
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#EAEAEA",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
        elevation: 2,
        marginBottom: 28,
    },
    featuredImage: {
        width: 100,
        height: 100,
        borderRadius: 16,
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
        backgroundColor: "#58CC02", // Duolingo dynamic vibrant green action color
        borderRadius: 12,
        paddingVertical: 6,
        paddingHorizontal: 20,
        alignSelf: "flex-start",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
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
        borderRadius: 16,
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
    emojiIcon: {
        fontSize: 20,
    },
    cellName: {
        fontSize: 13,
        fontWeight: "600",
        color: "#3C3C3C",
        textAlign: "center",
        lineHeight: 16,
    },
    unequipButton: {
        backgroundColor: "#FF9800",
    },
    equippedGridBadge: {
        position: "absolute",
        top: 8,
        left: 8,
        backgroundColor: "#58CC02",
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
        zIndex: 2,
    },
    equippedGridBadgeText: {
        color: "#FFFFFF",
        fontSize: 8,
        fontWeight: "700",
    },
});
