import { useState, useMemo, useRef } from "react";
import { useGetUserInventoryQuery, useActivateItemMutation } from "../services/itemApi";
import { useGetProfileQuery } from "../../auth/services/authApi";
import { useAppSelector } from "../../../store/storeHook";
import { Alert } from "react-native";

export type InventoryCategory = "ALL" | "POWERUP" | "AVT_FRAME" | "LEADERBOARD_BG";

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
    isActivated: boolean;
}

export function useInventory() {
    const { data: inventoryData, isLoading, isFetching: isFetchingInventory, refetch: refetchInventory } = useGetUserInventoryQuery();
    const { refetch: refetchProfile } = useGetProfileQuery();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<InventoryCategory>("ALL");
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
    const [activateItem, { isLoading: isActivatingMutationLoading }] = useActivateItemMutation();
    const isActivatingRef = useRef(false);
    const [conflictModalData, setConflictModalData] = useState<{
        dbId: number;
        itemName: string;
        activeItemName: string;
    } | null>(null);

    const profile = useAppSelector((state) => state.auth.profile);

    const isActivating = isActivatingMutationLoading || isActivatingRef.current;

    const inventory = useMemo<InventoryItem[]>(() => {
        if (!inventoryData?.inventory) return [];
        const rawItems = inventoryData.inventory.map((ui) => {
            const def = ui.itemDefinition;
            let icon = "cube-outline";
            let iconBgColor = "#E3F2FD";
            let iconColor = "#1E88E5";

            if (def.itemType === "XP_MUL" || def.itemType === "GOLD_MUL") {
                icon = "flash-outline";
                iconBgColor = "#FFECC7";
                iconColor = "#FF9F00";
            } else if (def.itemType === "SKIN") {
                if (def.equipmentSlot === "LEADERBOARD_BG" || def.equipmentSlot === "BACKGROUND") {
                    icon = "image-outline";
                    iconBgColor = "#E8F5E9";
                    iconColor = "#2E7D32";
                } else {
                    icon = "shield-outline";
                    iconBgColor = "#FFEBEE";
                    iconColor = "#E53935";
                }
            } else if (def.itemType === "BADGE") {
                icon = "ribbon-outline";
                iconBgColor = "#EDE7F6";
                iconColor = "#5E35B1";
            }

            const isEquipped = def.itemType === "SKIN" &&
                ((def.equipmentSlot === "AVT_FRAME" &&
                    Boolean(profile?.equippedFrameUrl) &&
                    profile?.equippedFrameUrl === def.imgUrl) ||
                ((def.equipmentSlot === "LEADERBOARD_BG" || def.equipmentSlot === "BACKGROUND") &&
                    Boolean(profile?.equippedLeaderboardBgUrl) &&
                    profile?.equippedLeaderboardBgUrl === def.imgUrl));

            const isActivated = Boolean(ui.isActivated) || isEquipped;

            return {
                id: String(def.id),
                dbId: def.id,
                name: def.name,
                description: def.description ?? "",
                quantity: ui.quantity,
                icon,
                iconBgColor,
                iconColor,
                imageUrl: def.shopImgUrl ?? def.imgUrl ?? "",
                itemType: def.itemType,
                equipmentSlot: def.equipmentSlot,
                isEquipped,
                isActivated,
            };
        });

        // Rearrange activated items to put them first
        return rawItems.sort((a, b) => {
            if (a.isActivated && !b.isActivated) return -1;
            if (!a.isActivated && b.isActivated) return 1;
            return a.dbId - b.dbId;
        });
    }, [inventoryData, profile]);

    const filteredInventory = useMemo(() => {
        return inventory.filter((item) => {
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
    }, [inventory, searchQuery, selectedCategory]);

    const selectedItem = useMemo(() => {
        if (filteredInventory.length === 0) return null;
        if (!selectedItemId) return filteredInventory[0];
        return filteredInventory.find((item) => item.id === selectedItemId) || filteredInventory[0];
    }, [filteredInventory, selectedItemId]);

    const handleUseItem = async (id: string, forceReplace: boolean = false) => {
        if (isActivatingRef.current || isActivatingMutationLoading) return;
        const item = inventory.find((it) => it.id === id);
        if (!item) return;

        try {
            isActivatingRef.current = true;
            const res = await activateItem({ itemDefinitionId: item.dbId, forceReplace }).unwrap();
            if (res.conflict) {
                setConflictModalData({
                    dbId: item.dbId,
                    itemName: item.name,
                    activeItemName: res.activeItemName || "hiệu ứng đang dùng",
                });
            } else {
                setConflictModalData(null);
            }
        } catch (err: any) {
            if (err?.data?.conflict || err?.status === 409) {
                setConflictModalData({
                    dbId: item.dbId,
                    itemName: item.name,
                    activeItemName: err?.data?.activeItemName || "hiệu ứng đang dùng",
                });
            } else {
                Alert.alert("Lỗi", err?.data?.error ?? err?.message ?? "Không thể thực hiện hành động này.");
            }
        } finally {
            isActivatingRef.current = false;
        }
    };

    const handleConfirmReplace = async () => {
        if (!conflictModalData || isActivatingRef.current) return;
        const targetDbId = conflictModalData.dbId;
        setConflictModalData(null);
        await handleUseItem(String(targetDbId), true);
    };

    const handleCloseConflictModal = () => {
        setConflictModalData(null);
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
        inventory: filteredInventory,
        rawInventory: inventory,
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
        isRefreshing: isFetchingInventory,
        conflictModalData,
        handleConfirmReplace,
        handleCloseConflictModal,
    };
}
