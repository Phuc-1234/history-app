export type QuestionType = "single-choice" | "multiple-choice" | "fill-in-blank" | "matching";

export interface BaseQuestion {
    id: string;
    text: string;
    type: QuestionType;
}

export interface SingleChoiceQuestion extends BaseQuestion {
    type: "single-choice";
    options: string[];
    correctOptionIndex: number;
    answerIds?: number[];
    optionsWithLabels: OptionWithLabel[]; // ADD THIS
}

export interface MultipleChoiceQuestion extends BaseQuestion {
    type: "multiple-choice";
    options: string[];
    correctOptionIndexes: number[];
}

export interface FillInBlankQuestion extends BaseQuestion {
    type: "fill-in-blank";
    placeholder?: string;
    correctText: string;
}

export interface MatchingPair {
    id: string;
    text: string;
}

export interface MatchingQuestion extends BaseQuestion {
    type: "matching";
    leftOptions: MatchingPair[];
    rightOptions: MatchingPair[];
    correctPairs: Record<string, string>; // Maps left ID -> right ID
}

interface OptionWithLabel {
    label: string;
    text: string;
    id: string | number; // Match this to whatever type a.id actually is
}

export type Question =
    | SingleChoiceQuestion
    | MultipleChoiceQuestion
    | FillInBlankQuestion
    | MatchingQuestion;

export interface TestResult {
    score: number;
    totalQuestions: number;
    correctAnswersCount: number;
    gradedAnswers: Record<string, boolean>; // Maps questionId -> isCorrect
}
