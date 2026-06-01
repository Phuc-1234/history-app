import React from "react";
import { StyleSheet, View, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTopBarData } from "../hooks/useTopBarData";
import { TopBar } from "./TopBar";

interface TopBarWrapperProps {
    children: React.ReactNode;
    branchConfig?: {
        hierarchy: string;
        title: string;
        subtitle?: string;
        onBackPress?: () => void;
    };
}

export function TopBarWrapper({ children, branchConfig }: TopBarWrapperProps) {
    const { data, loading } = useTopBarData();

    if (loading) {
        return (
            <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color="#5856D6" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
            <TopBar data={data} branchConfig={branchConfig} />
            <View style={styles.content}>{children}</View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#5856D6", // Background colors align with the Top Bar to prevent flash gaps
    },
    content: {
        flex: 1,
        backgroundColor: "#FFF", // Restores screen background to normal under header
    },
    loaderContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#FFF",
    },
});
