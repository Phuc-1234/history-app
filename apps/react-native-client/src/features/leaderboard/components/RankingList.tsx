import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { DisplayUser } from "../hooks/useLeaderboard";
import { colors } from "../../../theme/colors";
import typography from "../../../theme/typography";
import { Card } from "../../../components/Card";
import { AvatarWithFrame } from "../../../components/ui";

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
                const isMe = String(item.id) === String(myUserId);
                if (String(item.id) === String(myUserId)) {
                    console.log("Dữ liệu của tôi trong rankingList:", item);
                }

                return (
                    <Card key={item.id} style={[styles.rankRow, isMe && styles.meRow]}>
                        {/* Hạng */}
                        <Text style={[styles.rowPosition, isMe && styles.meText]}>
                            {index + 4}
                        </Text>

                        {/* Avatar */}
                        <AvatarWithFrame
                            uri={item.avatar}
                            frameUri={item.equippedFrameUrl}
                            size={40}
                            name={item.name}
                            borderWidth={1.5}
                            style={{ marginRight: 14 }}
                        />

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
                    </Card>
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
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.borderMedium,
            paddingHorizontal: 16,
            paddingVertical: 14,
            marginBottom: 14,
        },
        meRow: { 
            backgroundColor: colors.primaryContainer, 
            borderWidth: 1.5, 
            borderColor: colors.accent,
        },
        rowPosition: {
            fontFamily: typography.fonts.bold,
            width: 22,
            marginRight: 10,
            fontSize: 15,
            color: colors.textPrimary,
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
        meDefaultAvatar: { backgroundColor: colors.borderMedium },
        rowDefaultAvatarText: {
            fontFamily: typography.fonts.bold,
            color: colors.primary,
            fontSize: 16,
        },
        rowName: {
            fontFamily: typography.fonts.medium,
            flex: 1,
            fontSize: isSmallDevice ? 14 : 15,
            color: colors.textPrimary,
            marginRight: 8,
        },
        rowXp: {
            fontFamily: typography.fonts.bold,
            fontSize: isSmallDevice ? 14 : 15,
            color: colors.textSecondary,
        },
        meText: {
            color: colors.accent,
        },
    });