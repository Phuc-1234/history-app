import { useState, useMemo } from "react";
import { useAppSelector } from "../../../store/storeHook";
import { useGetShopItemsQuery, usePurchaseItemMutation, useGetUserInventoryQuery } from "../../inventory/services/itemApi";
import { useGetProfileQuery } from "../../auth/services/authApi";

export interface ShopItem {
    id: string;
    dbId: number;
    name: string;
    description: string;
    cost: number;
    imageUrl: string;
    category: "powerup" | "cosmetic";
    itemType: "SKIN" | "XP_MUL" | "GOLD_MUL" | "BADGE";
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
    const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
    const [purchaseModal, setPurchaseModal] = useState<PurchaseModalState | null>(null);

    const profile = useAppSelector((state) => state.auth.profile);
    const userCoins = profile?.totalGold ?? 0;

    const { data: shopData, isLoading, isFetching: isFetchingShop, refetch: refetchShop } = useGetShopItemsQuery();
    const { data: inventoryData, isFetching: isFetchingInventory, refetch: refetchInventory } = useGetUserInventoryQuery();
    const { refetch: refetchProfile } = useGetProfileQuery();
    const [purchaseItem] = usePurchaseItemMutation();

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
            isOwned: (item.itemType === "SKIN" || item.itemType === "BADGE") && ownedIds.has(item.id),
        }));
    }, [shopData, inventoryData]);

    const filteredItems = useMemo(() => {
        return shopItems.filter((item) =>
            item.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [shopItems, searchQuery]);

    const handlePurchase = async (item: ShopItem) => {
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
            await purchaseItem({ itemDefinitionId: item.dbId, quantity: 1 }).unwrap();
            setSelectedItem(null);
            setPurchaseModal({
                visible: true,
                title: "Mua thành công!",
                message: `Bạn đã mua thành công vật phẩm "${item.name}".`,
                isSuccess: true,
            });
        } catch (err: any) {
            setPurchaseModal({
                visible: true,
                title: "Lỗi mua hàng",
                message: err?.data?.error ?? err?.message ?? "Không thể mua vật phẩm.",
                isSuccess: false,
            });
        }
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
        userCoins,
        filteredItems,
        selectedItem,
        setSelectedItem,
        handlePurchase,
        purchaseModal,
        closePurchaseModal,
        isLoading,
        handleRefresh,
        isRefreshing: isFetchingShop || isFetchingInventory,
    };
}
