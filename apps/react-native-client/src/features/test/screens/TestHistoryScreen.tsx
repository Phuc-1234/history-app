import React from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Dimensions
} from "react-native";
import { useSelector } from "react-redux";
import { useRouter } from "expo-router";
import { Calendar, Award, ArrowRight, BookOpen, Clock } from "lucide-react-native";
import { RootState } from "../../../store/store";
import { TestAttempt } from "../store/testHistorySlice";

export default function TestHistoryScreen() {
    const router = useRouter();
    const attempts = useSelector((state: RootState) => state.testHistory.attempts);

    const handlePressAttempt = (id: string) => {
        router.push({
            pathname: "/(10_proflie)/10_5_test_detail",
            params: { attemptId: id }
        });
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return { bg: "#ECFDF5", text: "#059669", border: "#A7F3D0" }; // Green
        if (score >= 50) return { bg: "#FFFBEB", text: "#D97706", border: "#FDE68A" }; // Yellow
        return { bg: "#FEF2F2", text: "#DC2626", border: "#FECACA" }; // Red
    };

    const renderItem = ({ item }: { item: TestAttempt }) => {
        const colors = getScoreColor(item.score);

        return (
            <TouchableOpacity
                style={styles.card}
                activeOpacity={0.7}
                onPress={() => handlePressAttempt(item.id)}
            >
                <View style={styles.cardHeader}>
                    <View style={styles.titleContainer}>
                        <BookOpen size={16} color="#5D45F9" style={styles.titleIcon} />
                        <Text style={styles.cardTitle} numberOfLines={1}>
                            {item.testTitle}
                        </Text>
                    </View>
                    <View
                        style={[
                            styles.scoreBadge,
                            { backgroundColor: colors.bg, borderColor: colors.border }
                        ]}
                    >
                        <Text style={[styles.scoreText, { color: colors.text }]}>
                            {item.score}đ
                        </Text>
                    </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.cardFooter}>
                    <View style={styles.metaRow}>
                        <View style={styles.metaItem}>
                            <Calendar size={14} color="#718096" />
                            <Text style={styles.metaText}>{item.timestamp}</Text>
                        </View>
                        <View style={styles.metaItem}>
                            <Award size={14} color="#718096" />
                            <Text style={styles.metaText}>
                                {item.correctAnswersCount}/{item.totalQuestions} Câu đúng
                            </Text>
                        </View>
                    </View>
                    <View style={styles.arrowContainer}>
                        <Text style={styles.viewDetailText}>Chi tiết</Text>
                        <ArrowRight size={14} color="#5D45F9" />
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            {attempts.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <View style={styles.emptyIconContainer}>
                        <Clock size={48} color="#A0AEC0" />
                    </View>
                    <Text style={styles.emptyTitle}>Chưa có lịch sử làm bài</Text>
                    <Text style={styles.emptySubtitle}>
                        Các bài kiểm tra bạn đã hoàn thành sẽ xuất hiện ở đây để bạn ôn luyện lại.
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={attempts}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F8F7FF",
    },
    listContent: {
        padding: 16,
        paddingBottom: 32,
    },
    card: {
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        padding: 16,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: "#EAE7FA",
        shadowColor: "#5D45F9",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.04,
        shadowRadius: 10,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    titleContainer: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
        marginRight: 12,
    },
    titleIcon: {
        marginRight: 8,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#1C1C1E",
    },
    scoreBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 100,
        borderWidth: 1,
        minWidth: 54,
        alignItems: "center",
    },
    scoreText: {
        fontSize: 14,
        fontWeight: "800",
    },
    divider: {
        height: 1,
        backgroundColor: "#F1F0F7",
        marginBottom: 12,
    },
    cardFooter: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    metaRow: {
        gap: 6,
    },
    metaItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    metaText: {
        fontSize: 12,
        color: "#718096",
        fontWeight: "500",
    },
    arrowContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    viewDetailText: {
        fontSize: 12,
        fontWeight: "700",
        color: "#5D45F9",
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 40,
        paddingBottom: 80,
    },
    emptyIconContainer: {
        width: 96,
        height: 96,
        borderRadius: 100,
        backgroundColor: "#E8E7F5",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: "800",
        color: "#2D2D3A",
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 13,
        color: "#718096",
        textAlign: "center",
        lineHeight: 18,
        fontWeight: "500",
    },
});
