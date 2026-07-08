import React from "react";
import {
    View,
    StyleSheet,
    Platform,
    Pressable,
    ColorValue,
} from "react-native";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";

interface TabIconProps {
    focused: boolean;
    color: ColorValue;
    name: React.ComponentProps<typeof Ionicons>["name"];
    focusedName: React.ComponentProps<typeof Ionicons>["name"];
}

const TabBarIcon: React.FC<TabIconProps> = ({
    focused,
    color,
    name,
    focusedName,
}) => {
    return (
        <View style={styles.iconWrapper}>
            <Ionicons
                name={focused ? focusedName : name}
                size={22}
                color={color}
            />
        </View>
    );
};

export default function TabsLayout() {
    const insets = useSafeAreaInsets();
    
    const isWeb = Platform.OS === "web";

    // Detect if safe-area-context hasn't returned the real measurement yet
    const hasInitialInsets = insets.bottom > 0;

    // 1. Resolve padding
    const finalBottomPadding = isWeb
        ? 12
        : hasInitialInsets
          ? insets.bottom + 6 // Adjusted slightly for balance
          : 12; 

    // 2. Resolve an explicit height instead of using "auto"
    const finalTabHeight = isWeb 
        ? 76 
        : hasInitialInsets 
          ? 60 + insets.bottom  // Standard tab height + dynamic notch space
          : 72;                 // Safe fallback for physical hardware buttons

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarShowLabel: true,
                tabBarActiveTintColor: colors.accent,
                tabBarInactiveTintColor: colors.textMuted,
                tabBarLabelStyle: {
                    ...typography.caption,
                    fontFamily: typography.fonts.semiBold,
                    marginTop: 2,
                },

                tabBarStyle: {
                    backgroundColor: colors.surface,
                    borderTopWidth: 0,
                    elevation: 8,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: -3 },
                    shadowOpacity: 0.06,
                    shadowRadius: 8,

                    // Auto-height for mobile layouts
                    height: finalTabHeight,

                    // Balanced vertical spacing
                    paddingTop: 2,
                    paddingBottom: finalBottomPadding,

                    // FIX: Add horizontal padding to prevent edge icons from clipping
                    paddingHorizontal: 16,
                },

                tabBarButton: ({
                    onPress,
                    onLongPress,
                    disabled,
                    children,
                    style,
                }) => (
                    <Pressable
                        onPress={onPress || undefined}
                        onLongPress={onLongPress || undefined}
                        disabled={disabled || undefined}
                        hitSlop={8}
                        style={style}
                        android_ripple={null}
                    >
                        {children}
                    </Pressable>
                ),
            }}
        >
            <Tabs.Screen
                name="home"
                options={{
                    title: "Trang chủ",
                    tabBarIcon: ({ focused, color }) => (
                        <TabBarIcon
                            focused={focused}
                            color={color}
                            name="home-outline"
                            focusedName="home"
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="2_1_lessons"
                options={{
                    title: "Bài học",
                    tabBarIcon: ({ focused, color }) => (
                        <TabBarIcon
                            focused={focused}
                            color={color}
                            name="book-outline"
                            focusedName="book"
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="5_1_national_tests"
                options={{
                    title: "Luyện đề",
                    tabBarIcon: ({ focused, color }) => (
                        <TabBarIcon
                            focused={focused}
                            color={color}
                            name="clipboard-outline"
                            focusedName="clipboard"
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="7_1_item"
                options={{
                    href: null,
                }}
            />
            <Tabs.Screen
                name="8_2_buy_gold"
                options={{
                    href: null,
                }}
            />

            <Tabs.Screen
                name="9_1_leaderboard"
                options={{
                    title: "Xếp hạng",
                    tabBarIcon: ({ focused, color }) => (
                        <TabBarIcon
                            focused={focused}
                            color={color}
                            name="stats-chart-outline"
                            focusedName="stats-chart"
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="10_1_profile"
                options={{
                    title: "Hồ sơ",
                    tabBarIcon: ({ focused, color }) => (
                        <TabBarIcon
                            focused={focused}
                            color={color}
                            name="person-outline"
                            focusedName="person"
                        />
                    ),
                }}
            />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    iconWrapper: {
        alignItems: "center",
        justifyContent: "center",
        height: 32,
        width: Platform.OS === "web" ? 72 : 64,
        borderRadius: 16,
        // Removed any system margins that were offsetting icons inside layout views
    },
});
