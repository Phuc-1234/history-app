import React from "react";
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    FlatList,
    ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ScreenWrapper } from "../../components/layout/ScreenWrapper";
import { colors } from "../../theme/colors";
import typography from "../../theme/typography";
import { Card } from "../../components/Card";
import { useGetFeedbackHistoryQuery } from "../../features/profile/services/feedbackApi";

type FeedbackType = "BUG" | "FEATURE" | "OTHER";

export default function FeedbackHistoryScreen() {
    const router = useRouter();
    const { data: history = [], isLoading, refetch, isFetching } = useGetFeedbackHistoryQuery();

    const getFeedbackTypeStyle = (type: string) => {
        switch (type as FeedbackType) {
            case "BUG":
                return {
                    label: "Báo lỗi",
                    icon: "bug-outline" as const,
                    color: colors.error,
                    bgColor: colors.errorContainer,
                };
            case "FEATURE":
                return {
                    label: "Tính năng",
                    icon: "bulb-outline" as const,
                    color: colors.warning,
                    bgColor: colors.warningContainer,
                };
            default:
                return {
                    label: "Ý kiến khác",
                    icon: "chatbubble-outline" as const,
                    color: colors.info,
                    bgColor: colors.infoContainer,
                };
        }
    };

    const formatDate = (dateStr: string) => {
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString("vi-VN", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
            });
        } catch {
            return dateStr;
        }
    };

    const renderItem = ({ item }: { item: any }) => {
        const typeInfo = getFeedbackTypeStyle(item.type);

        return (
            <Card variant="grayBorder" style={styles.feedbackCard}>
                <View style={styles.cardHeader}>
                    <View style={[styles.badge, { backgroundColor: typeInfo.bgColor }]}>
                        <Ionicons name={typeInfo.icon} size={14} color={typeInfo.color} />
                        <Text style={[styles.badgeText, { color: typeInfo.color }]}>
                            {typeInfo.label}
                        </Text>
                    </View>
                    <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
                </View>
                <Text style={styles.feedbackContent}>{item.content}</Text>
            </Card>
        );
    };

    return (
        <ScreenWrapper
            enableScroll={false} // Use FlatList scroll instead of ScreenWrapper scroll
            showTopBar={false}
            branchConfig={{
                hierarchy: "Gửi góp ý",
                title: "Lịch sử góp ý",
                onBackPress: () => router.back(),
            }}
            style={styles.container}
        >

            {isLoading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={history}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    onRefresh={refetch}
                    refreshing={isFetching}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="chatbox-outline" size={60} color={colors.textPlaceholder} />
                            <Text style={styles.emptyText}>Bạn chưa gửi góp ý nào.</Text>
                            <Text style={styles.emptySubText}>
                                Các ý kiến đóng góp của bạn giúp chúng tôi cải thiện ứng dụng tốt hơn!
                            </Text>
                        </View>
                    }
                />
            )}
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    centerContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    listContent: {
        padding: 20,
        paddingBottom: 40,
        gap: 16,
    },
    feedbackCard: {
        padding: 16,
        backgroundColor: colors.surface,
    },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 10,
    },
    badge: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        gap: 4,
    },
    badgeText: {
        fontFamily: typography.fonts.semiBold,
        fontSize: 12,
    },
    dateText: {
        fontFamily: typography.fonts.regular,
        fontSize: 12,
        color: colors.textMuted,
    },
    feedbackContent: {
        fontFamily: typography.fonts.regular,
        fontSize: 14,
        color: colors.textPrimary,
        lineHeight: 20,
    },
    emptyContainer: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 80,
        paddingHorizontal: 40,
    },
    emptyText: {
        fontFamily: typography.fonts.bold,
        fontSize: 16,
        color: colors.textSecondary,
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubText: {
        fontFamily: typography.fonts.regular,
        fontSize: 14,
        color: colors.textMuted,
        textAlign: "center",
        lineHeight: 20,
    },
});
