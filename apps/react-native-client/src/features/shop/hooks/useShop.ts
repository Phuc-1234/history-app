import { useState, useMemo } from "react";
import { useAppSelector } from "../../../store/storeHook";
import { useGetShopItemsQuery, usePurchaseItemMutation } from "../../inventory/services/itemApi";
import { Alert } from "react-native";

export interface ShopItem {
    id: string;
    dbId: number;
    name: string;
    description: string;
    cost: number;
    imageUrl: string;
    category: "powerup" | "cosmetic";
}

export function useShop() {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);

    const profile = useAppSelector((state) => state.auth.profile);
    const userCoins = profile?.totalGold ?? 0;

    const { data: shopData, isLoading } = useGetShopItemsQuery();
    const [purchaseItem] = usePurchaseItemMutation();

    const shopItems = useMemo<ShopItem[]>(() => {
        if (!shopData?.items) return [];
        return shopData.items.map((item) => ({
            id: String(item.id),
            dbId: item.id,
            name: item.name,
            description: item.description ?? "",
            cost: item.price,
            imageUrl: item.imgUrl ?? "https://picsum.photos/id/1021/400/400",
            category: item.isConsumable ? "powerup" : "cosmetic",
        }));
    }, [shopData]);

    const filteredItems = useMemo(() => {
        return shopItems.filter((item) =>
            item.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [shopItems, searchQuery]);

    const handlePurchase = async (item: ShopItem) => {
        if (userCoins < item.cost) {
            Alert.alert("Lỗi", "Bạn không đủ số lượng Vàng để thực hiện giao dịch này.");
            return;
        }

        try {
            await purchaseItem({ itemDefinitionId: item.dbId, quantity: 1 }).unwrap();
            Alert.alert("Thành công", `Mua thành công: ${item.name}!`);
            setSelectedItem(null);
        } catch (err: any) {
            Alert.alert("Lỗi", err?.data?.error ?? err?.message ?? "Không thể mua vật phẩm.");
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
        isLoading,
    };
}
