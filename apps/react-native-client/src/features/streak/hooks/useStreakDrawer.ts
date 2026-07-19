import { useState, useCallback } from "react";

export function useStreakDrawer() {
    const [streakDrawerVisible, setStreakDrawerVisible] = useState(false);

    const openStreakDrawer = useCallback(() => {
        setStreakDrawerVisible(true);
    }, []);

    const closeStreakDrawer = useCallback(() => {
        setStreakDrawerVisible(false);
    }, []);

    return {
        streakDrawerVisible,
        openStreakDrawer,
        closeStreakDrawer,
    };
}
