import React from "react";
import { useRouter } from "expo-router";
import { StyleSheet } from "react-native";
import { colors } from "@/theme/colors";
import { ScreenWrapper, type BranchConfig } from "@/components/layout/ScreenWrapper";

/**
 * Vỏ màn hình dùng chung cho các màn social/challenge: bọc `ScreenWrapper`
 * với thanh điều hướng "back/home" (branchConfig) dựa trên tiêu đề màn hình.
 */
export function ScreenShell({
    title,
    rightLabel: _rightLabel,
    children,
}: {
    title: string;
    rightLabel?: string;
    children: React.ReactNode;
}) {
    const router = useRouter();
    const branchConfig: BranchConfig = {
        hierarchy: title,
        onBackPress: () => router.back(),
        onHomePress: () => router.push("/(tabs)/2_1_lessons"),
    };

    return (
        <ScreenWrapper
            showTopBar={false}
            branchConfig={branchConfig}
            style={styles.safeArea}
        >
            {children}
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: colors.background,
    },
});
