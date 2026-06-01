export type RankStepStatus = "passed" | "current" | "upcoming";
export type RewardStatus = "available" | "claimed" | "locked";
export type RewardIconType = "coin" | "badge" | "frame";

export interface RankStep {
    id: string;
    label: string;
    status: RankStepStatus;
}

export interface RankReward {
    id: string;
    title: string;
    description: string;
    status: RewardStatus;
    icon: RewardIconType;
}

export interface RewardPopupData {
    currentRank: string;
    nextRank: string;
    currentXp: number;
    nextRankXp: number;
    ranks: RankStep[];
    rewards: RankReward[];
}