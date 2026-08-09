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
    isPublic?: boolean;
}

export interface JoinPvpRoomRequest {
    roomCode: string;
}

export interface SubmitPvpAnswerRequest {
    roomCode: string;
    questionIndex: number;
    userAnswer: any;
    timeTakenSeconds: number;
    activeUserIds?: string[];
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
    isPublic: boolean;
    participants: PvpParticipant[];
    questions?: QuestionV2[];
    currentSubState?: "QUESTION" | "RESULT" | "LEADERBOARD";
    lastQuestionResult?: {
        questionIndex: number;
        correctAnswerData: any;
        explanation: string | null;
        leaderboard: PvpParticipant[];
    } | null;
}

export interface PvpLeaderboardEntry {
    rank: number;
    userId: string;
    name: string;
    profileImgUrl: string | null;
    score: number;
}

export interface PvpPublicRoomDto {
    id: string;
    code: string;
    hostUserId: string;
    hostName: string;
    hostAvatar: string | null;
    questionCount: number;
    timePerQuestion: number;
    participantCount: number;
    maxParticipants: number;
    createdAt: string;
}

