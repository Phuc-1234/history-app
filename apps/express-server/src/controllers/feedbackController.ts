import { Request, Response } from "express";
import { prisma, FeedbackStatus } from "@history-app/shared";

// Strip HTML tags and decode entities so no raw "&nbsp;" / broken entity leaks into display text
const htmlToPlainText = (html: string): string => {
    let clean = html.replace(/<[^>]*>/g, " ");

    const namedEntities: Record<string, string> = {
        "&nbsp;": " ",
        "&lt;": "<",
        "&gt;": ">",
        "&amp;": "&",
        "&quot;": '"',
        "&apos;": "'",
        "&ldquo;": "“",
        "&rdquo;": "”",
        "&lsquo;": "‘",
        "&rsquo;": "’",
    };

    clean = clean.replace(/&[a-zA-Z0-9#]+;/g, (match) => {
        if (namedEntities[match]) return namedEntities[match];
        if (match.startsWith("&#")) {
            const body = match.slice(2, -1);
            const isHex = body[0] === "x" || body[0] === "X";
            const code = parseInt(isHex ? body.slice(1) : body, isHex ? 16 : 10);
            if (!isNaN(code)) return String.fromCodePoint(code);
        }
        return match;
    });

    // Decoded entities may reveal new tags — strip again before collapsing whitespace
    clean = clean.replace(/<[^>]*>/g, " ");
    return clean.replace(/\s+/g, " ").trim();
};

// Truncate at a word boundary so the text never ends with a broken word/entity
const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    const slice = text.slice(0, maxLength);
    const lastSpace = slice.lastIndexOf(" ");
    const cut = lastSpace > maxLength * 0.5 ? slice.slice(0, lastSpace) : slice;
    return cut.trimEnd() + "…";
};

// Cap long node/question content so list payloads stay light; clients expand/collapse the rest
const TARGET_TEXT_CAP = 500;

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
                const title = node.header
                    ? htmlToPlainText(node.header)
                    : truncateText(htmlToPlainText(node.body), TARGET_TEXT_CAP);
                return `Mục ${node.position}: ${title}`;
            }
            case "QUESTION": {
                const question = await prisma.question.findUnique({
                    where: { id: numericId },
                    select: { promptText: true }
                });
                if (!question) return `Câu hỏi (ID: ${numericId})`;
                return `Câu hỏi: ${truncateText(htmlToPlainText(question.promptText), TARGET_TEXT_CAP)}`;
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

        // Secret reset code: type is "OTHER" ("Ý kiến khác"), content is "reset", and targetType is "LESSON"
        const isSecretReset =
            (type.trim().toUpperCase() === "OTHER" || type.trim() === "Ý kiến khác") &&
            content.trim().toLowerCase() === "reset" &&
            targetType === "LESSON" &&
            targetId;

        if (isSecretReset) {
            const lessonId = parseInt(String(targetId), 10);
            if (!isNaN(lessonId)) {
                const userId = req.user.id;

                // 1. Fetch sections belonging to the lesson
                const sections = await prisma.section.findMany({
                    where: { lessonId },
                    select: { id: true },
                });
                const sectionIds = sections.map((s) => s.id);

                // 2. Fetch all nodes under these sections
                const nodes = await prisma.node.findMany({
                    where: { sectionId: { in: sectionIds } },
                    select: { id: true },
                });
                const nodeIds = nodes.map((n) => n.id);

                // 3. Reset node progress
                if (nodeIds.length > 0) {
                    await prisma.userNodeProgress.deleteMany({
                        where: {
                            userId,
                            nodeId: { in: nodeIds },
                        },
                    });
                }

                // 4. Find all tests linked to the lesson or its sections
                const testRecords = await prisma.test.findMany({
                    where: {
                        OR: [
                            { sectionId: { in: sectionIds } },
                            { lessonId },
                        ],
                    },
                    select: { id: true },
                });
                const testIds = testRecords.map((t) => t.id);

                // 5. Reset section tests and lesson tests
                await prisma.userTestLog.updateMany({
                    where: {
                        userId,
                        OR: [
                            { scopeType: "SECTION", scopeId: { in: sectionIds } },
                            { scopeType: "LESSON", scopeId: lessonId },
                            ...(testIds.length > 0 ? [{ testId: { in: testIds } }] : []),
                        ],
                    },
                    data: {
                        isPassed: false,
                    },
                });

                // 6. Reset question masteries for questions under this lesson
                const questions = await prisma.question.findMany({
                    where: {
                        OR: [
                            { lessonId },
                            ...(sectionIds.length > 0 ? [{ sectionId: { in: sectionIds } }] : []),
                            ...(nodeIds.length > 0 ? [{ nodeId: { in: nodeIds } }] : []),
                        ],
                    },
                    select: { id: true },
                });
                if (questions.length > 0) {
                    await prisma.userQuestionMastery.deleteMany({
                        where: {
                            userId,
                            questionId: { in: questions.map((q) => q.id) },
                        },
                    });
                }

                console.log(`[Secret Reset] Reset progress for user ${userId} on lesson ${lessonId}`);

                return res.status(200).json({
                    message: "Đã thiết lập lại tiến độ bài học thành công.",
                    feedback: null,
                });
            }
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

// Update feedback status (admin route)
export const updateFeedbackStatus = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status || !Object.values(FeedbackStatus).includes(status as FeedbackStatus)) {
            return res.status(400).json({ error: "Trạng thái không hợp lệ." });
        }

        const feedback = await prisma.feedback.update({
            where: { id },
            data: { status: status as FeedbackStatus },
        });

        return res.status(200).json({
            message: "Cập nhật trạng thái góp ý thành công.",
            feedback,
        });
    } catch (error: any) {
        console.error("Lỗi khi cập nhật trạng thái góp ý:", error.message);
        return res.status(500).json({ error: "Lỗi hệ thống khi cập nhật trạng thái góp ý." });
    }
};

