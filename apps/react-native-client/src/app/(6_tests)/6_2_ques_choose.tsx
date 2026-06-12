import React from "react";
import { useLocalSearchParams } from "expo-router";
import { ScreenWrapper } from "../../components/layout/ScreenWrapper";
import { TestContainer } from "../../features/test";

export default function QuestionsScreen() {
    const { testId } = useLocalSearchParams<{ testId?: string }>();
    return (
        <ScreenWrapper>
            <TestContainer testId={testId} />
        </ScreenWrapper>
    );
}
