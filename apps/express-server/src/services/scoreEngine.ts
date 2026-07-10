// services/scoreEngine.ts — Hardcoded scoring rules for test V2
import {
    ChooseAnswerData,
    FillAnswerData,
    MatchAnswerData,
    AnswerData,
    UserChooseAnswer,
    UserFillAnswer,
    UserMatchAnswer,
    UserAnswer,
    QuestionScoreResult,
    DraftAnswerEntry,
} from "../types/testV2Types";

/**
 * Scoring rules (hardcoded):
 * - CHOOSE single (1 correct): max=0.25, correct→0.25
 * - CHOOSE multi (N correct, N<=4): partial [0.1, 0.25, 0.5, 1.0] by count correct
 * - CHOOSE multi (N correct, N>4):  partial [0.1, 0.25, 0.75, 1.0, 1.25, ...]
 * - FILL: max=0.5, correct→0.5 (case-insensitive trim)
 * - MATCH: max=1.0, each pair worth 1/N
 */

function scoreChoose(
    answerData: ChooseAnswerData,
    userAnswer: UserChooseAnswer | null,
): { scoreAwarded: number; maxScore: number } {
    const correctCount = answerData.correctOption.length;

    if (correctCount <= 1) {
        // Single choice
        const maxScore = 0.25;
        if (!userAnswer || !userAnswer.selectedOptions?.length) {
            return { scoreAwarded: 0, maxScore };
        }
        const isCorrect =
            userAnswer.selectedOptions.length === 1 &&
            answerData.correctOption.includes(userAnswer.selectedOptions[0]);
        return { scoreAwarded: isCorrect ? maxScore : 0, maxScore };
    }

    // Multi choice
    const totalOptions = answerData.options.length;
    const maxScore = totalOptions === 0 ? 0 : Math.max(0.25, Math.floor(totalOptions / 2) * 0.25);

    if (!userAnswer || !userAnswer.selectedOptions?.length) {
        return { scoreAwarded: 0, maxScore };
    }

    const incorrectCount = totalOptions - correctCount;
    let score = 0;
    const correctScorePerItem = correctCount > 0 ? maxScore / correctCount : 0;
    const incorrectPenaltyPerItem = incorrectCount > 0 ? maxScore / incorrectCount : 0;

    for (const optionIdx of userAnswer.selectedOptions) {
        if (answerData.correctOption.includes(optionIdx)) {
            score += correctScorePerItem;
        } else {
            score -= incorrectPenaltyPerItem;
        }
    }

    const scoreAwarded = Math.max(0, Math.round(score * 10000) / 10000);
    return { scoreAwarded, maxScore };
}

function getLevenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];
    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }
    return matrix[b.length][a.length];
}

function normalizeText(str: string): string {
    return str
        .toLowerCase()
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'’‘“”\[\]{}]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function extractNumbers(str: string): number[] {
    const matches = str.match(/\d+/g);
    if (!matches) return [];
    return matches.map(Number);
}

function isFillAnswerCorrect(acceptedAnswers: string[], typedAnswer: string): boolean {
    if (!typedAnswer.trim()) return false;

    const userNormalized = normalizeText(typedAnswer);
    const userNums = extractNumbers(typedAnswer);

    for (const accepted of acceptedAnswers) {
        const acceptedNormalized = normalizeText(accepted);
        const acceptedNums = extractNumbers(accepted);

        const numbersMatch =
            userNums.length === acceptedNums.length &&
            userNums.every((num, idx) => num === acceptedNums[idx]);

        if (!numbersMatch) continue;

        const wordCount = acceptedNormalized.split(/\s+/).filter(Boolean).length;
        let allowedTypos = 0;
        if (wordCount === 1) {
            allowedTypos = 0;
        } else if (wordCount === 2) {
            allowedTypos = 1;
        } else if (wordCount >= 3 && wordCount <= 5) {
            allowedTypos = 2;
        } else if (wordCount >= 6) {
            allowedTypos = 3;
        }

        const distance = getLevenshteinDistance(userNormalized, acceptedNormalized);
        if (distance <= allowedTypos) {
            return true;
        }
    }

    return false;
}

function scoreFill(
    answerData: FillAnswerData,
    userAnswer: UserFillAnswer | null,
): { scoreAwarded: number; maxScore: number } {
    const maxScore = 0.5;
    if (!userAnswer || !userAnswer.typedAnswer?.trim()) {
        return { scoreAwarded: 0, maxScore };
    }
    const isCorrect = isFillAnswerCorrect(answerData.acceptedAnswers, userAnswer.typedAnswer);
    return { scoreAwarded: isCorrect ? maxScore : 0, maxScore };
}

function scoreMatch(
    answerData: MatchAnswerData,
    userAnswer: UserMatchAnswer | null,
): { scoreAwarded: number; maxScore: number } {
    const totalPairs = answerData.pairs.length;
    if (totalPairs === 0) return { scoreAwarded: 0, maxScore: 0 };
    const maxScore = Math.max(0.25, Math.floor(totalPairs / 2) * 0.25);

    if (!userAnswer || !userAnswer.pairs?.length) {
        return { scoreAwarded: 0, maxScore };
    }

    let correctCount = 0;

    for (const rawPair of answerData.pairs) {
        let correctLeft = "";
        let correctRight = "";
        if (rawPair) {
            if (typeof rawPair.left === "string" && typeof rawPair.right === "string") {
                correctLeft = rawPair.left;
                correctRight = rawPair.right;
            } else {
                const keys = Object.keys(rawPair);
                correctLeft = keys[0] ?? "";
                correctRight = (rawPair as any)[correctLeft] ?? "";
            }
        }

        const userPair = userAnswer.pairs.find(
            (p) =>
                p.left?.trim().toLowerCase() ===
                correctLeft.trim().toLowerCase(),
        );
        if (
            userPair &&
            userPair.right?.trim().toLowerCase() ===
                correctRight.trim().toLowerCase()
        ) {
            correctCount++;
        }
    }

    const scoreAwarded = correctCount === totalPairs ? maxScore : 0;
    return { scoreAwarded, maxScore };
}

/**
 * Score a single question given its answerData and the user's answer.
 */
export function scoreQuestion(
    questionId: number,
    type: string,
    answerData: AnswerData,
    userAnswer: UserAnswer | null,
): QuestionScoreResult {
    let result: { scoreAwarded: number; maxScore: number };

    switch (type) {
        case "CHOOSE":
            result = scoreChoose(
                answerData as ChooseAnswerData,
                userAnswer as UserChooseAnswer | null,
            );
            break;
        case "FILL":
            result = scoreFill(
                answerData as FillAnswerData,
                userAnswer as UserFillAnswer | null,
            );
            break;
        case "MATCH":
            result = scoreMatch(
                answerData as MatchAnswerData,
                userAnswer as UserMatchAnswer | null,
            );
            break;
        default:
            result = { scoreAwarded: 0, maxScore: 0 };
    }

    return {
        questionId,
        type,
        scoreAwarded: result.scoreAwarded,
        maxScore: result.maxScore,
        isCorrect: result.scoreAwarded >= result.maxScore && result.maxScore > 0,
        userAnswerData: userAnswer,
        correctAnswerData: answerData,
    };
}

/**
 * Score all questions in a test given the draft answers.
 */
export function scoreAllQuestions(
    questions: { id: number; type: string; answerDataJson: any }[],
    draftAnswers: DraftAnswerEntry[],
): QuestionScoreResult[] {
    const draftMap = new Map<number, DraftAnswerEntry>();
    for (const d of draftAnswers) {
        draftMap.set(d.questionId, d);
    }

    return questions.map((q) => {
        const draft = draftMap.get(q.id);
        const answerData = q.answerDataJson as AnswerData;
        const userAnswer = draft?.answerData ?? null;
        return scoreQuestion(q.id, q.type, answerData, userAnswer);
    });
}
