import { Request, Response } from "express";
import { prisma } from "@history-app/shared";

// Helper function to resolve human-readable target name
const resolveTargetName = async (targetType: string | null, targetId: string | null): Promise<string | null> => {
    if (!targetType || !targetId) return null;
    try {
        const numericId = parseInt(targetId, 10);
        if (isNaN(numericId)) return `${targetType} (ID: ${targetId})`;

        switch (targetType) {
            case "GRADE":
                return `Khối ${numericId}`;
            case "LESSON": {
                const lesson = await prisma.lesson.findUnique({
                    where: { id: numericId },
                    select: { position: true, name: true }
                });
                return lesson ? `Bài ${lesson.position}: ${lesson.name}` : `Bài học (ID: ${numericId})`;
            }
            case "NODE": {
                const node = await prisma.node.findUnique({
                    where: { id: numericId },
                    select: { position: true, header: true, body: true }
                });
                if (!node) return `Mục (ID: ${numericId})`;
                const title = node.header || node.body.replace(/<[^>]*>/g, "").substring(0, 30) + "...";
                return `Mục ${node.position}: ${title}`;
            }
            case "QUESTION": {
                const question = await prisma.question.findUnique({
                    where: { id: numericId },
                    select: { promptText: true }
                });
                if (!question) return `Câu hỏi (ID: ${numericId})`;
                const plainText = question.promptText.replace(/<[^>]*>/g, "").trim().substring(0, 50) + "...";
                return `Câu hỏi: ${plainText}`;
            }
            default:
                return `${targetType} (ID: ${targetId})`;
        }
    } catch (error) {
        console.error("Lỗi khi giải quyết tên mục tiêu:", error);
        return `${targetType} (ID: ${targetId})`;
    }
};

// Create feedback (student route)
export const createFeedback = async (req: Request, res: Response): Promise<any> => {
    try {
        console.log("[createFeedback DEBUG] Request Body:", req.body);
        const { content, type, targetType, targetId } = req.body;

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
                targetType: targetType ? String(targetType).trim() : null,
                targetId: targetId ? String(targetId).trim() : null,
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

        const feedbacksWithTarget = await Promise.all(
            feedbacks.map(async (fb) => {
                const targetName = await resolveTargetName(fb.targetType, fb.targetId);
                return {
                    ...fb,
                    targetName,
                };
            })
        );

        return res.status(200).json(feedbacksWithTarget);
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

        const feedbacksWithTarget = await Promise.all(
            feedbacks.map(async (fb) => {
                const targetName = await resolveTargetName(fb.targetType, fb.targetId);
                return {
                    ...fb,
                    targetName,
                };
            })
        );

        return res.status(200).json(feedbacksWithTarget);
    } catch (error: any) {
        console.error("Lỗi khi lấy toàn bộ góp ý:", error.message);
        return res.status(500).json({ error: "Lỗi hệ thống khi lấy danh sách góp ý." });
    }
};

