import { Request, Response } from "express";
import {
    StartTestResponse,
    JumpRequest,
    JumpResponse,
    SubmitAnswerRequest,
    SubmitAnswerResponse,
    FinishTestResponse,
} from "@history-app/shared";
import { testService } from "../services/testService";

// Helper function to extract and sanitize client timezone headers safely
const parseTimezoneOffset = (req: Request<any, any, any>): number => {
    const tzHeader = req.headers["x-timezone-offset"] as string | undefined;
    const bodyOffset = req.body && (req.body as any).timezoneOffset;

    let raw: any = undefined;
    if (tzHeader !== undefined) raw = tzHeader;
    else if (bodyOffset !== undefined) raw = bodyOffset;

    if (raw === undefined || raw === null) return 0;

    const tz = Number(raw);
    if (Number.isNaN(tz) || Math.abs(tz) > 840) {
        const e: any = new Error("Invalid timezone offset");
        e.code = "INVALID_TZ";
        throw e;
    }
    return Math.max(-840, Math.min(840, tz));
};

export const startTest = async (
    req: Request<{ testId: string }, StartTestResponse, {}>,
    res: Response<StartTestResponse>,
) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized" } as any);
        }

        const tz = parseTimezoneOffset(req);

        const resp = await testService.startTest(req.user.id, req.params.testId, tz);
        return res.status(200).json(resp as any);
    } catch (err: any) {
        console.error("Start test error:", err?.message ?? err);
        if (err?.code === "INVALID_TZ") {
            return res.status(400).json({ error: "Invalid timezone offset" } as any);
        }
        if (err?.code === "NOT_FOUND" || err?.message?.includes("not found")) {
            return res.status(404).json({ error: "Test not found" } as any);
        }
        return res.status(500).json({ error: "Failed to start test" } as any);
    }
};

export const getTestSummary = async (
    req: Request<{ testId: string }, StartTestResponse, {}>,
    res: Response<StartTestResponse>,
) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized" } as any);
        }

        const resp = await testService.getTestSummary(req.user.id, req.params.testId);
        return res.status(200).json(resp as any);
    } catch (err: any) {
        console.error("Get test summary error:", err?.message ?? err);
        if (err?.code === "NOT_FOUND" || err?.message?.includes("not found")) {
            return res.status(404).json({ error: "Test not found" } as any);
        }
        return res.status(500).json({ error: "Failed to get test summary" } as any);
    }
};

export const jump = async (
    req: Request<{ logId: string }, JumpResponse, JumpRequest>,
    res: Response<JumpResponse>,
) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized" } as any);
        }

        const targetIndex = Number(req.body?.targetIndex ?? -1);
        // expect 1-based index from client UI
        if (Number.isNaN(targetIndex) || targetIndex < 1) {
            return res.status(400).json({ error: "Invalid targetIndex" } as any);
        }

        const resp = await testService.jumpTo(req.params.logId, req.user.id, targetIndex - 1);
        return res.status(200).json(resp as any);
    } catch (err: any) {
        console.error("Jump error:", err?.message ?? err);
        if (err?.code === "NOT_FOUND" || err?.message?.includes("not found")) {
            return res.status(404).json({ error: "Test log not found" } as any);
        }
        if (err?.code === "UNAUTHORIZED") {
            return res.status(403).json({ error: "Access denied" } as any);
        }
        if (err?.code === "ALREADY_SUBMITTED" || err?.message?.includes("submitted")) {
            return res.status(400).json({ error: "Test already submitted" } as any);
        }
        if (err?.code === "INVALID_TARGET") {
            return res.status(400).json({ error: err.message } as any);
        }
        if (err?.code === "TIME_EXCEEDED") {
            return res.status(400).json({ error: "Time limit exceeded" } as any);
        }
        return res.status(500).json({ error: "Failed to jump to question" } as any);
    }
};

export const submitAnswer = async (
    req: Request<{ logId: string }, SubmitAnswerResponse, SubmitAnswerRequest>,
    res: Response<SubmitAnswerResponse>,
) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized" } as any);
        }

        let { questionId, answerData } = req.body as any;

        // If client provided a 1-based index (targetIndex), map it to the actual questionId
        if (!questionId) {
            const idx = Number((req.body as any).targetIndex ?? (req.body as any).index ?? -1);
            if (Number.isNaN(idx) || idx < 1) {
                return res.status(400).json({ error: "Missing questionId or invalid index" } as any);
            }
            // Reuse jumpTo validations and mapping
            const j = await testService.jumpTo(req.params.logId, req.user.id, idx - 1);
            if (!j.question) return res.status(400).json({ error: "Invalid question index" } as any);
            questionId = j.question.id;
        }

        if (answerData === undefined || answerData === null) {
            return res.status(400).json({ error: "Missing answerData" } as any);
        }

        const answerDataStr = JSON.stringify(answerData);
        if (answerDataStr.length > 10000) {
            return res.status(400).json({ error: "Answer data too large" } as any);
        }

        const resp = await testService.submitAnswer(req.params.logId, req.user.id, Number(questionId), answerData);
        return res.status(200).json(resp as any);
    } catch (err: any) {
        console.error("Submit answer error:", err?.message ?? err);
        if (err?.code === "NOT_FOUND" || err?.message?.includes("not found")) {
            return res.status(404).json({ error: "Test log not found" } as any);
        }
        if (err?.code === "UNAUTHORIZED") {
            return res.status(403).json({ error: "Access denied" } as any);
        }
        if (err?.code === "ALREADY_SUBMITTED" || err?.message?.includes("submitted")) {
            return res.status(400).json({ error: "Test already submitted" } as any);
        }
        if (err?.code === "INVALID_QUESTION") {
            return res.status(400).json({ error: err.message } as any);
        }
        if (err?.code === "TIME_EXCEEDED") {
            return res.status(400).json({ error: "Time limit exceeded" } as any);
        }
        return res.status(500).json({ error: "Failed to save answer" } as any);
    }
};

export const finishTest = async (
    req: Request<{ logId: string }, FinishTestResponse, {}>,
    res: Response<FinishTestResponse>,
) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized" } as any);
        }

        const resp = await testService.finishTest(req.params.logId, req.user.id);
        return res.status(200).json(resp as any);
    } catch (err: any) {
        console.error("Finish test error:", err?.message ?? err);
        if (err?.code === "NOT_FOUND" || err?.message?.includes("not found")) {
            return res.status(404).json({ error: "Test log not found" } as any);
        }
        if (err?.code === "UNAUTHORIZED") {
            return res.status(403).json({ error: "Access denied" } as any);
        }
        if (err?.code === "TIME_EXCEEDED") {
            return res.status(400).json({ error: "Time limit exceeded" } as any);
        }
        if (err?.code === "ALREADY_SUBMITTED" || err?.message?.includes("already submitted")) {
            return res.status(400).json({ error: "Test aewfewfwèwewfewlready submitted" } as any);
        }
        return res.status(500).json({ error: "Failed to finish test" } as any);
    }
};
