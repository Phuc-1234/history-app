import React from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ActivityIndicator,
    RefreshControl,
} from "react-native";
import { useLeaderboard } from "../hooks/useLeaderboard";
import { PodiumSection } from "./PodiumSection";
import { RankingList } from "./RankingList";
import { colors } from "../../../theme/colors";
import { TopNavBar } from "../../../components/TopNavBar";

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

    return (
        <View style={styles.container}>
            {/* Navigation Tabs Header */}
            <TopNavBar
                tabs={[
                    { key: "xp", label: "XP" },
                    { key: "streak", label: "Chuỗi" },
                ]}
                activeTab={activeTab}
                onChangeTab={(key) => setActiveTab(key as "xp" | "streak")}
                containerStyle={styles.tabContainer}
            />

            {/* Content */}
            {isLoading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={styles.loadingText}>Đang tải bảng xếp hạng...</Text>
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
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                    refreshControl={
                        <RefreshControl
                            refreshing={isLoading}
                            onRefresh={refetch}
                            colors={[colors.primary]}
                            tintColor={colors.primary}
                        />
                    }
                >
                    {/* Podium Sub-view */}
                    {topUsers.length >= 3 && (
                        <PodiumSection
                            topUsers={topUsers}
                            isSmallDevice={isSmallDevice}
                            showStreak={activeTab === "streak"}
                        />
                    )}

                    {/* Remainder Table Rows */}
                    {rankingList.length > 0 && (
                        <RankingList
                            rankingList={rankingList}
                            isSmallDevice={isSmallDevice}
                            showStreak={activeTab === "streak"}
                        />
                    )}

                    {topUsers.length === 0 && rankingList.length === 0 && (
                        <View style={styles.centerContainer}>
                            <Text style={styles.emptyText}>
                                Chưa có dữ liệu xếp hạng
                            </Text>
                        </View>
                    )}
                </ScrollView>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    tabContainer: {
        marginHorizontal: 0,
        marginTop: 0,
    },
    scrollContent: {
        paddingHorizontal: 22,
        paddingTop: 10,
        paddingBottom: 40,
    },
    centerContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingTop: 60,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: colors.textSecondary,
        fontWeight: "500",
    },
    errorText: {
        fontSize: 15,
        color: colors.error,
        fontWeight: "600",
        marginBottom: 16,
    },
    retryButton: {
        backgroundColor: colors.primary,
        paddingHorizontal: 24,
        paddingVertical: 10,
        borderRadius: 5,
    },
    retryButtonText: {
        color: colors.textLight,
        fontSize: 14,
        fontWeight: "700",
    },
    emptyText: {
        fontSize: 15,
        color: colors.textSecondary,
        fontWeight: "500",
    },
});
