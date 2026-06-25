import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";

import { RankStep } from "../types/reward";

const lockIcon = require("../assets/lock-icon.png");
const medalIcon = require("../assets/medal-icon.png");

interface RankStepItemProps {
    rank: RankStep;
}

export default function RankStepItem({ rank }: RankStepItemProps) {
    const isCurrent = rank.status === "current";
    const isPassed = rank.status === "passed";
    const isUpcoming = rank.status === "upcoming";

    return (
        <View style={styles.rankStep}>
            <View
                style={[
                    styles.rankStepIcon,
                    isCurrent && styles.rankStepIconCurrent,
                ]}
            >
                {isUpcoming ? (
                    <Image
                        source={lockIcon}
                        style={styles.lockIcon}
                        resizeMode="contain"
                    />
                ) : isCurrent ? (
                    <View style={styles.currentMedalCircle}>
                        <Text style={styles.currentMedalStar}>{"\u2605"}</Text>
                    </View>
                ) : (
                    <Image
                        source={medalIcon}
                        style={styles.medalIcon}
                        resizeMode="contain"
                    />
                )}
                {isPassed && (
                    <View style={styles.doneBadge}>
                        <Text style={styles.doneText}>{"\u2713"}</Text>
                    </View>
                )}
            </View>
            <Text
                style={[
                    styles.rankStepLabel,
                    isCurrent && styles.rankStepLabelCurrent,
                ]}
            >
                {rank.label}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    rankStep: { width: 80, alignItems: "center", gap: 8 },
    rankStepIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: "#F2EDE7",
        alignItems: "center",
        justifyContent: "center",
    },
    rankStepIconCurrent: {
        width: 64,
        height: 64,
        borderRadius: 32,
        borderWidth: 2,
        borderColor: "#FF9800",
        backgroundColor: "#FFDCC0",
    },
    medalIcon: { width: 18, height: 18, tintColor: "#A8A2B3" },
    currentMedalCircle: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: "#FF9800",
        alignItems: "center",
        justifyContent: "center",
    },
    currentMedalStar: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
    lockIcon: { width: 18, height: 18, tintColor: "#474555" },
    doneBadge: {
        position: "absolute",
        right: -1,
        bottom: -1,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: "#67D391",
        alignItems: "center",
        justifyContent: "center",
    },
    doneText: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
    rankStepLabel: { color: "#77727F", fontSize: 12, lineHeight: 16 },
    rankStepLabelCurrent: { color: "#FF9800", fontSize: 16, lineHeight: 24 },
});
