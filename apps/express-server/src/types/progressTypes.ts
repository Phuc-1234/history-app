// types/progressTypes.ts — Local BE types for progress engine & node detail

export enum ProgressEventType {
    NODE_COMPLETED = "NODE_COMPLETED",
    TIER_GAINED = "TIER_GAINED",
    STREAK_MILESTONE = "STREAK_MILESTONE",
    STREAK_UPDATED = "STREAK_UPDATED",
    TEST_PASSED = "TEST_PASSED",
    REWARD_EARNED = "REWARD_EARNED",
}

export interface ProgressConsequence {
    eventType: ProgressEventType;
    message: string;
    xpGained?: number;
    goldGained?: number;
    itemsGained?: { name: string; imgUrl: string | null; quantity: number }[];
    payload?: Record<string, any>;
}

export interface NodeDetailResponse {
    id: number;
    position: number;
    header: string | null;
    body: string;
    imgUrl: string | null;
    sectionId: number;
    videoId: string | null;
    video: { id: string; hlsUrl: string; duration: number | null } | null;
    hasRelevantQuestions: boolean;
    isStudied: boolean | null;     // null if not logged in
    isCompleted: boolean | null;   // null if not logged in
}

export interface ProgressCounts {
    totalNodes: number;
    completedNodes: number;
}
