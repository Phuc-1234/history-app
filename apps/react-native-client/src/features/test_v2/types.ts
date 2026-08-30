// FE types for test V2 — mirrors BE DTOs, no shared package dependency

export type QuestionType = "CHOOSE" | "FILL" | "MATCH";
export type PurposeType = "EXAM" | "PRACTICE";
export type TestStatusType = "IN_PROGRESS" | "COMPLETED" | "EXPIRED" | "ABANDONED";
export type ScopeType = "GRADE" | "TOPIC" | "LESSON" | "SECTION" | "NODE" | "NATIONAL";

// ─── answerDataJson shapes ───────────────────────────────────────────────

export interface ChooseAnswerData {
    options: string[];
    correctOption: number[];
}

export interface FillAnswerData {
    acceptedAnswers: string[];
}

export interface MatchAnswerData {
    pairs: { left: string; right: string }[];
}

export type AnswerData = ChooseAnswerData | FillAnswerData | MatchAnswerData;

// ─── User answer shapes ─────────────────────────────────────────────────

export interface UserChooseAnswer {
    selectedOptions: number[];
}

export interface UserFillAnswer {
    typedAnswer: string;
}

export interface UserMatchAnswer {
    pairs: { left: string; right: string }[];
}

export type UserAnswer = UserChooseAnswer | UserFillAnswer | UserMatchAnswer;

// ─── Draft answer entry ─────────────────────────────────────────────────

export interface DraftAnswerEntry {
    questionId: number;
    type: QuestionType;
    answerData: UserAnswer;
    answeredAt: string;
}

// ─── Question DTO ────────────────────────────────────────────────────────

export interface QuestionV2 {
    id: number;
    type: QuestionType;
    difficulty: number;
    promptText: string;
    document: string | null;
    explanation: string | null;
    answerData: AnswerData;
}

// ─── UserTestLog DTO ─────────────────────────────────────────────────────

export interface UserTestLogV2 {
    id: string;
    testId: string | null;
    purposeType: PurposeType;
    status: TestStatusType;
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
    scopeType: ScopeType | null;
    scopeId: number | null;
    currentQuestionIndex: number;
    questionSequenceJson: number[];
    draftAnswerJson: DraftAnswerEntry[];
    testTitle?: string | null;
    goldEarned?: number;
    xpEarned?: number;
}

// ─── UserAnswerLog DTO ───────────────────────────────────────────────────

export interface UserAnswerLogV2 {
    questionId: number;
    type: QuestionType;
    userAnswerData?: UserAnswer | null;
    scoreAwarded: number;
    maxScore: number;
    correctAnswerData?: AnswerData | null;
}

// ─── API Request/Response ────────────────────────────────────────────────

export interface StartTestV2Request {
    scopeType?: ScopeType;
    purposeType?: PurposeType;
    scopeId?: number;
    testId?: string;
    presetId?: string;
    autoPickStrategy?: string;
    questionCount?: number;
    passThreshold?: number;
    timeLimit?: number | null;
    difficultyRatioJson?: any;
}

export interface StartTestV2Response {
    userTestLog: UserTestLogV2;
    questions: QuestionV2[];
}

export interface FinishTestV2Response {
    userTestLog: UserTestLogV2;
    answerLogs: UserAnswerLogV2[];
    consequences: {
        eventType: string;
        message: string;
        xpGained?: number;
        goldGained?: number;
        itemsGained?: { name: string; imgUrl: string | null; quantity: number }[];
    }[];
}

export interface ResumableTestV2Response {
    resumable: UserTestLogV2 | null;
    questions: QuestionV2[];
}

export interface TestHistoryV2Response {
    logs: UserTestLogV2[];
}

export interface TestAttemptDetailV2Response {
    userTestLog: UserTestLogV2;
    answerLogs: (UserAnswerLogV2 & { question: QuestionV2 })[];
}

export interface TestInfoV2Response {
    title: string;
    questionCount: number; 
    timeLimit: number | null;
    scopeType: ScopeType | null;
    scopeId: number | null;
    purposeType: PurposeType;
    goldReward: number;
    xpReward: number;
    xpMultiplier?: number;
    goldMultiplier?: number;
    attemptNumber: number;
    passThreshold: number;
    attemptCount: number;
    passCount: number;
    itemsReward?: { name: string; imgUrl: string | null; quantity: number }[];
}

// ─── Local evaluation result ─────────────────────────────────────────────

export interface QuestionEvalResult {
    questionId: number;
    scoreAwarded: number;
    maxScore: number;
    isCorrect: boolean;
}

export interface CuratedTestDto {
    id: string;
    title: string;
    summary: string | null;
    isPro: boolean;
    imgUrl?: string | null;
    passCount?: number;
    masteryPercentage?: number;
}
