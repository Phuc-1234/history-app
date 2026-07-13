import { useState, useMemo } from "react";
import { useGetUserInventoryQuery, useActivateItemMutation } from "../services/itemApi";
import { useGetProfileQuery } from "../../auth/services/authApi";
import { useAppSelector } from "../../../store/storeHook";
import { Alert } from "react-native";

export interface InventoryItem {
    id: string;
    dbId: number;
    name: string;
    description: string;
    quantity: number;
    icon: string;
    iconBgColor: string;
    iconColor: string;
    imageUrl: string;
    itemType: "SKIN" | "XP_MUL" | "GOLD_MUL" | "BADGE";
    equipmentSlot: string | null;
    isEquipped: boolean;
}

export function useInventory() {
    const { data: inventoryData, isLoading, isFetching: isFetchingInventory, refetch: refetchInventory } = useGetUserInventoryQuery();
    const { refetch: refetchProfile } = useGetProfileQuery();
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
    const [activateItem] = useActivateItemMutation();

    const profile = useAppSelector((state) => state.auth.profile);

    const inventory = useMemo<InventoryItem[]>(() => {
        if (!inventoryData?.inventory) return [];
        return inventoryData.inventory.map((ui) => {
            const def = ui.itemDefinition;
            let icon = "📦";
            let iconBgColor = "#E3F2FD";
            let iconColor = "#1E88E5";

            if (def.itemType === "XP_MUL" || def.itemType === "GOLD_MUL") {
                icon = "⚡";
                iconBgColor = "#FFECC7";
                iconColor = "#FF9F00";
            } else if (def.itemType === "SKIN") {
                icon = "🛡️";
                iconBgColor = "#FFEBEE";
                iconColor = "#E53935";
            } else if (def.itemType === "BADGE") {
                icon = "🏅";
                iconBgColor = "#EDE7F6";
                iconColor = "#5E35B1";
            }

            const isEquipped = def.itemType === "SKIN" &&
                def.equipmentSlot === "AVT_FRAME" &&
                profile?.equippedFrameUrl !== null &&
                profile?.equippedFrameUrl !== undefined &&
                profile.equippedFrameUrl === def.imgUrl;

            return {
                id: String(def.id),
                dbId: def.id,
                name: def.name,
                description: def.description ?? "",
                quantity: ui.quantity,
                icon,
                iconBgColor,
                iconColor,
                imageUrl: def.imgUrl ?? "https://picsum.photos/id/1021/200/200",
                itemType: def.itemType,
                equipmentSlot: def.equipmentSlot,
                isEquipped,
            };
        });
    }, [inventoryData, profile]);

    const selectedItem = useMemo(() => {
        if (inventory.length === 0) return null;
        if (!selectedItemId) return inventory[0];
        return inventory.find((item) => item.id === selectedItemId) || inventory[0];
    }, [inventory, selectedItemId]);

    const handleUseItem = async (id: string) => {
        const item = inventory.find((it) => it.id === id);
        if (!item) return;

        if (item.itemType !== "SKIN" || item.equipmentSlot !== "AVT_FRAME") {
            Alert.alert("Tính năng chưa được hỗ trợ", "Chỉ hỗ trợ trang bị Khung đại diện (avatar frame) vào lúc này.");
            return;
        }

        try {
            await activateItem({ itemDefinitionId: item.dbId }).unwrap();
        } catch (err: any) {
            Alert.alert("Lỗi", err?.data?.error ?? err?.message ?? "Không thể thực hiện hành động này.");
        }
    };

    const handleRefresh = async () => {
        try {
            await Promise.all([
                refetchInventory().unwrap(),
                refetchProfile().unwrap(),
            ]);
        } catch (e) {
            console.error("Refresh inventory failed:", e);
        }
    };

    return {
        inventory,
        selectedItem,
        setSelectedItemId,
        handleUseItem,
        isLoading,
        handleRefresh,
        isRefreshing: isFetchingInventory,
    };
}
