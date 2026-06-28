// controllers/homeController.ts
import { Request, Response } from "express";
import { homeService } from "../services/homeService";

export const getHomeData = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id ?? null;
        const data = await homeService.getHomeData(userId);
        return res.status(200).json(data);
    } catch (error) {
        console.error("[homeController] getHomeData error:", error);
        return res.status(500).json({ error: "Không thể tải dữ liệu trang chủ." });
    }
};
