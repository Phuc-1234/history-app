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

interface TopNavBarProps {
    tabs: TabOption[];
    activeTab: string;
    onChangeTab: (key: string) => void;
    containerStyle?: any;
    activeColor?: string;
    inactiveColor?: string;
    backgroundColor?: string;
}

export const TopNavBar: React.FC<TopNavBarProps> = ({
    tabs,
    activeTab,
    onChangeTab,
    containerStyle,
    activeColor = colors.primary,
    inactiveColor = colors.textMuted,
    backgroundColor = colors.surface,
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
                friction: 8,
            }).start();
        }
    }, [activeIndex, tabWidth, containerWidth]);

    const onLayout = (event: LayoutChangeEvent) => {
        const { width } = event.nativeEvent.layout;
        setContainerWidth(width);
    };

    return (
        <View style={[styles.container, { backgroundColor }, containerStyle]} onLayout={onLayout}>
            <View style={styles.bottomLine} />
            {containerWidth > 0 && (
                <Animated.View
                    style={[
                        styles.indicator,
                        {
                            width: tabWidth,
                            transform: [{ translateX: slideAnim }],
                            backgroundColor: activeColor,
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
                                { color: isActive ? activeColor : inactiveColor },
                            ]}
                        >
                            {tab.label.toUpperCase()}
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
        alignItems: "center",
        height: 48,
    },
    bottomLine: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 1,
        backgroundColor: colors.borderLight,
    },
    indicator: {
        position: "absolute",
        bottom: 0,
        left: 0,
        height: 3,
    },
    tabButton: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
    },
    tabText: {
        fontSize: 14,
        fontWeight: "500",
        letterSpacing: 0.5,
    },
});
