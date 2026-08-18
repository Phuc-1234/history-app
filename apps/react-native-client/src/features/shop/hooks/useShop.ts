import { useState, useMemo, useRef } from "react";
import { useAppSelector } from "../../../store/storeHook";
import {
    useGetShopItemsQuery,
    usePurchaseItemMutation,
    useGetUserInventoryQuery,
    useActivateItemMutation,
} from "../../inventory/services/itemApi";
import { useGetProfileQuery } from "../../auth/services/authApi";
import { toastService } from "../../../services/toastService";

export type ShopCategory = "ALL" | "POWERUP" | "AVT_FRAME" | "LEADERBOARD_BG";

export interface ShopItem {
    id: string;
    dbId: number;
    name: string;
    description: string;
    cost: number;
    imageUrl: string;
    category: "powerup" | "cosmetic";
    itemType: "SKIN" | "XP_MUL" | "GOLD_MUL" | "BADGE";
    equipmentSlot: string | null;
    isOwned: boolean;
}

export interface PurchaseModalState {
    visible: boolean;
    title: string;
    message: string;
    isSuccess: boolean;
}

export function useShop() {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<ShopCategory>("ALL");
    const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
    const [purchaseModal, setPurchaseModal] = useState<PurchaseModalState | null>(null);
    const [conflictModalData, setConflictModalData] = useState<{
        dbId: number;
        itemName: string;
        activeItemName: string;
    } | null>(null);
    const isPurchasingRef = useRef(false);

    const profile = useAppSelector((state) => state.auth.profile);
    const userCoins = profile?.totalGold ?? 0;

    const { data: shopData, isLoading, isFetching: isFetchingShop, refetch: refetchShop } = useGetShopItemsQuery();
    const { data: inventoryData, isFetching: isFetchingInventory, refetch: refetchInventory } = useGetUserInventoryQuery();
    const { refetch: refetchProfile } = useGetProfileQuery();
    const [purchaseItem, { isLoading: isPurchasingOnly }] = usePurchaseItemMutation();
    const [activateItem, { isLoading: isActivating }] = useActivateItemMutation();

    const isPurchasing = isPurchasingOnly || isActivating;

    const shopItems = useMemo<ShopItem[]>(() => {
        if (!shopData?.items) return [];
        const ownedIds = new Set(inventoryData?.inventory?.map((i) => i.itemDefinitionId) ?? []);
        return shopData.items.map((item) => ({
            id: String(item.id),
            dbId: item.id,
            name: item.name,
            description: item.description ?? "",
            cost: item.price,
            imageUrl: item.shopImgUrl ?? item.imgUrl ?? "",
            category: (item.itemType === "XP_MUL" || item.itemType === "GOLD_MUL") ? "powerup" : "cosmetic",
            itemType: item.itemType,
            equipmentSlot: item.equipmentSlot ?? null,
            isOwned: (item.itemType === "SKIN" || item.itemType === "BADGE") && ownedIds.has(item.id),
        }));
    }, [shopData, inventoryData]);

    const filteredItems = useMemo(() => {
        return shopItems.filter((item) => {
            const matchesQuery = item.name.toLowerCase().includes(searchQuery.toLowerCase());
            if (!matchesQuery) return false;

            if (selectedCategory === "ALL") return true;
            if (selectedCategory === "POWERUP") return item.itemType === "XP_MUL" || item.itemType === "GOLD_MUL";
            if (selectedCategory === "AVT_FRAME") return item.itemType === "SKIN" && item.equipmentSlot === "AVT_FRAME";
            if (selectedCategory === "LEADERBOARD_BG") {
                return item.itemType === "SKIN" && (item.equipmentSlot === "LEADERBOARD_BG" || item.equipmentSlot === "BACKGROUND");
            }
            return true;
        });
    }, [shopItems, searchQuery, selectedCategory]);

    const handlePurchase = async (item: ShopItem) => {
        if (isPurchasingRef.current || isPurchasing) return;

        if (item.isOwned) {
            setPurchaseModal({
                visible: true,
                title: "Thông báo",
                message: "Bạn đã sở hữu vật phẩm này.",
                isSuccess: false,
            });
            return;
        }

        if (userCoins < item.cost) {
            setPurchaseModal({
                visible: true,
                title: "Không đủ Vàng",
                message: "Bạn không đủ số lượng Vàng để thực hiện giao dịch này.",
                isSuccess: false,
            });
            return;
        }

        try {
            isPurchasingRef.current = true;
            await purchaseItem({ itemDefinitionId: item.dbId, quantity: 1 }).unwrap();
            setSelectedItem(null);
            toastService.show(`Bạn đã mua thành công vật phẩm "${item.name}".`, "success");
        } catch (err: any) {
            setPurchaseModal({
                visible: true,
                title: "Lỗi mua hàng",
                message: err?.data?.error ?? err?.message ?? "Không thể mua vật phẩm.",
                isSuccess: false,
            });
        } finally {
            isPurchasingRef.current = false;
        }
    };

    const handlePurchaseAndUse = async (item: ShopItem, forceReplace: boolean = false) => {
        if (isPurchasingRef.current || isPurchasing) return;

        if (item.isOwned && item.itemType !== "SKIN") {
            setPurchaseModal({
                visible: true,
                title: "Thông báo",
                message: "Bạn đã sở hữu vật phẩm này.",
                isSuccess: false,
            });
            return;
        }

        if (userCoins < item.cost) {
            setPurchaseModal({
                visible: true,
                title: "Không đủ Vàng",
                message: "Bạn không đủ số lượng Vàng để thực hiện giao dịch này.",
                isSuccess: false,
            });
            return;
        }

        try {
            isPurchasingRef.current = true;
            await purchaseItem({ itemDefinitionId: item.dbId, quantity: 1 }).unwrap();

            // Then immediately activate/equip
            const res = await activateItem({ itemDefinitionId: item.dbId, forceReplace }).unwrap();
            if (res.conflict) {
                setConflictModalData({
                    dbId: item.dbId,
                    itemName: item.name,
                    activeItemName: res.activeItemName || "hiệu ứng đang dùng",
                });
            } else {
                setSelectedItem(null);
                toastService.show(
                    item.itemType === "SKIN"
                        ? `Đã mua và trang bị "${item.name}".`
                        : `Đã mua và kích hoạt "${item.name}".`,
                    "success"
                );
            }
        } catch (err: any) {
            if (err?.data?.conflict || err?.status === 409) {
                setConflictModalData({
                    dbId: item.dbId,
                    itemName: item.name,
                    activeItemName: err?.data?.activeItemName || "hiệu ứng đang dùng",
                });
            } else {
                setPurchaseModal({
                    visible: true,
                    title: "Lỗi thực hiện",
                    message: err?.data?.error ?? err?.message ?? "Không thể hoàn tất giao dịch và kích hoạt.",
                    isSuccess: false,
                });
            }
        } finally {
            isPurchasingRef.current = false;
        }
    };

    const handleConfirmReplace = async () => {
        if (!conflictModalData) return;
        const targetDbId = conflictModalData.dbId;
        const targetItem = shopItems.find((it) => it.dbId === targetDbId);
        setConflictModalData(null);
        if (targetItem) {
            try {
                await activateItem({ itemDefinitionId: targetDbId, forceReplace: true }).unwrap();
                setSelectedItem(null);
                toastService.show(`Đã kích hoạt "${targetItem.name}".`, "success");
            } catch (err: any) {
                setPurchaseModal({
                    visible: true,
                    title: "Lỗi kích hoạt",
                    message: err?.data?.error ?? err?.message ?? "Không thể kích hoạt vật phẩm.",
                    isSuccess: false,
                });
            }
        }
    };

    const handleCloseConflictModal = () => {
        setConflictModalData(null);
    };

    const closePurchaseModal = () => {
        setPurchaseModal(null);
    };

    const handleRefresh = async () => {
        try {
            await Promise.all([
                refetchShop().unwrap(),
                refetchInventory().unwrap(),
                refetchProfile().unwrap(),
            ]);
        } catch (e) {
            console.error("Refresh shop failed:", e);
        }
    };

    return {
        searchQuery,
        setSearchQuery,
        selectedCategory,
        setSelectedCategory,
        userCoins,
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
        isRefreshing: isFetchingShop || isFetchingInventory,
    };
}
