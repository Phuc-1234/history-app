import React from "react";
import { useRouter } from "expo-router";
import { TopBarWrapper } from "../../features/top_bar";
import { TestDetailScreen } from "../../features/test";

export default function TestDetailRoute() {
    const router = useRouter();

    return (
        <TopBarWrapper
            branchConfig={{
                hierarchy: "LỊCH SỬ > CHI TIẾT",
                title: "Chi tiết bài làm",
                onBackPress: () => router.back(),
            }}
        >
            <TestDetailScreen />
        </TopBarWrapper>
    );
}
