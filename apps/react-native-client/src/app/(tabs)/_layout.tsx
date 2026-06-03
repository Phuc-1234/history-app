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
        <View
            style={[styles.iconWrapper, focused && styles.activePillBackground]}
        >
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

    // Resolve the real padding required to clear the translucent hardware buttons safely
    const finalBottomPadding = isWeb
        ? 12
        : hasInitialInsets
          ? insets.bottom + 8 // Safe inset + a little breathing room
          : 24; // Sensible default fallback while the frame initializes

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarShowLabel: false,
                tabBarActiveTintColor: "#FFFFFF",
                tabBarInactiveTintColor: "#4E4A58",

                tabBarStyle: {
                    backgroundColor: "#F3EFEA",
                    borderTopWidth: 0,
                    elevation: 0,
                    shadowOpacity: 0,

                    // Auto-height for mobile layouts
                    height: isWeb ? 70 : "auto",

                    // Balanced vertical spacing
                    paddingTop: 12,
                    paddingBottom: finalBottomPadding,

                    // FIX: Add horizontal padding to prevent edge icons from clipping
                    paddingHorizontal: 16,

                    borderTopLeftRadius: 24,
                    borderTopRightRadius: 24,

                    position: "relative",
                    bottom: 0,
                    left: 0,
                    right: 0,
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
                name="2_1_lessons"
                options={{
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
                name="7_1_inventory"
                options={{
                    tabBarIcon: ({ focused, color }) => (
                        <TabBarIcon
                            focused={focused}
                            color={color}
                            name="cube-outline"
                            focusedName="cube"
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="8_1_store"
                options={{
                    tabBarIcon: ({ focused, color }) => (
                        <TabBarIcon
                            focused={focused}
                            color={color}
                            name="storefront-outline"
                            focusedName="storefront"
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="9_1_leaderboard"
                options={{
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
        height: 40,
        width: Platform.OS === "web" ? 72 : 64,
        borderRadius: 20,
        // Removed any system margins that were offsetting icons inside layout views
    },
    activePillBackground: {
        backgroundColor: "#5F4DE5",
    },
});
