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

export interface DailyXpItem {
    date: string;
    xp: number;
    dayName?: string;
}

export interface StreakInfoResponse {
    currentStreak: number;
    highestStreak: number;
    hasCompletedToday: boolean;
    dailyXp: DailyXpItem[];
    milestones: StreakMilestone[];
}

export interface MonthlyCalendarResponse {
    year: number;
    month: number;
    dailyXp: DailyXpItem[];
}

export const streakApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getStreakInfo: builder.query<StreakInfoResponse, void>({
            query: () => ({
                url: "/api/gamification/streak",
            }),
            providesTags: ["User"],
        }),
        getMonthlyStreakCalendar: builder.query<MonthlyCalendarResponse, { year: number; month: number }>({
            query: ({ year, month }) => ({
                url: "/api/gamification/streak/calendar",
                params: { year, month },
            }),
            providesTags: ["User"],
        }),
    }),
    overrideExisting: __DEV__,
});

export const { useGetStreakInfoQuery, useGetMonthlyStreakCalendarQuery } = streakApi;
