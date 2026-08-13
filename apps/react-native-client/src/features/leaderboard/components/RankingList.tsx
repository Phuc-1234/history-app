import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { DisplayUser } from "../hooks/useLeaderboard";
import { colors } from "../../../theme/colors";
import typography from "../../../theme/typography";
import { Card } from "../../../components/Card";
import { AvatarWithFrame } from "../../../components/ui";
import { Ionicons } from "@expo/vector-icons";
import { Flame } from "lucide-react-native";
import { UserSocialBadges } from "./UserSocialBadges";

interface RankingListProps {
    rankingList: DisplayUser[];
    isSmallDevice: boolean;
    showStreak?: boolean;
    myUserId?: string | number;
    onUserPress?: (userId: string) => void;
}

export const RankingList: React.FC<RankingListProps> = ({
    rankingList,
    isSmallDevice,
    showStreak = false,
    myUserId,
    onUserPress,
}) => {
    const styles = createStyles(isSmallDevice);

    return (
        <View style={styles.listContainer}>
            {rankingList.map((item, index) => {
                const isMe = String(item.id) === String(myUserId);

                return (
                    <Card
                        key={item.id}
                        style={[styles.rankRow, isMe && styles.meRow]}
                        onPress={() => onUserPress?.(item.id)}
                    >
                        {/* Hạng */}
                        <Text style={styles.rowPosition}>
                            {item.rank || index + 4}
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

                        {/* Tên & Badges */}
                        <View style={styles.nameColumn}>
                            <Text style={[styles.rowName, isMe && styles.meName]} numberOfLines={1}>
                                {item.name}
                            </Text>
                            {isMe && (
                                <View style={{ flexDirection: "row", marginTop: 2 }}>
                                    <View style={styles.meTag}>
                                        <Text style={styles.meTagText}>Tôi</Text>
                                    </View>
                                </View>
                            )}
                            <UserSocialBadges
                                isFriend={item.isFriend}
                                isFollowing={item.isFollowing}
                            />
                        </View>

                        {/* XP hoặc Chuỗi */}
                        <Text style={styles.rowXp}>
                            {showStreak ? (
                                <>
                                    <Flame size={14} color={item.hasCompletedToday ? "#FF4500" : "#98A2B3"} />
                                    <Text> {item.streak} ngày</Text>
                                </>
                            ) : (
                                `${item.xp.toLocaleString()} XP`
                            )}
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
            borderWidth: 2, 
            borderColor: colors.primary,
        },
        rowPosition: {
            fontFamily: typography.fonts.bold,
            width: 28,
            marginRight: 8,
            fontSize: 15,
            color: colors.textPrimary,
        },
        nameColumn: {
            flex: 1,
            justifyContent: "center",
            marginRight: 8,
        },
        rowName: {
            fontFamily: typography.fonts.medium,
            fontSize: isSmallDevice ? 14 : 15,
            color: colors.textPrimary,
        },
        rowXp: {
            fontFamily: typography.fonts.bold,
            fontSize: isSmallDevice ? 14 : 15,
            color: colors.textSecondary,
        },
        meText: {
            color: colors.accent,
        },
        meName: {
            color: "#EA580C",
            fontFamily: typography.fonts.bold,
        },
        meTag: {
            backgroundColor: "#EA580C",
            paddingHorizontal: 6,
            paddingVertical: 1.5,
            borderRadius: 12,
        },
        meTagText: {
            fontFamily: typography.fonts.bold,
            fontSize: 10,
            color: "#FFFFFF",
        },
    });