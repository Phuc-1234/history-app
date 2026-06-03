import React from "react";
import { useRouter } from "expo-router";
import { TopBarWrapper } from "../../features/top_bar";
import { TestHistoryScreen } from "../../features/test";

export default function TestHistoryRoute() {
    const router = useRouter();

    return (
        <TopBarWrapper
            branchConfig={{
                hierarchy: "HỒ SƠ > LỊCH SỬ",
                title: "Lịch sử làm bài",
                onBackPress: () => router.back(),
            }}
        >
            <TestHistoryScreen />
        </TopBarWrapper>
    );
}
