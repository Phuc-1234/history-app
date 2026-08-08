import { useState, useEffect } from "react";
import { easterEggService } from "./easterEggService";

export { easterEggService };

export function useEasterEgg() {
    const [isEngMode, setIsEngMode] = useState<boolean>(easterEggService.isEngModeEnabled());

    useEffect(() => {
        const unsubscribe = easterEggService.subscribe((enabled) => {
            setIsEngMode(enabled);
        });
        return unsubscribe;
    }, []);

    return {
        isEngMode,
        setEngMode: (enabled: boolean) => easterEggService.setEngMode(enabled),
    };
}
