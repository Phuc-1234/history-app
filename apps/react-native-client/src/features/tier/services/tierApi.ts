import { apiSlice } from "@/services/apiSlice";

export interface TierRewardItem {
    id: number;
    name: string;
    imgUrl: string | null;
    quantity: number;
}

export interface TierReward {
    xp: number;
    gold: number;
    items: TierRewardItem[];
}

export interface TierItem {
    index: number;
    name: string;
    badgeImgUrl: string | null;
    description: string | null;
    xpThreshold: number;
    rewards: TierReward | null;
}

export interface GetTiersResponse {
    tiers: TierItem[];
}

export const tierApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getTiers: builder.query<GetTiersResponse, void>({
            query: () => ({
                url: "/api/gamification/tiers",
            }),
        }),
    }),
    overrideExisting: __DEV__,
});

export const { useGetTiersQuery } = tierApi;
