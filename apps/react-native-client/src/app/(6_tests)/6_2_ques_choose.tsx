import React from "react";
import { useLocalSearchParams } from "expo-router";
import { TestContainerV2 } from "../../features/test_v2";
import type { ScopeType, StartTestV2Request } from "../../features/test_v2/types";

export default function QuestionsScreen() {
    const { testId, scopeType, scopeId } = useLocalSearchParams<{
        testId?: string;
        scopeType?: string;
        scopeId?: string;
    }>();

    const params: StartTestV2Request = {
        presetId: "exam1",
        scopeType: scopeType as ScopeType,
        scopeId: scopeId ? parseInt(scopeId, 10) : undefined,
        ...(scopeType ? {} : { testId }),
    };

    return (
        <TestContainerV2 params={params} />
    );
}
