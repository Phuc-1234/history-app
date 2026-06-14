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
    const correctCount = answerData.correctOption.length;

    if (correctCount <= 1) {
        const maxScore = 0.25;
        if (!userAnswer?.selectedOptions?.length) return { scoreAwarded: 0, maxScore };
        const isCorrect =
            userAnswer.selectedOptions.length === 1 &&
            answerData.correctOption.includes(userAnswer.selectedOptions[0]);
        return { scoreAwarded: isCorrect ? maxScore : 0, maxScore };
    }

    const partialTable4 = [0, 0.1, 0.25, 0.5, 1.0];
    const getMaxScore = (n: number) => (n <= 4 ? (partialTable4[n] ?? 1.0) : 1.0 + (n - 4) * 0.25);
    const getPartialScore = (n: number, hits: number) => {
        if (hits <= 0) return 0;
        if (n <= 4) return partialTable4[Math.min(hits, n)] ?? 0;
        const table = [0, 0.1, 0.25, 0.75, 1.0];
        if (hits <= 4) return table[hits] ?? 0;
        return 1.0 + (hits - 4) * 0.25;
    };

    const maxScore = getMaxScore(correctCount);
    if (!userAnswer?.selectedOptions?.length) return { scoreAwarded: 0, maxScore };

    const hasWrong = userAnswer.selectedOptions.some((idx) => !answerData.correctOption.includes(idx));
    if (hasWrong) return { scoreAwarded: 0, maxScore };

    const correctHits = userAnswer.selectedOptions.filter((idx) => answerData.correctOption.includes(idx)).length;
    return { scoreAwarded: getPartialScore(correctCount, correctHits), maxScore };
}

function scoreFill(
    answerData: FillAnswerData,
    userAnswer: UserFillAnswer | null,
): { scoreAwarded: number; maxScore: number } {
    const maxScore = 0.5;
    if (!userAnswer?.typedAnswer?.trim()) return { scoreAwarded: 0, maxScore };
    const userText = userAnswer.typedAnswer.trim().toLowerCase();
    const isCorrect = answerData.acceptedAnswers.some((a) => a.trim().toLowerCase() === userText);
    return { scoreAwarded: isCorrect ? maxScore : 0, maxScore };
}

function scoreMatch(
    answerData: MatchAnswerData,
    userAnswer: UserMatchAnswer | null,
): { scoreAwarded: number; maxScore: number } {
    const maxScore = 1.0;
    const totalPairs = answerData.pairs.length;
    if (totalPairs === 0) return { scoreAwarded: 0, maxScore };
    if (!userAnswer?.pairs?.length) return { scoreAwarded: 0, maxScore };

    const perPair = maxScore / totalPairs;
    let score = 0;
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
            score += perPair;
        }
    }
    return { scoreAwarded: Math.round(score * 10000) / 10000, maxScore };
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
