import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/services/supabaseClient";
import type { PvpLeaderboardEntry, PvpParticipant, PvpRoom, QuestionV2 } from "../types";

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

export function usePvpRealtime(
    roomCode: string | null,
    initialRoomOrParticipants?: PvpRoom | PvpParticipant[] | null,
    currentUserId?: string
) {
    const initialRoom = initialRoomOrParticipants && "code" in initialRoomOrParticipants ? initialRoomOrParticipants : null;
    const initialParticipants = Array.isArray(initialRoomOrParticipants)
        ? initialRoomOrParticipants
        : (initialRoom?.participants ?? []);

    const [participants, setParticipants] = useState<PvpParticipant[]>(initialParticipants);
    const [isGameStarted, setIsGameStarted] = useState(initialRoom?.status === "IN_PROGRESS");
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(initialRoom?.currentQuestionIndex ?? 0);
    const [totalQuestions, setTotalQuestions] = useState(initialRoom?.questionCount ?? 10);
    const [timeLimitSeconds, setTimeLimitSeconds] = useState(initialRoom?.timePerQuestion ?? 15);
    const [currentQuestion, setCurrentQuestion] = useState<QuestionV2 | null>(
        initialRoom?.questions?.[initialRoom?.currentQuestionIndex ?? 0] ?? null
    );
    const [questionResult, setQuestionResult] = useState<PvpRealtimeState["questionResult"]>(
        initialRoom?.lastQuestionResult ?? null
    );
    const [finalLeaderboard, setFinalLeaderboard] = useState<PvpLeaderboardEntry[] | null>(null);
    const [answeredUserIds, setAnsweredUserIds] = useState<string[]>([]);
    const [showLeaderboard, setShowLeaderboard] = useState(
        initialRoom?.currentSubState === "LEADERBOARD"
    );
    const [rankChanges, setRankChanges] = useState<Record<string, number>>({});
    const [hostUserId, setHostUserId] = useState<string | null>(initialRoom?.hostUserId ?? null);
    const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);

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
        setHostUserId(null);
        setOnlineUserIds([]);
        prevRanksRef.current = {};
    }, []);

    useEffect(() => {
        if (initialRoom) {
            setParticipants(initialRoom.participants ?? []);
            if (initialRoom.status === "IN_PROGRESS") {
                setIsGameStarted(true);
                setCurrentQuestionIndex(initialRoom.currentQuestionIndex ?? 0);
                setTotalQuestions(initialRoom.questionCount ?? 10);
                setTimeLimitSeconds(initialRoom.timePerQuestion ?? 15);
                if (initialRoom.questions && initialRoom.questions.length > 0) {
                    setCurrentQuestion(initialRoom.questions[initialRoom.currentQuestionIndex ?? 0] ?? null);
                }
                if (initialRoom.lastQuestionResult) {
                    setQuestionResult(initialRoom.lastQuestionResult);
                }
                if (initialRoom.currentSubState === "LEADERBOARD") {
                    setShowLeaderboard(true);
                }
            }
        } else if (initialParticipants && initialParticipants.length > 0) {
            setParticipants(initialParticipants);
        } else if (!roomCode) {
            setParticipants([]);
            setIsGameStarted(false);
        }
    }, [roomCode, initialRoomOrParticipants]);

    useEffect(() => {
        if (!roomCode) return;

        const presenceKey = currentUserId || "user_" + Math.random().toString(36).substring(2, 7);

        const channel = supabase.channel(`pvp_${roomCode}`, {
            config: { broadcast: { self: true }, presence: { key: presenceKey } },
        });

        channel
            .on("presence", { event: "sync" }, () => {
                const state = channel.presenceState();
                const onlineKeys = Object.keys(state);
                setOnlineUserIds(onlineKeys);
            })
            .on("broadcast", { event: "PLAYER_JOINED" }, ({ payload }) => {
                if (payload?.participants) {
                    setParticipants(payload.participants);
                }
                if (payload?.hostUserId) {
                    setHostUserId(payload.hostUserId);
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
            .subscribe(async (status) => {
                if (status === "SUBSCRIBED" && currentUserId) {
                    await channel.track({ userId: currentUserId });
                }
            });

        channelRef.current = channel;

        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
            }
        };
    }, [roomCode, currentUserId]);

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
        hostUserId,
        onlineUserIds,
        resetState,
    };
}
