import { useState, useCallback } from "react";

export function useTierDrawer() {
    const [tierDrawerVisible, setTierDrawerVisible] = useState(false);

    const openTierDrawer = useCallback(() => {
        setTierDrawerVisible(true);
    }, []);

    const closeTierDrawer = useCallback(() => {
        setTierDrawerVisible(false);
    }, []);

    return {
        tierDrawerVisible,
        openTierDrawer,
        closeTierDrawer,
    };
}
