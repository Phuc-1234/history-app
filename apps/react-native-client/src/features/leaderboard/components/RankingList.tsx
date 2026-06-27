import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { DisplayUser } from "../hooks/useLeaderboard";
import { colors } from "../../../theme/colors";

interface RankingListProps {
    rankingList: DisplayUser[];
    isSmallDevice: boolean;
    showStreak?: boolean;
}

export const RankingList: React.FC<RankingListProps> = ({
    rankingList,
    isSmallDevice,
    showStreak = false,
}) => {
    const styles = createStyles(isSmallDevice);

    return (
        <View style={styles.listContainer}>
            {rankingList.map((item, index) => {
                const hasAvatar = item.avatar && item.avatar.trim() !== "";

                return (
                    <View key={item.id} style={styles.rankRow}>
                        <Text style={styles.rowPosition}>{index + 4}</Text>

                        {hasAvatar ? (
                            <Image
                                source={{ uri: item.avatar }}
                                style={styles.rowAvatar}
                            />
                        ) : (
                            <View style={styles.rowDefaultAvatar}>
                                <Text style={styles.rowDefaultAvatarText}>
                                    {item.name
                                        ? item.name.charAt(0).toUpperCase()
                                        : "?"}
                                </Text>
                            </View>
                        )}

                        <Text style={styles.rowName} numberOfLines={1}>
                            {item.name}
                        </Text>

                        <Text style={styles.rowXp}>
                            {showStreak
                                ? `🔥 ${item.streak} ngày`
                                : `${item.xp.toLocaleString()} XP`}
                        </Text>
                    </View>
                );
            })}
        </View>
    );
};

const createStyles = (isSmallDevice: boolean) =>
    StyleSheet.create({
        listContainer: { marginTop: 34 },
        rankRow: {
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: colors.primary,
            borderRadius: 20,
            paddingHorizontal: 16,
            paddingVertical: 14,
            marginBottom: 14,
        },
        rowPosition: {
            width: 22,
            marginRight: 10,
            fontSize: 15,
            fontWeight: "500",
            color: colors.textLight,
        },
        rowAvatar: {
            width: 40,
            height: 40,
            borderRadius: 20,
            marginRight: 14,
            backgroundColor: colors.surfaceVariant,
        },
        rowDefaultAvatar: {
            width: 40,
            height: 40,
            borderRadius: 20,
            marginRight: 14,
            backgroundColor: colors.primaryContainer,
            justifyContent: "center",
            alignItems: "center",
        },
        rowDefaultAvatarText: {
            color: colors.primary,
            fontSize: 16,
            fontWeight: "700",
        },
        rowName: {
            flex: 1,
            fontSize: isSmallDevice ? 14 : 15,
            color: colors.textLight,
            fontWeight: "500",
            marginRight: 8,
        },
        rowXp: {
            fontSize: isSmallDevice ? 14 : 15,
            color: colors.textLight,
            fontWeight: "700",
        },
    });
