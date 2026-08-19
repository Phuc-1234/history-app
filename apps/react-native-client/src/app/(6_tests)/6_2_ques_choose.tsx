import React from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { TestContainerV2 } from "../../features/test_v2";
import type { ScopeType, PurposeType, StartTestV2Request } from "../../features/test_v2/types";

export default function QuestionsScreen() {
    const router = useRouter();
    const { testId, scopeType, scopeId, purposeType, skipIntro, questionCount, autoPickStrategy } = useLocalSearchParams<{
        testId?: string;
        scopeType?: string;
        scopeId?: string;
        purposeType?: string;
        skipIntro?: string;
        questionCount?: string;
        autoPickStrategy?: string;
    }>();

    const parsedCount = questionCount ? parseInt(questionCount, 10) : undefined;
    const validCount = parsedCount && !isNaN(parsedCount) && parsedCount > 0 ? parsedCount : undefined;

    const params: StartTestV2Request = {
        scopeType: scopeType as ScopeType | undefined,
        scopeId: scopeId ? parseInt(scopeId, 10) : undefined,
        purposeType: (purposeType as PurposeType) || "PRACTICE",
        ...(testId ? { testId } : {}),
        ...(validCount ? { questionCount: validCount } : {}),
        ...(autoPickStrategy ? { autoPickStrategy } : {}),
    };

    return (
        <TestContainerV2 params={params} onExit={() => router.back()} skipIntro={skipIntro === "true"} />
    );
}
