// types/testV2Types.ts — Local BE types for test system V2
// Does NOT touch @shared/types. Uses Prisma enums directly where needed.

import { ProgressConsequence } from "./progressTypes";

// ─── answerDataJson shapes (stored on Question.answerDataJson) ────────────

export interface ChooseAnswerData {
    options: string[];
    correctOption: number[]; // indexes into options[]
}

export interface FillAnswerData {
    acceptedAnswers: string[];
}

export interface MatchAnswerData {
    pairs: { left: string; right: string }[];
}

export type AnswerData = ChooseAnswerData | FillAnswerData | MatchAnswerData;

// ─── User answer shapes (draftAnswerJson entries & UserAnswerLog.answerDataJson) ─

export interface UserChooseAnswer {
    selectedOptions: number[]; // indexes into options[]
}

export interface UserFillAnswer {
    typedAnswer: string;
}

export interface UserMatchAnswer {
    pairs: { left: string; right: string }[];
}

export type UserAnswer = UserChooseAnswer | UserFillAnswer | UserMatchAnswer;

// ─── Draft answer entry (element of UserTestLog.draftAnswerJson array) ───

export interface DraftAnswerEntry {
    questionId: number;
    type: string; // "CHOOSE" | "FILL" | "MATCH"
    answerData: UserAnswer;
    answeredAt: string; // ISO timestamp
}

// ─── Score result for a single question ──────────────────────────────────

export interface QuestionScoreResult {
    questionId: number;
    type: string;
    scoreAwarded: number;
    maxScore: number;
    isCorrect: boolean;
    userAnswerData: UserAnswer | null;
    correctAnswerData: AnswerData;
}

// ─── API Request types ───────────────────────────────────────────────────

export interface StartTestV2Request {
    scopeType?: string;   // ScopeType enum value
    purposeType?: string; // PurposeType enum value
    scopeId?: number;
    testId?: string;      // for manual/curated test
    presetId?: string;    // optional preset override
    autoPickStrategy?: string; // BALANCED, LOW_MASTERY, or WRONG
    questionCount?: number;
    passThreshold?: number;
    timeLimit?: number | null;
    difficultyRatioJson?: any;
}

export interface UpdateDraftRequest {
    draftAnswerJson: DraftAnswerEntry[];
}

export interface FinishTestV2Request {
    draftAnswerJson: DraftAnswerEntry[]; // final snapshot from FE
    seenQuestionIds?: number[];
}

// ─── API Response DTOs ───────────────────────────────────────────────────

export interface QuestionV2Dto {
    id: number;
    type: string;
    difficulty: number;
    promptText: string;
    document: string | null;
    explanation: string | null;
    answerData: AnswerData;
}

export interface UserTestLogV2Dto {
    id: string;
    testId: string | null;
    purposeType: string;
    status: string;
    scoreAwarded: number;
    maxScore: number;
    isPassed: boolean | null;
    startedAt: string;
    submittedAt: string | null;
    expiresAt: string | null;
    attemptNumber: number;
    questionCount: number;
    passThreshold: number;
    timeLimit: number | null;
    scopeType: string | null;
    scopeId: number | null;
    currentQuestionIndex: number;
    questionSequenceJson: number[];
    draftAnswerJson: DraftAnswerEntry[];
    testTitle?: string | null;
    autoPickStrategy?: string | null;
    // backward compat
    goldEarned?: number;
    xpEarned?: number;
}

export interface UserAnswerLogV2Dto {
    questionId: number;
    type: string;
    userAnswerData?: UserAnswer | null;
    scoreAwarded: number;
    maxScore: number;
    correctAnswerData?: AnswerData | null;
}

export interface StartTestV2Response {
    userTestLog: UserTestLogV2Dto;
    questions: QuestionV2Dto[];
}

export interface FinishTestV2Response {
    userTestLog: UserTestLogV2Dto;
    answerLogs: UserAnswerLogV2Dto[];
    consequences: ProgressConsequence[];
}

export interface ResumableTestV2Response {
    resumable: UserTestLogV2Dto | null;
    questions: QuestionV2Dto[];
}

export interface TestHistoryV2Response {
    logs: UserTestLogV2Dto[];
}

export interface TestAttemptDetailV2Response {
    userTestLog: UserTestLogV2Dto;
    answerLogs: (UserAnswerLogV2Dto & { question: QuestionV2Dto })[];
}

export interface TestInfoV2Response {
    title: string;
    questionCount: number;
    timeLimit: number | null;
    scopeType: string | null;
    scopeId: number | null;
    purposeType: string;
    goldReward: number;
    xpReward: number;
    attemptNumber: number;  // what attempt # this will be if user starts now
    passThreshold: number;
    attemptCount: number;
    passCount: number;
    itemsReward?: { name: string; imgUrl: string | null; quantity: number }[];
}

export interface NationalTestDto {
    id: string;
    title: string;
    summary: string | null;
}
