import { useState, useEffect, useRef, useCallback } from "react";
import { useAppSelector } from "@/store/storeHook";
import { useCheckResumableQuery } from "@/features/test_v2";
import { useGetReminderSettingsQuery } from "@/features/notification";

export function useHomePrompts() {
    const profile = useAppSelector((state) => state.auth.profile);
    const [reminderModalVisible, setReminderModalVisible] = useState(false);
    const hasCheckedPrompts = useRef(false);

    const {
        data: resumableData,
        isLoading: isResumableLoading,
        isFetching: isResumableFetching,
    } = useCheckResumableQuery(undefined, {
        skip: !profile,
    });

    const {
        data: reminderSettings,
        isLoading: isReminderLoading,
        isFetching: isReminderFetching,
    } = useGetReminderSettingsQuery(undefined, {
        skip: !profile,
    });

    useEffect(() => {
        if (!profile || hasCheckedPrompts.current) return;

        // Wait until resumable query completes
        if (isResumableLoading || isResumableFetching) return;

        // If an active test exists, GlobalTestResumePromptModal will show, suppress reminder
        if (resumableData?.resumable) {
            hasCheckedPrompts.current = true;
            return;
        }

        // Queue logic: only check study reminder if no resumable test
        if (reminderSettings !== undefined && !isReminderLoading && !isReminderFetching) {
            hasCheckedPrompts.current = true;
            if (!reminderSettings.isEnabled && Math.random() < 0.2) {
                setReminderModalVisible(true);
            }
        }
    }, [
        profile,
        resumableData,
        isResumableLoading,
        isResumableFetching,
        reminderSettings,
        isReminderLoading,
        isReminderFetching,
    ]);

    const closeReminderModal = useCallback(() => {
        setReminderModalVisible(false);
    }, []);

    return {
        reminderModalVisible,
        closeReminderModal,
    };
}

