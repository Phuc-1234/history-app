import React from "react";
import {
    StyleSheet,
    Text,
    View,
    Image,
    TouchableOpacity,
    SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { TopBarData } from "../hooks/useTopBarData";

interface TopBarProps {
    data: TopBarData | null;
    branchConfig?: {
        hierarchy: string; // e.g., "LỚP SỬ 10 > CHƯƠNG I"
        title: string; // e.g., "Sử học và đời sống"
        subtitle?: string; // e.g., "Thẻ lật"
        onBackPress?: () => void;
    };
}

export function TopBar({ data, branchConfig }: TopBarProps) {
    if (!data) return null;

    return (
        <View style={styles.container}>
            {/* --- Main Purple Stats Bar --- */}
            <View style={styles.purpleBar}>
                <Image
                    source={{ uri: data.profileImgUrl }}
                    style={styles.avatar}
                />

                <View style={styles.statsContainer}>
                    {/* XP Chip */}
                    <View style={styles.chip}>
                        {data.badgeImgUrl ? (
                            <Image
                                source={{ uri: data.badgeImgUrl }}
                                style={styles.badgeIcon}
                            />
                        ) : (
                            <Ionicons name="ribbon" size={16} color="#FF9500" />
                        )}
                        <Text style={styles.chipText}>{data.xp}XP</Text>
                    </View>

                    {/* Gold Chip */}
                    <View style={styles.chip}>
                        <Ionicons
                            name="logo-usd"
                            size={14}
                            color="#FFA500"
                            style={styles.goldIcon}
                        />
                        <Text style={styles.chipText}>
                            {data.gold.toLocaleString()}
                        </Text>
                    </View>

                    {/* Streak Chip */}
                    <View style={styles.chip}>
                        <Ionicons name="flame" size={16} color="#FF9500" />
                        <Text style={styles.chipText}>
                            {data.currentStreak}
                        </Text>
                    </View>
                </View>
            </View>

            {/* --- Optional Branch Bar --- */}
            {branchConfig && (
                <View style={styles.branchBar}>
                    <TouchableOpacity
                        onPress={branchConfig.onBackPress}
                        style={styles.backButton}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="arrow-back" size={24} color="#3A3A3C" />
                    </TouchableOpacity>

                    <View style={styles.branchTextContainer}>
                        <Text style={styles.hierarchyText}>
                            {branchConfig.hierarchy.toUpperCase()}
                        </Text>
                        <Text style={styles.titleText}>
                            {branchConfig.title}
                        </Text>
                        {branchConfig.subtitle && (
                            <Text style={styles.subtitleText}>
                                {branchConfig.subtitle}
                            </Text>
                        )}
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: "#FFF",
    },
    purpleBar: {
        backgroundColor: "#5856D6", // Vibrant purple matching your UI screenshot
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 16,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 2,
        borderColor: "#E5E5EA",
    },
    statsContainer: {
        flexDirection: "row",
        marginLeft: "auto",
        gap: 8,
    },
    chip: {
        backgroundColor: "rgba(255, 255, 255, 0.18)",
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
    },
    badgeIcon: {
        width: 16,
        height: 16,
        resizeMode: "contain",
    },
    goldIcon: {
        backgroundColor: "#FF9500",
        borderRadius: 7,
        paddingHorizontal: 2,
    },
    chipText: {
        color: "#FFF",
        fontSize: 15,
        fontWeight: "700",
    },
    /* Branch Bar Styles */
    branchBar: {
        flexDirection: "row",
        alignItems: "flex-start",
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: "#F2F2F7",
    },
    backButton: {
        marginRight: 12,
        paddingTop: 2,
    },
    branchTextContainer: {
        flex: 1,
    },
    hierarchyText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#8E8E93",
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    titleText: {
        fontSize: 22,
        fontWeight: "700",
        color: "#1C1C1E",
    },
    subtitleText: {
        fontSize: 15,
        color: "#8E8E93",
        marginTop: 2,
    },
});
