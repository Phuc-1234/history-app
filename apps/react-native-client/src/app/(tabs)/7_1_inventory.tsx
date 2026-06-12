import React from "react";
import { ScreenWrapper } from "../../components/layout/ScreenWrapper";
import { InventoryView } from "../../features/inventory";

export default function InventoryScreen() {
    return (
        <ScreenWrapper style={{ backgroundColor: "#FAF8F5" }}>
            <InventoryView />
        </ScreenWrapper>
    );
}
