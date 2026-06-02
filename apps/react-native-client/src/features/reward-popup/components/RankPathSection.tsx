import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { RankStep } from "../types/reward";
import RankStepItem from "./RankStepItem";

interface RankPathSectionProps {
    ranks: RankStep[];
}

const text = {
    routeTitle: "\u004c\u1ed9\u0020\u0074\u0072\u00ec\u006e\u0068\u0020\u0074\u0068\u0103\u006e\u0067\u0020\u0068\u1ea1\u006e\u0067",
};

export default function RankPathSection({ ranks }: RankPathSectionProps) {
    return (
        <View style={styles.routeSection}>
            <Text style={styles.sectionTitle}>{text.routeTitle}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.rankRoute}>
                    {ranks.slice(0, 4).map((rank) => (
                        <RankStepItem key={rank.id} rank={rank} />
                    ))}
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    routeSection: { gap: 12 },
    sectionTitle: { color: "#1D1B18", fontSize: 16, lineHeight: 24, fontWeight: "700" },
    rankRoute: { flexDirection: "row", justifyContent: "space-between", minWidth: "100%", paddingVertical: 4 },
});
