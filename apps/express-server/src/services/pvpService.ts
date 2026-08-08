import { prisma } from "@history-app/shared";
import { supabaseAdmin } from "../config/supabaseClient";
import { scoreQuestion } from "./scoreEngine";
import { autoPickQuestions } from "./testServiceV2";
import {
    CreatePvpRoomRequest,
    PvpParticipantDto,
    PvpRoomDto,
    SubmitPvpAnswerRequest,
} from "../types/pvpTypes";
import { QuestionV2Dto, AnswerData } from "../types/testV2Types";

function serviceError(message: string, code?: string) {
    const e: any = new Error(message);
    if (code) e.code = code;
    return e;
}

// In-memory timer references for active room loops
const activeRoomTimers = new Map<string, { timeout?: ReturnType<typeof setTimeout>; resolveAnswer?: () => void }>();

async function generate4DigitCode(): Promise<string> {
    for (let i = 0; i < 20; i++) {
        const code = Math.floor(1000 + Math.random() * 9000).toString();
        const existing = await prisma.pvpRoom.findFirst({
            where: { code, status: { in: ["LOBBY", "IN_PROGRESS"] } },
        });
        if (!existing) return code;
    }
    return Math.floor(1000 + Math.random() * 9000).toString();
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

        const room = await prisma.pvpRoom.create({
            data: {
                code: roomCode,
                hostUserId,
                status: "LOBBY",
                questionCount: sequence.length,
                timePerQuestion,
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

        return {
            id: room.id,
            code: room.code,
            hostUserId: room.hostUserId,
            status: room.status,
            questionCount: room.questionCount,
            timePerQuestion: room.timePerQuestion,
            currentQuestionIndex: room.currentQuestionIndex,
            participants: room.participants.map((p) => ({
                userId: p.userId,
                name: p.user.name,
                profileImgUrl: p.user.profileImgUrl,
                score: p.score,
            })),
            questions: orderedQuestions,
        };
    }

    // ── Join Room ──────────────────────────────────────────────────────────
    async joinRoom(userId: string, roomCode: string): Promise<PvpRoomDto> {
        const room = await prisma.pvpRoom.findFirst({
            where: { code: roomCode },
            include: {
                participants: {
                    include: { user: { select: { id: true, name: true, profileImgUrl: true } } },
                },
            },
        });

        if (!room) throw serviceError("Phòng không tồn tại", "ROOM_NOT_FOUND");
        if (room.status !== "LOBBY") throw serviceError("Phòng đã bắt đầu hoặc đã kết thúc", "ROOM_NOT_LOBBY");
        if (room.participants.length >= 8 && !room.participants.some((p) => p.userId === userId)) {
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

        return {
            id: updatedRoom!.id,
            code: updatedRoom!.code,
            hostUserId: updatedRoom!.hostUserId,
            status: updatedRoom!.status,
            questionCount: updatedRoom!.questionCount,
            timePerQuestion: updatedRoom!.timePerQuestion,
            currentQuestionIndex: updatedRoom!.currentQuestionIndex,
            participants: participantDtos,
            questions: orderedQuestions,
        };
    }

    // ── Get Room Info ──────────────────────────────────────────────────────
    async getRoomInfo(roomCode: string): Promise<PvpRoomDto> {
        const room = await prisma.pvpRoom.findFirst({
            where: { code: roomCode },
            include: {
                participants: {
                    include: { user: { select: { id: true, name: true, profileImgUrl: true } } },
                },
            },
        });

        if (!room) throw serviceError("Phòng không tồn me", "ROOM_NOT_FOUND");

        const seq = (room.questionSequenceJson as number[]) ?? [];
        const questionRecords = await prisma.question.findMany({ where: { id: { in: seq } } });
        const questionMap = new Map(questionRecords.map((q) => [q.id, q]));
        const orderedQuestions = seq.map((id) => questionMap.get(id)).filter(Boolean).map(toQuestionDto);

        return {
            id: room.id,
            code: room.code,
            hostUserId: room.hostUserId,
            status: room.status,
            questionCount: room.questionCount,
            timePerQuestion: room.timePerQuestion,
            currentQuestionIndex: room.currentQuestionIndex,
            participants: room.participants.map((p) => ({
                userId: p.userId,
                name: p.user.name,
                profileImgUrl: p.user.profileImgUrl,
                score: p.score,
            })),
            questions: orderedQuestions,
        };
    }

    // ── Start Room ─────────────────────────────────────────────────────────
    async startRoom(userId: string, roomCode: string): Promise<void> {
        const room = await prisma.pvpRoom.findFirst({ where: { code: roomCode } });

        if (!room) throw serviceError("Phòng không tồn tại", "ROOM_NOT_FOUND");
        if (room.hostUserId !== userId) throw serviceError("Chỉ chủ phòng mới có quyền bắt đầu", "UNAUTHORIZED");
        if (room.status !== "LOBBY") throw serviceError("Phòng đã bắt đầu", "ALREADY_STARTED");

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

            if (evalRes.isCorrect) {
                // Base 400 max score
                const baseScore = evalRes.scoreAwarded * 400;
                // Speed bonus: up to 2x multiplier for instantaneous answer
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

        // Check if all active participants submitted for this question
        const updatedRoom = await prisma.pvpRoom.findUnique({
            where: { id: room.id },
            include: { participants: true },
        });

        const allSubmitted = updatedRoom!.participants.every((p) => {
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

                // Broadcast QUESTION_RESULT
                await this.broadcast(roomCode, "QUESTION_RESULT", {
                    questionIndex: idx,
                    correctAnswerData: questionRecord?.answerDataJson,
                    explanation: questionRecord?.explanation,
                    leaderboard,
                });

                // Inter-question pause (4 seconds)
                await new Promise((r) => setTimeout(r, 4000));
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
}

export const pvpService = new PvpService();
