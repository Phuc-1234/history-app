import React from "react";
import { StyleSheet, View, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTopBarData } from "../hooks/useTopBarData";
import { TopBar } from "./TopBar";
import {
    useStreak,
    StreakCelebrationModal,
    StreakModal,
    RewardModal,
} from "../../streak";

interface TopBarWrapperProps {
    children: React.ReactNode;
    branchConfig?: {
        hierarchy: string;
        title: string;
        subtitle?: string;
        onBackPress?: () => void;
    };
}

export function TopBarWrapper({ children, branchConfig }: TopBarWrapperProps) {
    const { data, loading } = useTopBarData();

    const {
        celebrationVisible,
        streakVisible,
        rewardVisible,
        rewards,
        milestones,
        openStreak,
        closeCelebration,
        proceedToStreakModal,
        handleClaimReward,
        closeStreakModal,
        closeRewardModal,
    } = useStreak(data?.currentStreak ?? 7);

    if (loading) {
        return (
            <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color="#5856D6" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
            <TopBar
                data={data}
                branchConfig={branchConfig}
                onOpenStreak={openStreak}
            />
            <View style={styles.content}>{children}</View>

            <StreakCelebrationModal
                visible={celebrationVisible}
                onClose={closeCelebration}
                currentStreak={data?.currentStreak ?? 7}
                onNext={proceedToStreakModal}
            />

            <StreakModal
                visible={streakVisible}
                onClose={closeStreakModal}
                currentStreak={data?.currentStreak ?? 7}
                rewards={rewards}
                milestones={milestones}
                onClaimReward={handleClaimReward}
            />

            <RewardModal
                visible={rewardVisible}
                onClose={closeRewardModal}
                goldAmount={50}
                badgeName="Huy hiệu Chăm Chỉ"
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#5856D6", // Background colors align with the Top Bar to prevent flash gaps
    },
    content: {
        flex: 1,
        backgroundColor: "#FFF", // Restores screen background to normal under header
    },
    loaderContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#FFF",
    },
});
