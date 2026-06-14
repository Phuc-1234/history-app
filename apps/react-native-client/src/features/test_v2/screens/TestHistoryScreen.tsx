import React from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useGetTestHistoryQuery } from "../services/testApi";
import type { UserTestLogV2 } from "../types";

interface Props {
    scopeType?: string;
    scopeId?: number;
    testId?: string;
}

export default function TestHistoryScreen({ scopeType, scopeId, testId }: Props = {}) {
    const router = useRouter();
    const { data, isLoading, refetch } = useGetTestHistoryQuery({ scopeType, scopeId, testId });

    if (isLoading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#5D45F9" />
            </View>
        );
    }

    const logs = data?.logs ?? [];

    if (logs.length === 0) {
        return (
            <View style={styles.center}>
                <Text style={styles.emptyText}>Chưa có lượt làm bài nào</Text>
            </View>
        );
    }

    const renderItem = ({ item }: { item: UserTestLogV2 }) => {
        const scoreDisplay = item.maxScore > 0
            ? ((item.scoreAwarded / item.maxScore) * 10).toFixed(1)
            : "0.0";
        const date = new Date(item.startedAt);
        const dateStr = `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()} ${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;

        return (
            <TouchableOpacity
                style={styles.card}
                //  onPress={() => router.push({ pathname: "/(tabs)/test-detail-v2", params: { logId: item.id } } as any)}
                onPress={() => router.push({ pathname: "/(10_proflie)/10_5_test_detail", params: { logId: item.id } } as any)}
                activeOpacity={0.7}
            >
                <View style={styles.cardTop}>
                    <View style={[
                        styles.statusBadge,
                        item.isPassed ? styles.badgePassed : styles.badgeFailed,
                    ]}>
                        <Text style={[
                            styles.statusText,
                            item.isPassed ? styles.statusPassed : styles.statusFailed,
                        ]}>
                            {item.isPassed ? "Đạt" : item.status === "EXPIRED" ? "Hết giờ" : item.status === "ABANDONED" ? "Bỏ dở" : "Chưa đạt"}
                        </Text>
                    </View>
                    <Text style={styles.attemptText}>Lần {item.attemptNumber}</Text>
                </View>

                <View style={styles.scoreRow}>
                    <Text style={styles.scoreValue}>{scoreDisplay}</Text>
                    <Text style={styles.scoreMax}>/10</Text>
                </View>

                <View style={styles.metaRow}>
                    <Text style={styles.metaText}>{dateStr}</Text>
                    <Text style={styles.metaText}>
                        {item.purposeType === "PRACTICE" ? "Luyện tập" : "Kiểm tra"}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <FlatList
            data={logs}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            onRefresh={refetch}
            refreshing={isLoading}
        />
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40 },
    emptyText: { fontSize: 15, color: "#718096", fontWeight: "600" },
    list: { padding: 16, gap: 12 },
    card: {
        backgroundColor: "#FFF", borderRadius: 20, padding: 16,
        borderWidth: 1, borderColor: "#EAE7FA",
        shadowColor: "#5D45F9", shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
    },
    cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 100 },
    badgePassed: { backgroundColor: "#ECFDF5" },
    badgeFailed: { backgroundColor: "#FEF2F2" },
    statusText: { fontSize: 11, fontWeight: "800" },
    statusPassed: { color: "#059669" },
    statusFailed: { color: "#DC2626" },
    attemptText: { fontSize: 12, fontWeight: "600", color: "#A0AEC0" },
    scoreRow: { flexDirection: "row", alignItems: "baseline", marginBottom: 8 },
    scoreValue: { fontSize: 28, fontWeight: "900", color: "#5D45F9" },
    scoreMax: { fontSize: 14, fontWeight: "700", color: "#718096", marginLeft: 2 },
    metaRow: { flexDirection: "row", justifyContent: "space-between" },
    metaText: { fontSize: 12, color: "#A0AEC0", fontWeight: "500" },
});
