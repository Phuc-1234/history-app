import React, { useState } from "react";
import { ScrollView, StyleSheet, View, Text } from "react-native";
import { useLeaderboard } from "../hooks/useLeaderboard";
import { TopNavBar } from "../../../components/TopNavBar";
import { PodiumSection } from "./PodiumSection";
import { RankingList } from "./RankingList";
import { colors } from "../../../theme/colors";

export const RankingView: React.FC = () => {
    const { rankingList, topUsers, currentUserId, activeTab, setActiveTab } = useLeaderboard();
    const [showSticky, setShowSticky] = useState(false);

    // Tìm dữ liệu của chính mình để hiển thị ở thanh Sticky
    const me = rankingList.find((u) => u.id === currentUserId);

    const handleScroll = (event: any) => {
        // Hiện thanh sticky khi cuộn quá 250px
        setShowSticky(event.nativeEvent.contentOffset.y > 250);
    };

    return (
        <View style={styles.container}>
            <TopNavBar 
                tabs={[{ key: "xp", label: "XP" }, { key: "streak", label: "Chuỗi" }]}
                activeTab={activeTab}
                onChangeTab={(key) => setActiveTab(key as "xp" | "streak")}
            />
            
            <ScrollView 
                onScroll={handleScroll}
                scrollEventThrottle={16}
                contentContainerStyle={styles.scrollContent}
            >
                <PodiumSection topUsers={topUsers || []} isSmallDevice={false} />
                <RankingList 
                    rankingList={rankingList || []} 
                    currentUserId={currentUserId} 
                    showStreak={activeTab === "streak"} 
                />
            </ScrollView>

            {/* Thanh Sticky Footer */}
            {showSticky && me && (
                <View style={styles.stickyContainer}>
                    <Text style={styles.stickyRank}>{rankingList.indexOf(me) + 4}</Text>
                    <Text style={styles.stickyName}>{me.name}</Text>
                    <Text style={styles.stickyXp}>{me.xp} XP</Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { paddingHorizontal: 22, paddingTop: 10, paddingBottom: 100 },
    stickyContainer: {
        position: "absolute", bottom: 0, left: 0, right: 0, 
        flexDirection: "row", alignItems: "center", 
        backgroundColor: colors.primary, paddingHorizontal: 22, 
        paddingVertical: 14, borderTopLeftRadius: 20, borderTopRightRadius: 20,
        elevation: 10, shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1
    },
    stickyRank: { fontSize: 15, color: colors.textLight, width: 22, marginRight: 10 },
    stickyName: { flex: 1, fontSize: 15, color: colors.textLight, fontWeight: "500" },
    stickyXp: { fontSize: 15, color: colors.textLight, fontWeight: "700" }
});