import React, { createContext, useContext, useState, useRef, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    Animated,
    Dimensions,
    Pressable,
    TouchableOpacity,
    Platform,
    PanResponder,
    Image,
    ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useSegments } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Zap, Coins } from "lucide-react-native";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";
import { useTopBarData } from "../../features/top_bar/hooks/useTopBarData";
import { AvatarWithFrame } from "../ui";
import { StreakDrawerModal } from "../../features/streak";
import { TierDrawerModal } from "../../features/tier";

const DRAWER_WIDTH = 280;

interface SideDrawerContextType {
    openDrawer: () => void;
    closeDrawer: () => void;
    isOpen: boolean;
}

const SideDrawerContext = createContext<SideDrawerContextType | undefined>(undefined);

export function useSideDrawer() {
    const context = useContext(SideDrawerContext);
    if (!context) {
        throw new Error("useSideDrawer must be used within a SideDrawerProvider");
    }
    return context;
}

export function SideDrawerProvider({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [renderDrawer, setRenderDrawer] = useState(false);
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const segments = useSegments() as string[];
    const { data, streakManager, tierManager } = useTopBarData();

    const slideAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    const openPanResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, gestureState) => {
                return gestureState.dx > 10 && Math.abs(gestureState.dy) < 30;
            },
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dx > 30) {
                    openDrawer();
                }
            },
        })
    ).current;

    const closePanResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => false,
            onMoveShouldSetPanResponder: (_, gestureState) => {
                return gestureState.dx < -10 && Math.abs(gestureState.dy) < 30;
            },
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dx < -30) {
                    closeDrawer();
                }
            },
        })
    ).current;

    const openDrawer = () => {
        setIsOpen(true);
        setRenderDrawer(true);
    };

    const closeDrawer = () => {
        setIsOpen(false);
    };

    useEffect(() => {
        const useNative = Platform.OS !== "web";
        if (isOpen) {
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: 1,
                    duration: 250,
                    useNativeDriver: useNative,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 250,
                    useNativeDriver: useNative,
                }),
            ]).start();
        } else if (renderDrawer) {
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: useNative,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: useNative,
                }),
            ]).start(() => {
                setRenderDrawer(false);
            });
        }
    }, [isOpen, renderDrawer]);

    const activeTab = (() => {
        if (segments.includes("home")) return "home";
        if (segments.includes("2_1_lessons")) return "lessons";
        if (segments.includes("5_1_national_tests")) return "tests";
        if (segments.includes("9_1_leaderboard")) return "leaderboard";
        if (segments.includes("10_1_profile")) return "profile";
        if (segments.includes("7_1_item")) return "items";
        if (segments.includes("8_2_buy_gold")) return "buy_gold";
        if (segments.includes("notifications")) return "notifications";
        if (segments.includes("friends")) return "friends";
        if (segments.includes("10_4_test_history")) return "test_history";
        if (segments.includes("10_6_feedback")) return "feedback";
        if (segments.includes("10_8_subscription")) return "subscription";
        return "";
    })();

    const handleTabPress = (route: string) => {
        closeDrawer();
        router.navigate(route as any);
    };

    const drawerX = slideAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [-DRAWER_WIDTH, 0],
    });

    const overlayOpacity = fadeAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
    });

    const tabsConfig = [
        { id: "home", label: "Trang chủ", icon: "home-outline", activeIcon: "home", route: "/(tabs)/home" },
        { id: "lessons", label: "Bài học", icon: "book-outline", activeIcon: "book", route: "/(tabs)/2_1_lessons" },
        { id: "tests", label: "Luyện đề", icon: "clipboard-outline", activeIcon: "clipboard", route: "/(tabs)/5_1_national_tests" },
        { id: "leaderboard", label: "Bảng xếp hạng", icon: "stats-chart-outline", activeIcon: "stats-chart", route: "/(tabs)/9_1_leaderboard" },
        { id: "profile", label: "Hồ sơ cá nhân", icon: "person-outline", activeIcon: "person", route: "/(tabs)/10_1_profile" },
        { id: "items", label: "Cửa hàng", icon: "cart-outline", activeIcon: "cart", route: "/(tabs)/7_1_item" },
        { id: "buy_gold", label: "Nạp vàng", icon: "cash-outline", activeIcon: "cash", route: "/(tabs)/8_2_buy_gold" },
        { id: "notifications", label: "Thông báo", icon: "notifications-outline", activeIcon: "notifications", route: "/notifications" },
        { id: "friends", label: "Bạn bè", icon: "people-outline", activeIcon: "people", route: "/(social)/friends" },
        { id: "test_history", label: "Lịch sử làm bài", icon: "time-outline", activeIcon: "time", route: "/(10_proflie)/10_4_test_history" },
        { id: "feedback", label: "Gửi góp ý", icon: "chatbubble-ellipses-outline", activeIcon: "chatbubble-ellipses", route: "/(10_proflie)/10_6_feedback" },
        { id: "subscription", label: "Đăng ký gói", icon: "card-outline", activeIcon: "card", route: "/(10_proflie)/10_8_subscription" },
    ];

    const isDrawerAvailable = segments.includes("(tabs)");

    return (
        <SideDrawerContext.Provider value={{ openDrawer, closeDrawer, isOpen }}>
            {children}
            {isDrawerAvailable && !isOpen && (
                <View
                    style={styles.swipeOpenHandle}
                    {...openPanResponder.panHandlers}
                />
            )}
            {renderDrawer && (
                <View style={StyleSheet.absoluteFill}>
                    {/* Backdrop */}
                    <Animated.View style={[styles.backdrop, { opacity: overlayOpacity }]}>
                        <Pressable style={styles.backdropPressable} onPress={closeDrawer} />
                    </Animated.View>

                    {/* Drawer Panel */}
                    <Animated.View
                        style={[
                            styles.drawerContainer,
                            {
                                transform: [{ translateX: drawerX }],
                                paddingTop: insets.top + 20,
                                paddingBottom: insets.bottom + 20,
                                paddingLeft: Math.max(insets.left, 16),
                            },
                        ]}
                        {...closePanResponder.panHandlers}
                    >
                        {/* Drawer Header */}
                        <View style={styles.drawerHeader}>
                            {data.isLoggedIn ? (
                                <View style={styles.profileSection}>
                                    <AvatarWithFrame
                                        uri={data.avatarUri}
                                        frameUri={data.equippedFrameUrl}
                                        size={64}
                                        name={data.name}
                                        borderWidth={2}
                                    />
                                    <Text style={styles.drawerName} numberOfLines={1}>
                                        {data.name || "Bạn"}
                                    </Text>
                                    <View style={styles.drawerStatsRow}>
                                        {/* XP Chip */}
                                        <TouchableOpacity
                                            style={[styles.drawerChip, data.xpMultiplier > 1 && styles.xpMultipliedChip]}
                                            activeOpacity={0.7}
                                            onPress={() => {
                                                closeDrawer();
                                                tierManager.openTierDrawer();
                                            }}
                                        >
                                            {data.badgeImgUrl ? (
                                                <Image
                                                    source={{ uri: data.badgeImgUrl }}
                                                    style={styles.badgeIcon}
                                                />
                                            ) : (
                                                <Zap size={14} color={colors.secondary} />
                                            )}
                                            <Text style={styles.chipText}>
                                                {data.totalXp}XP
                                            </Text>
                                            {data.xpMultiplier > 1 && (
                                                <View style={styles.multiplierTag}>
                                                    <Text style={styles.multiplierTagText}>x{data.xpMultiplier}</Text>
                                                </View>
                                            )}
                                        </TouchableOpacity>

                                        {/* Gold Chip */}
                                        <TouchableOpacity
                                            style={[styles.drawerChip, data.goldMultiplier > 1 && styles.goldMultipliedChip]}
                                            activeOpacity={0.7}
                                            onPress={() => {
                                                closeDrawer();
                                                router.push("/(tabs)/8_2_buy_gold");
                                            }}
                                        >
                                            <Coins size={14} color={colors.gold} />
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
                                            style={styles.drawerChip}
                                            activeOpacity={0.7}
                                            onPress={() => {
                                                closeDrawer();
                                                streakManager.openStreakDrawer();
                                            }}
                                        >
                                            <Ionicons name="flame" size={14} color={colors.warning} />
                                            <Text style={styles.chipText}>
                                                {data.currentStreak}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ) : (
                                <View style={styles.profileSection}>
                                    <Ionicons name="person-circle-outline" size={64} color={colors.textMuted} />
                                    <Text style={styles.drawerName}>Khách</Text>
                                    <TouchableOpacity
                                        style={styles.loginBtn}
                                        activeOpacity={0.8}
                                        onPress={() => {
                                            closeDrawer();
                                            router.push("/(1_auth)/1_1_login");
                                        }}
                                    >
                                        <Text style={styles.loginBtnText}>Đăng nhập</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>

                        {/* Drawer Tabs */}
                        <ScrollView
                            style={styles.tabsScrollView}
                            contentContainerStyle={styles.tabsContainer}
                            showsVerticalScrollIndicator={false}
                        >
                            {tabsConfig.map((tab) => {
                                const isActive = activeTab === tab.id;
                                return (
                                    <TouchableOpacity
                                        key={tab.id}
                                        style={[
                                            styles.tabItem,
                                            isActive && styles.tabItemActive,
                                        ]}
                                        activeOpacity={0.7}
                                        onPress={() => handleTabPress(tab.route)}
                                    >
                                        <Ionicons
                                            name={(isActive ? tab.activeIcon : tab.icon) as any}
                                            size={22}
                                            color={isActive ? colors.primary : colors.textSecondary}
                                            style={styles.tabIcon}
                                        />
                                        <Text
                                            style={[
                                                styles.tabLabel,
                                                isActive && styles.tabLabelActive,
                                            ]}
                                        >
                                            {tab.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </Animated.View>
                </View>
            )}
            {data.isLoggedIn && (
                <>
                    <StreakDrawerModal
                        visible={streakManager.streakDrawerVisible}
                        onClose={streakManager.closeStreakDrawer}
                        currentStreak={data.currentStreak}
                    />
                    <TierDrawerModal
                        visible={tierManager.tierDrawerVisible}
                        onClose={tierManager.closeTierDrawer}
                        totalXp={data.totalXp}
                        currentTierIndex={data.currentTierIndex}
                    />
                </>
            )}
        </SideDrawerContext.Provider>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.4)",
    },
    backdropPressable: {
        flex: 1,
    },
    drawerContainer: {
        position: "absolute",
        top: 0,
        bottom: 0,
        left: 0,
        width: DRAWER_WIDTH,
        backgroundColor: colors.background,
        borderTopRightRadius: 12,
        borderBottomRightRadius: 12,
        paddingRight: 16,
    },
    drawerHeader: {
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderLight,
        marginBottom: 20,
    },
    profileSection: {
        alignItems: "center",
        gap: 8,
    },
    drawerName: {
        fontFamily: typography.fonts.bold,
        fontSize: 18,
        color: colors.textPrimary,
        marginTop: 4,
    },
    drawerStatsRow: {
        flexDirection: "row",
        gap: 6,
        marginTop: 6,
        justifyContent: "center",
        flexWrap: "wrap",
    },
    drawerChip: {
        backgroundColor: colors.background,
        borderColor: colors.borderLight,
        borderWidth: 1.5,
        borderRadius: 12,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 8,
        paddingVertical: 5,
        gap: 4,
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
        width: 14,
        height: 14,
        resizeMode: "contain",
    },
    chipText: {
        fontFamily: typography.fonts.bold,
        fontSize: 11,
        color: colors.textPrimary,
    },
    loginBtn: {
        backgroundColor: colors.primary,
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 30, // pill button border radius = 30
        marginTop: 4,
    },
    loginBtnText: {
        fontFamily: typography.fonts.bold,
        fontSize: 14,
        color: "#FFFFFF",
    },
    tabsScrollView: {
        flex: 1,
    },
    tabsContainer: {
        gap: 8,
        paddingBottom: 20,
    },
    tabItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12, // container border radius = 12
        backgroundColor: "transparent",
    },
    tabItemActive: {
        backgroundColor: colors.primaryContainer,
    },
    tabIcon: {
        marginRight: 14,
        width: 24,
        textAlign: "center",
    },
    tabLabel: {
        fontFamily: typography.fonts.medium,
        fontSize: 15,
        color: colors.textPrimary,
    },
    tabLabelActive: {
        fontFamily: typography.fonts.bold,
        color: colors.primary,
    },
    swipeOpenHandle: {
        position: "absolute",
        top: 0,
        bottom: 0,
        left: 0,
        width: 25,
        backgroundColor: "transparent",
        zIndex: 999,
    },
});
