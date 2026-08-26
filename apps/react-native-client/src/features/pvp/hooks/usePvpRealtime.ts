import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/services/supabaseClient";
import type { PvpLeaderboardEntry, PvpParticipant, PvpRoom, QuestionV2 } from "../types";
import { playTestPassSound } from "@/services/soundService";
import { hapticLight, hapticMedium, hapticSuccess } from "@/services/hapticsService";

export interface PvpRealtimeState {
    participants: PvpParticipant[];
    isGameStarted: boolean;
    currentQuestionIndex: number;
    totalQuestions: number;
    timeLimitSeconds: number;
    currentQuestion: QuestionV2 | null;
    questionResult: {
        questionIndex?: number;
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
    const [questionResult, setQuestionResult] = useState<PvpRealtimeState["questionResult"]>(() => {
        if (
            initialRoom?.lastQuestionResult &&
            initialRoom.lastQuestionResult.questionIndex === (initialRoom.currentQuestionIndex ?? 0) &&
            (initialRoom.currentSubState === "RESULT" || initialRoom.currentSubState === "LEADERBOARD")
        ) {
            return initialRoom.lastQuestionResult;
        }
        return null;
    });
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

    // Capture the initial room snapshot once per roomCode so that parent re-renders
    // (e.g. RTK Query refetch creating a new object reference) do not re-run the sync
    // effect and overwrite realtime-driven state (questionResult, currentQuestionIndex, etc.)
    const initialRoomSnapshotRef = useRef<{ roomCode: string | null; data: typeof initialRoomOrParticipants }>({
        roomCode: null,
        data: null,
    });
    if (initialRoomSnapshotRef.current.roomCode !== roomCode) {
        initialRoomSnapshotRef.current = { roomCode, data: initialRoomOrParticipants };
    }

    useEffect(() => {
        const snapshot = initialRoomSnapshotRef.current.data;
        const snapshotRoom = snapshot && "code" in snapshot ? snapshot : null;
        const snapshotParticipants = Array.isArray(snapshot)
            ? snapshot
            : (snapshotRoom?.participants ?? []);

        if (snapshotRoom) {
            setParticipants(snapshotRoom.participants ?? []);
            if (snapshotRoom.status === "IN_PROGRESS") {
                setIsGameStarted(true);
                setCurrentQuestionIndex(snapshotRoom.currentQuestionIndex ?? 0);
                setTotalQuestions(snapshotRoom.questionCount ?? 10);
                setTimeLimitSeconds(snapshotRoom.timePerQuestion ?? 15);
                if (snapshotRoom.questions && snapshotRoom.questions.length > 0) {
                    setCurrentQuestion(snapshotRoom.questions[snapshotRoom.currentQuestionIndex ?? 0] ?? null);
                }
                if (
                    snapshotRoom.lastQuestionResult &&
                    snapshotRoom.lastQuestionResult.questionIndex === (snapshotRoom.currentQuestionIndex ?? 0) &&
                    (snapshotRoom.currentSubState === "RESULT" || snapshotRoom.currentSubState === "LEADERBOARD")
                ) {
                    setQuestionResult(snapshotRoom.lastQuestionResult);
                } else {
                    setQuestionResult(null);
                }
                if (snapshotRoom.currentSubState === "LEADERBOARD") {
                    setShowLeaderboard(true);
                } else {
                    setShowLeaderboard(false);
                }
            }
        } else if (snapshotParticipants && snapshotParticipants.length > 0) {
            setParticipants(snapshotParticipants);
        } else if (!roomCode) {
            setParticipants([]);
            setIsGameStarted(false);
        }
    }, [roomCode]);

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
                hapticLight();
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
                    questionIndex: payload.questionIndex,
                    correctAnswerData: payload.correctAnswerData,
                    explanation: payload.explanation ?? null,
                    leaderboard,
                });
                setShowLeaderboard(false);
                hapticMedium();
            })
            .on("broadcast", { event: "SHOW_LEADERBOARD" }, () => {
                setShowLeaderboard(true);
            })
            .on("broadcast", { event: "GAME_OVER" }, ({ payload }) => {
                setFinalLeaderboard(payload.leaderboard ?? []);
                setShowLeaderboard(false);
                playTestPassSound();
                hapticSuccess();
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
