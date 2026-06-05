import { useState, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { Question, TestResult } from "../types";
import { addAttempt } from "../store/testHistorySlice";

const MOCK_QUESTIONS: Question[] = [
    {
        id: "q1",
        type: "single-choice",
        text: "Đối tượng nghiên cứu của Sử học là gì?",
        options: [
            "Toàn bộ hoạt động của con người trong quá khứ.",
            "Quá trình hình thành và phát triển của trái đất.",
            "Những hiện tượng tự nhiên xảy ra trong quá khứ.",
            "Các quy luật vận động của xã hội hiện đại."
        ],
        correctOptionIndex: 0
    },
    {
        id: "q2",
        type: "multiple-choice",
        text: "Đâu là các nguồn sử liệu cơ bản của Sử học?",
        options: [
            "Sử liệu truyền miệng.",
            "Sử liệu hiện vật.",
            "Sử liệu chữ viết.",
            "Sử liệu tin đồn mạng xã hội chưa được xác thực."
        ],
        correctOptionIndexes: [0, 1, 2]
    },
    {
        id: "q3",
        type: "fill-in-blank",
        text: "Lịch sử là những gì đã xảy ra trong...",
        placeholder: "Nhập câu trả lời của bạn...",
        correctText: "quá khứ"
    },
    {
        id: "q4",
        type: "matching",
        text: "Hãy nối các sự kiện lịch sử ở cột bên trái với năm diễn ra tương ứng ở cột bên phải:",
        leftOptions: [
            { id: "L1", text: "Cách mạng tháng Tám thành công" },
            { id: "L2", text: "Chiến dịch Điện Biên Phủ" },
            { id: "L3", text: "Giải phóng miền Nam" }
        ],
        rightOptions: [
            { id: "R1", text: "Năm 1954" },
            { id: "R2", text: "Năm 1975" },
            { id: "R3", text: "Năm 1945" }
        ],
        correctPairs: {
            "L1": "R3",
            "L2": "R1",
            "L3": "R2"
        }
    }
];

export function useTestRunner(initialTimeInSeconds = 900) {
    const dispatch = useDispatch();
    const [questions] = useState<Question[]>(MOCK_QUESTIONS);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, any>>({});
    const [timeLeft, setTimeLeft] = useState(initialTimeInSeconds);
    const [status, setStatus] = useState<"not-started" | "running" | "completed">("not-started");
    const [result, setResult] = useState<TestResult | null>(null);
    const [lastAttemptId, setLastAttemptId] = useState<string | null>(null);

    const timerRef = useRef<any>(null);

    useEffect(() => {
        if (status === "running") {
            timerRef.current = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current!);
                        // Trigger auto submit
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

    const handleAnswerSingle = (questionId: string, optionIndex: number) => {
        if (status !== "running") return;
        setAnswers((prev) => ({
            ...prev,
            [questionId]: optionIndex
        }));
    };

    const handleAnswerMultiple = (questionId: string, optionIndex: number) => {
        if (status !== "running") return;
        setAnswers((prev) => {
            const currentSelected: number[] = prev[questionId] || [];
            let newSelected: number[];
            if (currentSelected.includes(optionIndex)) {
                newSelected = currentSelected.filter((idx) => idx !== optionIndex);
            } else {
                newSelected = [...currentSelected, optionIndex].sort();
            }
            return {
                ...prev,
                [questionId]: newSelected
            };
        });
    };

    const handleAnswerFill = (questionId: string, text: string) => {
        if (status !== "running") return;
        setAnswers((prev) => ({
            ...prev,
            [questionId]: text
        }));
    };

    const handleAnswerMatching = (questionId: string, leftId: string, rightId: string) => {
        if (status !== "running") return;
        setAnswers((prev) => {
            const currentMatches: Record<string, string> = prev[questionId] || {};
            
            // If rightId is already matched to another leftId, remove that old match
            const cleanedMatches = { ...currentMatches };
            Object.keys(cleanedMatches).forEach((key) => {
                if (cleanedMatches[key] === rightId) {
                    delete cleanedMatches[key];
                }
            });

            const newMatches = {
                ...cleanedMatches,
                [leftId]: rightId
            };
            return {
                ...prev,
                [questionId]: newMatches
            };
        });
    };

    const handleRemoveMatch = (questionId: string, leftId: string) => {
        if (status !== "running") return;
        setAnswers((prev) => {
            const currentMatches: Record<string, string> = prev[questionId] || {};
            const newMatches = { ...currentMatches };
            delete newMatches[leftId];
            return {
                ...prev,
                [questionId]: newMatches
            };
        });
    };

    const handleGoNext = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex((prev) => prev + 1);
        }
    };

    const handleGoPrev = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex((prev) => prev - 1);
        }
    };

    const normalizeText = (text: string) => {
        return text
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .trim();
    };

    const handleSubmit = () => {
        if (status === "completed") return;
        setStatus("completed");
        if (timerRef.current) clearInterval(timerRef.current);

        // Grade the test
        let correctCount = 0;
        const graded: Record<string, boolean> = {};

        questions.forEach((q) => {
            const userAns = answers[q.id];
            if (q.type === "single-choice") {
                const isCorrect = userAns === q.correctOptionIndex;
                graded[q.id] = isCorrect;
                if (isCorrect) correctCount++;
            } else if (q.type === "multiple-choice") {
                const arr = userAns || [];
                const isCorrect =
                    arr.length === q.correctOptionIndexes.length &&
                    arr.every((val: number) => q.correctOptionIndexes.includes(val));
                graded[q.id] = isCorrect;
                if (isCorrect) correctCount++;
            } else if (q.type === "fill-in-blank") {
                const userText = userAns || "";
                const isCorrect = normalizeText(userText) === normalizeText(q.correctText);
                graded[q.id] = isCorrect;
                if (isCorrect) correctCount++;
            } else if (q.type === "matching") {
                const userPairs = userAns || {};
                const leftKeys = q.leftOptions.map((o) => o.id);
                const isCorrect =
                    leftKeys.every((key) => userPairs[key] === q.correctPairs[key]) &&
                    Object.keys(userPairs).length === leftKeys.length;
                graded[q.id] = isCorrect;
                if (isCorrect) correctCount++;
            }
        });

        const score = Math.round((correctCount / questions.length) * 10);
        setResult({
            score,
            totalQuestions: questions.length,
            correctAnswersCount: correctCount,
            gradedAnswers: graded
        });

        // Save to Redux history
        const attemptId = `attempt-${Date.now()}`;
        const finalScore = Math.round((correctCount / questions.length) * 100);
        const now = new Date();
        const pad = (n: number) => n.toString().padStart(2, "0");
        const dateStr = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

        dispatch(addAttempt({
            id: attemptId,
            testId: "test-theme-1",
            testTitle: "Kiểm tra Chủ đề 1",
            timestamp: dateStr,
            score: finalScore,
            correctAnswersCount: correctCount,
            totalQuestions: questions.length,
            answers,
            gradedAnswers: graded,
            questions
        }));
        setLastAttemptId(attemptId);
    };

    const handleStart = () => {
        setStatus("running");
    };

    const handleRestart = () => {
        setAnswers({});
        setCurrentQuestionIndex(0);
        setTimeLeft(initialTimeInSeconds);
        setStatus("running");
        setResult(null);
        setLastAttemptId(null);
    };

    // Formatted time: mm:ss
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
        currentQuestionIndex,
        currentQuestion: questions[currentQuestionIndex],
        answers,
        timeLeft,
        formattedTime: formatTime(timeLeft),
        status,
        result,
        lastAttemptId,
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
            setQuestionIndex: setCurrentQuestionIndex,
            restart: handleRestart
        },
        isQuestionAnswered
    };
}
