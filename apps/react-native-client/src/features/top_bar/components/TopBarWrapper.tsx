// features/dashboard/components/TopBarWrapper.tsx
import React from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTopBarData } from "../hooks/useTopBarData";
import { TopBar } from "./TopBar";
import {
    StreakCelebrationModal,
    StreakModal,
    RewardModal,
} from "../../streak";
import { colors } from "../../../theme/colors";

interface TopBarWrapperProps {
    children: React.ReactNode;
    branchConfig?: {
        hierarchy: string;
        title?: string;
        subtitle?: string;
        onBackPress?: () => void;
    };
}

export function TopBarWrapper({ children, branchConfig }: TopBarWrapperProps) {
    // Consume unified logic seamlessly from our refactored hook
    const { data, streakManager } = useTopBarData();

    return (
        <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
            <TopBar
                data={data}
                branchConfig={branchConfig}
                onOpenStreak={streakManager.openStreak}
            />
            <View style={styles.content}>{children}</View>

            {/* Modal presentation values driven strictly via hook managers */}
            <StreakCelebrationModal
                visible={streakManager.celebrationVisible}
                onClose={streakManager.closeCelebration}
                currentStreak={data.currentStreak}
                onNext={streakManager.proceedToStreakModal}
            />

            <StreakModal
                visible={streakManager.streakVisible}
                onClose={streakManager.closeStreakModal}
                currentStreak={data.currentStreak}
                rewards={streakManager.rewards}
                milestones={streakManager.milestones}
                onClaimReward={streakManager.handleClaimReward}
            />

            <RewardModal
                visible={streakManager.rewardVisible}
                onClose={streakManager.closeRewardModal}
                goldAmount={50}
                badgeName="Huy hiệu Chăm Chỉ"
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