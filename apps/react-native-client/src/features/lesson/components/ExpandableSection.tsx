import React, { useState } from "react";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LessonSection } from "../hooks/useLessonSummary";

interface ExpandableSectionProps {
    section: LessonSection;
    isTopLevel?: boolean;
    onNodePress?: (nodeId: number) => void;
}

export function ExpandableSection({
    section,
    isTopLevel = false,
    onNodePress,
}: ExpandableSectionProps) {
    const [isExpanded, setIsExpanded] = useState(isTopLevel ? false : true);

    const hasSubsections = section.children && section.children.length > 0;
    const hasNodes = section.nodes && section.nodes.length > 0;

    const totalNodes = section.progress?.totalNodes ?? 0;
    const completedNodes = section.progress?.completedNodes ?? 0;
    const percentage = totalNodes > 0 ? (completedNodes / totalNodes) * 100 : 0;

    return (
        <View
            style={[
                styles.card,
                isTopLevel ? styles.topLevelCard : styles.nestedCard,
            ]}
        >
            {isTopLevel && percentage > 0 && (
                <View
                    style={[
                        styles.progressFill,
                        { width: `${percentage}%` },
                    ]}
                />
            )}

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
                        onPress={(e) => e.stopPropagation()}
                    >
                        <Ionicons
                            name="ellipsis-vertical"
                            size={16}
                            color="#8E8E93"
                        />
                    </TouchableOpacity>
                    <Ionicons
                        name={isExpanded ? "chevron-up" : "chevron-down"}
                        size={18}
                        color={isTopLevel ? "#1C1C1E" : "#5856D6"}
                    />
                </View>
            </TouchableOpacity>

            {/* Expanded Content View */}
            {isExpanded && (
                <View style={styles.contentContainer}>
                    {/* 1. Render node rows — header or truncated body, tap → NodeScreen */}
                    {hasNodes &&
                        section.nodes?.map((node) => {
                            const displayText =
                                node.header
                                    ? node.header
                                    : node.body.slice(0, 80).trim() +
                                      (node.body.length > 80 ? "…" : "");

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
                                        numberOfLines={1}
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
                                        color={node.isComplete ? "#34C759" : "#AEAEB2"}
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
                            />
                        ))}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: "#FFF",
        width: "100%",
    },
    topLevelCard: {
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#E5E5EA",
        marginBottom: 12,
        overflow: "hidden",
        padding: 4,
    },
    nestedCard: {
        marginTop: 10,
        borderLeftWidth: 1,
        borderLeftColor: "#D2D1F7",
        paddingLeft: 8,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingVertical: 14,
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
        fontSize: 16,
        fontWeight: "700",
        color: "#1C1C1E",
    },
    nestedTitle: {
        fontSize: 15,
        fontWeight: "600",
        color: "#5856D6",
    },
    contentContainer: {
        paddingHorizontal: 12,
        paddingBottom: 12,
        zIndex: 1,
    },
    progressFill: {
        position: "absolute",
        left: 0,
        top: 0,
        bottom: 0,
        backgroundColor: "#E3F2FD", // Beautiful soft blue progress fill
        zIndex: 0,
    },
    nodeRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 8,
        paddingHorizontal: 4,
        paddingVertical: 6,
        backgroundColor: "#FAFAFF",
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#EEEEF2",
    },
    nodeRowCompleted: {
        backgroundColor: "#F2FBF6",
        borderColor: "#D3F2E1",
    },
    bulletPoint: {
        width: 5,
        height: 5,
        borderRadius: 2.5,
        backgroundColor: "#5856D6",
        marginRight: 10,
        flexShrink: 0,
    },
    bulletPointCompleted: {
        backgroundColor: "#34C759",
    },
    nodeText: {
        flex: 1,
        fontSize: 14,
        color: "#3A3A3C",
        lineHeight: 20,
    },
    nodeTextCompleted: {
        color: "#2C3E50",
        fontWeight: "600",
    },
    nodeChevron: {
        marginLeft: 6,
        flexShrink: 0,
    },
});
