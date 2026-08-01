// hooks/useTestRunnerV2.ts — V2 test runner for Practice + Exam modes
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Alert, Platform } from "react-native";
import type {
    StartTestV2Request,
    StartTestV2Response,
    FinishTestV2Response,
    QuestionV2,
    UserTestLogV2,
    DraftAnswerEntry,
    UserAnswer,
    UserChooseAnswer,
    UserFillAnswer,
    UserMatchAnswer,
    QuestionEvalResult,
} from "../types";
import {
    useStartTestV2Mutation,
    useUpdateDraftMutation,
    useFinishTestV2Mutation,
} from "../services/testApi";
import { evaluateQuestion, isSingleChoice } from "../services/scoreEngine";
import { useLoading } from "../../loading";

export type TestRunnerStatus = "idle" | "loading" | "running" | "submitting" | "completed";

export interface TestRunnerV2State {
    // Session
    session: UserTestLogV2 | null;
    questions: QuestionV2[];
    purposeType: "PRACTICE" | "EXAM";
    status: TestRunnerStatus;
    error: string | null;

    // Navigation
    currentIndex: number;
    totalCount: number;
    currentQuestion: QuestionV2 | null;

    // Answers
    draftAnswers: DraftAnswerEntry[];
    evaluations: Record<number, QuestionEvalResult>; // practice mode: per-question eval

    // Timer (exam mode)
    timeLeft: number; // seconds
    formattedTime: string;

    // Result
    result: FinishTestV2Response | null;

    // Practice redo queue
    redoQueue: number[]; // questionIds to redo

    // Actions
    actions: {
        start: () => Promise<void>;
        answerChoose: (questionId: number, selectedOptions: number[]) => void;
        answerFill: (questionId: number, typedAnswer: string) => void;
        answerMatch: (questionId: number, pairs: { left: string; right: string }[]) => void;
        goNext: () => void;
        goPrev: () => void;
        jumpTo: (index: number) => void;
        submit: () => Promise<void>;
        restart: () => Promise<void>;
        redoWrong: () => void;
        confirmAnswer: () => void;
        clearError: () => void;
    };

    // Utilities
    isQuestionAnswered: (questionId: number) => boolean;
    getAnswerForQuestion: (questionId: number) => UserAnswer | null;
    getEvalForQuestion: (questionId: number) => QuestionEvalResult | null;
}

export function useTestRunnerV2(params: StartTestV2Request): TestRunnerV2State {
    const { showLoading, hideLoading } = useLoading();
    const [startTestMut] = useStartTestV2Mutation();
    const [updateDraftMut] = useUpdateDraftMutation();
    const [finishTestMut] = useFinishTestV2Mutation();

    const [session, setSession] = useState<UserTestLogV2 | null>(null);
    const [questions, setQuestions] = useState<QuestionV2[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [draftAnswers, setDraftAnswers] = useState<DraftAnswerEntry[]>([]);
    const [evaluations, setEvaluations] = useState<Record<number, QuestionEvalResult>>({});
    const [status, setStatus] = useState<TestRunnerStatus>("idle");
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<FinishTestV2Response | null>(null);
    const [timeLeft, setTimeLeft] = useState(0);
    const [redoQueue, setRedoQueue] = useState<number[]>([]);
    const [seenQuestionIds, setSeenQuestionIds] = useState<number[]>([]);

    const timerRef = useRef<any>(null);
    const draftSyncRef = useRef<any>(null);
    const sessionRef = useRef(session);
    const draftRef = useRef(draftAnswers);
    const seenRef = useRef(seenQuestionIds);

    const purposeType = (params.purposeType ?? session?.purposeType ?? "PRACTICE") as "PRACTICE" | "EXAM";
    const currentQuestion = questions[currentIndex] ?? null;

    // Keep refs in sync
    useEffect(() => { sessionRef.current = session; }, [session]);
    useEffect(() => { draftRef.current = draftAnswers; }, [draftAnswers]);
    useEffect(() => { seenRef.current = seenQuestionIds; }, [seenQuestionIds]);

    // ── Timer (exam mode) ────────────────────────────────────────────
    useEffect(() => {
        if (status !== "running" || purposeType !== "EXAM" || !session?.expiresAt) return;

        const tick = () => {
            const remaining = Math.max(0, Math.floor((new Date(session.expiresAt!).getTime() - Date.now()) / 1000));
            setTimeLeft(remaining);
            if (remaining <= 0) {
                clearInterval(timerRef.current);
                handleSubmit();
            }
        };

        tick();
        timerRef.current = setInterval(tick, 1000);
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [status, session?.expiresAt, purposeType]);

    // ── Draft sync (debounced 3s) ────────────────────────────────────
    useEffect(() => {
        if (status !== "running" || !session) return;

        if (draftSyncRef.current) clearTimeout(draftSyncRef.current);
        draftSyncRef.current = setTimeout(() => {
            if (sessionRef.current) {
                updateDraftMut({
                    logId: sessionRef.current.id,
                    draftAnswerJson: draftRef.current,
                }).catch(() => {}); // fire-and-forget
            }
        }, 3000);

        return () => { if (draftSyncRef.current) clearTimeout(draftSyncRef.current); };
    }, [draftAnswers, status, session?.id]);

    // ── Track seen questions ─────────────────────────────────────────
    useEffect(() => {
        if (currentQuestion) {
            setSeenQuestionIds((prev) => {
                if (prev.includes(currentQuestion.id)) return prev;
                return [...prev, currentQuestion.id];
            });
        }
    }, [currentQuestion]);

    // ── Start test ───────────────────────────────────────────────────
    const handleStart = useCallback(async () => {
        try {
            setStatus("loading");
            setError(null);
            showLoading();
            const resp = await startTestMut(params).unwrap();
            setSession(resp.userTestLog);
            setQuestions(resp.questions);
            setCurrentIndex(0);
            setDraftAnswers(resp.userTestLog.draftAnswerJson ?? []);
            setSeenQuestionIds(resp.userTestLog.draftAnswerJson?.map((d) => d.questionId) ?? []);
            setEvaluations({});
            setRedoQueue([]);
            setResult(null);

            if (resp.userTestLog.expiresAt) {
                const remaining = Math.max(0, Math.floor((new Date(resp.userTestLog.expiresAt).getTime() - Date.now()) / 1000));
                setTimeLeft(remaining);
            }

            setStatus("running");
        } catch (err: any) {
            console.error("Failed to start test:", err);
            setError(err?.data?.error ?? err?.message ?? "Không thể bắt đầu bài kiểm tra");
            setStatus("idle");
        } finally {
            hideLoading();
        }
    }, [params, startTestMut, showLoading, hideLoading]);

    // ── Resume from existing session ─────────────────────────────────
    const resumeSession = useCallback((log: UserTestLogV2, qs: QuestionV2[]) => {
        setSession(log);
        setQuestions(qs);
        setCurrentIndex(log.currentQuestionIndex);
        setDraftAnswers(log.draftAnswerJson ?? []);
        setSeenQuestionIds(log.draftAnswerJson?.map((d) => d.questionId) ?? []);
        setEvaluations({});
        setRedoQueue([]);
        setResult(null);
        if (log.expiresAt) {
            setTimeLeft(Math.max(0, Math.floor((new Date(log.expiresAt).getTime() - Date.now()) / 1000)));
        }
        setStatus("running");
    }, []);

    // ── Answer handlers ──────────────────────────────────────────────
    const setAnswer = useCallback((questionId: number, type: string, answerData: UserAnswer) => {
        const entry: DraftAnswerEntry = {
            questionId,
            type: type as any,
            answerData,
            answeredAt: new Date().toISOString(),
        };
        setDraftAnswers((prev) => {
            const filtered = prev.filter((d) => d.questionId !== questionId);
            return [...filtered, entry];
        });
    }, []);

    const answerChoose = useCallback((questionId: number, selectedOptions: number[]) => {
        if (status !== "running") return;
        setAnswer(questionId, "CHOOSE", { selectedOptions } as UserChooseAnswer);
    }, [status, setAnswer]);

    const answerFill = useCallback((questionId: number, typedAnswer: string) => {
        if (status !== "running") return;
        setAnswer(questionId, "FILL", { typedAnswer } as UserFillAnswer);
    }, [status, setAnswer]);

    const answerMatch = useCallback((questionId: number, pairs: { left: string; right: string }[]) => {
        if (status !== "running") return;
        setAnswer(questionId, "MATCH", { pairs } as UserMatchAnswer);
    }, [status, setAnswer]);

    // ── Navigation ───────────────────────────────────────────────────
    const goNext = useCallback(() => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex((i) => i + 1);
        }
    }, [currentIndex, questions.length]);

    const goPrev = useCallback(() => {
        if (currentIndex > 0) {
            setCurrentIndex((i) => i - 1);
        }
    }, [currentIndex]);

    const jumpTo = useCallback((index: number) => {
        if (purposeType === "EXAM" && index >= 0 && index < questions.length) {
            setCurrentIndex(index);
        }
    }, [purposeType, questions.length]);

    // ── Submit ────────────────────────────────────────────────────────
    const handleSubmit = useCallback(async () => {
        if (status === "completed" || status === "submitting" || !sessionRef.current) return;
        setStatus("submitting");
        if (timerRef.current) clearInterval(timerRef.current);
        if (draftSyncRef.current) clearTimeout(draftSyncRef.current);

        try {
            const resp = await finishTestMut({
                logId: sessionRef.current.id,
                draftAnswerJson: draftRef.current,
                seenQuestionIds: seenRef.current,
            }).unwrap();

            setResult(resp);
            setSession(resp.userTestLog);
            setStatus("completed");
        } catch (err: any) {
            console.error("Finish test error:", err);
            const errMsg = err?.data?.error ?? err?.message ?? "Không thể nộp bài";
            setError(errMsg);
            if (Platform.OS === "web") {
                if (typeof window !== "undefined" && window.alert) {
                    window.alert(`Lỗi nộp bài: ${errMsg}`);
                }
            } else {
                Alert.alert("Lỗi nộp bài", errMsg);
            }
            setStatus("running");
        }
    }, [status, finishTestMut]);

    // ── Redo wrong (practice mode) ───────────────────────────────────
    const redoWrong = useCallback(() => {
        if (purposeType !== "PRACTICE") return;
        const wrongIds = Object.entries(evaluations)
            .filter(([, e]) => !e.isCorrect)
            .map(([id]) => Number(id));

        if (wrongIds.length === 0) return;

        // Re-sequence: only wrong questions
        const wrongQuestions = questions.filter((q) => wrongIds.includes(q.id));
        setQuestions(wrongQuestions);
        setCurrentIndex(0);
        setRedoQueue(wrongIds);
        // Clear evaluations for redo questions
        setEvaluations((prev) => {
            const next = { ...prev };
            for (const id of wrongIds) delete next[id];
            return next;
        });
        // Clear draft answers for redo questions
        setDraftAnswers((prev) => prev.filter((d) => !wrongIds.includes(d.questionId)));
    }, [purposeType, evaluations, questions]);

    // ── Restart ──────────────────────────────────────────────────────
    const handleRestart = useCallback(async () => {
        setSession(null);
        setQuestions([]);
        setCurrentIndex(0);
        setDraftAnswers([]);
        setSeenQuestionIds([]);
        setEvaluations({});
        setRedoQueue([]);
        setResult(null);
        setTimeLeft(0);
        setError(null);
        await handleStart();
    }, [handleStart]);

    // ── Confirm Answer (practice mode) ───────────────────────────────
    const confirmAnswer = useCallback(() => {
        if (purposeType !== "PRACTICE" || !currentQuestion) return;
        const questionId = currentQuestion.id;
        const draft = draftAnswers.find((d) => d.questionId === questionId);
        const userAnswer = draft?.answerData ?? null;

        const evalResult = evaluateQuestion(currentQuestion, userAnswer);
        setEvaluations((prev) => ({ ...prev, [questionId]: evalResult }));
    }, [purposeType, currentQuestion, draftAnswers]);

    // ── Utilities ────────────────────────────────────────────────────
    const isQuestionAnswered = useCallback((questionId: number) => {
        const draft = draftAnswers.find((d) => d.questionId === questionId);
        if (!draft) return false;
        if (draft.type === "FILL") {
            const ans = draft.answerData as UserFillAnswer;
            return !!ans.typedAnswer && ans.typedAnswer.trim() !== "";
        }
        if (draft.type === "MATCH") {
            const ans = draft.answerData as UserMatchAnswer;
            return !!ans.pairs && ans.pairs.length > 0;
        }
        if (draft.type === "CHOOSE") {
            const ans = draft.answerData as UserChooseAnswer;
            return !!ans.selectedOptions && ans.selectedOptions.length > 0;
        }
        return true;
    }, [draftAnswers]);

    const getAnswerForQuestion = useCallback((questionId: number): UserAnswer | null => {
        return draftAnswers.find((d) => d.questionId === questionId)?.answerData ?? null;
    }, [draftAnswers]);

    const getEvalForQuestion = useCallback((questionId: number): QuestionEvalResult | null => {
        return evaluations[questionId] ?? null;
    }, [evaluations]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    };

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    const startRef = useRef(handleStart);
    const answerChooseRef = useRef(answerChoose);
    const answerFillRef = useRef(answerFill);
    const answerMatchRef = useRef(answerMatch);
    const goNextRef = useRef(goNext);
    const goPrevRef = useRef(goPrev);
    const jumpToRef = useRef(jumpTo);
    const handleSubmitRef = useRef(handleSubmit);
    const handleRestartRef = useRef(handleRestart);
    const redoWrongRef = useRef(redoWrong);
    const confirmAnswerRef = useRef(confirmAnswer);
    const clearErrorRef = useRef(clearError);

    useEffect(() => { startRef.current = handleStart; }, [handleStart]);
    useEffect(() => { answerChooseRef.current = answerChoose; }, [answerChoose]);
    useEffect(() => { answerFillRef.current = answerFill; }, [answerFill]);
    useEffect(() => { answerMatchRef.current = answerMatch; }, [answerMatch]);
    useEffect(() => { goNextRef.current = goNext; }, [goNext]);
    useEffect(() => { goPrevRef.current = goPrev; }, [goPrev]);
    useEffect(() => { jumpToRef.current = jumpTo; }, [jumpTo]);
    useEffect(() => { handleSubmitRef.current = handleSubmit; }, [handleSubmit]);
    useEffect(() => { handleRestartRef.current = handleRestart; }, [handleRestart]);
    useEffect(() => { redoWrongRef.current = redoWrong; }, [redoWrong]);
    useEffect(() => { confirmAnswerRef.current = confirmAnswer; }, [confirmAnswer]);
    useEffect(() => { clearErrorRef.current = clearError; }, [clearError]);

    const actions = useMemo(() => ({
        start: () => startRef.current(),
        answerChoose: (questionId: number, selectedOptions: number[]) => answerChooseRef.current(questionId, selectedOptions),
        answerFill: (questionId: number, typedAnswer: string) => answerFillRef.current(questionId, typedAnswer),
        answerMatch: (questionId: number, pairs: { left: string; right: string }[]) => answerMatchRef.current(questionId, pairs),
        goNext: () => goNextRef.current(),
        goPrev: () => goPrevRef.current(),
        jumpTo: (index: number) => jumpToRef.current(index),
        submit: () => handleSubmitRef.current(),
        restart: () => handleRestartRef.current(),
        redoWrong: () => redoWrongRef.current(),
        confirmAnswer: () => confirmAnswerRef.current(),
        clearError: () => clearErrorRef.current(),
    }), []);

    return {
        session,
        questions,
        purposeType,
        status,
        error,
        currentIndex,
        totalCount: questions.length,
        currentQuestion,
        draftAnswers,
        evaluations,
        timeLeft,
        formattedTime: formatTime(timeLeft),
        result,
        redoQueue,
        actions,
        isQuestionAnswered,
        getAnswerForQuestion,
        getEvalForQuestion,
    };
}
