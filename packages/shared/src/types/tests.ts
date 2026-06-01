// DTOs for test lifecycle APIs

export type QuestionType = "CHOOSE" | "FILL" | "MATCH";

export interface QuestionAnswerDto {
    id: number;
    content: string;
    leftText?: string | null;
    rightText?: string | null;
}

export interface QuestionDto {
    id: number;
    type: QuestionType;
    difficulty: number;
    promptText: string;
    answers?: QuestionAnswerDto[];
}

export interface StartTestResponse {
    userTestLogId: string;
    totalQuestionCount: number;
    timeLimitSeconds?: number | null;
    attemptNumber: number;
    hasPassedBefore: boolean;
    firstQuestion?: QuestionDto | null;
}

export interface JumpRequest {
    targetIndex: number;
}

export interface JumpResponse {
    index: number;
    totalCount: number;
    question: QuestionDto | null;
    previousAnswer?: any;
}

export interface SubmitAnswerRequest {
    // Either provide the exact `questionId` (preferred) or a 1-based `targetIndex`.
    // The server accepts either form and will map `targetIndex` to the correct question id.
    questionId?: number;
    targetIndex?: number;
    answerData: any;
}

export interface SubmitAnswerResponse {
    saved: boolean;
}

export interface FinishTestResponse {
    score: number;
    isPassed: boolean;
    xpEarned: number;
    goldEarned: number;
    currentStreak: number;
    leveledUp?: boolean;
    newTierIndex?: number | null;
    questionSummaries?: Array<{
        questionId: number;
        isCorrect: boolean;
        earnedXp?: number;
    }>;
}
