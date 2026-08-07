import { QuestionV2Dto } from "./testV2Types";

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

export interface PvpParticipantDto {
    userId: string;
    name: string;
    profileImgUrl: string | null;
    score: number;
    hasAnsweredCurrent?: boolean;
}

export interface PvpRoomDto {
    id: string;
    code: string;
    hostUserId: string;
    status: string;
    questionCount: number;
    timePerQuestion: number;
    autoNext: boolean;
    transitionInterval: number;
    currentQuestionIndex: number;
    participants: PvpParticipantDto[];
    questions?: QuestionV2Dto[];
}
