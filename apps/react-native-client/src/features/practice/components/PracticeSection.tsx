import React, { useState, useMemo, useEffect } from "react";
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "@/components/Card";
import { colors } from "@/theme/colors";
import typography from "@/theme/typography";
import { useGetTestInfoQuery, useGetPracticeStatsQuery } from "@/features/test_v2/services/testApi";
import { ScopeType } from "@/features/test_v2/types";

export interface PracticeOptions {
    scopeType: ScopeType;
    scopeId?: number;
    questionCount: number;
    autoPickStrategy: "WRONG" | "LOW_MASTERY" | "BALANCED";
}

interface PracticeSectionProps {
    scopeType: ScopeType;
    scopeId?: number;
    wrongQuestionCount?: number;
    answeredQuestionCount?: number;
    onPracticePress: (options: PracticeOptions) => void;
    isActiveTab?: boolean;
}

export const PracticeSection: React.FC<PracticeSectionProps> = ({
    scopeType,
    scopeId,
    wrongQuestionCount: propWrongCount,
    answeredQuestionCount: propAnsweredCount,
    onPracticePress,
    isActiveTab = true,
}) => {
    // If stats are not passed as props, fetch them via practice-stats endpoint
    const shouldFetchStats = propWrongCount === undefined || propAnsweredCount === undefined;
    const { data: practiceStats } = useGetPracticeStatsQuery(
        { scopeType, scopeId },
        { skip: !shouldFetchStats || !isActiveTab }
    );

    const wrongQuestionCount = propWrongCount ?? practiceStats?.wrongQuestionCount ?? 0;
    const answeredQuestionCount = propAnsweredCount ?? practiceStats?.answeredQuestionCount ?? 0;

    const [practiceCount, setPracticeCount] = useState(10);
    const [wrongPracticeCount, setWrongPracticeCount] = useState(10);

    const wrongOptions = useMemo(() => {
        if (wrongQuestionCount <= 10) return [];
        const opts = [10];
        if (wrongQuestionCount > 20) opts.push(20);
        if (wrongQuestionCount > 30) opts.push(30);
        if (!opts.includes(wrongQuestionCount)) opts.push(wrongQuestionCount);
        return opts;
    }, [wrongQuestionCount]);

    const practiceOptions = useMemo(() => {
        const n = answeredQuestionCount;
        const options: { value: number; label: string }[] = [];
        let addedAll = false;

        for (const count of [10, 20, 30]) {
            if (count < n) {
                options.push({ value: count, label: String(count) });
            } else if (count === n) {
                options.push({ value: count, label: `Tất cả (${n})` });
                addedAll = true;
            } else {
                if (!addedAll) {
                    options.push({ value: n, label: `Tất cả (${n})` });
                    addedAll = true;
                }
            }
        }
        return options;
    }, [answeredQuestionCount]);

    useEffect(() => {
        if (wrongQuestionCount <= 10) {
            setWrongPracticeCount(wrongQuestionCount);
        } else {
            if (!wrongOptions.includes(wrongPracticeCount)) {
                setWrongPracticeCount(wrongOptions[0] || 10);
            }
        }
    }, [wrongQuestionCount, wrongOptions]);

    useEffect(() => {
        if (answeredQuestionCount <= 10) {
            setPracticeCount(answeredQuestionCount);
        } else {
            const optionValues = practiceOptions.map((o) => o.value);
            if (!optionValues.includes(practiceCount)) {
                setPracticeCount(optionValues[0] || 10);
            }
        }
    }, [answeredQuestionCount, practiceOptions]);

    const { data: wrongTestInfo } = useGetTestInfoQuery(
        {
            scopeType,
            scopeId,
            autoPickStrategy: "WRONG",
            questionCount: wrongPracticeCount,
        },
        { skip: wrongQuestionCount === 0 || !isActiveTab }
    );

    const { data: personalTestInfo } = useGetTestInfoQuery(
        {
            scopeType,
            scopeId,
            autoPickStrategy: "LOW_MASTERY",
            questionCount: practiceCount,
        },
        { skip: answeredQuestionCount === 0 || !isActiveTab }
    );

    return (
        <View style={styles.practiceContainer}>
            {/* Làm lại câu sai Card */}
            <Card variant="bordered" style={[styles.practiceCard, { marginBottom: 16 }]}>
                <View style={styles.practiceCardHeader}>
                    <Ionicons name="alert-circle-outline" size={24} color={colors.error} />
                    <Text style={styles.practiceCardTitle}>Làm lại câu sai</Text>
                </View>
                <Text style={styles.practiceCardDesc}>
                    {wrongQuestionCount === 0
                        ? "Bạn không có câu hỏi sai nào. Tuyệt vời!"
                        : wrongQuestionCount <= 10
                            ? `Bạn có ${wrongQuestionCount} câu trả lời sai. Hãy làm lại để khắc phục!`
                            : `Bạn có ${wrongQuestionCount} câu trả lời sai. Hãy ôn luyện để sửa đổi và củng cố nhé!`}
                </Text>

                {wrongQuestionCount > 10 && (
                    <>
                        <Text style={styles.practiceOptionLabel}>Số lượng câu hỏi</Text>
                        <View style={styles.practiceOptionsRow}>
                            {wrongOptions.map((count) => (
                                <TouchableOpacity
                                    key={count}
                                    style={[
                                        styles.practiceOptionBtn,
                                        wrongPracticeCount === count && styles.practiceOptionBtnActive,
                                    ]}
                                    onPress={() => setWrongPracticeCount(count)}
                                    activeOpacity={0.7}
                                >
                                    <Text
                                        style={[
                                            styles.practiceOptionText,
                                            wrongPracticeCount === count && styles.practiceOptionTextActive,
                                        ]}
                                    >
                                        {count === wrongQuestionCount ? `Tất cả (${count})` : count}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </>
                )}

                <View style={[styles.practiceRewardRow, { marginBottom: 12 }]}>
                    <Text style={styles.practiceRewardLabel}>Yêu cầu đạt:</Text>
                    <View style={[styles.practiceRewardBadge, { backgroundColor: colors.info }]}>
                        <Ionicons name="checkmark-circle" size={14} color="#FFF" />
                        <Text style={styles.practiceRewardText}>
                            Đúng từ {wrongTestInfo ? `${wrongTestInfo.passThreshold}%` : "80%"} số câu
                        </Text>
                    </View>
                </View>

                <View style={styles.practiceRewardRow}>
                    <Text style={styles.practiceRewardLabel}>Phần thưởng:</Text>
                    <View style={styles.practiceRewardBadge}>
                        <Ionicons name="flash" size={14} color="#FFF" />
                        <Text style={styles.practiceRewardText}>
                            +{wrongTestInfo ? wrongTestInfo.xpReward : wrongPracticeCount * 1} XP
                        </Text>
                    </View>
                    <View style={[styles.practiceRewardBadge, { backgroundColor: colors.gold }]}>
                        <Ionicons name="cash" size={14} color="#FFF" />
                        <Text style={styles.practiceRewardText}>
                            +{wrongTestInfo ? wrongTestInfo.goldReward : wrongPracticeCount * 1} Vàng
                        </Text>
                    </View>
                    {wrongTestInfo?.itemsReward?.map((item, idx) => (
                        <View key={idx} style={[styles.practiceRewardBadge, { backgroundColor: "#0d9488" }]}>
                            <Ionicons name="cube" size={14} color="#FFF" />
                            <Text style={styles.practiceRewardText}>
                                {item.name} x{item.quantity}
                            </Text>
                        </View>
                    ))}
                </View>

                <TouchableOpacity
                    style={[
                        styles.practiceStartBtn,
                        wrongQuestionCount === 0 && { backgroundColor: colors.textPlaceholder },
                    ]}
                    onPress={() =>
                        onPracticePress({
                            scopeType,
                            scopeId,
                            questionCount: wrongPracticeCount,
                            autoPickStrategy: "WRONG",
                        })
                    }
                    disabled={wrongQuestionCount === 0}
                    activeOpacity={0.8}
                >
                    <Text style={styles.practiceStartBtnText}>Làm lại ngay</Text>
                </TouchableOpacity>
            </Card>

            {/* Luyện tập cá nhân Card */}
            <Card variant="bordered" style={styles.practiceCard}>
                <View style={styles.practiceCardHeader}>
                    <Ionicons name="bar-chart-outline" size={24} color={colors.primary} />
                    <Text style={styles.practiceCardTitle}>Luyện tập cá nhân</Text>
                </View>
                <Text style={styles.practiceCardDesc}>
                    {answeredQuestionCount === 0
                        ? "Bạn không có câu hỏi ôn tập nào. Hãy học và làm bài kiểm tra trước!"
                        : "Củng cố kiến thức bằng cách ôn lại các câu hỏi đã làm để tăng cấp độ thành thạo. Ưu tiên các câu hỏi chưa vững."}
                </Text>

                {answeredQuestionCount > 0 &&
                    (answeredQuestionCount < 10 ? (
                        <Text style={[styles.practiceOptionLabel, { marginBottom: 20 }]}>
                            Số lượng câu hỏi:{" "}
                            <Text style={{ color: colors.accent }}>{answeredQuestionCount}</Text>
                        </Text>
                    ) : (
                        <>
                            <Text style={styles.practiceOptionLabel}>Số lượng câu hỏi</Text>
                            <View style={styles.practiceOptionsRow}>
                                {practiceOptions.map((opt) => (
                                    <TouchableOpacity
                                        key={opt.value}
                                        style={[
                                            styles.practiceOptionBtn,
                                            practiceCount === opt.value && styles.practiceOptionBtnActive,
                                        ]}
                                        onPress={() => setPracticeCount(opt.value)}
                                        activeOpacity={0.7}
                                    >
                                        <Text
                                            style={[
                                                styles.practiceOptionText,
                                                practiceCount === opt.value && styles.practiceOptionTextActive,
                                            ]}
                                        >
                                            {opt.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </>
                    ))}

                <View style={[styles.practiceRewardRow, { marginBottom: 12 }]}>
                    <Text style={styles.practiceRewardLabel}>Yêu cầu đạt:</Text>
                    <View style={[styles.practiceRewardBadge, { backgroundColor: colors.info }]}>
                        <Ionicons name="checkmark-circle" size={14} color="#FFF" />
                        <Text style={styles.practiceRewardText}>
                            Đúng từ {personalTestInfo ? `${personalTestInfo.passThreshold}%` : "80%"} số câu
                        </Text>
                    </View>
                </View>

                <View style={styles.practiceRewardRow}>
                    <Text style={styles.practiceRewardLabel}>Phần thưởng:</Text>
                    <View style={styles.practiceRewardBadge}>
                        <Ionicons name="flash" size={14} color="#FFF" />
                        <Text style={styles.practiceRewardText}>
                            +{personalTestInfo ? personalTestInfo.xpReward : practiceCount * 1} XP
                        </Text>
                    </View>
                    <View style={[styles.practiceRewardBadge, { backgroundColor: colors.gold }]}>
                        <Ionicons name="cash" size={14} color="#FFF" />
                        <Text style={styles.practiceRewardText}>
                            +{personalTestInfo ? personalTestInfo.goldReward : practiceCount * 1} Vàng
                        </Text>
                    </View>
                    {personalTestInfo?.itemsReward?.map((item, idx) => (
                        <View key={idx} style={[styles.practiceRewardBadge, { backgroundColor: "#0d9488" }]}>
                            <Ionicons name="cube" size={14} color="#FFF" />
                            <Text style={styles.practiceRewardText}>
                                {item.name} x{item.quantity}
                            </Text>
                        </View>
                    ))}
                </View>

                <TouchableOpacity
                    style={[
                        styles.practiceStartBtn,
                        answeredQuestionCount === 0 && { backgroundColor: colors.textPlaceholder },
                    ]}
                    onPress={() =>
                        onPracticePress({
                            scopeType,
                            scopeId,
                            questionCount: practiceCount,
                            autoPickStrategy: "LOW_MASTERY",
                        })
                    }
                    disabled={answeredQuestionCount === 0}
                    activeOpacity={0.8}
                >
                    <Text style={styles.practiceStartBtnText}>Bắt đầu luyện tập</Text>
                </TouchableOpacity>
            </Card>
        </View>
    );
};

const styles = StyleSheet.create({
    practiceContainer: {
        width: "100%",
        paddingBottom: 24,
    },
    practiceCard: {
        padding: 20,
        marginBottom: 24,
        borderRadius: 12, // Container border radius = 12
    },
    practiceCardHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
    },
    practiceCardTitle: {
        fontFamily: typography.fonts.bold,
        fontSize: 18,
        color: colors.textPrimary,
        marginLeft: 8,
    },
    practiceCardDesc: {
        fontFamily: typography.fonts.regular,
        fontSize: 14,
        color: colors.textSecondary,
        marginBottom: 20,
        lineHeight: 20,
    },
    practiceOptionLabel: {
        fontFamily: typography.fonts.semiBold,
        fontSize: 14,
        color: colors.textPrimary,
        marginBottom: 12,
    },
    practiceOptionsRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 24,
    },
    practiceOptionBtn: {
        flex: 1,
        paddingVertical: 12,
        marginHorizontal: 4,
        borderRadius: 30, // Pill button border radius = 30
        borderWidth: 1.5,
        borderColor: colors.borderMedium,
        alignItems: "center",
        backgroundColor: colors.surface,
    },
    practiceOptionBtnActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    practiceOptionText: {
        fontFamily: typography.fonts.semiBold,
        fontSize: 14,
        color: colors.textSecondary,
    },
    practiceOptionTextActive: {
        color: "#FFFFFF",
    },
    practiceRewardRow: {
        flexDirection: "row",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 6,
        marginBottom: 24,
    },
    practiceRewardLabel: {
        fontFamily: typography.fonts.semiBold,
        fontSize: 14,
        color: colors.textPrimary,
        marginRight: 6,
    },
    practiceRewardBadge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.accent,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    practiceRewardText: {
        fontFamily: typography.fonts.bold,
        fontSize: 12,
        color: "#FFFFFF",
        marginLeft: 4,
    },
    practiceStartBtn: {
        backgroundColor: colors.primary,
        borderRadius: 30, // Pill button border radius = 30
        paddingVertical: 14,
        alignItems: "center",
    },
    practiceStartBtnText: {
        fontFamily: typography.fonts.bold,
        fontSize: 16,
        color: "#FFFFFF",
    },
});
