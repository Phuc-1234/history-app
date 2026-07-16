import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── DEBUG / TESTING OVERRIDE ──────────────────────────────────────────────
// Force a specific background on every screen (bypasses random pick + cache).
// Set back to `null` to restore normal session-random behaviour.
const FORCE_BACKGROUND: AppBackgroundType | null = "rotatingDrum";

// ─── Types ─────────────────────────────────────────────────────────────────
export type AppBackgroundType =
    | "rotatingDrum"
    | "historicalSky"
    | "customDragon";

// All available backgrounds — picking uniformly from this array gives each one
// an equal 1/N chance.
const ALL_BACKGROUNDS: AppBackgroundType[] = [
    "rotatingDrum",
    "historicalSky",
    "customDragon",
];

// ─── Storage key & constants ───────────────────────────────────────────────
const STORAGE_KEY = "@app/background_type";
const STORAGE_TIMESTAMP_KEY = "@app/background_timestamp";
const RESEED_INTERVAL_MS = 1000 * 60 * 60; // 1 hour — if app was closed >1h, reseed.

// ─── Reseed logic ──────────────────────────────────────────────────────────
// Pick a new background type and persist it, along with the current timestamp.
async function reseedBackground(): Promise<AppBackgroundType> {
    const next: AppBackgroundType =
        ALL_BACKGROUNDS[Math.floor(Math.random() * ALL_BACKGROUNDS.length)];
    try {
        await AsyncStorage.multiSet([
            [STORAGE_KEY, next],
            [STORAGE_TIMESTAMP_KEY, String(Date.now())],
        ]);
    } catch {
        // non-fatal — fall through with the in-memory pick.
    }
    return next;
}

// Decide whether the persisted background should be reused or reseeded.
async function loadOrReseed(): Promise<AppBackgroundType> {
    try {
        const [[, stored], [, storedTs]] = await AsyncStorage.multiGet([
            STORAGE_KEY,
            STORAGE_TIMESTAMP_KEY,
        ]);

        const isStoredValid =
            stored === "rotatingDrum" ||
            stored === "historicalSky" ||
            stored === "customDragon";

        if (isStoredValid && storedTs) {
            const elapsed = Date.now() - Number(storedTs);
            // Reuse if the app was reopened within the reseed interval.
            if (elapsed < RESEED_INTERVAL_MS) {
                return stored as AppBackgroundType;
            }
        }
    } catch {
        // ignore read errors — fall through to reseed.
    }
    return reseedBackground();
}

// ─── Public hook ───────────────────────────────────────────────────────────
// Returns the background type to show for this app session. Reseeded when the
// app has been closed longer than RESEED_INTERVAL_MS; otherwise reused so the
// user doesn't see flicker between rapid reopens.
export function useAppBackground(): AppBackgroundType | null {
    const [bg, setBg] = useState<AppBackgroundType | null>(
        FORCE_BACKGROUND // immediate value when an override is set (no flicker)
    );

    useEffect(() => {
        if (FORCE_BACKGROUND !== null) {
            return; // override active — skip async load entirely
        }
        let cancelled = false;
        loadOrReseed().then((value) => {
            if (!cancelled) setBg(value);
        });
        return () => {
            cancelled = true;
        };
    }, []);

    return bg;
}

export default useAppBackground;
