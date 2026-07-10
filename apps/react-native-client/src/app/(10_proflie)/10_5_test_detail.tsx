import React from "react";
import { useRouter } from "expo-router";
import { ScreenWrapper } from "../../components/layout/ScreenWrapper";
// import { TestDetailScreen } from "../../features/test";
import { TestDetailScreen } from "../../features/test_v2";

export default function TestDetailRoute() {
    const router = useRouter();

    return (
        <ScreenWrapper
            showTopBar={false}
            branchConfig={{
                hierarchy: "LỊCH SỬ > CHI TIẾT",
                title: "Chi tiết bài làm",
                onBackPress: () => router.back(),
            }}
        >
            {/* <TestDetailScreen /> */}
            <TestDetailScreen />
        </ScreenWrapper>
    );
}
