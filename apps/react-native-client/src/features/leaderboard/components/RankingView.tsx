import React, { useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ActivityIndicator,
    RefreshControl,
    TouchableWithoutFeedback,
} from "react-native";
import { useSelector } from "react-redux";
import { useRouter } from "expo-router";
import { RootState } from "@/store/store";
import { useLeaderboard } from "../hooks/useLeaderboard";
import { PodiumSection } from "./PodiumSection";
import { RankingList } from "./RankingList";
import { colors } from "../../../theme/colors";
import typography from "../../../theme/typography";
import { SlidingTabBar } from "../../../components/SlidingTabBar";
import { Card } from "../../../components/Card";
import { Ionicons } from "@expo/vector-icons";

export const RankingView: React.FC = () => {
    const router = useRouter();
    const user = useSelector((state: RootState) => state.auth.profile);
    const myUserId = user?.id;
    
    // State quản lý sticky & filter dropdown
    const [showSticky, setShowSticky] = useState(false);
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);

    const {
        topUsers,
        rankingList,
        displayUsers,
        isSmallDevice,
        activeTab,
        setActiveTab,
        filterOption,
        setFilterOption,
        isLoading,
        isFetching,
        isError,
        refetch,
    } = useLeaderboard(myUserId ? String(myUserId) : undefined);

    const meInList = displayUsers.find((u) => String(u.id) === String(myUserId));
    const myRank = meInList ? meInList.rank : 0;

    const isFiltering = filterOption !== "all";

    // Logic cuộn để hiện thanh sticky
    const handleScroll = (event: any) => {
        const scrollY = event.nativeEvent.contentOffset.y;
        setShowSticky(scrollY > 100); 
    };

    const handleUserPress = (targetUserId: string) => {
        if (myUserId && String(targetUserId) === String(myUserId)) {
            return;
        }
        router.push(`/(social)/profile?userId=${targetUserId}` as never);
    };

    return (
        <View style={styles.container}>
            {/* Absolute overlay to dismiss dropdown when tapping outside */}
            {showFilterDropdown && (
                <TouchableWithoutFeedback onPress={() => setShowFilterDropdown(false)}>
                    <View style={styles.overlay} />
                </TouchableWithoutFeedback>
            )}

            {/* Header tab bar + Filter button */}
            <View style={styles.tabFilterRow}>
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
                <TouchableOpacity
                    style={[
                        styles.filterButton,
                        isFiltering && styles.filterButtonActive,
                    ]}
                    onPress={() => setShowFilterDropdown((prev) => !prev)}
                    activeOpacity={0.8}
                >
                    <Ionicons
                        name="filter"
                        size={20}
                        color={isFiltering ? colors.textLight : colors.primary}
                    />
                </TouchableOpacity>
            </View>

            {/* Filter Dropdown Popover */}
            {showFilterDropdown && (
                <Card style={styles.filterDropdownCard}>
                    <TouchableOpacity
                        style={styles.checkboxOption}
                        onPress={() => setFilterOption("all")}
                        activeOpacity={0.8}
                    >
                        <Ionicons
                            name={filterOption === "all" ? "radio-button-on" : "radio-button-off"}
                            size={20}
                            color={colors.primary}
                        />
                        <Text style={styles.checkboxLabel}>Tất cả</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.checkboxOption}
                        onPress={() => setFilterOption("friends")}
                        activeOpacity={0.8}
                    >
                        <Ionicons
                            name={filterOption === "friends" ? "radio-button-on" : "radio-button-off"}
                            size={20}
                            color={colors.primary}
                        />
                        <Text style={styles.checkboxLabel}>Bạn bè</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.checkboxOption}
                        onPress={() => setFilterOption("following")}
                        activeOpacity={0.8}
                    >
                        <Ionicons
                            name={filterOption === "following" ? "radio-button-on" : "radio-button-off"}
                            size={20}
                            color={colors.primary}
                        />
                        <Text style={styles.checkboxLabel}>Đang theo dõi</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.checkboxOption}
                        onPress={() => setFilterOption("both")}
                        activeOpacity={0.8}
                    >
                        <Ionicons
                            name={filterOption === "both" ? "radio-button-on" : "radio-button-off"}
                            size={20}
                            color={colors.primary}
                        />
                        <Text style={styles.checkboxLabel}>Bạn bè & đang theo dõi</Text>
                    </TouchableOpacity>
                </Card>
            )}

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
                    refreshControl={
                        <RefreshControl
                            refreshing={isFetching}
                            onRefresh={refetch}
                            colors={[colors.primary]}
                            tintColor={colors.primary}
                        />
                    }
                >
                    {topUsers.length > 0 ? (
                        <PodiumSection
                            topUsers={topUsers}
                            isSmallDevice={isSmallDevice}
                            showStreak={activeTab === "streak"}
                            onUserPress={handleUserPress}
                            myUserId={myUserId}
                        />
                    ) : (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>Không tìm thấy người dùng phù hợp</Text>
                        </View>
                    )}

                    {rankingList.length > 0 && (
                        <RankingList
                            rankingList={rankingList}
                            isSmallDevice={isSmallDevice}
                            showStreak={activeTab === "streak"}
                            myUserId={myUserId}
                            onUserPress={handleUserPress}
                        />
                    )}
                </ScrollView>
            )}

            {/* Thanh Sticky Bar */}
            {showSticky && meInList && (
                <TouchableOpacity
                    style={styles.myRankStickyBar}
                    onPress={() => handleUserPress(String(myUserId))}
                    activeOpacity={0.9}
                >
                    <Text style={styles.rankText}>Hạng {myRank}</Text>
                    <Text style={styles.nameText} numberOfLines={1}>
                        {meInList.name}
                    </Text>
                    <Text style={styles.xpText}>
                        {activeTab === "xp" ? (
                            `${meInList.xp ?? 0} XP`
                        ) : (
                            <>
                                <Ionicons name="flame" size={16} color="#FFD700" />
                                <Text> {meInList.streak ?? 0}</Text>
                            </>
                        )}
                    </Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "transparent" },
    overlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 50,
        backgroundColor: "transparent",
    },
    tabFilterRow: {
        flexDirection: "row",
        alignItems: "center",
        marginHorizontal: 22,
        marginTop: 10,
        marginBottom: 10,
        gap: 10,
        zIndex: 10,
    },
    tabContainer: {
        flex: 1,
        marginHorizontal: 0,
        marginTop: 0,
        marginBottom: 0,
    },
    filterButton: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: colors.surfaceVariant,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        borderColor: colors.borderMedium,
    },
    filterButtonActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    filterDropdownCard: {
        position: "absolute",
        top: 60,
        right: 22,
        zIndex: 100,
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 12,
        gap: 10,
        borderWidth: 1,
        borderColor: colors.borderMedium,
        minWidth: 160,
    },
    checkboxOption: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        paddingVertical: 6,
        paddingHorizontal: 4,
    },
    checkboxLabel: {
        fontFamily: typography.fonts.medium,
        fontSize: 14,
        color: colors.textPrimary,
    },
    scrollContent: { paddingHorizontal: 22, paddingTop: 10, paddingBottom: 120 },
    centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
    emptyContainer: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 40,
    },
    emptyText: {
        fontFamily: typography.fonts.medium,
        color: colors.textMuted,
        fontSize: 14,
    },
    errorText: {
        fontFamily: typography.fonts.regular,
        color: colors.error,
        marginBottom: 16,
    },
    retryButton: { backgroundColor: colors.primary, padding: 10, borderRadius: 5 },
    retryButtonText: {
        fontFamily: typography.fonts.bold,
        color: "white",
    },
    
    // Style cho thanh Sticky
    myRankStickyBar: {
        position: "absolute",
        bottom: 60,
        left: 20,
        right: 20,
        height: 60,
        backgroundColor: colors.accent,
        borderRadius: 30,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 30,
        zIndex: 999,
    },
    rankText: { 
        fontFamily: typography.fonts.bold,
        color: "#FFD700", 
        fontSize: 16 
    },
    xpText: { 
        fontFamily: typography.fonts.bold,
        color: "#FFD700", 
        fontSize: 16 
    },
    nameText: { 
        fontFamily: typography.fonts.bold,
        color: "white", 
        fontSize: 16, 
        flex: 1, 
        marginHorizontal: 10 
    },
});