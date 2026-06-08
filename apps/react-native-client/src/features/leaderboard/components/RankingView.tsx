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
import { SafeAreaView } from "react-native-safe-area-context";
import { useLeaderboard } from "../hooks/useLeaderboard";
import { PodiumSection } from "./PodiumSection";
import { RankingList } from "./RankingList";

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
        <SafeAreaView style={styles.container} edges={["left", "right"]}>
            {/* Navigation Tabs Header */}
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[
                        styles.tabButton,
                        activeTab === "xp" && styles.activeTabButton,
                    ]}
                    onPress={() => setActiveTab("xp")}
                >
                    <Text
                        style={
                            activeTab === "xp"
                                ? styles.activeTabText
                                : styles.inactiveTabText
                        }
                    >
                        Hạng
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        styles.tabButton,
                        activeTab === "streak" && styles.activeTabButton,
                    ]}
                    onPress={() => setActiveTab("streak")}
                >
                    <Text
                        style={
                            activeTab === "streak"
                                ? styles.activeTabText
                                : styles.inactiveTabText
                        }
                    >
                        Chuỗi
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Content */}
            {isLoading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#4E3FE0" />
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
                            colors={["#4E3FE0"]}
                            tintColor="#4E3FE0"
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
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F3EFEA",
    },
    tabContainer: {
        backgroundColor: "#E2DDD7",
        borderRadius: 12,
        padding: 4,
        flexDirection: "row",
        marginHorizontal: 22,
        marginTop: 16,
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
    activeTabText: {
        fontSize: 15,
        fontWeight: "600",
        color: "#4E3FE0",
    },
    inactiveTabText: {
        fontSize: 15,
        fontWeight: "500",
        color: "#4E4A58",
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
        color: "#4E4A58",
        fontWeight: "500",
    },
    errorText: {
        fontSize: 15,
        color: "#E74C3C",
        fontWeight: "600",
        marginBottom: 16,
    },
    retryButton: {
        backgroundColor: "#4E3FE0",
        paddingHorizontal: 24,
        paddingVertical: 10,
        borderRadius: 20,
    },
    retryButtonText: {
        color: "#FFFFFF",
        fontSize: 14,
        fontWeight: "700",
    },
    emptyText: {
        fontSize: 15,
        color: "#4E4A58",
        fontWeight: "500",
    },
});
