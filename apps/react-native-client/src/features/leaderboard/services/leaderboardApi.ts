// services/leaderboardApi.ts
import { apiSlice } from "@/services/apiSlice";
import { LeaderboardResponse, SortType } from "../types/leaderboardTypes";

export const leaderboardApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getLeaderboard: builder.query<
            LeaderboardResponse,
            { limit?: number; page?: number; sort?: SortType }
        >({
            query: (params) => ({
                url: "/api/gamification/leaderboard",
                params: {
                    limit: params.limit ?? 20,
                    page: params.page ?? 1,
                    sort: params.sort ?? "xp",
                },
            }),
            providesTags: ["User"],
        }),
    }),
    overrideExisting: __DEV__,
});

export const { useGetLeaderboardQuery } = leaderboardApi;
