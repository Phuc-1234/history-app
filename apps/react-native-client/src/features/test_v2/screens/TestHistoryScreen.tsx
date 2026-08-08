import React, { useState } from "react";
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import Card from "../../../components/Card";
import { CustomModal } from "../../../components/Modal";
import { useGetTestHistoryQuery } from "../services/testApi";
import { formatScore } from "../services/scoreEngine";
import type { UserTestLogV2 } from "../types";
import { colors } from "../../../theme/colors";
import typography from "@/theme/typography";

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

    const handlePressItem = (item: UserTestLogV2) => {
        router.push({ pathname: "/(10_proflie)/10_5_test_detail", params: { logId: item.id } } as any);
    };

    const renderItem = ({ item }: { item: UserTestLogV2 }) => {
        const scoreDisplay = item.maxScore > 0
            ? formatScore((item.scoreAwarded / item.maxScore) * 10)
            : "0";
        const date = new Date(item.startedAt);
        const dateStr = `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()} ${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;

        return (
            <Card
                variant="grayBorder"
                style={styles.card}
                onPress={() => handlePressItem(item)}
                activeOpacity={0.7}
            >
                <View style={styles.cardTop}>
                    <View style={styles.scoreAndStatus}>
                        <View style={styles.scoreRow}>
                            <Text style={styles.scoreValue}>{scoreDisplay}</Text>
                            <Text style={styles.scoreMax}>/10</Text>
                        </View>
                        <View style={[
                            styles.statusBadge,
                            item.isPassed ? styles.badgePassed : styles.badgeFailed,
                        ]}>
                            <Text style={styles.statusText}>
                                {item.isPassed ? "Đạt" : item.status === "EXPIRED" ? "Hết giờ" : item.status === "ABANDONED" ? "Bỏ dở" : "Chưa đạt"}
                            </Text>
                        </View>
                    </View>
                    <Text style={styles.attemptText}>Lần {item.attemptNumber}</Text>
                </View>

                <View style={styles.metaRow}>
                    <Text style={styles.metaText}>
                        {item.purposeType === "PRACTICE" ? "Luyện tập" : "Kiểm tra"}
                    </Text>
                    <Text style={styles.metaText}>{dateStr}</Text>
                </View>
            </Card>
        );
    };

    return (
        <View style={{ flex: 1 }}>
            <FlatList
                data={logs}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                onRefresh={refetch}
                refreshing={isLoading}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40 },
    emptyText: { fontSize: 15, color: colors.textMuted, fontFamily: typography.fonts.semiBold },
    list: { padding: 16, gap: 12 },
    card: {
        padding: 16,
    },
    cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
    scoreAndStatus: { flexDirection: "row", alignItems: "center", gap: 8 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 5 },
    badgePassed: { backgroundColor: colors.success },
    badgeFailed: { backgroundColor: colors.error },
    statusText: { fontSize: 11, fontFamily: typography.fonts.medium, color: colors.textLight },
    attemptText: { fontSize: 12, fontFamily: typography.fonts.semiBold, color: colors.textPlaceholder },
    scoreRow: { flexDirection: "row", alignItems: "baseline" },
    scoreValue: { fontSize: 24, fontFamily: typography.fonts.black, color: colors.primary },
    scoreMax: { fontSize: 13, fontFamily: typography.fonts.bold, color: colors.textMuted, marginLeft: 2 },
    metaRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    metaText: { fontSize: 12, color: colors.textPlaceholder, fontFamily: typography.fonts.medium },
});
