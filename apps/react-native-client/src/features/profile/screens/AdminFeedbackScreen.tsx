import React, { useState, useMemo } from "react";
import {
    StyleSheet,
    Text,
    View,
    FlatList,
    ActivityIndicator,
    TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ScreenWrapper } from "../../../components/layout/ScreenWrapper";
import { colors } from "../../../theme/colors";
import typography from "../../../theme/typography";
import { Card } from "../../../components/Card";
import { useGetAdminFeedbacksQuery } from "../services/feedbackApi";

type FilterType = "ALL" | "BUG" | "FEATURE" | "OTHER";

export default function AdminFeedbackScreen() {
    const { data: feedbacks = [], isLoading, refetch, isFetching } = useGetAdminFeedbacksQuery();
    const [filter, setFilter] = useState<FilterType>("ALL");

    const getFeedbackTypeStyle = (type: string) => {
        switch (type) {
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

    const filteredFeedbacks = useMemo(() => {
        if (filter === "ALL") return feedbacks;
        return feedbacks.filter((item) => item.type === filter);
    }, [feedbacks, filter]);

    const renderItem = ({ item }: { item: any }) => {
        const typeInfo = getFeedbackTypeStyle(item.type);
        const userName = item.user?.name || "Người dùng ẩn danh";
        const userEmail = item.user?.email || "Chưa cập nhật email";

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

                {/* Submitting User details */}
                <View style={styles.userSection}>
                    <Ionicons name="person-circle-outline" size={32} color={colors.textSecondary} />
                    <View style={styles.userMeta}>
                        <Text style={styles.userName}>{userName}</Text>
                        <Text style={styles.userEmail}>{userEmail}</Text>
                    </View>
                </View>

                <Text style={styles.feedbackContent}>{item.content}</Text>
            </Card>
        );
    };

    const filterOptions: { key: FilterType; label: string }[] = [
        { key: "ALL", label: "Tất cả" },
        { key: "BUG", label: "Lỗi" },
        { key: "FEATURE", label: "Tính năng" },
        { key: "OTHER", label: "Khác" },
    ];

    return (
        <ScreenWrapper
            enableScroll={false}
            showTopBar={false}
            style={styles.container}
        >
            {/* Custom Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Quản lý góp ý</Text>
            </View>

            {/* Filter Tabs */}
            <View style={styles.filterBar}>
                {filterOptions.map((opt) => {
                    const isSelected = filter === opt.key;
                    return (
                        <TouchableOpacity
                            key={opt.key}
                            style={[
                                styles.filterTab,
                                isSelected && styles.filterTabSelected,
                            ]}
                            onPress={() => setFilter(opt.key)}
                            activeOpacity={0.7}
                        >
                            <Text
                                style={[
                                    styles.filterText,
                                    isSelected && styles.filterTextSelected,
                                ]}
                            >
                                {opt.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {isLoading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={filteredFeedbacks}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    onRefresh={refetch}
                    refreshing={isFetching}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="chatbox-outline" size={60} color={colors.textPlaceholder} />
                            <Text style={styles.emptyText}>Không có góp ý nào phù hợp.</Text>
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
    header: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderLight,
    },
    headerTitle: {
        fontFamily: typography.fonts.bold,
        fontSize: 20,
        color: colors.textPrimary,
    },
    filterBar: {
        flexDirection: "row",
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: colors.surfaceVariant,
        gap: 8,
    },
    filterTab: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 20,
        alignItems: "center",
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.borderMedium,
    },
    filterTabSelected: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    filterText: {
        fontFamily: typography.fonts.medium,
        fontSize: 13,
        color: colors.textSecondary,
    },
    filterTextSelected: {
        color: colors.textLight,
        fontFamily: typography.fonts.bold,
    },
    centerContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    listContent: {
        padding: 16,
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
        marginBottom: 12,
    },
    badge: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
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
    userSection: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        backgroundColor: colors.primaryContainer,
        padding: 10,
        borderRadius: 12,
        marginBottom: 12,
    },
    userMeta: {
        flex: 1,
    },
    userName: {
        fontFamily: typography.fonts.bold,
        fontSize: 14,
        color: colors.textPrimary,
    },
    userEmail: {
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
        paddingVertical: 100,
    },
    emptyText: {
        fontFamily: typography.fonts.bold,
        fontSize: 15,
        color: colors.textSecondary,
        marginTop: 16,
    },
});
