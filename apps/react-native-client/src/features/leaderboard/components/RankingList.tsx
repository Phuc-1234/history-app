import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { DisplayUser } from "../hooks/useLeaderboard";
import { colors } from "../../../theme/colors";

interface RankingListProps {
    rankingList: DisplayUser[];
    isSmallDevice: boolean;
    showStreak?: boolean;
    myUserId?: string | number;
}

export const RankingList: React.FC<RankingListProps> = ({
    rankingList,
    isSmallDevice,
    showStreak = false,
    myUserId,
}) => {
    const styles = createStyles(isSmallDevice);

    return (
        <View style={styles.listContainer}>
            {rankingList.map((item, index) => {
                const hasAvatar = item.avatar && item.avatar.trim() !== "";
                const isMe = String(item.id) === String(myUserId);
                if (String(item.id) === String(myUserId)) {
                    console.log("Dữ liệu của tôi trong rankingList:", item);
                }

                return (
                    <View key={item.id} style={[styles.rankRow, isMe && styles.meRow]}>
                        {/* Hạng */}
                        <Text style={[styles.rowPosition, isMe && styles.meText]}>
                            {index + 4}
                        </Text>

                        {/* Avatar */}
                        {hasAvatar ? (
                            <Image
                                source={{ uri: item.avatar }}
                                style={styles.rowAvatar}
                            />
                        ) : (
                            <View style={[styles.rowDefaultAvatar, isMe && styles.meDefaultAvatar]}>
                                <Text style={[styles.rowDefaultAvatarText, isMe && styles.meText]}>
                                    {item.name ? item.name.charAt(0).toUpperCase() : "?"}
                                </Text>
                            </View>
                        )}

                        {/* Tên */}
                        <Text style={[styles.rowName, isMe && styles.meText]} numberOfLines={1}>
                            {item.name}
                        </Text>

                        {/* XP hoặc Chuỗi */}
                        <Text style={[styles.rowXp, isMe && styles.meText]}>
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
        meRow: { 
            backgroundColor: '#EBE9FE', 
            borderWidth: 2, 
            borderColor: '#5641E8' 
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
        meDefaultAvatar: { backgroundColor: '#D8D4FF' }, // Màu nền avatar nhạt hơn khi là hàng của mình
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
        meText: {
            color: '#5641E8', // Chữ màu tím đậm khi là hàng của mình
            fontWeight: 'bold',
        },
    });