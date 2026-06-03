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
        <View style={[styles.iconWrapper, focused && styles.activePillBackground]}>
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
                    
                    // Let layout size naturally via padding
                    height: Platform.OS === "web" ? 70 : "auto", 
                    
                    // Balanced top/bottom spacing that responds dynamically to system overlays
                    paddingTop: 12,
                    paddingBottom: Platform.OS === "ios" 
                        ? insets.bottom 
                        : Math.max(insets.bottom, 12),
                    
                    borderTopLeftRadius: 24,
                    borderTopRightRadius: 24,
                    position: "absolute",
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
    },
    activePillBackground: {
        backgroundColor: "#5F4DE5",
    },
});