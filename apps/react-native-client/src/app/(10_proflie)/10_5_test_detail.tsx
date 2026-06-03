import React from "react";
import { View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import SubPageHeader from "../../features/profile/components/SubPageHeader";
import { TestDetailScreen } from "../../features/test";

export default function TestDetailRoute() {
    const router = useRouter();

    return (
        <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
            <SubPageHeader
                title="Chi tiết bài làm"
                onBackPress={() => router.back()}
            />
            <TestDetailScreen />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F8F7FF",
    },
});
