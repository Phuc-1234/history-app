import type { QuestionV2 } from "../test_v2/types";
export type { QuestionV2 };

export interface CreatePvpRoomRequest {
    scopeType?: string;
    scopeId?: number;
    testId?: string;
    questionCount?: number;
    timePerQuestion?: number; // 10, 15, 30
    autoNext?: boolean;
    transitionInterval?: number;
}

export interface JoinPvpRoomRequest {
    roomCode: string;
}

export interface SubmitPvpAnswerRequest {
    roomCode: string;
    questionIndex: number;
    userAnswer: any;
    timeTakenSeconds: number;
}

export interface PvpParticipant {
    userId: string;
    name: string;
    profileImgUrl: string | null;
    score: number;
    hasAnsweredCurrent?: boolean;
}

export interface PvpRoom {
    id: string;
    code: string;
    hostUserId: string;
    status: "LOBBY" | "IN_PROGRESS" | "FINISHED" | "CANCELLED";
    questionCount: number;
    timePerQuestion: number;
    autoNext: boolean;
    transitionInterval: number;
    currentQuestionIndex: number;
    participants: PvpParticipant[];
    questions?: QuestionV2[];
}

export interface PvpLeaderboardEntry {
    rank: number;
    userId: string;
    name: string;
    profileImgUrl: string | null;
    score: number;
}
