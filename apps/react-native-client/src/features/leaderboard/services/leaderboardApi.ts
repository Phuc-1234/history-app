import { apiSlice } from "@/services/apiSlice";
import { GetLeaderboardResponse } from "@history-app/shared";

// Args type for the leaderboard query
export interface GetLeaderboardXpArgs {
    limit?: number;
    page?: number;
    sort?: "xp" | "streak";
}

export const leaderboardApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getLeaderboardXp: builder.query<GetLeaderboardResponse, GetLeaderboardXpArgs>({
            query: ({ limit = 20, page = 1, sort = "xp" } = {}) => ({
                url: "/api/gamification/leaderboard",
                method: "GET",
                params: { limit, page, sort },
            }),
            providesTags: ["User"],
        }),
    }),
    overrideExisting: __DEV__,
});

export const { useGetLeaderboardXpQuery } = leaderboardApi;
