import React from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ActivityIndicator,
    RefreshControl,
    Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLeaderboard, LeaderboardUser, MyRankCard } from "../hooks/useLeaderboard";
import { PodiumSection } from "./PodiumSection";
import { RankingList } from "./RankingList";

// ── My Rank Card ─────────────────────────────────────────────────────────────
function avatarSource(user: LeaderboardUser) {
    if (user.avatar && user.avatar.trim() !== "") return { uri: user.avatar };
    const initials = encodeURIComponent(user.name || "?");
    return {
        uri: `https://ui-avatars.com/api/?name=${initials}&background=4E3FE0&color=fff&bold=true`,
    };
}

interface MyRankCardViewProps {
    card: MyRankCard;
    isSmallDevice: boolean;
}

const MyRankCardView: React.FC<MyRankCardViewProps> = ({ card, isSmallDevice }) => (
    <View style={myCardStyles.wrapper}>
        <Text style={myCardStyles.label}>📍 Hạng của bạn</Text>
        <View style={myCardStyles.row}>
            <Text style={myCardStyles.position}>#{card.position}</Text>
            <Image source={avatarSource(card.user)} style={myCardStyles.avatar} />
            <Text style={myCardStyles.name} numberOfLines={1}>
                {card.user.name}
            </Text>
            <Text style={myCardStyles.xp}>
                {card.user.xp.toLocaleString()} XP
            </Text>
        </View>
    </View>
);

const myCardStyles = StyleSheet.create({
    wrapper: {
        marginTop: 24,
        backgroundColor: "#DCD8F6",
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderWidth: 1,
        borderColor: "#B8ADEE",
        shadowColor: "#7F6BFF",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.14,
        shadowRadius: 8,
        elevation: 3,
    },
    label: {
        fontSize: 12,
        fontWeight: "600",
        color: "#4E3FE0",
        marginBottom: 8,
        letterSpacing: 0.3,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
    },
    position: {
        width: 32,
        fontSize: 15,
        fontWeight: "700",
        color: "#4E3FE0",
        marginRight: 10,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
        backgroundColor: "#C7C0F0",
    },
    name: {
        flex: 1,
        fontSize: 15,
        fontWeight: "700",
        color: "#4E3FE0",
        marginRight: 8,
    },
    xp: {
        fontSize: 15,
        fontWeight: "700",
        color: "#4E3FE0",
    },
});

// ── Main RankingView ──────────────────────────────────────────────────────────
export const RankingView: React.FC = () => {
    const {
        topUsers,
        rankingList,
        myRankCard,
        isSmallDevice,
        isLoading,
        error,
        refetch,
    } = useLeaderboard();

    if (isLoading && rankingList.length === 0) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#4E3FE0" />
                </View>
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.center}>
                    <Text style={styles.errorText}>Không thể tải bảng xếp hạng.</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={refetch}>
                        <Text style={styles.retryText}>Thử lại</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={["left", "right"]}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={isLoading}
                        onRefresh={refetch}
                        colors={["#4E3FE0"]}
                        tintColor="#4E3FE0"
                    />
                }
            >
                {/* Tab Header */}
                <View style={styles.tabContainer}>
                    <TouchableOpacity style={[styles.tabButton, styles.activeTabButton]}>
                        <Text style={styles.activeTabText}>Hạng</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.tabButton}>
                        <Text style={styles.inactiveTabText}>Chuỗi</Text>
                    </TouchableOpacity>
                </View>

                {/* Podium – top 3 */}
                <PodiumSection topUsers={topUsers} isSmallDevice={isSmallDevice} />

                {/* "Hạng của bạn" – shown only when user is outside the top entries */}
                {myRankCard && (
                    <MyRankCardView card={myRankCard} isSmallDevice={isSmallDevice} />
                )}

                {/* Rank 4+ list */}
                <RankingList rankingList={rankingList} isSmallDevice={isSmallDevice} />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#F3EFEA" },
    center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
    errorText: { fontSize: 15, color: "#C53030", marginBottom: 16, fontWeight: "500" },
    retryButton: {
        backgroundColor: "#4E3FE0",
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    retryText: { color: "#FFFFFF", fontWeight: "600", fontSize: 14 },
    scrollContent: { paddingHorizontal: 22, paddingTop: 26, paddingBottom: 40 },
    tabContainer: {
        backgroundColor: "#E2DDD7",
        borderRadius: 12,
        padding: 4,
        flexDirection: "row",
    },
    tabButton: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 11,
        borderRadius: 10,
    },
    activeTabButton: {
        backgroundColor: "#F5F2EF",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
        elevation: 1,
    },
    activeTabText: { fontSize: 15, fontWeight: "600", color: "#4E3FE0" },
    inactiveTabText: { fontSize: 15, fontWeight: "500", color: "#4E4A58" },
});
