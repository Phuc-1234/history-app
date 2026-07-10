import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors } from "@/theme/colors";

export function SegmentTabs({
    tabs,
    active,
    onChange,
    activeColors,
}: {
    tabs: string[];
    active: string;
    onChange: (tab: string) => void;
    activeColors?: Record<string, string>;
}) {
    return (
        <View style={styles.segment}>
            {tabs.map((tab) => {
                const selected = tab === active;
                const activeColor = activeColors?.[tab] || colors.primary;
                return (
                    <TouchableOpacity
                        key={tab}
                        style={[
                            styles.segmentItem,
                            selected && { backgroundColor: activeColor },
                        ]}
                        onPress={() => onChange(tab)}
                        activeOpacity={0.8}
                    >
                        <Text
                            style={[
                                styles.segmentText,
                                selected && styles.segmentTextActive,
                            ]}
                        >
                            {tab}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    segment: {
        flexDirection: "row",
        padding: 4,
        borderRadius: 12,
        backgroundColor: colors.inputBackground,
    },
    segmentItem: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 12,
        alignItems: "center",
    },
    segmentText: {
        fontSize: 12,
        fontWeight: "500",
        color: colors.textMuted,
    },
    segmentTextActive: {
        color: colors.textLight,
    },
});
