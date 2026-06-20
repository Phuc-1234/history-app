// features/dashboard/components/TopBar.tsx
import React from "react";
import {
    StyleSheet,
    Text,
    View,
    Image,
    TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ProcessedTopBarData } from "../hooks/useTopBarData";
import { colors } from "../../../theme/colors";

interface TopBarProps {
    data?: ProcessedTopBarData;
    showStatsBar?: boolean;
    branchConfig?: {
        hierarchy: string;
        title?: string;
        subtitle?: string;
        onBackPress?: () => void;
    };
    onOpenStreak?: () => void;
}

export function TopBar({ data, showStatsBar = true, branchConfig, onOpenStreak }: TopBarProps) {
    const router = useRouter();

    return (
        <View style={styles.container}>
            {/* --- Main Stats Bar --- */}
            {showStatsBar && data && (
                <View style={[styles.purpleBar, branchConfig && styles.purpleBarWithBranch]}>
                    {!data.isLoggedIn ? (
                        /* Anonymous UI View state */
                        <View style={styles.notLoggedInContainer}>
                            <View style={styles.promptTextContainer}>
                                <Ionicons
                                    name="person-circle-outline"
                                    size={32}
                                    color={colors.primary}
                                />
                                <Text style={styles.promptText} numberOfLines={2}>
                                    Đăng nhập để lưu tiến trình học tập của bạn!
                                </Text>
                            </View>
                            <TouchableOpacity
                                style={styles.loginButton}
                                activeOpacity={0.8}
                                onPress={() => router.push("/(1_auth)/1_1_login")}
                            >
                                <Text style={styles.loginButtonText}>Đăng nhập</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        /* Authenticated State UI View */
                        <>
                            <View style={styles.userSection}>
                                <Image source={{ uri: data.avatarUri }} style={styles.avatar} />
                                <Text style={styles.nameText} numberOfLines={1}>
                                    {data.name}
                                </Text>
                            </View>

                            <View style={styles.statsContainer}>
                                {/* XP Chip */}
                                <View style={styles.chip}>
                                    {data.badgeImgUrl ? (
                                        <Image
                                            source={{ uri: data.badgeImgUrl }}
                                            style={styles.badgeIcon}
                                        />
                                    ) : (
                                        <Ionicons name="ribbon" size={20} color={colors.secondary} />
                                    )}
                                    <Text style={[styles.chipText, { color: colors.secondary }]}>
                                        {data.totalXp}XP
                                    </Text>
                                </View>

                                {/* Gold Chip */}
                                <TouchableOpacity
                                    style={styles.chip}
                                    activeOpacity={0.7}
                                    onPress={() => router.push("/(tabs)/8_2_buy_gold")}
                                >
                                    <Ionicons
                                        name="logo-usd"
                                        size={18}
                                        color={colors.secondary}
                                    />
                                    <Text style={[styles.chipText, { color: colors.secondary }]}>
                                        {data.totalGold}
                                    </Text>
                                </TouchableOpacity>

                                {/* Streak Chip */}
                                <TouchableOpacity
                                    style={styles.chip}
                                    activeOpacity={0.7}
                                    onPress={onOpenStreak}
                                >
                                    <Ionicons name="flame" size={20} color={colors.streak} />
                                    <Text style={[styles.chipText, { color: colors.streak }]}>
                                        {data.currentStreak}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </>
                    )}
                </View>
            )}

            {/* --- Optional Branch Bar Layout Block --- */}
            {branchConfig && (
                <View style={styles.branchBar}>
                    <TouchableOpacity
                        onPress={branchConfig.onBackPress}
                        style={styles.backButton}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="arrow-back" size={24} color={colors.textSecondary} />
                    </TouchableOpacity>

                    <View style={styles.branchTextContainer}>
                        <Text style={styles.hierarchyText}>
                            {branchConfig.hierarchy.toUpperCase()}
                        </Text>
                        {branchConfig.title ? (
                            <Text style={styles.titleText}>
                                {branchConfig.title}
                            </Text>
                        ) : null}
                        {branchConfig.subtitle && (
                            <Text style={styles.subtitleText}>
                                {branchConfig.subtitle}
                            </Text>
                        )}
                    </View>

                    <TouchableOpacity
                        onPress={() => router.push("/(tabs)/2_1_lessons")}
                        style={styles.homeButton}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="home-outline" size={24} color={colors.textSecondary} />
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: colors.background,
        zIndex: 5,
        borderBottomWidth: 2,
        borderBottomColor: colors.borderDark,
    },
    purpleBar: {
        backgroundColor: colors.background,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 16,
    },
    purpleBarWithBranch: {
        borderBottomWidth: 1,
        borderBottomColor: colors.borderMedium,
    },
    userSection: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
        marginRight: 8,
    },
    nameText: {
        color: colors.textPrimary,
        fontSize: 14,
        fontWeight: "700",
        marginLeft: 8,
        flexShrink: 1,
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 2,
        borderColor: colors.borderMedium,
    },
    statsContainer: {
        flexDirection: "row",
        marginLeft: "auto",
        gap: 12,
    },
    chip: {
        backgroundColor: "transparent",
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 4,
        paddingVertical: 4,
        gap: 4,
    },
    badgeIcon: {
        width: 20,
        height: 20,
        resizeMode: "contain",
    },
    chipText: {
        fontSize: 15,
        fontWeight: "700",
    },
    notLoggedInContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
    },
    promptTextContainer: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
        marginRight: 12,
        gap: 8,
    },
    promptText: {
        color: colors.textPrimary,
        fontSize: 14,
        fontWeight: "600",
        flexShrink: 1,
    },
    loginButton: {
        backgroundColor: colors.primary,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    loginButtonText: {
        color: colors.textLight,
        fontSize: 14,
        fontWeight: "700",
    },
    branchBar: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: colors.background,
    },
    backButton: {
        marginRight: 12,
    },
    homeButton: {
        marginLeft: 12,
    },
    branchTextContainer: {
        flex: 1,
    },
    hierarchyText: {
        fontSize: 12,
        fontWeight: "600",
        color: colors.textMuted,
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    titleText: {
        fontSize: 22,
        fontWeight: "700",
        color: colors.textPrimary,
    },
    subtitleText: {
        fontSize: 15,
        color: colors.textMuted,
        marginTop: 2,
    },
});