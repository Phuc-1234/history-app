import { AITool } from "../types";
import { prisma } from "@history-app/shared";

export const getLessonDetailTool: AITool = {
    declaration: {
        name: "get_lesson_detail",
        description: "Lấy chi tiết một bài học trong giáo trình (bao gồm tóm tắt, các mục chính và danh sách nút kiến thức). Có thể tra cứu theo số thứ tự bài trong khối lớp (ví dụ: Bài 2 Lớp 10), tên bài học, hoặc lessonId.",
        parameters: {
            type: "OBJECT",
            properties: {
                gradeNumber: {
                    type: "INTEGER",
                    description: "Khối lớp của bài học: 10, 11, hoặc 12 (kết hợp với lessonPosition hoặc lessonName)."
                },
                lessonPosition: {
                    type: "INTEGER",
                    description: "Số thứ tự của bài học trong khối lớp (ví dụ: 2 cho 'Bài 2', 1 cho 'Bài 1')."
                },
                lessonName: {
                    type: "STRING",
                    description: "Tên hoặc từ khóa tiêu đề bài học (ví dụ: 'Tri thức lịch sử và cuộc sống')."
                },
                lessonId: {
                    type: "INTEGER",
                    description: "Mã ID số nguyên của bài học (nếu đã biết từ kết quả tra cứu trước)."
                }
            }
        }
    },
    execute: async (args: { lessonId?: number; gradeNumber?: number; lessonPosition?: number; lessonName?: string }) => {
        try {
            let lesson: any = null;

            const includeQuery = {
                topic: {
                    include: {
                        grade: true
                    }
                },
                sections: {
                    orderBy: { position: "asc" as const },
                    include: {
                        nodes: {
                            orderBy: { position: "asc" as const },
                            select: {
                                id: true,
                                header: true,
                                position: true
                            }
                        }
                    }
                }
            };

            if (args.gradeNumber && args.lessonPosition) {
                lesson = await prisma.lesson.findFirst({
                    where: {
                        position: args.lessonPosition,
                        topic: { gradeId: args.gradeNumber }
                    },
                    include: includeQuery
                });
            } else if (args.lessonId) {
                lesson = await prisma.lesson.findUnique({
                    where: { id: args.lessonId },
                    include: includeQuery
                });
            } else if (args.lessonPosition) {
                lesson = await prisma.lesson.findFirst({
                    where: {
                        position: args.lessonPosition,
                        ...(args.gradeNumber ? { topic: { gradeId: args.gradeNumber } } : {})
                    },
                    include: includeQuery
                });
            } else if (args.lessonName) {
                lesson = await prisma.lesson.findFirst({
                    where: {
                        name: { contains: args.lessonName, mode: "insensitive" },
                        ...(args.gradeNumber ? { topic: { gradeId: args.gradeNumber } } : {})
                    },
                    include: includeQuery
                });
            }

            if (!lesson) {
                return { status: "not_found", message: "Không tìm thấy bài học phù hợp trong giáo trình." };
            }

            // Fetch all sections and nodes belonging to this lesson
            const sections = await prisma.section.findMany({
                where: { lessonId: lesson.id },
                orderBy: { position: "asc" }
            });

            const sectionIds = sections.map((s) => s.id);
            const nodes = await prisma.node.findMany({
                where: { sectionId: { in: sectionIds } },
                orderBy: { position: "asc" }
            });

            // Build hierarchical tree for sections
            const sectionMap = new Map<number, any>();
            for (const s of sections) {
                sectionMap.set(s.id, {
                    id: s.id,
                    name: s.name,
                    summary: s.summary ?? null,
                    position: s.position,
                    parentSectionId: s.parentSectionId ?? null,
                    children: [],
                    nodes: []
                });
            }

            const rootSections: any[] = [];
            for (const s of sectionMap.values()) {
                if (s.parentSectionId == null) {
                    rootSections.push(s);
                } else {
                    const parent = sectionMap.get(s.parentSectionId);
                    if (parent) {
                        parent.children.push(s);
                    } else {
                        rootSections.push(s);
                    }
                }
            }

            for (const n of nodes) {
                const cleanContent = n.body
                    ? n.body.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
                    : "";
                const nodeItem = {
                    nodeId: n.id,
                    position: n.position,
                    header: n.header || "Nội dung chi tiết",
                    content: cleanContent,
                    markdownLink: `[${n.header || "Nội dung chi tiết"}](node:${n.id})`
                };
                if (n.sectionId && sectionMap.has(n.sectionId)) {
                    sectionMap.get(n.sectionId).nodes.push(nodeItem);
                }
            }

            return {
                status: "success",
                lesson: {
                    id: lesson.id,
                    position: lesson.position,
                    name: `Bài ${lesson.position}: ${lesson.name}`,
                    summary: lesson.summary,
                    grade: lesson.topic?.grade ? `Lịch sử lớp ${lesson.topic.grade.id}` : `Lớp ${lesson.topic?.gradeId}`,
                    topic: lesson.topic?.name,
                    markdownLink: `[Bài ${lesson.position}: ${lesson.name}](lesson:${lesson.id})`,
                    sections: rootSections
                }
            };
        } catch (error: any) {
            return { status: "error", message: error.message };
        }
    }
};

