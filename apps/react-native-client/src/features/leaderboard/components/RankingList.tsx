import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { DisplayUser } from "../hooks/useLeaderboard";
import { colors } from "../../../theme/colors";

interface RankingListProps {
    rankingList: DisplayUser[];
    isSmallDevice: boolean;
    showStreak?: boolean;
    myName: string; // Truyền tên bạn vào
}

export const RankingList: React.FC<RankingListProps> = ({ rankingList, isSmallDevice, showStreak, myName }) => {
    const styles = createStyles(isSmallDevice);
    return (
        <View style={styles.listContainer}>
            {rankingList.map((item, index) => {
                const isMe = item.name === myName;
                return (
                    <View key={item.id} style={[styles.rankRow, isMe && styles.meRow]}>
                        <Text style={[styles.rowPosition, isMe && styles.meText]}>{index + 4}</Text>
                        <Image source={{ uri: item.avatar || "https://i.pravatar.cc/100" }} style={styles.rowAvatar} />
                        <Text style={[styles.rowName, isMe && styles.meText]} numberOfLines={1}>{item.name}</Text>
                        <Text style={[styles.rowXp, isMe && styles.meText]}>
                            {showStreak ? `🔥 ${item.streak || 0}` : `${item.xp.toLocaleString()} XP`}
                        </Text>
                    </View>
                );
            })}
        </View>
    );
};

const createStyles = (isSmallDevice: boolean) => StyleSheet.create({
    listContainer: { marginTop: 10 },
    rankRow: { flexDirection: "row", alignItems: "center", backgroundColor: colors.primary, borderRadius: 20, padding: 16, marginBottom: 14 },
    meRow: { backgroundColor: '#EBE9FE', borderWidth: 1.5, borderColor: '#5641E8' }, // Nổi bật
    meText: { color: '#5641E8', fontWeight: 'bold' },
    rowPosition: { width: 22, marginRight: 10, fontSize: 15, fontWeight: "500", color: colors.textLight },
    rowAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 14, backgroundColor: colors.surfaceVariant },
    rowName: { flex: 1, fontSize: 15, color: colors.textLight, fontWeight: "500" },
    rowXp: { fontSize: 15, color: colors.textLight, fontWeight: "700" },
});