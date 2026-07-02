import React, { useEffect, useRef, useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Animated,
    LayoutChangeEvent,
} from "react-native";
import { colors } from "../theme/colors";

export interface TabOption {
    key: string;
    label: string;
}

interface SlidingTabBarProps {
    tabs: TabOption[];
    activeTab: string;
    onChangeTab: (key: string) => void;
    containerStyle?: any;
    activeColor?: string;
    inactiveColor?: string;
    indicatorColor?: string;
}

export const SlidingTabBar: React.FC<SlidingTabBarProps> = ({
    tabs,
    activeTab,
    onChangeTab,
    containerStyle,
    activeColor,
    inactiveColor,
    indicatorColor,
}) => {
    const [containerWidth, setContainerWidth] = useState(0);
    const slideAnim = useRef(new Animated.Value(0)).current;

    const activeIndex = tabs.findIndex((tab) => tab.key === activeTab);
    const tabWidth = containerWidth > 0 ? containerWidth / tabs.length : 0;

    useEffect(() => {
        if (containerWidth > 0 && activeIndex !== -1) {
            Animated.spring(slideAnim, {
                toValue: activeIndex * tabWidth,
                useNativeDriver: true,
                tension: 40,
                friction: 7,
            }).start();
        }
    }, [activeIndex, tabWidth, containerWidth]);

    const onLayout = (event: LayoutChangeEvent) => {
        const { width } = event.nativeEvent.layout;
        setContainerWidth(width);
    };

    return (
        <View style={[styles.container, containerStyle]} onLayout={onLayout}>
            {containerWidth > 0 && (
                <Animated.View
                    style={[
                        styles.indicator,
                        {
                            width: tabWidth - 8,
                            transform: [{ translateX: slideAnim }],
                            backgroundColor: indicatorColor ?? colors.accent,
                        },
                    ]}
                />
            )}
            {tabs.map((tab) => {
                const isActive = tab.key === activeTab;
                return (
                    <TouchableOpacity
                        key={tab.key}
                        style={styles.tabButton}
                        onPress={() => onChangeTab(tab.key)}
                        activeOpacity={0.8}
                    >
                        <Text
                            style={[
                                styles.tabText,
                                isActive
                                    ? [styles.activeText, activeColor ? { color: activeColor } : null]
                                    : [styles.inactiveText, inactiveColor ? { color: inactiveColor } : null],
                            ]}
                        >
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        position: "relative",
        backgroundColor: colors.surfaceVariant,
        borderRadius: 5,
        padding: 4,
        alignItems: "center",
    },
    indicator: {
        position: "absolute",
        top: 4,
        bottom: 4,
        left: 4,
        backgroundColor: colors.accent,
        borderRadius: 5,
    },
    tabButton: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 11,
        zIndex: 1,
    },
    tabText: {
        fontSize: 15,
        fontWeight: "500", // Low-mid font weight
    },
    activeText: {
        color: colors.textLight,
    },
    inactiveText: {
        color: colors.accent,
    },
});
