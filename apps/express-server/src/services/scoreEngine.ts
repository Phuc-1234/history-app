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
    const partialTable4 = [0, 0.1, 0.2, 0.5, 1.0];
    // For N>4: extend with 0.1, 0.2, 0.75, 1.0, 1.25, ...
    function getMaxScore(n: number): number {
        if (n <= 4) return partialTable4[n] ?? 1.0;
        // For N>4 the max is the Nth entry
        return 1.0 + (n - 4) * 0.25;
    }

    function getPartialScore(n: number, hits: number): number {
        if (hits <= 0) return 0;
        if (n <= 4) return partialTable4[Math.min(hits, n)] ?? 0;
        // Extended table
        const table = [0, 0.1, 0.2, 0.75, 1.0];
        if (hits <= 4) return table[hits] ?? 0;
        return 1.0 + (hits - 4) * 0.25;
    }

    const maxScore = getMaxScore(totalOptions);

    if (!userAnswer || !userAnswer.selectedOptions?.length) {
        return { scoreAwarded: 0, maxScore };
    }

    // Each option is a true/false decision
    let correctHits = 0;
    for (let idx = 0; idx < totalOptions; idx++) {
        const isCorrectOption = answerData.correctOption.includes(idx);
        const isSelectedByUser = userAnswer.selectedOptions.includes(idx);
        if (isCorrectOption === isSelectedByUser) {
            correctHits++;
        }
    }

    return {
        scoreAwarded: getPartialScore(totalOptions, correctHits),
        maxScore,
    };
}

function scoreFill(
    answerData: FillAnswerData,
    userAnswer: UserFillAnswer | null,
): { scoreAwarded: number; maxScore: number } {
    const maxScore = 0.5;
    if (!userAnswer || !userAnswer.typedAnswer?.trim()) {
        return { scoreAwarded: 0, maxScore };
    }
    const userText = userAnswer.typedAnswer.trim().toLowerCase();
    const isCorrect = answerData.acceptedAnswers.some(
        (accepted) => accepted.trim().toLowerCase() === userText,
    );
    return { scoreAwarded: isCorrect ? maxScore : 0, maxScore };
}

function scoreMatch(
    answerData: MatchAnswerData,
    userAnswer: UserMatchAnswer | null,
): { scoreAwarded: number; maxScore: number } {
    const maxScore = 1.0;
    const totalPairs = answerData.pairs.length;
    if (totalPairs === 0) return { scoreAwarded: 0, maxScore };

    if (!userAnswer || !userAnswer.pairs?.length) {
        return { scoreAwarded: 0, maxScore };
    }

    const perPair = maxScore / totalPairs;
    let score = 0;

    for (const rawPair of answerData.pairs) {
        let correctLeft = "";
        let correctRight = "";
        if (rawPair) {
            if (
                typeof rawPair.left === "string" &&
                typeof rawPair.right === "string"
            ) {
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
            score += perPair;
        }
    }

    return { scoreAwarded: Math.round(score * 10000) / 10000, maxScore };
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
        isCorrect:
            result.scoreAwarded >= result.maxScore && result.maxScore > 0,
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
