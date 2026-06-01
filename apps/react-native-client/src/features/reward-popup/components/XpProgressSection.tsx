import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface XpProgressSectionProps {
    currentXp: number;
    nextRankXp: number;
    nextRank: string;
}

const text = {
    progressTitle: "\u0054\u0069\u1ebf\u006e\u0020\u0111\u1ed9\u0020\u0068\u0069\u1ec7\u006e\u0020\u0074\u1ea1\u0069",
    remainingPrefix: "\u0043\u00f2\u006e",
    remainingSuffix: "\u0058\u0050\u0020\u0111\u1ec3\u0020\u006c\u00ea\u006e",
};

export default function XpProgressSection({ currentXp, nextRankXp, nextRank }: XpProgressSectionProps) {
    const progress = Math.min(currentXp / nextRankXp, 1);
    const remainingXp = Math.max(nextRankXp - currentXp, 0);

    return (
        <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
                <Text style={styles.sectionTitle}>{text.progressTitle}</Text>
                <Text style={styles.xpText}>{currentXp} / {nextRankXp} XP</Text>
            </View>
            <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${progress * 100}%` as `${number}%` }]} />
            </View>
            <Text style={styles.remainingText}>
                {text.remainingPrefix} {remainingXp} {text.remainingSuffix} {nextRank}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    progressSection: { gap: 8 },
    progressHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
    sectionTitle: { color: "#1D1B18", fontSize: 16, lineHeight: 24, fontWeight: "700" },
    xpText: { color: "#FF9800", fontSize: 16, lineHeight: 24, fontWeight: "500" },
    progressTrack: { height: 12, borderRadius: 999, backgroundColor: "#ECE7E2", overflow: "hidden" },
    progressFill: { height: "100%", borderRadius: 999, backgroundColor: "#FF9800" },
    remainingText: { color: "#474555", fontSize: 16, lineHeight: 24, textAlign: "center", marginTop: 4 },
});
