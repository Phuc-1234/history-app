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
    Image,
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
import { AvatarWithFrame } from "../../../components/ui";
import { Ionicons } from "@expo/vector-icons";

export const RankingView: React.FC = () => {
    const router = useRouter();
    const user = useSelector((state: RootState) => state.auth.profile);
    const myUserId = user?.id;
    
    // State quản lý sticky & filter dropdown
    const [isMyRowVisible, setIsMyRowVisible] = useState(true);
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

    // Logic cuộn kiêm kiểm tra vị trí xem row của 'Tôi' có trên màn hình hay không
    const handleScroll = (event: any) => {
        const scrollY = event.nativeEvent.contentOffset.y;
        const layoutHeight = event.nativeEvent.layoutMeasurement.height;

        if (!meInList) {
            setIsMyRowVisible(true);
            return;
        }

        // Ước tính vị trí Y thực tế của người dùng:
        // PodiumSection: paddingTop(10) + marginTop(18) + height(topUsers ~240px) => ~268px.
        // RankingList: marginTop(34).
        // Hàng Card: height 68px + marginBottom 14px = 82px / hàng.
        let meTop = 0;
        let meBottom = 0;

        if (meInList.rank <= 3) {
            meTop = 10;
            meBottom = 260;
        } else {
            const indexInList = meInList.rank - 4;
            meTop = 268 + 34 + indexInList * 82;
            meBottom = meTop + 68;
        }

        // Floater che khoảng 80px ở đáy ScrollView (bottom: 20, height: 68 -> bottomOffset ~90px)
        const visibleTop = scrollY;
        const visibleBottom = scrollY + layoutHeight - 90;

        // Row considered visible only if its main portion is within visible bounds (above the floater)
        const isVisible = meBottom > visibleTop && meTop < visibleBottom;
        setIsMyRowVisible(isVisible);
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
                        <Ionicons name="people" size={16} color={colors.socialFriends} />
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
                        <Ionicons name="eye" size={16} color={colors.socialFollowing} />
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
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                            <Ionicons name="people" size={16} color={colors.socialFriends} />
                            <Ionicons name="eye" size={16} color={colors.socialFollowing} />
                        </View>
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

            {/* Thanh Sticky Bar hiển thị khi hàng của người dùng cuộn khỏi màn hình */}
            {!isMyRowVisible && meInList && (
                <Card
                    style={styles.myRankStickyBar}
                    onPress={() => handleUserPress(String(myUserId))}
                >
                    {meInList.equippedLeaderboardBgUrl && (
                        <>
                            <Image
                                source={{ uri: meInList.equippedLeaderboardBgUrl }}
                                style={StyleSheet.absoluteFill}
                                resizeMode="cover"
                            />
                            <View
                                style={[
                                    StyleSheet.absoluteFill,
                                    { backgroundColor: "rgba(255, 255, 255, 0.72)" },
                                ]}
                            />
                        </>
                    )}
                    {/* Hạng */}
                    <Text style={styles.stickyRankPosition}>
                        {myRank}
                    </Text>

                    {/* Avatar */}
                    <AvatarWithFrame
                        uri={meInList.avatar}
                        frameUri={meInList.equippedFrameUrl}
                        size={40}
                        name={meInList.name}
                        borderWidth={1.5}
                        style={{ marginRight: 14 }}
                    />

                    {/* Tên & Badges */}
                    <View style={styles.stickyNameColumn}>
                        <Text style={styles.stickyRowName} numberOfLines={1}>
                            {meInList.name}
                        </Text>
                        <View style={{ flexDirection: "row", marginTop: 2 }}>
                            <View style={styles.stickyMeTag}>
                                <Text style={styles.stickyMeTagText}>Tôi</Text>
                            </View>
                        </View>
                    </View>

                    {/* XP hoặc Chuỗi */}
                    <Text style={styles.stickyRowXp}>
                        {activeTab === "streak" ? (
                            <>
                                <Ionicons name="flame" size={14} color="#EA580C" />
                                <Text> {meInList.streak ?? 0} ngày</Text>
                            </>
                        ) : (
                            `${(meInList.xp ?? 0).toLocaleString()} XP`
                        )}
                    </Text>
                </Card>
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
    
    // Style cho thanh Sticky Bar (Row format với viền màu brand & shadow)
    myRankStickyBar: {
        position: "absolute",
        bottom: 20,
        left: 22,
        right: 22,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.surface,
        borderWidth: 2,
        borderColor: colors.primary,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        zIndex: 999,
        // Elevation & shadow
        elevation: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 8,
    },
    stickyRankPosition: {
        fontFamily: typography.fonts.bold,
        width: 28,
        marginRight: 8,
        fontSize: 15,
        color: colors.textPrimary,
    },
    stickyNameColumn: {
        flex: 1,
        justifyContent: "center",
        marginRight: 8,
    },
    stickyRowName: {
        fontFamily: typography.fonts.bold,
        fontSize: 15,
        color: "#EA580C",
    },
    stickyMeTag: {
        backgroundColor: "#EA580C",
        paddingHorizontal: 6,
        paddingVertical: 1.5,
        borderRadius: 12,
    },
    stickyMeTagText: {
        fontFamily: typography.fonts.bold,
        fontSize: 10,
        color: "#FFFFFF",
    },
    stickyRowXp: {
        fontFamily: typography.fonts.bold,
        fontSize: 15,
        color: colors.textSecondary,
    },
});