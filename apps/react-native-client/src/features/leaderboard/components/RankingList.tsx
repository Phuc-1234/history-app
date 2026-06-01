import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { User } from "../hooks/useLeaderboard";

interface RankingListProps {
    rankingList: User[];
    isSmallDevice: boolean;
}

export const RankingList: React.FC<RankingListProps> = ({
    rankingList,
    isSmallDevice,
}) => {
    const styles = createStyles(isSmallDevice);

    return (
        <View style={styles.listContainer}>
            {rankingList.map((item, index) => {
                const isMe = item.name === "Bạn";
                const hasAvatar = item.avatar && item.avatar.trim() !== "";

                return (
                    <View
                        key={item.id}
                        style={[styles.rankRow, isMe && styles.meRow]}
                    >
                        <Text
                            style={[styles.rowPosition, isMe && styles.meText]}
                        >
                            {index + 4}
                        </Text>

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

                        <Text
                            style={[styles.rowName, isMe && styles.meText]}
                            numberOfLines={1}
                        >
                            {item.name}
                        </Text>

                        <Text style={[styles.rowXp, isMe && styles.meText]}>
                            {item.xp.toLocaleString()} XP
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
            backgroundColor: "#F7F7F7",
            borderRadius: 14,
            paddingHorizontal: 16,
            paddingVertical: 14,
            marginBottom: 14,
        },
        meRow: {
            backgroundColor: "#DCD8F6",
            borderWidth: 1,
            borderColor: "#B8ADEE",
            shadowColor: "#7F6BFF",
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.12,
            shadowRadius: 8,
            elevation: 2,
        },
        rowPosition: {
            width: 22,
            marginRight: 10,
            fontSize: 15,
            fontWeight: "500",
            color: "#4A4A58",
        },
        rowAvatar: {
            width: 40,
            height: 40,
            borderRadius: 20,
            marginRight: 14,
            backgroundColor: "#DDD",
        },
        rowDefaultAvatar: {
            width: 40,
            height: 40,
            borderRadius: 20,
            marginRight: 14,
            backgroundColor: "#7D56C8",
            justifyContent: "center",
            alignItems: "center",
        },
        rowDefaultAvatarText: {
            color: "#FFFFFF",
            fontSize: 16,
            fontWeight: "700",
        },
        rowName: {
            flex: 1,
            fontSize: isSmallDevice ? 14 : 15,
            color: "#222222",
            fontWeight: "500",
            marginRight: 8,
        },
        rowXp: {
            fontSize: isSmallDevice ? 14 : 15,
            color: "#4E3FE0",
            fontWeight: "700",
        },
        meText: { color: "#4E3FE0", fontWeight: "700" },
    });
