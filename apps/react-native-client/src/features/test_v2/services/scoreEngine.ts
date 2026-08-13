// services/scoreEngine.ts — FE local evaluation (mirrors BE exactly)
import type {
    QuestionV2,
    AnswerData,
    ChooseAnswerData,
    FillAnswerData,
    MatchAnswerData,
    UserAnswer,
    UserChooseAnswer,
    UserFillAnswer,
    UserMatchAnswer,
    QuestionEvalResult,
} from "../types";

function scoreChoose(
    answerData: ChooseAnswerData,
    userAnswer: UserChooseAnswer | null,
): { scoreAwarded: number; maxScore: number } {
    const correctOption: number[] = answerData.correctOption ?? [];
    const correctCount = correctOption.length;

    if (correctCount <= 1) {
        const maxScore = 0.25;
        if (!userAnswer || !userAnswer.selectedOptions || !userAnswer.selectedOptions.length) {
            return { scoreAwarded: 0, maxScore };
        }
        const isCorrect =
            userAnswer.selectedOptions.length === 1 &&
            correctOption.includes(userAnswer.selectedOptions[0]);
        return { scoreAwarded: isCorrect ? maxScore : 0, maxScore };
    }

    const totalOptions = answerData.options.length;
    const maxScore = totalOptions === 0 ? 0 : Math.max(0.25, Math.floor(totalOptions / 2) * 0.25);

    if (!userAnswer || !userAnswer.selectedOptions || !userAnswer.selectedOptions.length) {
        return { scoreAwarded: 0, maxScore };
    }

    const incorrectCount = totalOptions - correctCount;
    let score = 0;
    const correctScorePerItem = correctCount > 0 ? maxScore / correctCount : 0;
    const incorrectPenaltyPerItem = incorrectCount > 0 ? maxScore / incorrectCount : 0;

    for (const optionIdx of userAnswer.selectedOptions) {
        if (correctOption.includes(optionIdx)) {
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

function isFillAnswerCorrect(
    acceptedAnswers: string[],
    typedAnswer: string,
    onDebugLog?: (msg: string) => void
): boolean {
    if (!typedAnswer.trim()) return false;

    const userNormalized = normalizeText(typedAnswer);
    const userNums = extractNumbers(typedAnswer);

    for (const accepted of acceptedAnswers) {
        const acceptedNormalized = normalizeText(accepted);
        const acceptedNums = extractNumbers(accepted);

        const numbersMatch =
            userNums.length === acceptedNums.length &&
            userNums.every((num, idx) => num === acceptedNums[idx]);

        if (!numbersMatch) {
            onDebugLog?.(
                `Failed number check for accepted: "${accepted}". ` +
                `Expected numbers: [${acceptedNums.join(", ")}], User numbers: [${userNums.join(", ")}]`
            );
            continue;
        }

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
        const isMatch = distance <= allowedTypos;

        onDebugLog?.(
            `Comparing user "${typedAnswer}" (normalized: "${userNormalized}") with accepted "${accepted}" (normalized: "${acceptedNormalized}"). ` +
            `Word count: ${wordCount}, Allowed typos: ${allowedTypos}, Distance: ${distance}. Match: ${isMatch}`
        );

        if (isMatch) {
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
    if (!userAnswer?.typedAnswer?.trim()) return { scoreAwarded: 0, maxScore };

    console.log(`[Fill Question Evaluation] Starting evaluation for user input: "${userAnswer.typedAnswer}"`);
    const isCorrect = isFillAnswerCorrect(
        answerData.acceptedAnswers,
        userAnswer.typedAnswer,
        (msg) => console.log(`[Fill Question Evaluation] ${msg}`)
    );
    console.log(`[Fill Question Evaluation] Final evaluation result: ${isCorrect ? "CORRECT" : "WRONG"}`);

    return { scoreAwarded: isCorrect ? maxScore : 0, maxScore };
}

function scoreMatch(
    answerData: MatchAnswerData,
    userAnswer: UserMatchAnswer | null,
): { scoreAwarded: number; maxScore: number } {
    const totalPairs = answerData.pairs.length;
    if (totalPairs === 0) return { scoreAwarded: 0, maxScore: 0 };
    const maxScore = Math.max(0.25, Math.floor(totalPairs / 2) * 0.25);
    if (!userAnswer?.pairs?.length) return { scoreAwarded: 0, maxScore };

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
            (p) => p.left?.trim().toLowerCase() === correctLeft.trim().toLowerCase(),
        );
        if (userPair && userPair.right?.trim().toLowerCase() === correctRight.trim().toLowerCase()) {
            correctCount++;
        }
    }
    const scoreAwarded = correctCount === totalPairs ? maxScore : 0;
    return { scoreAwarded, maxScore };
}
     
/**
 * Evaluate a single question locally.
 */
export function evaluateQuestion(question: QuestionV2, userAnswer: UserAnswer | null): QuestionEvalResult {
    let result: { scoreAwarded: number; maxScore: number };

    switch (question.type) {
        case "CHOOSE":
            result = scoreChoose(question.answerData as ChooseAnswerData, userAnswer as UserChooseAnswer | null);
            break;
        case "FILL":
            result = scoreFill(question.answerData as FillAnswerData, userAnswer as UserFillAnswer | null);
            break;
        case "MATCH":
            result = scoreMatch(question.answerData as MatchAnswerData, userAnswer as UserMatchAnswer | null);
            break;
        default:
            result = { scoreAwarded: 0, maxScore: 0 };
    }

    return {
        questionId: question.id,
        scoreAwarded: result.scoreAwarded,
        maxScore: result.maxScore,
        isCorrect: result.scoreAwarded >= result.maxScore && result.maxScore > 0,
    };
}

/**
 * Determine if a CHOOSE question is single-choice or multi-choice.
 */
export function isSingleChoice(question: QuestionV2): boolean {
    if (question.type !== "CHOOSE") return false;
    const data = question.answerData as ChooseAnswerData;
    return (data.correctOption?.length ?? 0) <= 1;
}

/**
 * Format score to show up to 2 decimal places, omitting decimal if 0.
 */
export function formatScore(num: number): string {
    const rounded = Math.round(num * 100) / 100;
    return rounded.toString();
}

/**
 * Get the possible min and max points for a question.
 */
export function getQuestionPointsRange(question: QuestionV2): { min: number; max: number; isRange: boolean } {
    if (question.type === "CHOOSE") {
        const data = question.answerData as ChooseAnswerData;
        if ((data.correctOption?.length ?? 0) <= 1) {
            return { min: 0.25, max: 0.25, isRange: false };
        } else {
            const totalOptions = data.options.length;
            const max = totalOptions === 0 ? 0 : Math.max(0.25, Math.floor(totalOptions / 2) * 0.25);
            const correctCount = data.correctOption?.length ?? 0;
            const min = correctCount > 0 ? max / correctCount : 0;
            return {
                min: Math.round(min * 10000) / 10000,
                max: Math.round(max * 10000) / 10000,
                isRange: min < max,
            };
        }
    } else if (question.type === "FILL") {
        return { min: 0.5, max: 0.5, isRange: false };
    } else if (question.type === "MATCH") {
        const data = question.answerData as MatchAnswerData;
        const totalPairs = data.pairs?.length || 0;
        const max = totalPairs === 0 ? 0 : Math.max(0.25, Math.floor(totalPairs / 2) * 0.25);
        return { min: max, max, isRange: false };
    }
    return { min: 0, max: 0, isRange: false };
}
