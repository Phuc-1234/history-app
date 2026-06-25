import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";

const rankGoldBadge = require("../assets/rank-gold-iii.png");

interface RankHeroProps {
    currentRank: string;
}

export default function RankHero({ currentRank }: RankHeroProps) {
    return (
        <View style={styles.rankHero}>
            <Image
                source={rankGoldBadge}
                style={styles.rankBadgeImage}
                resizeMode="contain"
            />
            <Text style={styles.currentRank}>{currentRank}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    rankHero: { alignItems: "center", gap: 12 },
    rankBadgeImage: { width: 112, height: 112 },
    currentRank: {
        color: "#FF9800",
        fontSize: 16,
        lineHeight: 24,
        fontWeight: "500",
    },
});
