import React from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { PvpMainScreen } from "@/features/pvp";

export default function PvpRoute() {
    const router = useRouter();
    const params = useLocalSearchParams<{
        initialMode?: string;
        initialTestId?: string;
        initialScopeType?: string;
        initialScopeId?: string;
        initialQuestionCount?: string;
    }>();

    return (
        <PvpMainScreen
            onExit={() => router.back()}
            initialMode={params.initialMode as any}
            initialTestId={params.initialTestId}
            initialScopeType={params.initialScopeType}
            initialScopeId={params.initialScopeId ? parseInt(params.initialScopeId, 10) : undefined}
            initialQuestionCount={params.initialQuestionCount ? parseInt(params.initialQuestionCount, 10) : undefined}
        />
    );
}
