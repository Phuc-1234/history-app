import React from "react";
import { useRouter } from "expo-router";
import { ScreenWrapper } from "../../components/layout/ScreenWrapper";
// import { TestHistoryScreen } from "../../features/test";
import { TestHistoryScreen } from "../../features/test_v2";

export default function TestHistoryRoute() {
    const router = useRouter();

    return (
        <ScreenWrapper
            branchConfig={{
                hierarchy: "HỒ SƠ > LỊCH SỬ",
                title: "Lịch sử làm bài",
                onBackPress: () => router.back(),
            }}
        >
            {/* <TestHistoryScreen /> */}
            <TestHistoryScreen />
        </ScreenWrapper>
    );
}
