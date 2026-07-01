// features/home/services/homeApi.ts
import { apiSlice } from "@/services/apiSlice";

export interface LeaderboardEntry {
    rank: number;
    id: string;
    name: string;
    totalXp: number;
    avatarUrl: string | null;
    tierName: string | null;
    badgeImgUrl: string | null;
}

export interface HomeLessonItem {
    id: number;
    name: string;
    summary: string | null;
    topicName: string | null;
    gradeId: number | null;
    progress: {
        completedNodes: number;
        totalNodes: number;
    };
}

export interface HomeDataResponse {
    leaderboard: LeaderboardEntry[];
    lessons: HomeLessonItem[];
}

export const homeApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getHomeData: builder.query<HomeDataResponse, void>({
            query: () => "/api/home",
            providesTags: ["User"],
        }),
    }),
    overrideExisting: __DEV__,
});

export const { useGetHomeDataQuery } = homeApi;
