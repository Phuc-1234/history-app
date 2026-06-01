import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { RankReward } from "../types/reward";
import RewardItem from "./RewardItem";

interface RewardListSectionProps {
    currentRank: string;
    rewards: RankReward[];
}

const text = {
    rewardTitle: "\u0050\u0068\u1ea7\u006e\u0020\u0074\u0068\u01b0\u1edf\u006e\u0067",
};

export default function RewardListSection({ currentRank, rewards }: RewardListSectionProps) {
    return (
        <View style={styles.rewardSection}>
            <Text style={styles.sectionTitle}>
                {text.rewardTitle} <Text style={styles.rankName}>{currentRank}</Text>
            </Text>
            <View style={styles.rewardList}>
                {rewards.map((reward) => (
                    <RewardItem key={reward.id} reward={reward} />
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    rewardSection: { gap: 14 },
    sectionTitle: { color: "#1D1B18", fontSize: 16, lineHeight: 24, fontWeight: "700" },
    rankName: { fontWeight: "700" },
    rewardList: { gap: 14 },
});
