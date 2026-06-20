import React from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useGetTestHistoryQuery } from "../services/testApi";
import { formatScore } from "../services/scoreEngine";
import type { UserTestLogV2 } from "../types";
import { colors } from "../../../theme/colors";

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
                <ActivityIndicator size="large" color={colors.primary} />
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
            ? formatScore((item.scoreAwarded / item.maxScore) * 10)
            : "0";
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
                        <Text style={styles.statusText}>
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
    emptyText: { fontSize: 15, color: colors.textMuted, fontWeight: "600" },
    list: { padding: 16, gap: 12 },
    card: {
        backgroundColor: colors.surface, borderRadius: 5, padding: 16,
        borderWidth: 2.5, borderColor: colors.borderDark,


    },
    cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 5 },
    badgePassed: { backgroundColor: colors.success },
    badgeFailed: { backgroundColor: colors.error },
    statusText: { fontSize: 11, fontWeight: "500", color: colors.textLight },


    attemptText: { fontSize: 12, fontWeight: "600", color: colors.textPlaceholder },
    scoreRow: { flexDirection: "row", alignItems: "baseline", marginBottom: 8 },
    scoreValue: { fontSize: 28, fontWeight: "900", color: colors.primary },
    scoreMax: { fontSize: 14, fontWeight: "700", color: colors.textMuted, marginLeft: 2 },
    metaRow: { flexDirection: "row", justifyContent: "space-between" },
    metaText: { fontSize: 12, color: colors.textPlaceholder, fontWeight: "500" },
});
