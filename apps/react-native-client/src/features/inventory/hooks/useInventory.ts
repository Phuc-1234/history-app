import { useState, useMemo } from "react";
import { useGetUserInventoryQuery } from "../services/itemApi";

export interface InventoryItem {
    id: string;
    name: string;
    description: string;
    quantity: number;
    icon: string;
    iconBgColor: string;
    iconColor: string;
    imageUrl: string;
}

export function useInventory() {
    const { data: inventoryData, isLoading } = useGetUserInventoryQuery();
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

    const inventory = useMemo<InventoryItem[]>(() => {
        if (!inventoryData?.inventory) return [];
        return inventoryData.inventory.map((ui) => {
            const def = ui.itemDefinition;
            let icon = "📦";
            let iconBgColor = "#E3F2FD";
            let iconColor = "#1E88E5";

            if (def.type === "BOOST") {
                icon = "⚡";
                iconBgColor = "#FFECC7";
                iconColor = "#FF9F00";
            } else if (def.type === "SKIN") {
                icon = "🛡️";
                iconBgColor = "#FFEBEE";
                iconColor = "#E53935";
            } else if (def.isConsumable) {
                icon = "🧪";
                iconBgColor = "#EDE7F6";
                iconColor = "#5E35B1";
            }

            return {
                id: String(def.id),
                name: def.name,
                description: def.description ?? "",
                quantity: ui.quantity,
                icon,
                iconBgColor,
                iconColor,
                imageUrl: def.imgUrl ?? "https://picsum.photos/id/1021/200/200",
            };
        });
    }, [inventoryData]);

    const selectedItem = useMemo(() => {
        if (inventory.length === 0) return null;
        if (!selectedItemId) return inventory[0];
        return inventory.find((item) => item.id === selectedItemId) || inventory[0];
    }, [inventory, selectedItemId]);

    const handleUseItem = (id: string) => {
        // No-op for now as item usage is not included in the goal
        alert("Sử dụng vật phẩm sẽ sớm ra mắt!");
    };

    return {
        inventory,
        selectedItem,
        setSelectedItemId,
        handleUseItem,
        isLoading,
    };
}
