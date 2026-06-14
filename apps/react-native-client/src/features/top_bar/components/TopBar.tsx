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

interface TopBarProps {
    data: ProcessedTopBarData;
    branchConfig?: {
        hierarchy: string;
        title: string;
        subtitle?: string;
        onBackPress?: () => void;
    };
    onOpenStreak?: () => void;
}

export function TopBar({ data, branchConfig, onOpenStreak }: TopBarProps) {
    const router = useRouter();

    return (
        <View style={styles.container}>
            {/* --- Main Purple Stats Bar --- */}
            <View style={styles.purpleBar}>
                {!data.isLoggedIn ? (
                    /* Anonymous UI View state */
                    <View style={styles.notLoggedInContainer}>
                        <View style={styles.promptTextContainer}>
                            <Ionicons
                                name="person-circle-outline"
                                size={32}
                                color="rgba(255, 255, 255, 0.8)"
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
                                    <Ionicons name="ribbon" size={16} color="#FF9500" />
                                )}
                                <Text style={styles.chipText}>{data.totalXp}XP</Text>
                            </View>

                            {/* Gold Chip */}
                            <TouchableOpacity
                                style={styles.chip}
                                activeOpacity={0.7}
                                onPress={() => router.push("/(tabs)/8_2_buy_gold")}
                            >
                                <Ionicons
                                    name="logo-usd"
                                    size={14}
                                    color="#FFA500"
                                    style={styles.goldIcon}
                                />
                                <Text style={styles.chipText}>{data.totalGold}</Text>
                            </TouchableOpacity>


                            {/* Streak Chip */}
                            <TouchableOpacity
                                style={styles.chip}
                                activeOpacity={0.7}
                                onPress={onOpenStreak}
                            >
                                <Ionicons name="flame" size={16} color="#FF9500" />
                                <Text style={styles.chipText}>{data.currentStreak}</Text>
                            </TouchableOpacity>
                        </View>
                    </>
                )}
            </View>

            {/* --- Optional Branch Bar Layout Block --- */}
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
    container: { backgroundColor: "#FFF" },
    purpleBar: {
        backgroundColor: "#5856D6",
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 16,
    },
    userSection: { flexDirection: "row", alignItems: "center", flex: 1, marginRight: 8 },
    nameText: { color: "#FFF", fontSize: 14, fontWeight: "700", marginLeft: 8, flexShrink: 1 },
    avatar: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: "#E5E5EA" },
    statsContainer: { flexDirection: "row", marginLeft: "auto", gap: 6 },
    chip: { backgroundColor: "rgba(255, 255, 255, 0.18)", flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, gap: 4 },
    badgeIcon: { width: 16, height: 16, resizeMode: "contain" },
    goldIcon: { backgroundColor: "#FF9500", borderRadius: 7, paddingHorizontal: 2 },
    chipText: { color: "#FFF", fontSize: 14, fontWeight: "700" },
    notLoggedInContainer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", width: "100%" },
    promptTextContainer: { flexDirection: "row", alignItems: "center", flex: 1, marginRight: 12, gap: 8 },
    promptText: { color: "#FFF", fontSize: 14, fontWeight: "600", flexShrink: 1 },
    loginButton: { backgroundColor: "#FFF", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
    loginButtonText: { color: "#5856D6", fontSize: 14, fontWeight: "700" },
    branchBar: { flexDirection: "row", alignItems: "flex-start", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#F2F2F7" },
    backButton: { marginRight: 12, paddingTop: 2 },
    branchTextContainer: { flex: 1 },
    hierarchyText: { fontSize: 12, fontWeight: "600", color: "#8E8E93", letterSpacing: 0.5, marginBottom: 2 },
    titleText: { fontSize: 22, fontWeight: "700", color: "#1C1C1E" },
    subtitleText: { fontSize: 15, color: "#8E8E93", marginTop: 2 },
});