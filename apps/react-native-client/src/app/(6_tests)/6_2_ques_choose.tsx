import React from "react";
import { useLocalSearchParams } from "expo-router";
import { TestContainer } from "../../features/test";

export default function QuestionsScreen() {
    const { testId } = useLocalSearchParams<{ testId?: string }>();
    return <TestContainer testId={testId} />;
}
