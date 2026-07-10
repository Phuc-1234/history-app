import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors } from "../../../theme/colors";

export const RankingList = ({ rankingList, currentUserId, showStreak }: any) => {
    return (
        <View style={styles.listContainer}>
            {rankingList?.map((item: any, index: number) => {
                const isMe = item.id === currentUserId;
                return (
                    <View key={item.id} style={[styles.rankRow, isMe && styles.meRow]}>
                        <Text style={styles.rowPosition}>{index + 4}</Text>
                        <View style={styles.rowAvatar} />
                        <Text style={styles.rowName}>{item.name}</Text>
                        <Text style={styles.rowXp}>{showStreak ? `🔥 ${item.streak}` : `${item.xp} XP`}</Text>
                    </View>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    listContainer: { marginTop: 20 },
    rankRow: { flexDirection: "row", alignItems: "center", backgroundColor: colors.primary, borderRadius: 20, padding: 16, marginBottom: 14 },
    meRow: { borderWidth: 2, borderColor: '#FFD700' }, 
    rowPosition: { fontSize: 15, color: colors.textLight, width: 22 },
    rowAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceVariant, marginHorizontal: 14 },
    rowName: { flex: 1, color: colors.textLight },
    rowXp: { color: colors.textLight, fontWeight: "700" }
});