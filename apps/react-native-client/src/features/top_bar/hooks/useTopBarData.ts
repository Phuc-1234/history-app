import { useAppSelector } from "../../../store/storeHook"; // Adjust path according to your structure
import { useStreak } from "../../streak"; // Adjust path as used in your wrappers
import { useGetProfileQuery } from "@/features/auth/services/authApi";
import { useGetUserActiveEffectsQuery } from "@/features/inventory/services/itemApi";

export interface ProcessedTopBarData {
    isLoggedIn: boolean;
    name: string;
    avatarUri: string;
    equippedFrameUrl: string | null;
    totalXp: number;
    totalGold: string; // Formatted with toLocaleString() for direct presentation
    currentStreak: number;
    badgeImgUrl: string | null;
    xpMultiplier: number;
    goldMultiplier: number;
}

export function useTopBarData() {
    // Automatically trigger profile query and subscribe to updates
    useGetProfileQuery();

    // 1. Fetch live data context straight from Redux State
    const profile = useAppSelector((state) => state.auth.profile);
    const { data: activeEffectsData } = useGetUserActiveEffectsQuery(undefined, { skip: !profile });

    // 2. Encapsulate streak module states and visibility configurations directly here
    const streakCount = profile ? profile.currentStreak : 0;
    const streakManager = useStreak(streakCount);

    // 3. Compute structural configurations, fallbacks, and avatar generation details
    const isLoggedIn = !!profile;
    const name = profile?.name ?? "";
    const totalXp = profile?.totalXp ?? 0;
    const totalGold = profile?.totalGold ? profile.totalGold.toLocaleString() : "0";
    const badgeImgUrl = profile?.badgeImgUrl ?? null;
    const equippedFrameUrl = profile?.equippedFrameUrl ?? null;

    const avatarUri = profile?.profileImgUrl
        ? profile.profileImgUrl
        : `https://ui-avatars.com/api/?name=${encodeURIComponent(
              name || "User"
          )}&background=E8E4F4&color=5856D6&bold=true`;

    const processedData: ProcessedTopBarData = {
        isLoggedIn,
        name,
        avatarUri,
        equippedFrameUrl,
        totalXp,
        totalGold,
        currentStreak: streakCount,
        badgeImgUrl,
        xpMultiplier: activeEffectsData?.xpMultiplier ?? 1.0,
        goldMultiplier: activeEffectsData?.goldMultiplier ?? 1.0,
    };

    return {
        data: processedData,
        streakManager, // Bubble up standard modal operations seamlessly
    };
}