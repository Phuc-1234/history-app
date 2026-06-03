import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Check } from "lucide-react-native";
import { MultipleChoiceQuestion as MultipleChoiceQuestionType } from "../types";

interface Props {
    question: MultipleChoiceQuestionType;
    selectedAnswers: number[] | undefined;
    onSelect: (optionIndex: number) => void;
    disabled?: boolean;
}

export default function MultipleChoiceQuestion({
    question,
    selectedAnswers = [],
    onSelect,
    disabled = false
}: Props) {
    return (
        <View style={styles.container}>
            {/* Guidelines / Helper Label */}
            <View style={styles.badgeContainer}>
                <View style={styles.multiSelectBadge}>
                    <Text style={styles.badgeText}>Chọn nhiều đáp án</Text>
                </View>
            </View>

            <Text style={styles.questionText}>{question.text}</Text>

            <View style={styles.optionsContainer}>
                {question.options.map((option, index) => {
                    const isSelected = selectedAnswers.includes(index);

                    return (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.optionCard,
                                isSelected && styles.optionCardSelected,
                                disabled && styles.optionCardDisabled
                            ]}
                            activeOpacity={0.7}
                            onPress={() => !disabled && onSelect(index)}
                            disabled={disabled}
                        >
                            <View style={styles.optionContent}>
                                {/* Text option */}
                                <Text
                                    style={[
                                        styles.optionText,
                                        isSelected && styles.optionTextSelected
                                    ]}
                                >
                                    {option}
                                </Text>

                                {/* Checkbox Indicator */}
                                <View
                                    style={[
                                        styles.checkboxIndicator,
                                        isSelected && styles.checkboxIndicatorSelected
                                    ]}
                                >
                                    {isSelected && (
                                        <Check size={12} color="#FFFFFF" strokeWidth={4.5} />
                                    )}
                                </View>
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: "100%",
        paddingVertical: 10,
    },
    badgeContainer: {
        flexDirection: "row",
        marginBottom: 12,
    },
    multiSelectBadge: {
        backgroundColor: "#EBF8FF",
        borderWidth: 1,
        borderColor: "#BEE3F8",
        borderRadius: 100,
        paddingHorizontal: 12,
        paddingVertical: 4,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: "800",
        color: "#2B6CB0",
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    questionText: {
        fontSize: 18,
        fontWeight: "700",
        color: "#1A202C",
        lineHeight: 26,
        marginBottom: 24,
    },
    optionsContainer: {
        gap: 14,
    },
    optionCard: {
        width: "100%",
        backgroundColor: "#FFFFFF",
        borderWidth: 1.5,
        borderColor: "#F1F5F9",
        borderRadius: 20,
        paddingHorizontal: 20,
        paddingVertical: 18,
        shadowColor: "#1A202C",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.02,
        shadowRadius: 6,
        elevation: 1,
    },
    optionCardSelected: {
        borderColor: "#5D45F9",
        backgroundColor: "#F5F3FF",
        shadowColor: "#5D45F9",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 3,
    },
    optionCardDisabled: {
        opacity: 0.8,
    },
    optionContent: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
    },
    optionText: {
        flex: 1,
        fontSize: 15,
        fontWeight: "600",
        color: "#4A5568",
        lineHeight: 22,
    },
    optionTextSelected: {
        color: "#5D45F9",
        fontWeight: "700",
    },
    checkboxIndicator: {
        width: 22,
        height: 22,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: "#CBD5E1",
        alignItems: "center",
        justifyContent: "center",
    },
    checkboxIndicatorSelected: {
        borderColor: "#5D45F9",
        backgroundColor: "#5D45F9",
    },
});
