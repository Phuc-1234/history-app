// types/gamification.ts
// Types for leaderboard, tiers, rewards, items and user items

export interface LeaderboardEntry {
    id: string;
    avatarUrl?: string | null;
    name: string;
    tierName?: string | null;
    badgeImgUrl?: string | null;
    totalXp: number;
    currentStreak: number;
}

export type GetLeaderboardResponse =
    | {
          entries: LeaderboardEntry[];
          total: number;
          page: number;
          pageSize: number;
          userPosition?: number | null;
      }
    | { error: string };

export interface TierDto {
    index: number;
    name: string;
    badgeImgUrl?: string | null;
    description?: string | null;
    xpThreshold: number;
}

export type GetTiersResponse = { tiers: TierDto[] } | { error: string };

export interface MilestoneRewardDto {
    id: number;
    goldAmount: number;
    xpAmount: number;
    itemQuantity: number;
    sourceValue: number;
    itemId?: number | null;
    rewardType: "ITEM" | "XP" | "GOLD";
    name: string;
}

export type GetMilestoneRewardsResponse =
    | { rewards: MilestoneRewardDto[] }
    | { error: string };

export interface PendingRewardDto {
    id: number;
    goldAmount: number;
    xpAmount: number;
    itemQuantity: number;
    sourceType: "STREAK" | "TIER";
    sourceValue: number;
    isClaimed: boolean;
    userId: string;
    itemId?: number | null;
    rewardType: "ITEM" | "XP" | "GOLD";
}

export type GetPendingRewardsResponse =
    | { rewards: PendingRewardDto[] }
    | { error: string };

export interface ItemDto {
    id: number;
    cost?: number | null;
    isConsumable: boolean;
    isPurchaseable: boolean;
    imgUrl?: string | null;
    description?: string | null;
    type: string;
    value?: number | null;
    testLimit?: number | null;
    timeLimit?: number | null;
}

export type GetItemsResponse = { items: ItemDto[] } | { error: string };

export interface UserItemDto {
    userId: string;
    name: string;
    itemId: number;
    quantity: number;
    isActive: boolean;
    activateAt?: string | null;
    item?: ItemDto | null;
}

export type GetUserItemsResponse = { items: UserItemDto[] } | { error: string };
