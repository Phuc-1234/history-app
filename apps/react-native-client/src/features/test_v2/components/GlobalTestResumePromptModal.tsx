import React, { useEffect, useState, useRef, useCallback } from "react";
import { AppState, type AppStateStatus } from "react-native";
import { usePathname, useRouter } from "expo-router";
import { useAppSelector } from "@/store/storeHook";
import { useCheckResumableQuery, useAbandonTestMutation } from "../services/testApi";
import { ResumeTestPromptModal } from "./ResumeTestPromptModal";
import { usePreventDoubleTap } from "@/hooks/usePreventDoubleTap";

export function GlobalTestResumePromptModal() {
    const router = useRouter();
    const pathname = usePathname();
    const preventDoubleTap = usePreventDoubleTap();
    const profile = useAppSelector((state) => state.auth.profile);

    const [visible, setVisible] = useState(false);
    const lastPromptedPathRef = useRef<string | null>(null);
    const lastPromptedLogIdRef = useRef<string | null>(null);
    const hasInitialPromptedRef = useRef(false);

    const {
        data: resumableData,
        isSuccess,
        refetch,
    } = useCheckResumableQuery(undefined, {
        skip: !profile,
    });

    const [abandonTestMut, { isLoading: isAbandoning }] = useAbandonTestMutation();

    // Re-check when app returns from background / lock screen
    useEffect(() => {
        const subscription = AppState.addEventListener("change", (nextAppState: AppStateStatus) => {
            if (nextAppState === "active" && profile) {
                refetch();
            }
        });
        return () => {
            subscription.remove();
        };
    }, [profile, refetch]);

    // Reset lastPromptedPathRef when inside test runner so returning triggers prompt
    useEffect(() => {
        if (pathname?.includes("6_2_ques_choose")) {
            lastPromptedPathRef.current = null;
            setVisible(false);
        }
    }, [pathname]);

    // Prompt logic on app entry and screen navigation
    useEffect(() => {
        if (!profile || !isSuccess) return;

        // Never prompt if already in test runner
        if (pathname?.includes("6_2_ques_choose")) {
            setVisible(false);
            return;
        }

        const resumable = resumableData?.resumable;
        if (!resumable) {
            setVisible(false);
            return;
        }

        // 1. Initial cold-start prompt
        if (!hasInitialPromptedRef.current) {
            hasInitialPromptedRef.current = true;
            lastPromptedLogIdRef.current = resumable.id;
            lastPromptedPathRef.current = pathname;
            setVisible(true);
            return;
        }

        // 2. Hub screens navigation prompt (prompt once per tab/hub visit if still unexpired)
        const isHubRoute =
            pathname === "/(tabs)/home" ||
            pathname === "/(tabs)/5_1_national_tests" ||
            pathname === "/(tabs)/2_1_lessons" ||
            pathname?.startsWith("/(3_4_lessons)/lesson");

        const isNewLog = lastPromptedLogIdRef.current !== resumable.id;
        const isNewPath = lastPromptedPathRef.current !== pathname;

        if (isHubRoute && (isNewLog || isNewPath)) {
            lastPromptedLogIdRef.current = resumable.id;
            lastPromptedPathRef.current = pathname;
            setVisible(true);
        }
    }, [profile, isSuccess, resumableData, pathname]);

    const handleResume = preventDoubleTap(() => {
        setVisible(false);
        router.push("/(6_tests)/6_2_ques_choose?isResume=true" as never);
    });

    const handleAbandon = useCallback(async () => {
        if (resumableData?.resumable) {
            try {
                await abandonTestMut({ logId: resumableData.resumable.id }).unwrap();
            } catch (err) {
                console.error("Failed to abandon test:", err);
            }
        }
        lastPromptedLogIdRef.current = null;
        setVisible(false);
    }, [resumableData?.resumable, abandonTestMut]);

    if (!visible || !resumableData?.resumable || pathname?.includes("6_2_ques_choose")) {
        return null;
    }

    return (
        <ResumeTestPromptModal
            visible={visible}
            testLog={resumableData.resumable}
            onResume={handleResume}
            onAbandon={handleAbandon}
            isAbandoning={isAbandoning}
        />
    );
}
