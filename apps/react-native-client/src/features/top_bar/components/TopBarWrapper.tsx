import React from "react";
import { StyleSheet, View, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTopBarData } from "../hooks/useTopBarData";
import { TopBar } from "./TopBar";
import { useState } from "react";
import StreakCelebrationModal from "../../../components/StreakCelebrationModal";
import StreakModal from "../../../components/StreakModal";
import RewardModal from "../../../components/RewardModal";

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

    const [celebrationVisible, setCelebrationVisible] = useState(false);
    const [streakVisible, setStreakVisible] = useState(false);
    const [rewardVisible, setRewardVisible] = useState(false);

    const openStreak = () => {
        setCelebrationVisible(true);
    };

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
                onClose={() => setCelebrationVisible(false)}
                currentStreak={data?.currentStreak ?? 7}
                onNext={() => {
                    setCelebrationVisible(false);
                    setStreakVisible(true);
                }}
            />

            <StreakModal
                visible={streakVisible}
                onClose={() => setStreakVisible(false)}
                currentStreak={data?.currentStreak ?? 7}
                onClaimCoin={() => {
                    setStreakVisible(false);
                    setRewardVisible(true);
                }}
            />

            <RewardModal
                visible={rewardVisible}
                onClose={() => setRewardVisible(false)}
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
