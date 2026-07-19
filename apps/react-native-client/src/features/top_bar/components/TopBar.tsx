// features/dashboard/components/TopBar.tsx
import React from "react";
import {
    StyleSheet,
    Text,
    View,
    Image,
    TouchableOpacity,
    Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ProcessedTopBarData } from "../hooks/useTopBarData";
import { colors } from "../../../theme/colors";
import typography from "../../../theme/typography";
import { AvatarWithFrame } from "../../../components/ui";
import { useSideDrawer } from "../../../components/layout/SideDrawerContext";

interface TopBarProps {
    data?: ProcessedTopBarData;
    showStatsBar?: boolean;
    branchConfig?: {
        hierarchy: string;
        title?: string;
        subtitle?: string;
        onBackPress?: () => void;
        onHomePress?: () => void;
        uppercaseHierarchy?: boolean;
        hideBack?: boolean;
        hideHome?: boolean;
        rightElement?: React.ReactNode;
        titleColor?: string;
    };
    onOpenStreak?: () => void;
}

export function TopBar({ data, showStatsBar = true, branchConfig, onOpenStreak }: TopBarProps) {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { openDrawer } = useSideDrawer();

    return (
        <LinearGradient
            colors={[colors.accent, "#d89b65ff"]}
            style={[styles.container, { paddingTop: insets.top }]}
        >
            {/* --- Main Stats Bar --- */}
            {showStatsBar && data && (
                <View style={[styles.purpleBar, branchConfig && styles.purpleBarWithBranch]}>
                    {!data.isLoggedIn ? (
                        /* Anonymous UI View state */
                        <View style={styles.notLoggedInContainer}>
                            <TouchableOpacity
                                style={styles.menuButton}
                                activeOpacity={0.7}
                                onPress={openDrawer}
                            >
                                <Ionicons name="menu" size={26} color="#FFFFFF" />
                            </TouchableOpacity>
                            <View style={styles.promptTextContainer}>
                                <Ionicons
                                    name="person-circle-outline"
                                    size={32}
                                    color="#FFFFFF"
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
                            <TouchableOpacity
                                style={styles.menuButton}
                                activeOpacity={0.7}
                                onPress={openDrawer}
                            >
                                <Ionicons name="menu" size={26} color="#FFFFFF" />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.userSection}
                                activeOpacity={0.7}
                                onPress={() => router.push("/(tabs)/10_1_profile")}
                            >
                                <AvatarWithFrame
                                    uri={data.avatarUri}
                                    frameUri={data.equippedFrameUrl}
                                    size={36}
                                    name={data.name}
                                    borderWidth={1.5}
                                />
                            </TouchableOpacity>

                            <View style={styles.statsContainer}>
                                {/* XP Chip */}
                                <View style={[styles.chip, data.xpMultiplier > 1 && styles.xpMultipliedChip]}>
                                    {data.badgeImgUrl ? (
                                        <Image
                                            source={{ uri: data.badgeImgUrl }}
                                            style={styles.badgeIcon}
                                        />
                                    ) : (
                                        <Ionicons name="ribbon" size={20} color="#FFFFFF" />
                                    )}
                                    <Text style={styles.chipText}>
                                        {data.totalXp}XP
                                    </Text>
                                    {data.xpMultiplier > 1 && (
                                        <View style={styles.multiplierTag}>
                                            <Text style={styles.multiplierTagText}>x{data.xpMultiplier}</Text>
                                        </View>
                                    )}
                                </View>

                                {/* Gold Chip */}
                                <TouchableOpacity
                                    style={[styles.chip, data.goldMultiplier > 1 && styles.goldMultipliedChip]}
                                    activeOpacity={0.7}
                                    onPress={() => router.push("/(tabs)/8_2_buy_gold")}
                                >
                                    <Ionicons
                                        name="logo-usd"
                                        size={18}
                                        color="#FFFFFF"
                                    />
                                    <Text style={styles.chipText}>
                                        {data.totalGold}
                                    </Text>
                                    {data.goldMultiplier > 1 && (
                                        <View style={[styles.multiplierTag, styles.goldMultiplierTag]}>
                                            <Text style={styles.multiplierTagText}>x{data.goldMultiplier}</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>

                                {/* Streak Chip */}
                                <TouchableOpacity
                                    style={styles.chip}
                                    activeOpacity={0.7}
                                    onPress={onOpenStreak}
                                >
                                    <Ionicons name="flame" size={20} color="#FFFFFF" />
                                    <Text style={styles.chipText}>
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
                    {!branchConfig.hideBack && (
                        <Pressable
                            onPress={branchConfig.onBackPress}
                            style={({ pressed }) => [
                                styles.backButton,
                                pressed && styles.buttonPressed
                            ]}
                        >
                            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                        </Pressable>
                    )}

                    <View style={styles.branchTextContainer}>
                        {branchConfig.hierarchy ? (
                            <Text style={[styles.hierarchyText, branchConfig.titleColor && { color: branchConfig.titleColor }]}>
                                {branchConfig.uppercaseHierarchy ? branchConfig.hierarchy.toUpperCase() : branchConfig.hierarchy}
                            </Text>
                        ) : null}
                        {branchConfig.title ? (
                            <Text style={styles.titleText}>
                                {branchConfig.title}
                            </Text>
                        ) : null}
                        {branchConfig.subtitle ? (
                            <Text style={styles.subtitleText}>
                                {branchConfig.subtitle}
                            </Text>
                        ) : null}
                    </View>

                    {branchConfig.rightElement ? (
                        branchConfig.rightElement
                    ) : (
                        !branchConfig.hideHome && (
                            <Pressable
                                onPress={branchConfig.onHomePress || (() => router.push("/(tabs)/home"))}
                                style={({ pressed }) => [
                                    styles.homeButton,
                                    pressed && styles.buttonPressed
                                ]}
                            >
                                <Ionicons name="home-outline" size={24} color="#FFFFFF" />
                            </Pressable>
                        )
                    )}
                </View>
            )}
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        zIndex: 5,
    },
    purpleBar: {
        backgroundColor: "transparent",
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 16,
    },
    menuButton: {
        marginRight: 12,
        justifyContent: "center",
        alignItems: "center",
    },
    purpleBarWithBranch: {
    },
    userSection: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
        marginRight: 8,
    },
    nameText: {
        ...typography.bodyMediumBold,
        color: "#FFFFFF",
        marginLeft: 8,
        flexShrink: 1,
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 2,
        borderColor: "rgba(255, 255, 255, 0.4)",
    },
    statsContainer: {
        flexDirection: "row",
        marginLeft: "auto",
        gap: 8,
    },
    chip: {
        backgroundColor: "rgba(255, 255, 255, 0.18)",
        borderRadius: 16,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 8,
        paddingVertical: 4,
        gap: 4,
        borderWidth: 1.5,
        borderColor: "transparent",
        position: "relative",
    },
    xpMultipliedChip: {
        borderColor: "#007AFF",
    },
    goldMultipliedChip: {
        borderColor: "#FFB800",
    },
    multiplierTag: {
        position: "absolute",
        top: -6,
        right: -6,
        backgroundColor: "#007AFF",
        paddingHorizontal: 4,
        paddingVertical: 1,
        borderRadius: 30,
        borderWidth: 1,
        borderColor: "#FFFFFF",
        zIndex: 10,
    },
    goldMultiplierTag: {
        backgroundColor: "#FFB800",
    },
    multiplierTagText: {
        fontSize: 8,
        fontFamily: typography.fonts.bold,
        color: "#FFFFFF",
    },
    badgeIcon: {
        width: 20,
        height: 20,
        resizeMode: "contain",
    },
    chipText: {
        ...typography.bodyMediumBold,
        color: "#FFFFFF",
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
        ...typography.bodyMediumSemiBold,
        color: "#FFFFFF",
        flexShrink: 1,
    },
    loginButton: {
        backgroundColor: "#FFFFFF",
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    loginButtonText: {
        ...typography.bodyMediumBold,
        color: colors.accent,
    },
    branchBar: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: "transparent",
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
        marginLeft: -8,
        marginRight: 4,
    },
    homeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
        marginLeft: 4,
        marginRight: -8,
    },
    buttonPressed: {
        backgroundColor: "rgba(255, 255, 255, 0.2)",
    },
    branchTextContainer: {
        flex: 1,
    },
    hierarchyText: {
        ...typography.bodySmallSemiBold,
        color: "rgba(255, 255, 255, 0.75)",
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    titleText: {
        ...typography.h3,
        color: "#FFFFFF",
    },
    subtitleText: {
        ...typography.bodyMedium,
        color: "rgba(255, 255, 255, 0.85)",
        marginTop: 2,
    },
});