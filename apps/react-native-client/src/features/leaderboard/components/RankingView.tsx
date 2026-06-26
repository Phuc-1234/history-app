import React, { useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    View,
    ActivityIndicator,
    RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLeaderboard } from "../hooks/useLeaderboard";
import { PodiumSection } from "./PodiumSection";
import { RankingList } from "./RankingList";
import { TopNavBar } from "../../../components/TopNavBar";
import { colors } from "../../../theme/colors";

export const RankingView: React.FC = () => {
    const {
        topUsers,
        rankingList,
        isSmallDevice,
        activeTab,
        setActiveTab,
        isLoading,
        isError,
        refetch,
    } = useLeaderboard();

    const MY_NAME = "Ánh Hồng"; // Tên của bạn
    const [showSticky, setShowSticky] = useState(false);

    // Tính toán thông tin của bạn
    const allUsers = [...topUsers, ...rankingList];
    const myIndex = allUsers.findIndex((u) => u.name === MY_NAME);
    const myUser = myIndex !== -1 ? allUsers[myIndex] : null;

    const handleScroll = (event: any) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        // Hiện thanh Sticky khi cuộn quá 200px
        setShowSticky(offsetY > 200);
    };

    return (
        <SafeAreaView style={styles.container} edges={["left", "right"]}>
            <TopNavBar
                tabs={[
                    { key: "xp", label: "XP" },
                    { key: "streak", label: "Chuỗi" },
                ]}
                activeTab={activeTab}
                onChangeTab={(key) => setActiveTab(key as "xp" | "streak")}
                containerStyle={styles.tabContainer}
            />

            {isLoading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <ScrollView
                    onScroll={handleScroll}
                    scrollEventThrottle={16}
                    contentContainerStyle={styles.scrollContent}
                    refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} colors={[colors.primary]} tintColor={colors.primary} />}
                >
                    {topUsers.length >= 3 && (
                        <PodiumSection topUsers={topUsers} isSmallDevice={isSmallDevice} showStreak={activeTab === "streak"} />
                    )}
                    {rankingList.length > 0 && (
                        <RankingList 
                            rankingList={rankingList} 
                            isSmallDevice={isSmallDevice} 
                            showStreak={activeTab === "streak"} 
                            myName={MY_NAME} 
                        />
                    )}
                </ScrollView>
            )}

            {/* Sticky Footer */}
            {showSticky && myUser && (
                <View style={styles.stickyUserBar}>
                    <Text style={styles.stickyText}>Hạng {myIndex + 1}</Text>
                    <Text style={styles.stickyName}>{myUser.name}</Text>
                    <Text style={styles.stickyXp}>{myUser.xp.toLocaleString()} XP</Text>
                </View>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#F3EFEA" },
    tabContainer: { marginHorizontal: 22, marginTop: 16 },
    scrollContent: { paddingHorizontal: 22, paddingTop: 10, paddingBottom: 120 },
    centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
    stickyUserBar: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        backgroundColor: '#5641E8',
        borderRadius: 16,
        padding: 15,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    stickyText: { color: '#FFF', fontWeight: 'bold' },
    stickyName: { color: '#FFF', fontWeight: '700' },
    stickyXp: { color: '#FFD700', fontWeight: 'bold' },
});