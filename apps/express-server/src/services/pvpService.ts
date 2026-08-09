import { prisma } from "@history-app/shared";
import { Prisma } from "@prisma/client";
import { supabaseAdmin } from "../config/supabaseClient";
import { scoreQuestion } from "./scoreEngine";
import { autoPickQuestions, expandScopeToQuestionWhere } from "./testServiceV2";
import {
    CreatePvpRoomRequest,
    PvpParticipantDto,
    PvpPublicRoomDto,
    PvpRoomDto,
    SubmitPvpAnswerRequest,
} from "../types/pvpTypes";
import { QuestionV2Dto, AnswerData } from "../types/testV2Types";

function serviceError(message: string, code?: string) {
    const e: any = new Error(message);
    if (code) e.code = code;
    return e;
}

interface RoomTimerState {
    timeout?: ReturnType<typeof setTimeout>;
    resolveAnswer?: () => void;
    resolveTransition?: (target: "LEADERBOARD" | "NEXT_QUESTION") => void;
    pendingTarget?: "LEADERBOARD" | "NEXT_QUESTION";
    triggerSoftLeaveFallback?: () => void;
}

interface ActiveRoomSubState {
    subState: "QUESTION" | "RESULT" | "LEADERBOARD";
    questionIndex: number;
    lastQuestionResult?: {
        questionIndex: number;
        correctAnswerData: any;
        explanation: string | null;
        leaderboard: PvpParticipantDto[];
    } | null;
}

// In-memory timer references for active room loops
const activeRoomTimers = new Map<string, RoomTimerState>();
const roomOnlineUsersMap = new Map<string, Set<string>>();
const activeRoomSubStates = new Map<string, ActiveRoomSubState>();

async function generate4DigitCode(): Promise<string> {
    for (let i = 0; i < 100; i++) {
        const code = Math.floor(1000 + Math.random() * 9000).toString();
        const existing = await prisma.pvpRoom.findFirst({
            where: { code, status: { in: ["LOBBY", "IN_PROGRESS"] } },
        });
        if (!existing) return code;
    }
    throw serviceError("Tất cả mã phòng thi đấu đã được sử dụng, vui lòng thử lại sau", "ALL_ROOM_CODES_USED");
}

function toQuestionDto(q: any): QuestionV2Dto {
    return {
        id: q.id,
        type: q.type,
        difficulty: q.difficulty,
        promptText: q.promptText,
        document: q.document ?? null,
        explanation: q.explanation ?? null,
        answerData: q.answerDataJson as AnswerData,
    };
}

export class PvpService {
    // Broadcast helper via Supabase Admin channel
    private async broadcast(roomCode: string, event: string, payload: any) {
        try {
            const channel = supabaseAdmin.channel(`pvp_${roomCode}`);
            await channel.send({
                type: "broadcast",
                event,
                payload,
            });
        } catch (err) {
            console.error(`[PVP Broadcast Error] Room ${roomCode}, Event ${event}:`, err);
        }
    }

    // ── Create Room ────────────────────────────────────────────────────────
    async createRoom(hostUserId: string, req: CreatePvpRoomRequest): Promise<PvpRoomDto> {
        let sequence: number[] = [];
        const questionCount = req.questionCount ?? 10;
        const timePerQuestion = req.timePerQuestion ?? 15;
        const autoNext = req.autoNext ?? true;
        const transitionInterval = req.transitionInterval ?? 4;

        const availableCount = await this.getAvailableQuestionsCount(req.scopeType, req.scopeId, req.testId);
        if (availableCount <= 0) {
            throw serviceError("Không có câu hỏi nào khả dụng cho phạm vi này (0 câu)", "NO_QUESTIONS");
        }
        if (questionCount > availableCount) {
            throw serviceError(`Số câu hỏi yêu cầu (${questionCount}) vượt quá số câu hiện có (${availableCount})`, "NO_QUESTIONS");
        }

        if (req.testId) {
            const test = await prisma.test.findUnique({
                where: { id: req.testId },
                include: { testQuestions: { where: { question: { isActive: true } }, orderBy: { position: "asc" } } },
            });
            if (test) {
                sequence = test.testQuestions.map((tq) => tq.questionId).slice(0, questionCount);
            }
        }

        if (sequence.length === 0) {
            sequence = await autoPickQuestions(
                hostUserId,
                req.scopeType,
                req.scopeId,
                "BALANCED",
                questionCount,
                { 1: 40, 2: 30, 3: 20, 4: 10 },
            );
        }

        if (sequence.length === 0) {
            throw serviceError("Không có câu hỏi khả dụng cho cài đặt này", "NO_QUESTIONS");
        }

        const roomCode = await generate4DigitCode();

        const isPublic = req.isPublic ?? true;

        const room = await prisma.pvpRoom.create({
            data: {
                code: roomCode,
                hostUserId,
                status: "LOBBY",
                questionCount: sequence.length,
                timePerQuestion,
                autoNext,
                transitionInterval,
                isPublic,
                questionSequenceJson: sequence,
                currentQuestionIndex: 0,
                participants: {
                    create: {
                        userId: hostUserId,
                        score: 0,
                        answersJson: [],
                    },
                },
            },
            include: {
                participants: {
                    include: {
                        user: { select: { id: true, name: true, profileImgUrl: true } },
                    },
                },
            },
        });

        const questionRecords = await prisma.question.findMany({
            where: { id: { in: sequence } },
        });

        // Re-order questions based on sequence
        const questionMap = new Map(questionRecords.map((q) => [q.id, q]));
        const orderedQuestions = sequence
            .map((id) => questionMap.get(id))
            .filter(Boolean)
            .map(toQuestionDto);

        const runtimeState = activeRoomSubStates.get(room.id);

        return {
            id: room.id,
            code: room.code,
            hostUserId: room.hostUserId,
            status: room.status,
            questionCount: room.questionCount,
            timePerQuestion: room.timePerQuestion,
            autoNext: room.autoNext,
            transitionInterval: room.transitionInterval,
            currentQuestionIndex: room.currentQuestionIndex,
            isPublic: room.isPublic,
            participants: room.participants.map((p) => ({
                userId: p.userId,
                name: p.user.name,
                profileImgUrl: p.user.profileImgUrl,
                score: p.score,
            })),
            questions: orderedQuestions,
            currentSubState: runtimeState?.subState ?? "QUESTION",
            lastQuestionResult: runtimeState?.lastQuestionResult ?? null,
        };
    }

    // ── Join Room ──────────────────────────────────────────────────────────
    async joinRoom(userId: string, roomCode: string): Promise<PvpRoomDto> {
        const room = await prisma.pvpRoom.findFirst({
            where: { code: roomCode, status: { in: ["LOBBY", "IN_PROGRESS"] } },
            orderBy: { createdAt: "desc" },
            include: {
                participants: {
                    include: { user: { select: { id: true, name: true, profileImgUrl: true } } },
                },
            },
        });

        if (!room) throw serviceError("Phòng không tồn tại", "ROOM_NOT_FOUND");
        const isExistingParticipant = room.participants.some((p) => p.userId === userId);
        if (room.status !== "LOBBY" && !isExistingParticipant) {
            throw serviceError("Phòng đã bắt đầu thi đấu, không thể tham gia mới", "ROOM_NOT_LOBBY");
        }
        if (room.participants.length >= 8 && !isExistingParticipant) {
            throw serviceError("Phòng đã đầy (tối đa 8 người)", "ROOM_FULL");
        }

        // Upsert participant
        await prisma.pvpParticipant.upsert({
            where: { roomId_userId: { roomId: room.id, userId } },
            create: { roomId: room.id, userId, score: 0, answersJson: [] },
            update: {},
        });

        const updatedRoom = await prisma.pvpRoom.findUnique({
            where: { id: room.id },
            include: {
                participants: {
                    include: { user: { select: { id: true, name: true, profileImgUrl: true } } },
                },
            },
        });

        const seq = (updatedRoom!.questionSequenceJson as number[]) ?? [];
        const questionRecords = await prisma.question.findMany({ where: { id: { in: seq } } });
        const questionMap = new Map(questionRecords.map((q) => [q.id, q]));
        const orderedQuestions = seq.map((id) => questionMap.get(id)).filter(Boolean).map(toQuestionDto);

        const participantDtos: PvpParticipantDto[] = updatedRoom!.participants.map((p) => ({
            userId: p.userId,
            name: p.user.name,
            profileImgUrl: p.user.profileImgUrl,
            score: p.score,
        }));

        // Broadcast player join event
        await this.broadcast(roomCode, "PLAYER_JOINED", { participants: participantDtos });

        const runtimeState = activeRoomSubStates.get(updatedRoom!.id);

        return {
            id: updatedRoom!.id,
            code: updatedRoom!.code,
            hostUserId: updatedRoom!.hostUserId,
            status: updatedRoom!.status,
            questionCount: updatedRoom!.questionCount,
            timePerQuestion: updatedRoom!.timePerQuestion,
            autoNext: updatedRoom!.autoNext,
            transitionInterval: updatedRoom!.transitionInterval,
            currentQuestionIndex: updatedRoom!.currentQuestionIndex,
            isPublic: updatedRoom!.isPublic,
            participants: participantDtos,
            questions: orderedQuestions,
            currentSubState: runtimeState?.subState ?? "QUESTION",
            lastQuestionResult: runtimeState?.lastQuestionResult ?? null,
        };
    }

    // ── Leave Room ─────────────────────────────────────────────────────────
    async leaveRoom(userId: string, roomCode: string): Promise<void> {
        const room = await prisma.pvpRoom.findFirst({
            where: { code: roomCode, status: { in: ["LOBBY", "IN_PROGRESS"] } },
            include: { participants: true },
        });

        if (!room) return;

        const participant = room.participants.find((p) => p.userId === userId);
        if (!participant) return;

        await prisma.pvpParticipant.delete({ where: { id: participant.id } });

        const remainingParticipants = await prisma.pvpParticipant.findMany({
            where: { roomId: room.id },
            include: { user: { select: { id: true, name: true, profileImgUrl: true } } },
        });

        let newHostUserId: string | null = null;

        if (remainingParticipants.length === 0) {
            const timerState = activeRoomTimers.get(roomCode);
            if (timerState?.timeout) clearTimeout(timerState.timeout);
            activeRoomTimers.delete(roomCode);

            await prisma.pvpRoom.update({
                where: { id: room.id },
                data: { status: "CANCELLED" },
            });
        } else if (room.hostUserId === userId) {
            newHostUserId = remainingParticipants[0].userId;
            await prisma.pvpRoom.update({
                where: { id: room.id },
                data: { hostUserId: newHostUserId },
            });
        }

        const participantDtos: PvpParticipantDto[] = remainingParticipants.map((p) => ({
            userId: p.userId,
            name: p.user.name,
            profileImgUrl: p.user.profileImgUrl,
            score: p.score,
        }));

        await this.broadcast(roomCode, "PLAYER_JOINED", {
            participants: participantDtos,
            hostUserId: newHostUserId ?? (room.hostUserId === userId ? null : room.hostUserId),
        });
    }

    // ── Get Room Info ──────────────────────────────────────────────────────
    async getRoomInfo(roomCode: string): Promise<PvpRoomDto> {
        const room = await prisma.pvpRoom.findFirst({
            where: { code: roomCode, status: { in: ["LOBBY", "IN_PROGRESS"] } },
            orderBy: { createdAt: "desc" },
            include: {
                participants: {
                    include: { user: { select: { id: true, name: true, profileImgUrl: true } } },
                },
            },
        });

        if (!room) throw serviceError("Phòng không tồn tại", "ROOM_NOT_FOUND");

        const seq = (room.questionSequenceJson as number[]) ?? [];
        const questionRecords = await prisma.question.findMany({ where: { id: { in: seq } } });
        const questionMap = new Map(questionRecords.map((q) => [q.id, q]));
        const orderedQuestions = seq.map((id) => questionMap.get(id)).filter(Boolean).map(toQuestionDto);

        const runtimeState = activeRoomSubStates.get(room.id);

        return {
            id: room.id,
            code: room.code,
            hostUserId: room.hostUserId,
            status: room.status,
            questionCount: room.questionCount,
            timePerQuestion: room.timePerQuestion,
            autoNext: room.autoNext,
            transitionInterval: room.transitionInterval,
            currentQuestionIndex: room.currentQuestionIndex,
            isPublic: room.isPublic,
            participants: room.participants.map((p) => ({
                userId: p.userId,
                name: p.user.name,
                profileImgUrl: p.user.profileImgUrl,
                score: p.score,
            })),
            questions: orderedQuestions,
            currentSubState: runtimeState?.subState ?? "QUESTION",
            lastQuestionResult: runtimeState?.lastQuestionResult ?? null,
        };
    }

    // ── Get Active Room ────────────────────────────────────────────────────
    async getActiveRoom(userId: string): Promise<PvpRoomDto | null> {
        const room = await prisma.pvpRoom.findFirst({
            where: {
                status: { in: ["LOBBY", "IN_PROGRESS"] },
                participants: { some: { userId } },
            },
            orderBy: { createdAt: "desc" },
            include: {
                participants: {
                    include: { user: { select: { id: true, name: true, profileImgUrl: true } } },
                },
            },
        });

        if (!room) return null;

        const seq = (room.questionSequenceJson as number[]) ?? [];
        const questionRecords = await prisma.question.findMany({ where: { id: { in: seq } } });
        const questionMap = new Map(questionRecords.map((q) => [q.id, q]));
        const orderedQuestions = seq.map((id) => questionMap.get(id)).filter(Boolean).map(toQuestionDto);

        const runtimeState = activeRoomSubStates.get(room.id);

        return {
            id: room.id,
            code: room.code,
            hostUserId: room.hostUserId,
            status: room.status,
            questionCount: room.questionCount,
            timePerQuestion: room.timePerQuestion,
            autoNext: room.autoNext,
            transitionInterval: room.transitionInterval,
            currentQuestionIndex: room.currentQuestionIndex,
            isPublic: room.isPublic,
            participants: room.participants.map((p) => ({
                userId: p.userId,
                name: p.user.name,
                profileImgUrl: p.user.profileImgUrl,
                score: p.score,
            })),
            questions: orderedQuestions,
            currentSubState: runtimeState?.subState ?? "QUESTION",
            lastQuestionResult: runtimeState?.lastQuestionResult ?? null,
        };
    }

    // ── Get Public Rooms ───────────────────────────────────────────────────
    async getPublicRooms(userId: string): Promise<PvpPublicRoomDto[]> {
        const rooms = await prisma.pvpRoom.findMany({
            where: {
                isPublic: true,
                status: "LOBBY",
                hostUserId: { not: userId },
                participants: { none: { userId } },
            },
            orderBy: { createdAt: "desc" },
            include: {
                host: { select: { id: true, name: true, profileImgUrl: true } },
                _count: { select: { participants: true } },
            },
            take: 30,
        });

        return rooms.map((r) => ({
            id: r.id,
            code: r.code,
            hostUserId: r.hostUserId,
            hostName: r.host.name,
            hostAvatar: r.host.profileImgUrl,
            questionCount: r.questionCount,
            timePerQuestion: r.timePerQuestion,
            participantCount: r._count.participants,
            maxParticipants: 8,
            createdAt: r.createdAt.toISOString(),
        }));
    }

    // ── Start Room ─────────────────────────────────────────────────────────
    async startRoom(userId: string, roomCode: string): Promise<void> {
        const room = await prisma.pvpRoom.findFirst({
            where: { code: roomCode, status: "LOBBY" },
            orderBy: { createdAt: "desc" },
            include: { participants: true },
        });

        if (!room) throw serviceError("Phòng không tồn tại", "ROOM_NOT_FOUND");
        if (room.hostUserId !== userId) throw serviceError("Chỉ chủ phòng mới có quyền bắt đầu", "UNAUTHORIZED");
        if (room.status !== "LOBBY") throw serviceError("Phòng đã bắt đầu", "ALREADY_STARTED");
        if (room.participants.length < 2) {
            throw serviceError("Cần ít nhất 2 người chơi để bắt đầu", "MIN_PLAYERS_REQUIRED");
        }

        await prisma.pvpRoom.update({
            where: { id: room.id },
            data: { status: "IN_PROGRESS", currentQuestionIndex: 0 },
        });

        // Broadcast GAME_START
        await this.broadcast(roomCode, "GAME_START", { roomCode, questionCount: room.questionCount });

        // Kick off room question timer cycle in background
        setImmediate(() => this.runRoomQuestionCycle(room.id, roomCode));
    }

    // ── Submit Answer ──────────────────────────────────────────────────────
    async submitAnswer(userId: string, req: SubmitPvpAnswerRequest): Promise<{ scoreEarned: number; totalScore: number }> {
        const { roomCode, questionIndex, userAnswer, timeTakenSeconds } = req;

        const room = await prisma.pvpRoom.findFirst({
            where: { code: roomCode, status: "IN_PROGRESS" },
            include: { participants: true },
        });

        if (!room) throw serviceError("Phòng không ở trạng thái thi đấu", "ROOM_NOT_ACTIVE");
        if (room.currentQuestionIndex !== questionIndex) {
            throw serviceError("Câu hỏi đã hết hạn", "EXPIRED_QUESTION");
        }

        const participant = room.participants.find((p) => p.userId === userId);
        if (!participant) throw serviceError("Bạn không trong phòng này", "NOT_PARTICIPANT");

        const answers = (participant.answersJson as any[]) ?? [];
        if (answers.some((a) => a.questionIndex === questionIndex)) {
            return { scoreEarned: 0, totalScore: participant.score };
        }

        const seq = (room.questionSequenceJson as number[]) ?? [];
        const questionId = seq[questionIndex];
        const question = await prisma.question.findUnique({ where: { id: questionId } });

        let scoreEarned = 0;
        if (question) {
            const evalRes = scoreQuestion(
                questionId,
                question.type,
                question.answerDataJson as any,
                userAnswer,
            );

            if (evalRes.scoreAwarded > 0) {
                // Base score derived from test-v2 scoreEngine rules multiplied by 400
                // Single choice: 0.25 * 400 = 100 base pts; Fill: 0.5 * 400 = 200 base pts
                const baseScore = evalRes.scoreAwarded * 400;
                // Time-based speed bonus: 1.0x to 2.0x multiplier based on remaining seconds
                const remainingSec = Math.max(0, room.timePerQuestion - timeTakenSeconds);
                const speedBonus = 1 + remainingSec / room.timePerQuestion;
                scoreEarned = Math.round(baseScore * speedBonus);
            }
        }

        const newScore = participant.score + scoreEarned;
        const newAnswers = [
            ...answers,
            { questionIndex, questionId, userAnswer, scoreEarned, timeTakenSeconds },
        ];

        await prisma.pvpParticipant.update({
            where: { id: participant.id },
            data: { score: newScore, answersJson: newAnswers },
        });

        // Broadcast player submitted status
        await this.broadcast(roomCode, "PLAYER_ANSWERED", { userId, questionIndex });

        // Check if all active online participants submitted for this question
        const updatedRoom = await prisma.pvpRoom.findUnique({
            where: { id: room.id },
            include: { participants: true },
        });

        const activeUserIds = req.activeUserIds;
        if (activeUserIds && activeUserIds.length > 0) {
            roomOnlineUsersMap.set(room.id, new Set(activeUserIds));
            const isHostOnline = activeUserIds.includes(room.hostUserId);
            if (!isHostOnline) {
                const timerRef = activeRoomTimers.get(room.id);
                if (timerRef?.triggerSoftLeaveFallback) {
                    timerRef.triggerSoftLeaveFallback();
                }
            }
        }

        const targetParticipants = activeUserIds && activeUserIds.length > 0
            ? updatedRoom!.participants.filter((p) => activeUserIds.includes(p.userId))
            : updatedRoom!.participants;

        const allSubmitted = targetParticipants.length > 0 && targetParticipants.every((p) => {
            const pAnswers = (p.answersJson as any[]) ?? [];
            return pAnswers.some((a) => a.questionIndex === questionIndex);
        });

        if (allSubmitted) {
            const timerRef = activeRoomTimers.get(room.id);
            if (timerRef?.resolveAnswer) {
                timerRef.resolveAnswer();
            }
        }

        return { scoreEarned, totalScore: newScore };
    }

    // ── Transition Helper ──────────────────────────────────────────────────
    private waitForTransition(
        roomId: string,
        targetState: "LEADERBOARD" | "NEXT_QUESTION",
        autoNext: boolean,
        transitionInterval: number,
        hostUserId: string
    ): Promise<void> {
        return new Promise<void>((resolve) => {
            let timer: ReturnType<typeof setTimeout> | undefined;

            const cleanupAndResolve = () => {
                if (timer) clearTimeout(timer);
                activeRoomTimers.delete(roomId);
                resolve();
            };

            const latestOnlineUsers = roomOnlineUsersMap.get(roomId);
            const isHostOnline = !latestOnlineUsers || latestOnlineUsers.size === 0 || latestOnlineUsers.has(hostUserId);

            if (autoNext) {
                timer = setTimeout(cleanupAndResolve, transitionInterval * 1000);
            } else if (!isHostOnline) {
                // Host soft-left (offline): set 5s fallback timer
                timer = setTimeout(cleanupAndResolve, 5000);
            }

            activeRoomTimers.set(roomId, {
                pendingTarget: targetState,
                resolveTransition: (target) => {
                    if (target === targetState) {
                        cleanupAndResolve();
                    }
                },
                triggerSoftLeaveFallback: () => {
                    if (!autoNext && !timer) {
                        timer = setTimeout(cleanupAndResolve, 5000);
                    }
                },
            });
        });
    }

    // ── Timer & Question Cycle Loop ────────────────────────────────────────
    private async runRoomQuestionCycle(roomId: string, roomCode: string) {
        try {
            const room = await prisma.pvpRoom.findUnique({
                where: { id: roomId },
                include: { participants: true },
            });
            if (!room || room.status !== "IN_PROGRESS") return;

            const seq = (room.questionSequenceJson as number[]) ?? [];
            const totalQuestions = seq.length;

            for (let idx = 0; idx < totalQuestions; idx++) {
                // Update currentQuestionIndex
                await prisma.pvpRoom.update({
                    where: { id: roomId },
                    data: { currentQuestionIndex: idx },
                });

                const questionId = seq[idx];
                const questionRecord = await prisma.question.findUnique({ where: { id: questionId } });
                const questionDto = questionRecord ? toQuestionDto(questionRecord) : null;

                // 1. Broadcast QUESTION_START
                activeRoomSubStates.set(roomId, {
                    subState: "QUESTION",
                    questionIndex: idx,
                    lastQuestionResult: null,
                });

                await this.broadcast(roomCode, "QUESTION_START", {
                    questionIndex: idx,
                    totalQuestions,
                    timeLimitSeconds: room.timePerQuestion,
                    question: questionDto,
                });

                // 2. Wait for question timer OR all players answered
                await new Promise<void>((resolve) => {
                    const timeout = setTimeout(() => {
                        activeRoomTimers.delete(roomId);
                        resolve();
                    }, room.timePerQuestion * 1000 + 500);

                    activeRoomTimers.set(roomId, {
                        timeout,
                        resolveAnswer: () => {
                            clearTimeout(timeout);
                            activeRoomTimers.delete(roomId);
                            resolve();
                        },
                    });
                });

                // 3. Fetch latest participant scores & correct answer
                const currentParticipants = await prisma.pvpParticipant.findMany({
                    where: { roomId },
                    include: { user: { select: { id: true, name: true, profileImgUrl: true } } },
                    orderBy: { score: "desc" },
                });

                const leaderboard = currentParticipants.map((p) => ({
                    userId: p.userId,
                    name: p.user.name,
                    profileImgUrl: p.user.profileImgUrl,
                    score: p.score,
                }));

                const resultPayload = {
                    questionIndex: idx,
                    correctAnswerData: questionRecord?.answerDataJson,
                    explanation: questionRecord?.explanation ?? null,
                    leaderboard,
                };

                activeRoomSubStates.set(roomId, {
                    subState: "RESULT",
                    questionIndex: idx,
                    lastQuestionResult: resultPayload,
                });

                // Broadcast QUESTION_RESULT (State 2: correct answer & points on screen)
                await this.broadcast(roomCode, "QUESTION_RESULT", resultPayload);

                // Transition from State 2 -> State 3 (Leaderboard)
                await this.waitForTransition(room.id, "LEADERBOARD", room.autoNext, room.transitionInterval, room.hostUserId);

                const currentSubState = activeRoomSubStates.get(roomId);
                activeRoomSubStates.set(roomId, {
                    subState: "LEADERBOARD",
                    questionIndex: idx,
                    lastQuestionResult: currentSubState?.lastQuestionResult ?? null,
                });

                // Broadcast SHOW_LEADERBOARD (State 3: Leaderboard modal)
                await this.broadcast(roomCode, "SHOW_LEADERBOARD", {
                    questionIndex: idx,
                    leaderboard,
                });

                // Transition from State 3 -> State 4 (Next question)
                await this.waitForTransition(room.id, "NEXT_QUESTION", room.autoNext, room.transitionInterval, room.hostUserId);
            }

            // 4. Game finished
            await prisma.pvpRoom.update({
                where: { id: roomId },
                data: { status: "FINISHED" },
            });

            const finalParticipants = await prisma.pvpParticipant.findMany({
                where: { roomId },
                include: { user: { select: { id: true, name: true, profileImgUrl: true } } },
                orderBy: { score: "desc" },
            });

            const finalLeaderboard = finalParticipants.map((p, rank) => ({
                rank: rank + 1,
                userId: p.userId,
                name: p.user.name,
                profileImgUrl: p.user.profileImgUrl,
                score: p.score,
            }));

            await this.broadcast(roomCode, "GAME_OVER", { leaderboard: finalLeaderboard });
        } catch (err) {
            console.error(`[PVP Cycle Error] Room ${roomCode}:`, err);
        }
    }

    async triggerNextState(userId: string, roomCode: string, targetState: "LEADERBOARD" | "NEXT_QUESTION"): Promise<void> {
        const room = await prisma.pvpRoom.findFirst({
            where: { code: roomCode, status: "IN_PROGRESS" },
            orderBy: { createdAt: "desc" },
        });
        if (!room) throw serviceError("Phòng không tồn tại", "ROOM_NOT_FOUND");
        if (room.hostUserId !== userId) throw serviceError("Chỉ chủ phòng mới có quyền chuyển tiếp", "UNAUTHORIZED");

        const roomState = activeRoomTimers.get(room.id);
        if (roomState?.resolveTransition && roomState.pendingTarget === targetState) {
            roomState.resolveTransition(targetState);
        }
    }

    async getCuratedTests(): Promise<Array<{ id: string; title: string; summary: string | null; questionCount: number }>> {
        const tests = await prisma.test.findMany({
            select: {
                id: true,
                title: true,
                summary: true,
                _count: { select: { testQuestions: true } },
            },
            orderBy: { title: "asc" },
        });

        return tests.map((t) => ({
            id: t.id,
            title: t.title,
            summary: t.summary,
            questionCount: t._count.testQuestions,
        }));
    }

    async getAvailableQuestionsCount(
        scopeType?: string,
        scopeId?: number,
        testId?: string
    ): Promise<number> {
        if (testId) {
            const count = await prisma.testQuestion.count({
                where: {
                    testId,
                    question: { isActive: true },
                },
            });
            return count;
        }

        const scopeWhere = await expandScopeToQuestionWhere(scopeType, scopeId);
        const count = await prisma.question.count({
            where: {
                ...scopeWhere,
                isActive: true,
                answerDataJson: { not: Prisma.DbNull },
            },
        });
        return count;
    }
}

export const pvpService = new PvpService();
