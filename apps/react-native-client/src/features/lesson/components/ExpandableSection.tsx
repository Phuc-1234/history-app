import React, { useState } from "react";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LessonSection } from "../hooks/useLessonSummary";

interface ExpandableSectionProps {
    section: LessonSection;
    isTopLevel?: boolean;
}

export function ExpandableSection({
    section,
    isTopLevel = false,
}: ExpandableSectionProps) {
    const [isExpanded, setIsExpanded] = useState(isTopLevel ? false : true); // Top levels closed, deeper nested default open

    const hasSubsections =
        section.subsections && section.subsections.length > 0;
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
                    {section.title}
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
                    {/* 1. Render leaf text nodes if present */}
                    {hasNodes &&
                        section.nodes?.map((node) => (
                            <View key={node.id} style={styles.nodeRow}>
                                <View style={styles.bulletPoint} />
                                <Text style={styles.nodeText}>{node.text}</Text>
                            </View>
                        ))}

                    {/* 2. RECURSIVE STEP: Render child sections using this exact component */}
                    {hasSubsections &&
                        section.subsections?.map((sub) => (
                            <ExpandableSection
                                key={sub.id}
                                section={sub}
                                isTopLevel={false}
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
    },
    nodeRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginTop: 8,
        paddingHorizontal: 4,
    },
    bulletPoint: {
        width: 5,
        height: 5,
        borderRadius: 2.5,
        backgroundColor: "#3A3A3C",
        marginTop: 7,
        marginRight: 8,
    },
    nodeText: {
        flex: 1,
        fontSize: 14,
        color: "#3A3A3C",
        lineHeight: 20,
    },
});
