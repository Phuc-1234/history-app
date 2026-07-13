import React from "react";
import HistoricalBackground from "./HistoricalBackground";
import HistoricalSkyBackground from "./HistoricalSkyBackground";
import CustomDragonBackground from "./CustomDragonBackground";
import { useAppBackground } from "../../state/useAppBackground";

// ─── AppBackground ─────────────────────────────────────────────────────────
// Drop-in replacement for <HistoricalBackground /> that picks one of the
// available backgrounds per app session (reseeded after the app has been
// closed for a while). API matches HistoricalBackground: no props,
// absolute-fill, pointerEvents="none".
export default function AppBackground() {
    const bg = useAppBackground();

    // While the persisted choice is loading (first frame), render the legacy
    // rotating-drum background so the user never sees a flash of empty screen.
    if (bg === null) {
        return <HistoricalBackground />;
    }
    switch (bg) {
        case "historicalSky":
            return <HistoricalSkyBackground />;
        case "customDragon":
            return <CustomDragonBackground />;
        case "rotatingDrum":
        default:
            return <HistoricalBackground />;
    }
}
