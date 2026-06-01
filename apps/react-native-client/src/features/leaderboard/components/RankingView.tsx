import React from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLeaderboard } from "../hooks/useLeaderboard";
import { PodiumSection } from "./PodiumSection";
import { RankingList } from "./RankingList";

export const RankingView: React.FC = () => {
    const { topUsers, rankingList, isSmallDevice } = useLeaderboard();

    return (
        <SafeAreaView style={styles.container} edges={["left", "right"]}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Navigation Tabs Header */}
                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[styles.tabButton, styles.activeTabButton]}
                    >
                        <Text style={styles.activeTabText}>Hạng</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.tabButton}>
                        <Text style={styles.inactiveTabText}>Chuỗi</Text>
                    </TouchableOpacity>
                </View>

                {/* Podium Sub-view */}
                <PodiumSection
                    topUsers={topUsers}
                    isSmallDevice={isSmallDevice}
                />

                {/* Remainder Table Rows */}
                <RankingList
                    rankingList={rankingList}
                    isSmallDevice={isSmallDevice}
                />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F3EFEA",
    },
    scrollContent: {
        paddingHorizontal: 22,
        paddingTop: 26,
        paddingBottom: 40,
    },
    tabContainer: {
        backgroundColor: "#E2DDD7",
        borderRadius: 12,
        padding: 4,
        flexDirection: "row",
    },
    tabButton: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center", // FIX: Changed from 'justify' to 'justifyContent'
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
});
