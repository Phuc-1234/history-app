import { apiSlice } from "@/services/apiSlice";

export interface StreakMilestoneItem {
    id: number;
    name: string;
    imgUrl: string | null;
    quantity: number;
}

export interface StreakMilestone {
    id: number;
    day: number;
    xp: number;
    gold: number;
    items: StreakMilestoneItem[];
    isReached: boolean;
    isClaimed: boolean;
}

export interface StreakInfoResponse {
    currentStreak: number;
    highestStreak: number;
    hasCompletedToday: boolean;
    milestones: StreakMilestone[];
}

export const streakApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getStreakInfo: builder.query<StreakInfoResponse, void>({
            query: () => ({
                url: "/api/gamification/streak",
            }),
            providesTags: ["User"],
        }),
    }),
    overrideExisting: __DEV__,
});

export const { useGetStreakInfoQuery } = streakApi;
