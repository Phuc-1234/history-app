// controllers/testControllerV2.ts — Thin controller for test V2 endpoints
import { Request, Response } from "express";
import { testServiceV2 } from "../services/testServiceV2";

export const checkResumable = async (req: Request, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: "Unauthorized" });
        const resp = await testServiceV2.checkResumable(req.user.id);
        return res.status(200).json(resp);
    } catch (err: any) {
        console.error("checkResumable error:", err?.message ?? err);
        return res.status(500).json({ error: "Failed to check resumable tests" });
    }
};

export const startTest = async (req: Request, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: "Unauthorized" });
        const resp = await testServiceV2.startTest(req.user.id, req.body);
        return res.status(200).json(resp);
    } catch (err: any) {
        console.error("startTestV2 error:", err?.message ?? err);
        if (err?.code === "NOT_FOUND") return res.status(404).json({ error: err.message });
        if (err?.code === "ACTIVE_TEST_EXISTS") return res.status(409).json({ error: err.message });
        if (err?.code === "NO_QUESTIONS") return res.status(404).json({ error: err.message });
        return res.status(500).json({ error: "Failed to start test" });
    }
};

export const updateDraft = async (req: Request, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: "Unauthorized" });
        await testServiceV2.updateDraft(req.params.logId, req.user.id, req.body.draftAnswerJson);
        return res.status(200).json({ saved: true });
    } catch (err: any) {
        console.error("updateDraft error:", err?.message ?? err);
        if (err?.code === "NOT_FOUND") return res.status(404).json({ error: err.message });
        return res.status(500).json({ error: "Failed to update draft" });
    }
};

export const finishTest = async (req: Request, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: "Unauthorized" });
        const resp = await testServiceV2.finishTest(
            req.params.logId,
            req.user.id,
            req.body.draftAnswerJson ?? [],
        );
        return res.status(200).json(resp);
    } catch (err: any) {
        console.error("finishTestV2 error:", err?.message ?? err);
        if (err?.code === "NOT_FOUND") return res.status(404).json({ error: err.message });
        if (err?.code === "UNAUTHORIZED") return res.status(403).json({ error: err.message });
        if (err?.code === "ALREADY_SUBMITTED") return res.status(400).json({ error: err.message });
        return res.status(500).json({ error: "Failed to finish test" });
    }
};

export const abandonTest = async (req: Request, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: "Unauthorized" });
        await testServiceV2.abandonTest(req.params.logId, req.user.id);
        return res.status(200).json({ abandoned: true });
    } catch (err: any) {
        console.error("abandonTest error:", err?.message ?? err);
        if (err?.code === "NOT_FOUND") return res.status(404).json({ error: err.message });
        return res.status(500).json({ error: "Failed to abandon test" });
    }
};

export const getHistory = async (req: Request, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: "Unauthorized" });
        const { scopeType, scopeId, testId } = req.query as any;
        const resp = await testServiceV2.getHistory(
            req.user.id,
            scopeType,
            scopeId ? Number(scopeId) : undefined,
            testId,
        );
        return res.status(200).json(resp);
    } catch (err: any) {
        console.error("getHistory error:", err?.message ?? err);
        return res.status(500).json({ error: "Failed to get test history" });
    }
};

export const getAttemptDetail = async (req: Request, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: "Unauthorized" });
        const resp = await testServiceV2.getAttemptDetail(req.params.logId, req.user.id);
        return res.status(200).json(resp);
    } catch (err: any) {
        console.error("getAttemptDetail error:", err?.message ?? err);
        if (err?.code === "NOT_FOUND") return res.status(404).json({ error: err.message });
        if (err?.code === "UNAUTHORIZED") return res.status(403).json({ error: err.message });
        return res.status(500).json({ error: "Failed to get attempt detail" });
    }
};

export const getTestInfo = async (req: Request, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: "Unauthorized" });
        const resp = await testServiceV2.getTestInfo(req.user.id, req.body);
        return res.status(200).json(resp);
    } catch (err: any) {
        console.error("getTestInfo error:", err?.message ?? err);
        if (err?.code === "NOT_FOUND") return res.status(404).json({ error: err.message });
        return res.status(500).json({ error: "Failed to get test info" });
    }
};

export const getNationalTests = async (req: Request, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: "Unauthorized" });
        const resp = await testServiceV2.getNationalTests();
        return res.status(200).json(resp);
    } catch (err: any) {
        console.error("getNationalTests error:", err?.message ?? err);
        return res.status(500).json({ error: "Failed to get national tests" });
    }
};
