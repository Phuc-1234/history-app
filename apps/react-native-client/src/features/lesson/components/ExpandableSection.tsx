import React, { useState } from "react";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { usePreventDoubleTap } from "@/hooks/usePreventDoubleTap";
import { LessonSection } from "../hooks/useLessonSummary";
import { colors } from "../../../theme/colors";
import { typography } from "../../../theme/typography";

const getSectionDisplaySuffix = (name: string): string => {
    const match = name.trim().match(/^([0-9]+|[IVXLCDMivxlcdm]+)\./);
    return match ? match[1] : "này";
};

const countTotalNodes = (sec: LessonSection): number => {
    let count = sec.nodes?.length || 0;
    if (sec.children) {
        for (const child of sec.children) {
            count += countTotalNodes(child);
        }
    }
    return count;
};

const stripHtml = (html: string | undefined | null): string => {
    if (!html) return "";
    let clean = html.replace(/<[^>]*>/g, " ");
    
    // Decode common HTML entities
    const entities: { [key: string]: string } = {
        "&nbsp;": " ",
        "&lt;": "<",
        "&gt;": ">",
        "&amp;": "&",
        "&quot;": '"',
        "&apos;": "'",
        "&cent;": "¢",
        "&pound;": "£",
        "&yen;": "¥",
        "&euro;": "€",
        "&copy;": "©",
        "&reg;": "®",
        "&ldquo;": "“",
        "&rdquo;": "”",
        "&lsquo;": "‘",
        "&rsquo;": "’",
    };
    
    clean = clean.replace(/&[a-zA-Z0-9#]+;/g, (match) => {
        if (entities[match]) {
            return entities[match];
        }
        if (match.startsWith("&#")) {
            const code = parseInt(match.slice(2, -1), 10);
            if (!isNaN(code)) {
                return String.fromCharCode(code);
            }
        }
        return match;
    });

    // Strip HTML again in case any entities decoded to HTML tags
    clean = clean.replace(/<[^>]*>/g, " ");

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
    const preventDoubleTap = usePreventDoubleTap();
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
                        onPress={preventDoubleTap((e) => {
                            e.stopPropagation();
                            router.push(`/(3_4_lessons)/4_4_fcard?sectionId=${section.id}`);
                        })}
                    >
                        <Ionicons
                            name="layers-outline"
                            size={18}
                            color={isTopLevel ? colors.textPrimary : colors.primary}
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

                    {/* Section test button — only for top-level sections with >1 node and questions */}
                    {isTopLevel && onSectionTestPress && section.hasSectionTest && countTotalNodes(section) > 1 && (
                        <TouchableOpacity
                            style={[
                                styles.sectionTestBtn,
                                section.testPassed && {
                                    backgroundColor: colors.success,
                                    borderColor: colors.success,
                                }
                            ]}
                            onPress={() => onSectionTestPress(section.id)}
                            activeOpacity={0.8}
                        >
                            <Text style={[
                                styles.sectionTestBtnText,
                                section.testPassed && { color: "#FFFFFF" }
                            ]}>
                                Thử thách mục {getSectionDisplaySuffix(section.name)}
                            </Text>
                            {section.testPassed && (
                                <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                            )}
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
        paddingLeft: 12,
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
        ...typography.h3,
        color: colors.textPrimary,
    },
    nestedTitle: {
        ...typography.bodyMediumBold,
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
        borderRadius: 12,
    },
    nodeRowCompleted: {
        backgroundColor: colors.success,
        borderWidth: 0,
    },
    nodeText: {
        flex: 1,
        ...typography.bodyMedium,
        color: colors.textSecondary,
        lineHeight: 22,
    },
    nodeTextCompleted: {
        color: colors.textLight,
        fontFamily: typography.fonts.bold,
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
        fontFamily: typography.fonts.bold,
        fontSize: 13,
        textAlign: "center",
    },
});
