// features/dashboard/components/TopBarWrapper.tsx
import React from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTopBarData } from "../hooks/useTopBarData";
import { TopBar } from "./TopBar";
import { StreakDrawerModal } from "../../streak";
import { TierDrawerModal } from "../../tier";
import { colors } from "../../../theme/colors";

interface TopBarWrapperProps {
    children: React.ReactNode;
    branchConfig?: {
        hierarchy: string;
        title?: string;
        subtitle?: string;
        onBackPress?: () => void;
        onHomePress?: () => void;
    };
}

export function TopBarWrapper({ children, branchConfig }: TopBarWrapperProps) {
    // Consume unified logic seamlessly from our refactored hook
    const { data, streakManager, tierManager } = useTopBarData();

    return (
        <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
            <TopBar
                data={data}
                branchConfig={branchConfig}
                onOpenStreak={streakManager.openStreakDrawer}
                onOpenTier={tierManager.openTierDrawer}
            />
            <View style={styles.content}>{children}</View>

            {/* Modal presentation values driven strictly via hook managers */}
            <StreakDrawerModal
                visible={streakManager.streakDrawerVisible}
                onClose={streakManager.closeStreakDrawer}
                currentStreak={data.currentStreak}
            />
            <TierDrawerModal
                visible={tierManager.tierDrawerVisible}
                onClose={tierManager.closeTierDrawer}
                totalXp={data.totalXp}
                currentTierIndex={data.currentTierIndex}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: colors.background, // Matches bar color context smoothly
    },
    content: {
        flex: 1,
        backgroundColor: colors.background,
        overflow: "hidden",
    },
});