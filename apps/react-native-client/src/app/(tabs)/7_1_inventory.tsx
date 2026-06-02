import React from "react";
import { TopBarWrapper } from "../../features/top_bar";
import { InventoryView } from "../../features/inventory";

export default function InventoryScreen() {
    return (
        <TopBarWrapper>
            <InventoryView />
        </TopBarWrapper>
    );
}
