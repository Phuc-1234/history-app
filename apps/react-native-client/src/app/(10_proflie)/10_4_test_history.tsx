import React from "react";
import { View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import SubPageHeader from "../../features/profile/components/SubPageHeader";
import { TestHistoryScreen } from "../../features/test";

export default function TestHistoryRoute() {
    const router = useRouter();

    return (
        <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
            <SubPageHeader
                title="Lịch sử làm bài"
                onBackPress={() => router.back()}
            />
            <TestHistoryScreen />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F8F7FF",
    },
});
