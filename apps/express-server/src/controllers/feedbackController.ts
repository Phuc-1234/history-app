import { Request, Response } from "express";
import { prisma } from "@history-app/shared";

// Create feedback (student route)
export const createFeedback = async (req: Request, res: Response): Promise<any> => {
    try {
        const { content, type } = req.body;

        if (!content || typeof content !== "string" || !content.trim()) {
            return res.status(400).json({ error: "Nội dung góp ý không được trống." });
        }

        if (!type || typeof type !== "string" || !type.trim()) {
            return res.status(400).json({ error: "Loại góp ý không được trống." });
        }

        if (!req.user || !req.user.id) {
            return res.status(401).json({ error: "Phiên đăng nhập không hợp lệ." });
        }

        const feedback = await prisma.feedback.create({
            data: {
                content: content.trim(),
                type: type.trim(),
                userId: req.user.id,
            },
        });

        return res.status(201).json({
            message: "Gửi góp ý thành công.",
            feedback,
        });
    } catch (error: any) {
        console.error("Lỗi khi tạo góp ý:", error.message);
        return res.status(500).json({ error: "Lỗi hệ thống khi tạo góp ý." });
    }
};

// Get current user feedback history (student route)
export const getUserFeedbackHistory = async (req: Request, res: Response): Promise<any> => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ error: "Phiên đăng nhập không hợp lệ." });
        }

        const feedbacks = await prisma.feedback.findMany({
            where: { userId: req.user.id },
            orderBy: { createdAt: "desc" },
        });

        return res.status(200).json(feedbacks);
    } catch (error: any) {
        console.error("Lỗi khi lấy lịch sử góp ý:", error.message);
        return res.status(500).json({ error: "Lỗi hệ thống khi lấy lịch sử góp ý." });
    }
};

// List all feedbacks in system (admin route)
export const listAllFeedbacks = async (req: Request, res: Response): Promise<any> => {
    try {
        const feedbacks = await prisma.feedback.findMany({
            orderBy: { createdAt: "desc" },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                        profileImgUrl: true,
                    },
                },
            },
        });

        return res.status(200).json(feedbacks);
    } catch (error: any) {
        console.error("Lỗi khi lấy toàn bộ góp ý:", error.message);
        return res.status(500).json({ error: "Lỗi hệ thống khi lấy danh sách góp ý." });
    }
};
