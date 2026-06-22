import React, { useState } from "react";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LessonSection } from "../hooks/useLessonSummary";
import { colors } from "../../../theme/colors";

const getSectionDisplaySuffix = (name: string): string => {
    const match = name.trim().match(/^([0-9]+|[IVXLCDMivxlcdm]+)\./);
    return match ? match[1] : "này";
};

const stripHtml = (html: string | undefined | null): string => {
    if (!html) return "";
    const clean = html.replace(/<[^>]*>/g, " ");
    return clean.replace(/\s+/g, " ").trim();
};

interface ExpandableSectionProps {
    section: LessonSection;
    isTopLevel?: boolean;
    onNodePress?: (nodeId: number) => void;
    onSectionTestPress?: (sectionId: number) => void;
}

export function ExpandableSection({
    section,
    isTopLevel = false,
    onNodePress,
    onSectionTestPress,
}: ExpandableSectionProps) {
    const router = useRouter();
    const [isExpanded, setIsExpanded] = useState(true);

    const hasSubsections = section.children && section.children.length > 0;
    const hasNodes = section.nodes && section.nodes.length > 0;

    return (
        <View
            style={[
                styles.card,
                isTopLevel ? styles.topLevelCard : styles.nestedCard,
            ]}
        >
            {/* Header Container */}
            <TouchableOpacity
                style={styles.header}
                onPress={() => setIsExpanded(!isExpanded)}
                activeOpacity={0.7}
            >
                <Text
                    style={[
                        styles.title,
                        isTopLevel ? styles.topLevelTitle : styles.nestedTitle,
                    ]}
                >
                    {section.name}
                </Text>

                <View style={styles.headerRight}>
                    <TouchableOpacity
                        style={styles.threeDots}
                        onPress={(e) => {
                            e.stopPropagation();
                            router.push(`/(3_4_lessons)/4_4_fcard?sectionId=${section.id}`);
                        }}
                    >
                        <Ionicons
                            name="copy"
                            size={16}
                            color={colors.primary}
                        />
                    </TouchableOpacity>
                    <Ionicons
                        name={isExpanded ? "chevron-up" : "chevron-down"}
                        size={18}
                        color={isTopLevel ? colors.textPrimary : colors.primary}
                    />
                </View>
            </TouchableOpacity>

            {/* Expanded Content View */}
            {isExpanded && (
                <View style={styles.contentContainer}>
                    {/* 1. Render node rows — header or truncated body, tap → NodeScreen */}
                    {hasNodes &&
                        section.nodes?.map((node) => {
                            const cleanBody = stripHtml(node.body);
                            const displayText =
                                node.header
                                    ? node.header
                                    : cleanBody.slice(0, 80).trim() +
                                      (cleanBody.length > 80 ? "…" : "");

                            return (
                                <TouchableOpacity
                                    key={node.id}
                                    style={[
                                        styles.nodeRow,
                                        node.isComplete && styles.nodeRowCompleted,
                                    ]}
                                    onPress={() => onNodePress?.(node.id)}
                                    activeOpacity={0.7}
                                >
                                    <View
                                        style={[
                                            styles.bulletPoint,
                                            node.isComplete && styles.bulletPointCompleted,
                                        ]}
                                    />
                                    <Text
                                        style={[
                                            styles.nodeText,
                                            node.isComplete && styles.nodeTextCompleted,
                                        ]}
                                        numberOfLines={2}
                                    >
                                        {displayText}
                                    </Text>
                                    <Ionicons
                                        name={
                                            node.isComplete
                                                ? "checkmark-circle"
                                                : "chevron-forward"
                                        }
                                        size={14}
                                        color={node.isComplete ? colors.textLight : colors.textMuted}
                                        style={styles.nodeChevron}
                                    />
                                </TouchableOpacity>
                            );
                        })}

                    {/* 2. RECURSIVE STEP: Render child sections */}
                    {hasSubsections &&
                        section.children?.map((sub) => (
                            <ExpandableSection
                                key={sub.id}
                                section={sub}
                                isTopLevel={false}
                                onNodePress={onNodePress}
                                onSectionTestPress={onSectionTestPress}
                            />
                        ))}

                    {/* Section test button — only for top-level sections */}
                    {isTopLevel && onSectionTestPress && (
                        <TouchableOpacity
                            style={styles.sectionTestBtn}
                            onPress={() => onSectionTestPress(section.id)}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="document-text" size={16} color={colors.primary} />
                            <Text style={styles.sectionTestBtnText}>
                                Luyện tập mục {getSectionDisplaySuffix(section.name)}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: "transparent",
        width: "100%",
    },
    topLevelCard: {
        marginBottom: 12,
        overflow: "hidden",
    },
    nestedCard: {
        marginTop: 10,
        backgroundColor: "transparent",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 12,
        zIndex: 1,
    },
    headerRight: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    threeDots: {
        padding: 4,
    },
    title: {
        flex: 1,
    },
    topLevelTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: colors.textPrimary,
    },
    nestedTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: colors.primary,
    },
    contentContainer: {
        paddingBottom: 8,
        zIndex: 1,
    },
    nodeRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        paddingHorizontal: 12,
        marginBottom: 10,
        backgroundColor: "transparent",
        borderWidth: 1,
        borderColor: colors.borderDark,
        borderRadius: 5,
    },
    nodeRowCompleted: {
        backgroundColor: colors.success,
        borderWidth: 0,
    },
    bulletPoint: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: colors.primary,
        marginRight: 10,
        flexShrink: 0,
    },
    bulletPointCompleted: {
        backgroundColor: colors.textLight,
    },
    nodeText: {
        flex: 1,
        fontSize: 15,
        color: colors.textSecondary,
        lineHeight: 22,
    },
    nodeTextCompleted: {
        color: colors.textLight,
        fontWeight: "600",
    },
    nodeChevron: {
        marginLeft: 6,
        flexShrink: 0,
    },
    sectionTestBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.primary,
        borderRadius: 30,
        paddingVertical: 10,
        gap: 6,
        marginTop: 12,
    },
    sectionTestBtnText: {
        color: colors.primary,
        fontSize: 13,
        fontWeight: "700",
        textAlign: "center",
    },
});
