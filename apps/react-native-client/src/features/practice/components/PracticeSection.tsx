import React, { useState, useMemo, useEffect } from "react";
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Zap, Coins } from "lucide-react-native";
import { Card } from "@/components/Card";
import { colors } from "@/theme/colors";
import typography from "@/theme/typography";
import { useGetTestInfoQuery, useGetPracticeStatsQuery } from "@/features/test_v2/services/testApi";
import { useGetUserActiveEffectsQuery } from "@/features/inventory/services/itemApi";
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

interface QuestionCountSelectorProps {
    value: number;
    onChange: (val: number) => void;
    maxCount: number;
}

const QuestionCountSelector: React.FC<QuestionCountSelectorProps> = ({
    value,
    onChange,
    maxCount,
}) => {
    const [inputText, setInputText] = useState(String(value));
    const [note, setNote] = useState<string | null>(null);

    useEffect(() => {
        setInputText(String(value));
    }, [value]);

    const effectiveMin = maxCount < 5 ? Math.max(1, maxCount) : 5;
    const effectiveMax = Math.max(1, maxCount);

    const suggestions = useMemo(() => {
        if (maxCount <= 0) return [];
        const list: number[] = [];
        if (maxCount > 10) list.push(10);
        if (maxCount > 20) list.push(20);
        if (!list.includes(maxCount)) list.push(maxCount);
        return list;
    }, [maxCount]);

    const handleTextChange = (text: string) => {
        const cleaned = text.replace(/[^0-9]/g, "");
        setInputText(cleaned);
        if (note) {
            setNote(null);
        }
    };

    const handleBlur = () => {
        const num = parseInt(inputText, 10);
        if (!inputText || isNaN(num) || num < effectiveMin) {
            onChange(effectiveMin);
            setInputText(String(effectiveMin));
            setNote(
                maxCount < 5
                    ? `Số lượng câu hỏi tối thiểu là ${effectiveMin} câu (theo số câu hiện có).`
                    : "Số lượng câu hỏi tối thiểu là 5 câu."
            );
        } else if (num > effectiveMax) {
            onChange(effectiveMax);
            setInputText(String(effectiveMax));
            setNote(`Số lượng câu hỏi tối đa là ${effectiveMax} câu.`);
        } else {
            onChange(num);
            setNote(null);
        }
    };

    return (
        <View style={styles.selectorContainer}>
            <Text style={styles.practiceOptionLabel}>Số lượng câu hỏi</Text>
            <View style={styles.selectorRow}>
                <TextInput
                    style={styles.countInput}
                    value={inputText}
                    onChangeText={handleTextChange}
                    onBlur={handleBlur}
                    keyboardType="number-pad"
                    maxLength={4}
                />
                <View style={styles.suggestionsRow}>
                    {suggestions.map((val) => {
                        const isActive = value === val;
                        const label = val === maxCount ? `Tất cả (${val})` : String(val);
                        return (
                            <TouchableOpacity
                                key={val}
                                style={[
                                    styles.suggestionBtn,
                                    isActive && styles.suggestionBtnActive,
                                ]}
                                onPress={() => {
                                    onChange(val);
                                    setInputText(String(val));
                                    setNote(null);
                                }}
                                activeOpacity={0.7}
                            >
                                <Text
                                    style={[
                                        styles.suggestionText,
                                        isActive && styles.suggestionTextActive,
                                    ]}
                                >
                                    {label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>
            {note ? <Text style={styles.noteText}>{note}</Text> : null}
        </View>
    );
};

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

    const [practiceCount, setPracticeCount] = useState(Math.min(10, answeredQuestionCount));
    const [wrongPracticeCount, setWrongPracticeCount] = useState(Math.min(10, wrongQuestionCount));

    useEffect(() => {
        setWrongPracticeCount(Math.min(10, wrongQuestionCount));
    }, [wrongQuestionCount]);

    useEffect(() => {
        setPracticeCount(Math.min(10, answeredQuestionCount));
    }, [answeredQuestionCount]);

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

    const { data: activeEffectsData } = useGetUserActiveEffectsQuery(undefined, { skip: !isActiveTab });

    const wrongXpMultiplier = ((wrongTestInfo?.xpMultiplier ?? 1) > 1 ? wrongTestInfo!.xpMultiplier : (activeEffectsData?.xpMultiplier ?? 1)) ?? 1;
    const wrongGoldMultiplier = ((wrongTestInfo?.goldMultiplier ?? 1) > 1 ? wrongTestInfo!.goldMultiplier : (activeEffectsData?.goldMultiplier ?? 1)) ?? 1;

    const personalXpMultiplier = ((personalTestInfo?.xpMultiplier ?? 1) > 1 ? personalTestInfo!.xpMultiplier : (activeEffectsData?.xpMultiplier ?? 1)) ?? 1;
    const personalGoldMultiplier = ((personalTestInfo?.goldMultiplier ?? 1) > 1 ? personalTestInfo!.goldMultiplier : (activeEffectsData?.goldMultiplier ?? 1)) ?? 1;

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

                {wrongQuestionCount > 0 && (
                    <QuestionCountSelector
                        value={wrongPracticeCount}
                        onChange={setWrongPracticeCount}
                        maxCount={wrongQuestionCount}
                    />
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
                    <View style={[
                        styles.practiceRewardBadge,
                        wrongXpMultiplier > 1 && { borderWidth: 2, borderColor: "#007AFF" },
                    ]}>
                        <Zap size={14} color="#FFF" />
                        <Text style={styles.practiceRewardText}>
                            +{wrongTestInfo ? wrongTestInfo.xpReward : wrongPracticeCount * 1} XP
                        </Text>
                        {wrongXpMultiplier > 1 && (
                            <View style={[styles.multiplierBadge, { borderColor: "#007AFF" }]}>
                                <Text style={[styles.multiplierText, { color: "#007AFF" }]}>x{wrongXpMultiplier}</Text>
                            </View>
                        )}
                    </View>
                    <View style={[
                        styles.practiceRewardBadge,
                        { backgroundColor: colors.gold },
                        wrongGoldMultiplier > 1 && { borderWidth: 2, borderColor: "#FFB800" },
                    ]}>
                        <Coins size={14} color="#FFF" />
                        <Text style={styles.practiceRewardText}>
                            +{wrongTestInfo ? wrongTestInfo.goldReward : wrongPracticeCount * 1} Vàng
                        </Text>
                        {wrongGoldMultiplier > 1 && (
                            <View style={[styles.multiplierBadge, { borderColor: "#FFB800" }]}>
                                <Text style={[styles.multiplierText, { color: "#FFB800" }]}>x{wrongGoldMultiplier}</Text>
                            </View>
                        )}
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

                {wrongQuestionCount > 0 && (
                    <TouchableOpacity
                        style={styles.practiceStartBtn}
                        onPress={() => {
                            const minAllowed = wrongQuestionCount < 5 ? wrongQuestionCount : 5;
                            const count = Math.max(minAllowed, Math.min(wrongPracticeCount || minAllowed, wrongQuestionCount));
                            onPracticePress({
                                scopeType,
                                scopeId,
                                questionCount: count,
                                autoPickStrategy: "WRONG",
                            });
                        }}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.practiceStartBtnText}>Làm lại ngay</Text>
                    </TouchableOpacity>
                )}
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

                {answeredQuestionCount > 0 && (
                    <QuestionCountSelector
                        value={practiceCount}
                        onChange={setPracticeCount}
                        maxCount={answeredQuestionCount}
                    />
                )}

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
                    <View style={[
                        styles.practiceRewardBadge,
                        personalXpMultiplier > 1 && { borderWidth: 2, borderColor: "#007AFF" },
                    ]}>
                        <Zap size={14} color="#FFF" />
                        <Text style={styles.practiceRewardText}>
                            +{personalTestInfo ? personalTestInfo.xpReward : practiceCount * 1} XP
                        </Text>
                        {personalXpMultiplier > 1 && (
                            <View style={[styles.multiplierBadge, { borderColor: "#007AFF" }]}>
                                <Text style={[styles.multiplierText, { color: "#007AFF" }]}>x{personalXpMultiplier}</Text>
                            </View>
                        )}
                    </View>
                    <View style={[
                        styles.practiceRewardBadge,
                        { backgroundColor: colors.gold },
                        personalGoldMultiplier > 1 && { borderWidth: 2, borderColor: "#FFB800" },
                    ]}>
                        <Coins size={14} color="#FFF" />
                        <Text style={styles.practiceRewardText}>
                            +{personalTestInfo ? personalTestInfo.goldReward : practiceCount * 1} Vàng
                        </Text>
                        {personalGoldMultiplier > 1 && (
                            <View style={[styles.multiplierBadge, { borderColor: "#FFB800" }]}>
                                <Text style={[styles.multiplierText, { color: "#FFB800" }]}>x{personalGoldMultiplier}</Text>
                            </View>
                        )}
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

                {answeredQuestionCount > 0 && (
                    <TouchableOpacity
                        style={styles.practiceStartBtn}
                        onPress={() => {
                            const minAllowed = answeredQuestionCount < 5 ? answeredQuestionCount : 5;
                            const count = Math.max(minAllowed, Math.min(practiceCount || minAllowed, answeredQuestionCount));
                            onPracticePress({
                                scopeType,
                                scopeId,
                                questionCount: count,
                                autoPickStrategy: "LOW_MASTERY",
                            });
                        }}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.practiceStartBtnText}>Bắt đầu luyện tập</Text>
                    </TouchableOpacity>
                )}
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
        borderRadius: 12,
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
        marginBottom: 8,
    },
    selectorContainer: {
        marginBottom: 20,
    },
    selectorRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    countInput: {
        width: 64,
        height: 40,
        borderWidth: 1.5,
        borderColor: colors.borderMedium,
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingTop: 3,
        paddingBottom: 0,
        textAlign: "center",
        textAlignVertical: "center",
        includeFontPadding: false,
        fontFamily: typography.fonts.semiBold,
        fontSize: 14,
        lineHeight: 18,
        color: colors.textPrimary,
        backgroundColor: colors.surface,
    },
    suggestionsRow: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    suggestionBtn: {
        height: 40,
        paddingHorizontal: 10,
        borderRadius: 30,
        borderWidth: 1.5,
        borderColor: colors.borderMedium,
        backgroundColor: colors.surface,
        alignItems: "center",
        justifyContent: "center",
    },
    suggestionBtnActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    suggestionText: {
        fontFamily: typography.fonts.semiBold,
        fontSize: 12,
        color: colors.textSecondary,
    },
    suggestionTextActive: {
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
        position: "relative",
    },
    practiceRewardText: {
        fontFamily: typography.fonts.bold,
        fontSize: 12,
        color: "#FFFFFF",
        marginLeft: 4,
    },
    practiceStartBtn: {
        backgroundColor: colors.primary,
        borderRadius: 30,
        paddingVertical: 14,
        alignItems: "center",
    },
    practiceStartBtnText: {
        fontFamily: typography.fonts.bold,
        fontSize: 16,
        color: "#FFFFFF",
    },
    multiplierBadge: {
        position: "absolute",
        top: -8,
        right: -8,
        backgroundColor: "#FFFFFF",
        paddingHorizontal: 4,
        paddingVertical: 1,
        borderRadius: 30,
        borderWidth: 1.5,
        alignItems: "center",
        justifyContent: "center",
    },
    multiplierText: {
        fontSize: 9,
        fontFamily: typography.fonts.bold,
    },
    noteText: {
        fontSize: 12,
        fontFamily: typography.fonts.regular,
        color: colors.textWarning,
        marginTop: 6,
    },
});
