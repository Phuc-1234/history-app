import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/services/supabaseClient";
import type { PvpLeaderboardEntry, PvpParticipant, QuestionV2 } from "../types";

export interface PvpRealtimeState {
    participants: PvpParticipant[];
    isGameStarted: boolean;
    currentQuestionIndex: number;
    totalQuestions: number;
    timeLimitSeconds: number;
    currentQuestion: QuestionV2 | null;
    questionResult: {
        correctAnswerData: any;
        explanation: string | null;
        leaderboard: PvpParticipant[];
    } | null;
    finalLeaderboard: PvpLeaderboardEntry[] | null;
    answeredUserIds: string[];
}

export function usePvpRealtime(roomCode: string | null, initialParticipants: PvpParticipant[] = []) {
    const [participants, setParticipants] = useState<PvpParticipant[]>(initialParticipants);
    const [isGameStarted, setIsGameStarted] = useState(false);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [totalQuestions, setTotalQuestions] = useState(10);
    const [timeLimitSeconds, setTimeLimitSeconds] = useState(15);
    const [currentQuestion, setCurrentQuestion] = useState<QuestionV2 | null>(null);
    const [questionResult, setQuestionResult] = useState<PvpRealtimeState["questionResult"]>(null);
    const [finalLeaderboard, setFinalLeaderboard] = useState<PvpLeaderboardEntry[] | null>(null);
    const [answeredUserIds, setAnsweredUserIds] = useState<string[]>([]);
    const [showLeaderboard, setShowLeaderboard] = useState(false);
    const [rankChanges, setRankChanges] = useState<Record<string, number>>({});

    const channelRef = useRef<any>(null);
    const prevRanksRef = useRef<Record<string, number>>({});

    const resetState = useCallback(() => {
        setParticipants([]);
        setIsGameStarted(false);
        setCurrentQuestionIndex(0);
        setCurrentQuestion(null);
        setQuestionResult(null);
        setFinalLeaderboard(null);
        setAnsweredUserIds([]);
        setShowLeaderboard(false);
        setRankChanges({});
        prevRanksRef.current = {};
    }, []);

    useEffect(() => {
        if (initialParticipants && initialParticipants.length > 0) {
            setParticipants(initialParticipants);
        } else if (!roomCode) {
            setParticipants([]);
        }
    }, [roomCode, initialParticipants]);

    useEffect(() => {
        if (!roomCode) return;

        const channel = supabase.channel(`pvp_${roomCode}`, {
            config: { broadcast: { self: true }, presence: { key: roomCode } },
        });

        channel
            .on("broadcast", { event: "PLAYER_JOINED" }, ({ payload }) => {
                if (payload?.participants) {
                    setParticipants(payload.participants);
                }
            })
            .on("broadcast", { event: "GAME_START" }, () => {
                setIsGameStarted(true);
                setQuestionResult(null);
                setFinalLeaderboard(null);
                setShowLeaderboard(false);
            })
            .on("broadcast", { event: "QUESTION_START" }, ({ payload }) => {
                setIsGameStarted(true);
                setCurrentQuestionIndex(payload.questionIndex ?? 0);
                setTotalQuestions(payload.totalQuestions ?? 10);
                setTimeLimitSeconds(payload.timeLimitSeconds ?? 15);
                setCurrentQuestion(payload.question ?? null);
                setQuestionResult(null);
                setAnsweredUserIds([]);
                setShowLeaderboard(false);
            })
            .on("broadcast", { event: "PLAYER_ANSWERED" }, ({ payload }) => {
                if (payload?.userId) {
                    setAnsweredUserIds((prev) => Array.from(new Set([...prev, payload.userId])));
                }
            })
            .on("broadcast", { event: "QUESTION_RESULT" }, ({ payload }) => {
                const leaderboard = payload.leaderboard ?? [];
                const sorted = [...leaderboard].sort((a, b) => b.score - a.score);
                const changes: Record<string, number> = {};

                sorted.forEach((item, index) => {
                    const newRank = index + 1;
                    const prevRank = prevRanksRef.current[item.userId];
                    if (prevRank !== undefined) {
                        changes[item.userId] = prevRank - newRank;
                    } else {
                        changes[item.userId] = 0;
                    }
                });

                const nextRanks: Record<string, number> = {};
                sorted.forEach((item, index) => {
                    nextRanks[item.userId] = index + 1;
                });
                prevRanksRef.current = nextRanks;

                setRankChanges(changes);
                setQuestionResult({
                    correctAnswerData: payload.correctAnswerData,
                    explanation: payload.explanation ?? null,
                    leaderboard,
                });
                setShowLeaderboard(false);
            })
            .on("broadcast", { event: "SHOW_LEADERBOARD" }, () => {
                setShowLeaderboard(true);
            })
            .on("broadcast", { event: "GAME_OVER" }, ({ payload }) => {
                setFinalLeaderboard(payload.leaderboard ?? []);
                setShowLeaderboard(false);
            })
            .subscribe();

        channelRef.current = channel;

        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
            }
        };
    }, [roomCode]);

    return {
        participants,
        setParticipants,
        isGameStarted,
        currentQuestionIndex,
        totalQuestions,
        timeLimitSeconds,
        currentQuestion,
        questionResult,
        finalLeaderboard,
        answeredUserIds,
        showLeaderboard,
        rankChanges,
        resetState,
    };
}
