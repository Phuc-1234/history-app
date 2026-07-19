import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { ScreenWrapper } from "../../components/layout/ScreenWrapper";
import { SlidingTabBar } from "../../components/SlidingTabBar";
import { ShopView } from "../../features/shop";
import { InventoryView } from "../../features/inventory";
import colors from "../../theme/colors";

export default function ItemScreen() {
    const [activeTab, setActiveTab] = useState("shop");

    const tabs = [
        { key: "shop", label: "Cửa hàng" },
        { key: "inventory", label: "Túi đồ" },
    ];

    return (
        <ScreenWrapper style={styles.wrapper}>
            <View style={styles.tabBarContainer}>
                <SlidingTabBar
                    tabs={tabs}
                    activeTab={activeTab}
                    onChangeTab={setActiveTab}
                />
            </View>
            <View style={styles.contentContainer}>
                {activeTab === "shop" ? <ShopView /> : <InventoryView />}
            </View>
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        flex: 1,
        backgroundColor: colors.background,
    },
    tabBarContainer: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 8,
        backgroundColor: colors.background,
    },
    contentContainer: {
        flex: 1,
    },
});
