import React, { useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ActivityIndicator,
    RefreshControl,
} from "react-native";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { useLeaderboard } from "../hooks/useLeaderboard";
import { TopNavBar } from "../../../components/TopNavBar";
import { PodiumSection } from "./PodiumSection";
import { RankingList } from "./RankingList";
import { colors } from "../../../theme/colors";
import typography from "../../../theme/typography";
import { SlidingTabBar } from "../../../components/SlidingTabBar";

export const RankingView: React.FC = () => {
    const user = useSelector((state: RootState) => state.auth.profile);
    const myUserId = user?.id;
    
    // State để quản lý thanh sticky
    const [showSticky, setShowSticky] = useState(false);

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
   const allUsers = [...(topUsers || []), ...(rankingList || [])];
    const meInList = allUsers.find(u => String(u.id) === String(myUserId));
    const myRank = meInList ? allUsers.indexOf(meInList) + 1 : 0;

    // Logic cuộn để hiện thanh sticky
    const handleScroll = (event: any) => {
        const scrollY = event.nativeEvent.contentOffset.y;
        setShowSticky(scrollY > 100); 
    };
    return (
        <View style={styles.container}>
            <SlidingTabBar
                tabs={[
                    { key: "xp", label: "XP" },
                    { key: "streak", label: "Chuỗi" },
                ]}
                activeTab={activeTab}
                onChangeTab={(key) => setActiveTab(key as "xp" | "streak")}
                containerStyle={styles.tabContainer}
                indicatorColor={colors.primary}
                inactiveColor={colors.primary}
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

            {isLoading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : isError ? (
                <View style={styles.centerContainer}>
                    <Text style={styles.errorText}>Không thể tải dữ liệu</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={refetch}>
                        <Text style={styles.retryButtonText}>Thử lại</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <ScrollView
                    onScroll={handleScroll}
                    scrollEventThrottle={16}
                    showsVerticalScrollIndicator={false}
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
                            myUserId={myUserId}
                        />
                    )}
                </ScrollView>
            )}

           {/* Thanh Sticky Bar */}
            {showSticky && meInList && (
                <View style={styles.myRankStickyBar}>
                    <Text style={styles.rankText}>Hạng {myRank}</Text>
                    <Text style={styles.nameText} numberOfLines={1}>
                        {meInList.name}
                    </Text>
                    <Text style={styles.xpText}>
                        {activeTab === "xp" ? `${meInList.xp ?? 0} XP` : `🔥 ${meInList.streak ?? 0}`}
                    </Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'transparent' },
    tabContainer: { marginHorizontal: 22, marginTop: 10, marginBottom: 10 },
    scrollContent: { paddingHorizontal: 22, paddingTop: 10, paddingBottom: 120 },
    centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
    errorText: { 
        fontFamily: typography.fonts.regular,
        color: colors.error, 
        marginBottom: 16 
    },
    retryButton: { backgroundColor: colors.primary, padding: 10, borderRadius: 5 },
    retryButtonText: { 
        fontFamily: typography.fonts.bold,
        color: 'white' 
    },
    
    // Style cho thanh Sticky
    myRankStickyBar: {
    position: 'absolute',
    bottom: 60,
    left: 20,
    right: 20,
    height: 60,
    backgroundColor: colors.accent,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // Dàn đều hạng và XP sang 2 bên
    paddingHorizontal: 30,           // Tăng padding để nhìn đẹp hơn
    elevation: 10,
    zIndex: 999,                     // Luôn nằm trên cùng
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
},
rankText: { 
    fontFamily: typography.fonts.bold,
    color: '#FFD700', 
    fontSize: 16 
},
xpText: { 
    fontFamily: typography.fonts.bold,
    color: '#FFD700', 
    fontSize: 16 
},
nameText: { 
    fontFamily: typography.fonts.bold,
    color: 'white', 
    fontSize: 16, 
    flex: 1, 
    marginHorizontal: 10 
},
});