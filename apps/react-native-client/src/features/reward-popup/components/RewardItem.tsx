import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { RankReward } from "../types/reward";

const avatarFrameIcon = require("../assets/avatar-frame-icon.png");
const medalIcon = require("../assets/medal-icon.png");

interface RewardItemProps {
    reward: RankReward;
}

const text = {
    claimed: "\u0110\u00e3\u0020\u006e\u0068\u1ead\u006e",
    locked: "\u004b\u0068\u00f3\u0061",
    claim: "\u004e\u0068\u1ead\u006e",
};

export default function RewardItem({ reward }: RewardItemProps) {
    const isClaimed = reward.status === "claimed";
    const isLocked = reward.status === "locked";

    return (
        <View style={styles.rewardCard}>
            <View
                style={[
                    styles.rewardIcon,
                    reward.icon === "badge" && styles.rewardIconBadge,
                    isLocked && styles.rewardIconLocked,
                ]}
            >
                {reward.icon === "frame" ? (
                    <Image
                        source={avatarFrameIcon}
                        style={styles.avatarFrameIcon}
                        resizeMode="contain"
                    />
                ) : reward.icon === "badge" ? (
                    <Image
                        source={medalIcon}
                        style={styles.rewardMedalIcon}
                        resizeMode="contain"
                    />
                ) : (
                    <Text style={styles.rewardIconText}>$</Text>
                )}
            </View>
            <View style={styles.rewardInfo}>
                <Text style={styles.rewardTitle} numberOfLines={2}>
                    {reward.title}
                </Text>
                <Text style={styles.rewardDescription} numberOfLines={2}>
                    {reward.description}
                </Text>
            </View>
            <Pressable
                disabled={isClaimed || isLocked}
                style={[
                    styles.rewardButton,
                    isClaimed && styles.rewardButtonClaimed,
                    isLocked && styles.rewardButtonLocked,
                ]}
            >
                <Text
                    style={[
                        styles.rewardButtonText,
                        (isClaimed || isLocked) && styles.rewardButtonTextMuted,
                    ]}
                >
                    {isClaimed
                        ? text.claimed
                        : isLocked
                          ? text.locked
                          : text.claim}
                </Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    rewardCard: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 16,
        paddingHorizontal: 16,
        minHeight: 92,
        backgroundColor: "#FFFFFF",
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "#E5E1EC",
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 2,
    },
    rewardIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#FFE9D6",
    },
    rewardIconBadge: { backgroundColor: "#EAE6FF" },
    rewardIconLocked: { backgroundColor: "#ECE7E2" },
    rewardIconText: { color: "#9A4F00", fontSize: 20, fontWeight: "700" },
    rewardMedalIcon: { width: 20, height: 20, tintColor: "#6D5DF6" },
    avatarFrameIcon: { width: 20, height: 20, tintColor: "#5947E8" },
    rewardInfo: { flex: 1, minWidth: 0, paddingRight: 2 },
    rewardTitle: {
        color: "#1D1B18",
        fontSize: 16,
        lineHeight: 21,
        fontWeight: "700",
    },
    rewardDescription: {
        color: "#474555",
        fontSize: 14,
        lineHeight: 19,
        marginTop: 2,
    },
    rewardButton: {
        minWidth: 74,
        minHeight: 36,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: "#FF9A44",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
    },
    rewardButtonClaimed: { backgroundColor: "#E8E2DC" },
    rewardButtonLocked: { backgroundColor: "#F2EDE7" },
    rewardButtonText: {
        color: "#FFFFFF",
        fontSize: 14,
        lineHeight: 18,
        fontWeight: "700",
        textAlign: "center",
    },
    rewardButtonTextMuted: { color: "#474555" },
});
