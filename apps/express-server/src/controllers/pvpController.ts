import { Request, Response } from "express";
import { pvpService } from "../services/pvpService";

export const createRoom = async (req: Request, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: "Unauthorized" });
        const room = await pvpService.createRoom(req.user.id, req.body);
        return res.status(200).json(room);
    } catch (err: any) {
        console.error("createRoom error:", err?.message ?? err);
        if (err?.code === "NO_QUESTIONS") return res.status(404).json({ error: err.message });
        if (err?.code === "ALL_ROOM_CODES_USED") return res.status(400).json({ error: err.message });
        return res.status(500).json({ error: "Failed to create PVP room" });
    }
};

export const joinRoom = async (req: Request, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: "Unauthorized" });
        const { roomCode } = req.body;
        if (!roomCode) return res.status(400).json({ error: "Missing room code" });
        const room = await pvpService.joinRoom(req.user.id, roomCode.trim());
        return res.status(200).json(room);
    } catch (err: any) {
        console.error("joinRoom error:", err?.message ?? err);
        if (err?.code === "ROOM_NOT_FOUND") return res.status(404).json({ error: err.message });
        if (err?.code === "ROOM_NOT_LOBBY") return res.status(400).json({ error: err.message });
        if (err?.code === "ROOM_FULL") return res.status(400).json({ error: err.message });
        return res.status(500).json({ error: "Failed to join PVP room" });
    }
};

export const leaveRoom = async (req: Request, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: "Unauthorized" });
        const { roomCode } = req.body;
        if (!roomCode) return res.status(400).json({ error: "Missing room code" });
        await pvpService.leaveRoom(req.user.id, roomCode.trim());
        return res.status(200).json({ left: true });
    } catch (err: any) {
        console.error("leaveRoom error:", err?.message ?? err);
        return res.status(500).json({ error: "Failed to leave PVP room" });
    }
};

export const getRoomInfo = async (req: Request, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: "Unauthorized" });
        const { code } = req.params;
        const room = await pvpService.getRoomInfo(code);
        return res.status(200).json(room);
    } catch (err: any) {
        console.error("getRoomInfo error:", err?.message ?? err);
        if (err?.code === "ROOM_NOT_FOUND") return res.status(404).json({ error: err.message });
        return res.status(500).json({ error: "Failed to get PVP room info" });
    }
};

export const getActiveRoom = async (req: Request, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: "Unauthorized" });
        const room = await pvpService.getActiveRoom(req.user.id);
        return res.status(200).json(room);
    } catch (err: any) {
        console.error("getActiveRoom error:", err?.message ?? err);
        return res.status(500).json({ error: "Failed to get active PVP room" });
    }
};

export const startRoom = async (req: Request, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: "Unauthorized" });
        const { roomCode } = req.body;
        if (!roomCode) return res.status(400).json({ error: "Missing room code" });
        await pvpService.startRoom(req.user.id, roomCode.trim());
        return res.status(200).json({ started: true });
    } catch (err: any) {
        console.error("startRoom error:", err?.message ?? err);
        if (err?.code === "ROOM_NOT_FOUND") return res.status(404).json({ error: err.message });
        if (err?.code === "UNAUTHORIZED") return res.status(403).json({ error: err.message });
        if (err?.code === "ALREADY_STARTED") return res.status(400).json({ error: err.message });
        if (err?.code === "MIN_PLAYERS_REQUIRED") return res.status(400).json({ error: err.message });
        return res.status(500).json({ error: "Failed to start PVP room" });
    }
};

export const submitAnswer = async (req: Request, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: "Unauthorized" });
        const result = await pvpService.submitAnswer(req.user.id, req.body);
        return res.status(200).json(result);
    } catch (err: any) {
        console.error("submitAnswer error:", err?.message ?? err);
        if (err?.code === "ROOM_NOT_ACTIVE") return res.status(400).json({ error: err.message });
        if (err?.code === "EXPIRED_QUESTION") return res.status(400).json({ error: err.message });
        if (err?.code === "NOT_PARTICIPANT") return res.status(403).json({ error: err.message });
        return res.status(500).json({ error: "Failed to submit PVP answer" });
    }
};

export const nextState = async (req: Request, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: "Unauthorized" });
        const { roomCode, targetState } = req.body;
        if (!roomCode || !targetState) return res.status(400).json({ error: "Missing required fields" });
        await pvpService.triggerNextState(req.user.id, roomCode.trim(), targetState);
        return res.status(200).json({ success: true });
    } catch (err: any) {
        console.error("nextState error:", err?.message ?? err);
        if (err?.code === "ROOM_NOT_FOUND") return res.status(404).json({ error: err.message });
        if (err?.code === "UNAUTHORIZED") return res.status(403).json({ error: err.message });
        return res.status(500).json({ error: "Failed to transition state" });
    }
};

export const getCuratedTests = async (req: Request, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: "Unauthorized" });
        const tests = await pvpService.getCuratedTests();
        return res.status(200).json(tests);
    } catch (err: any) {
        console.error("getCuratedTests error:", err?.message ?? err);
        return res.status(500).json({ error: "Failed to fetch curated tests" });
    }
};

export const getAvailableQuestionsCount = async (req: Request, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: "Unauthorized" });
        const scopeType = req.query.scopeType as string | undefined;
        const scopeId = req.query.scopeId ? parseInt(req.query.scopeId as string, 10) : undefined;
        const testId = req.query.testId as string | undefined;

        const count = await pvpService.getAvailableQuestionsCount(scopeType, scopeId, testId);
        return res.status(200).json({ availableCount: count });
    } catch (err: any) {
        console.error("getAvailableQuestionsCount error:", err?.message ?? err);
        return res.status(500).json({ error: "Failed to get available questions count" });
    }
};

export const getPublicRooms = async (req: Request, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ error: "Unauthorized" });
        const rooms = await pvpService.getPublicRooms(req.user.id);
        return res.status(200).json(rooms);
    } catch (err: any) {
        console.error("getPublicRooms error:", err?.message ?? err);
        return res.status(500).json({ error: "Failed to fetch public rooms" });
    }
};

export const redirectToPvpRoom = (req: Request, res: Response) => {
    const code = (req.params.code || req.query.roomCode || req.query.code || "").toString().trim();
    const deepLinkUrl = `historyapp://pvp?roomCode=${encodeURIComponent(code)}`;

    const html = `<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tham gia phòng thi đấu PVP</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #f8fafc;
            color: #1e293b;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            padding: 20px;
            box-sizing: border-box;
        }
        .card {
            background: #ffffff;
            border-radius: 16px;
            padding: 32px 24px;
            max-width: 400px;
            width: 100%;
            text-align: center;
            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
        }
        .code-badge {
            font-size: 36px;
            font-weight: 800;
            color: #c37938;
            letter-spacing: 6px;
            margin: 16px 0;
        }
        .btn {
            display: inline-block;
            background-color: #c37938;
            color: #ffffff;
            font-weight: 700;
            font-size: 16px;
            text-decoration: none;
            padding: 14px 28px;
            border-radius: 30px;
            margin-top: 20px;
        }
        .subtext {
            color: #64748b;
            font-size: 14px;
            margin-top: 12px;
        }
    </style>
</head>
<body>
    <div class="card">
        <h2>Thi đấu Lịch Sử PVP</h2>
        <p>Đang chuyển hướng bạn vào phòng thi đấu...</p>
        <div class="code-badge">#${code || "----"}</div>
        <a id="open-btn" class="btn" href="${deepLinkUrl}">Mở trong ứng dụng</a>
        <p class="subtext">Nếu ứng dụng không tự động mở, hãy bấm nút ở trên.</p>
    </div>
    <script>
        window.location.href = "${deepLinkUrl}";
    </script>
</body>
</html>`;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(200).send(html);
};

