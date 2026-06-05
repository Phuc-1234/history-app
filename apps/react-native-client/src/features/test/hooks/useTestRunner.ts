import { useState, useEffect, useRef, useCallback } from "react";
import { useDispatch } from "react-redux";
import type { QuestionDto, FinishTestResponse } from "@history-app/shared";
import { Question, TestResult } from "../types";
import { addAttempt } from "../store/testHistorySlice";
import {
    useStartTestMutation,
    useJumpToQuestionMutation,
    useSubmitAnswerMutation,
    useFinishTestMutation,
} from "../services/testApi";

// ---------------------------------------------------------------------------
// QuestionDto (server) → local Question (UI) mapper
// ---------------------------------------------------------------------------
function mapDtoToQuestion(dto: QuestionDto): Question {
    const answers = dto.answers ?? [];
    switch (dto.type) {
        case "CHOOSE": {
            return {
                id: String(dto.id),
                type: "single-choice",
                text: dto.promptText,
                options: answers.map((a) => a.content),
                // Crucial Add: keep a reference of the answer IDs in matching sequence
                answerIds: answers.map((a) => a.id),
                correctOptionIndex: -1,
            };
        }
        case "FILL":
            return {
                id: String(dto.id),
                type: "fill-in-blank",
                text: dto.promptText,
                placeholder: "Nhập câu trả lời của bạn...",
                correctText: "", // graded server-side
            };
        case "MATCH":
            return {
                id: String(dto.id),
                type: "matching",
                text: dto.promptText,
                leftOptions: answers
                    .filter((a) => a.leftText)
                    .map((a) => ({ id: String(a.id), text: a.leftText! })),
                rightOptions: answers
                    .filter((a) => a.rightText)
                    .map((a) => ({ id: String(a.id), text: a.rightText! })),
                correctPairs: {}, // graded server-side
            };
        default:
            // Fallback for any future types
            return {
                id: String(dto.id),
                type: "single-choice",
                text: dto.promptText,
                options: answers.map((a) => a.content),
                correctOptionIndex: -1,
            };
    }
}

// ---------------------------------------------------------------------------
// Build answer payload the server expects from the local UI answer format
// ---------------------------------------------------------------------------
function buildAnswerData(question: Question, answer: any): any {
    if (answer === undefined || answer === null) return null;

    switch (question.type) {
        case "single-choice": {
            // "answer" is currently the selected option index (e.g., 0).
            // Map it back to the database ID the backend evaluates.
            const selectedId = (question as any).answerIds?.[answer];
            return selectedId ? { selectedAnswerIds: [selectedId] } : null;
        }
        case "multiple-choice": {
            // If answer is an array of indices [0, 2], map them to IDs
            const selectedIds = Array.isArray(answer)
                ? answer
                      .map((idx) => (question as any).answerIds?.[idx])
                      .filter(Boolean)
                : [];
            return selectedIds.length > 0
                ? { selectedAnswerIds: selectedIds }
                : null;
        }
        case "fill-in-blank":
            // Use 'typedAnswer' instead of 'text' to prevent fallback stringification
            return { typedAnswer: answer };

        // --- MATCH TYPE ---
        case "matching": {
            // 'answer' is your local state object: { [leftId]: rightId }
            const pairsRecord = answer as Record<string, string>;

            // Safely map the IDs back to their literal display text strings
            const formattedPairs = Object.entries(pairsRecord)
                .map(([leftId, rightId]) => {
                    const leftItem = (question as any).leftOptions?.find(
                        (o: any) => String(o.id) === leftId,
                    );
                    const rightItem = (question as any).rightOptions?.find(
                        (o: any) => String(o.id) === rightId,
                    );

                    return {
                        left: leftItem ? leftItem.text : "",
                        right: rightItem ? rightItem.text : "",
                    };
                })
                .filter((pair) => pair.left && pair.right); // Remove any broken/incomplete matches

            return {
                pairs: formattedPairs,
            };
        }

        default:
            return answer;
    }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export function useTestRunner(testId: string, initialTimeInSeconds = 900) {
    const dispatch = useDispatch();

    // RTK Query mutations
    const [startTestMut] = useStartTestMutation();
    const [jumpMut] = useJumpToQuestionMutation();
    const [submitAnswerMut] = useSubmitAnswerMutation();
    const [finishTestMut] = useFinishTestMutation();

    // Core state
    const [questions, setQuestions] = useState<Question[]>([]);
    const [totalQuestionCount, setTotalQuestionCount] = useState(0);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, any>>({});
    const [timeLeft, setTimeLeft] = useState(initialTimeInSeconds);
    const [status, setStatus] = useState<
        "not-started" | "loading" | "running" | "submitting" | "completed"
    >("not-started");
    const [result, setResult] = useState<TestResult | null>(null);
    const [lastAttemptId, setLastAttemptId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Server-side log session
    const logIdRef = useRef<string | null>(null);
    const timerRef = useRef<any>(null);

    // ------ Timer ------
    useEffect(() => {
        if (status === "running") {
            timerRef.current = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current!);
                        handleSubmit();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [status]);

    // ------ Start test ------
    const handleStart = useCallback(async () => {
        try {
            setStatus("loading");
            setError(null);

            const resp = await startTestMut({ testId }).unwrap();
            logIdRef.current = resp.userTestLogId;

            const total = resp.totalQuestionCount;
            setTotalQuestionCount(total);

            if (resp.timeLimitSeconds) {
                setTimeLeft(resp.timeLimitSeconds);
            }

            // Seed with the first question returned by start
            if (resp.firstQuestion) {
                setQuestions([mapDtoToQuestion(resp.firstQuestion)]);
            }

            setCurrentQuestionIndex(0);
            setStatus("running");
        } catch (err: any) {
            console.error("Failed to start test:", err);
            setError(
                err?.data?.error ??
                    err?.message ??
                    "Không thể bắt đầu bài kiểm tra",
            );
            setStatus("not-started");
        }
    }, [testId, startTestMut]);

    // ------ Navigate / jump ------
    const jumpTo = useCallback(
        async (targetIndex: number) => {
            if (!logIdRef.current || status !== "running") return;

            // Persist current answer before jumping
            const currentQ = questions[currentQuestionIndex];
            if (currentQ && answers[currentQ.id] !== undefined) {
                try {
                    await submitAnswerMut({
                        logId: logIdRef.current,
                        questionId: Number(currentQ.id),
                        answerData: buildAnswerData(
                            currentQ,
                            answers[currentQ.id],
                        ),
                    }).unwrap();
                } catch {
                    // best-effort save — don't block navigation
                }
            }

            try {
                // Server expects 1-based index
                const resp = await jumpMut({
                    logId: logIdRef.current,
                    targetIndex: targetIndex + 1,
                }).unwrap();

                if (resp.question) {
                    const mapped = mapDtoToQuestion(resp.question);
                    setQuestions((prev) => {
                        const copy = [...prev];
                        // Expand array if needed
                        while (copy.length <= targetIndex) {
                            copy.push(null as any);
                        }
                        copy[targetIndex] = mapped;
                        return copy;
                    });

                    // Restore previous answer if server sends it
                    if (
                        resp.previousAnswer !== undefined &&
                        resp.previousAnswer !== null
                    ) {
                        setAnswers((prev) => ({
                            ...prev,
                            [mapped.id]: resp.previousAnswer,
                        }));
                    }
                }

                setCurrentQuestionIndex(targetIndex);
            } catch (err: any) {
                console.error("Jump failed:", err);
                setError(err?.data?.error ?? "Không thể chuyển câu hỏi");
            }
        },
        [
            status,
            questions,
            currentQuestionIndex,
            answers,
            jumpMut,
            submitAnswerMut,
        ],
    );

    const handleGoNext = useCallback(() => {
        if (currentQuestionIndex < totalQuestionCount - 1) {
            jumpTo(currentQuestionIndex + 1);
        }
    }, [currentQuestionIndex, totalQuestionCount, jumpTo]);

    const handleGoPrev = useCallback(() => {
        if (currentQuestionIndex > 0) {
            jumpTo(currentQuestionIndex - 1);
        }
    }, [currentQuestionIndex, jumpTo]);

    // ------ Answer handlers ------
    const handleAnswerSingle = (questionId: string, optionIndex: number) => {
        if (status !== "running") return;
        setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
    };

    const handleAnswerMultiple = (questionId: string, optionIndex: number) => {
        if (status !== "running") return;
        setAnswers((prev) => {
            const currentSelected: number[] = prev[questionId] || [];
            let newSelected: number[];
            if (currentSelected.includes(optionIndex)) {
                newSelected = currentSelected.filter(
                    (idx) => idx !== optionIndex,
                );
            } else {
                newSelected = [...currentSelected, optionIndex].sort();
            }
            return { ...prev, [questionId]: newSelected };
        });
    };

    const handleAnswerFill = (questionId: string, text: string) => {
        if (status !== "running") return;
        setAnswers((prev) => ({ ...prev, [questionId]: text }));
    };

    const handleAnswerMatching = (
        questionId: string,
        leftId: string,
        rightId: string,
    ) => {
        if (status !== "running") return;
        setAnswers((prev) => {
            const currentMatches: Record<string, string> =
                prev[questionId] || {};
            const cleanedMatches = { ...currentMatches };
            Object.keys(cleanedMatches).forEach((key) => {
                if (cleanedMatches[key] === rightId) {
                    delete cleanedMatches[key];
                }
            });
            return {
                ...prev,
                [questionId]: { ...cleanedMatches, [leftId]: rightId },
            };
        });
    };

    const handleRemoveMatch = (questionId: string, leftId: string) => {
        if (status !== "running") return;
        setAnswers((prev) => {
            const currentMatches: Record<string, string> =
                prev[questionId] || {};
            const newMatches = { ...currentMatches };
            delete newMatches[leftId];
            return { ...prev, [questionId]: newMatches };
        });
    };

    // ------ Submit / Finish ------
    const handleSubmit = useCallback(async () => {
        if (
            status === "completed" ||
            status === "submitting" ||
            !logIdRef.current
        )
            return;
        setStatus("submitting");
        if (timerRef.current) clearInterval(timerRef.current);

        try {
            // Persist the current question's answer first
            const currentQ = questions[currentQuestionIndex];
            if (currentQ && answers[currentQ.id] !== undefined) {
                await submitAnswerMut({
                    logId: logIdRef.current!,
                    questionId: Number(currentQ.id),
                    answerData: buildAnswerData(currentQ, answers[currentQ.id]),
                })
                    .unwrap()
                    .catch(() => {});
            }

            // Finish
            const resp: FinishTestResponse = await finishTestMut({
                logId: logIdRef.current!,
            }).unwrap();

            // Build graded map
            const graded: Record<string, boolean> = {};
            let correctCount = 0;
            if (resp.questionSummaries) {
                resp.questionSummaries.forEach((qs) => {
                    graded[String(qs.questionId)] = qs.isCorrect;
                    if (qs.isCorrect) correctCount++;
                });
            }

            setResult({
                score: resp.score,
                totalQuestions: totalQuestionCount,
                correctAnswersCount: correctCount,
                gradedAnswers: graded,
            });

            // Save to Redux history
            const attemptId = logIdRef.current!;
            const now = new Date();
            const pad = (n: number) => n.toString().padStart(2, "0");
            const dateStr = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

            dispatch(
                addAttempt({
                    id: attemptId,
                    testId,
                    testTitle: `Kiểm tra`, // server doesn't return title in finish
                    timestamp: dateStr,
                    score: resp.score,
                    correctAnswersCount: correctCount,
                    totalQuestions: totalQuestionCount,
                    answers,
                    gradedAnswers: graded,
                    questions: questions.filter(Boolean),
                }),
            );
            setLastAttemptId(attemptId);
            setStatus("completed");
        } catch (err: any) {
            console.error("Finish test error:", err);
            setError(err?.data?.error ?? "Không thể nộp bài");
            setStatus("running"); // allow retry
        }
    }, [
        status,
        questions,
        currentQuestionIndex,
        answers,
        totalQuestionCount,
        testId,
        submitAnswerMut,
        finishTestMut,
        dispatch,
    ]);

    // ------ Restart ------
    const handleRestart = useCallback(async () => {
        setAnswers({});
        setCurrentQuestionIndex(0);
        setTimeLeft(initialTimeInSeconds);
        setResult(null);
        setLastAttemptId(null);
        setError(null);
        setQuestions([]);
        // Start a fresh server session
        await handleStart();
    }, [initialTimeInSeconds, handleStart]);

    // ------ Utilities ------
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    const isQuestionAnswered = (questionId: string) => {
        const ans = answers[questionId];
        if (ans === undefined || ans === null) return false;
        if (Array.isArray(ans)) return ans.length > 0;
        if (typeof ans === "object") return Object.keys(ans).length > 0;
        if (typeof ans === "string") return ans.trim().length > 0;
        return true;
    };

    return {
        questions,
        totalQuestionCount,
        currentQuestionIndex,
        currentQuestion: questions[currentQuestionIndex] ?? null,
        answers,
        timeLeft,
        formattedTime: formatTime(timeLeft),
        status,
        result,
        lastAttemptId,
        error,
        actions: {
            start: handleStart,
            answerSingle: handleAnswerSingle,
            answerMultiple: handleAnswerMultiple,
            answerFill: handleAnswerFill,
            answerMatching: handleAnswerMatching,
            removeMatch: handleRemoveMatch,
            goNext: handleGoNext,
            goPrev: handleGoPrev,
            submit: handleSubmit,
            setQuestionIndex: jumpTo,
            restart: handleRestart,
        },
        isQuestionAnswered,
    };
}
