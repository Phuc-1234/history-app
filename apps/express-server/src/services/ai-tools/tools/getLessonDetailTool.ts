import { AITool } from "../types";
import { prisma } from "@history-app/shared";

export const getLessonDetailTool: AITool = {
    declaration: {
        name: "get_lesson_detail",
        description: "Lấy chi tiết một bài học theo lessonId khóa chính trong CSDL (bao gồm tóm tắt, các mục chính và danh sách nút kiến thức).",
        parameters: {
            type: "OBJECT",
            properties: {
                lessonId: {
                    type: "INTEGER",
                    description: "Mã ID số nguyên khóa chính của bài học trong CSDL (thu được từ search_course_content hoặc get_grade_overview, KHÔNG PHẢI số thứ tự 'Bài 1', 'Bài 2')."
                }
            },
            required: ["lessonId"]
        }
    },
    execute: async (args: { lessonId: number }) => {
        try {
            const lesson = await prisma.lesson.findUnique({
                where: { id: args.lessonId },
                include: {
                    topic: {
                        include: {
                            grade: true
                        }
                    },
                    sections: {
                        orderBy: { position: "asc" },
                        include: {
                            nodes: {
                                orderBy: { position: "asc" },
                                select: {
                                    id: true,
                                    header: true,
                                    position: true
                                }
                            }
                        }
                    }
                }
            });

            if (!lesson) {
                return { status: "not_found", message: `Không tìm thấy bài học với ID ${args.lessonId}` };
            }

            return {
                status: "success",
                lesson: {
                    id: lesson.id,
                    name: lesson.name,
                    summary: lesson.summary,
                    grade: lesson.topic?.grade ? `Lịch sử lớp ${lesson.topic.grade.id}` : `Lớp ${lesson.topic?.gradeId}`,
                    topic: lesson.topic?.name,
                    sections: lesson.sections.map(s => ({
                        id: s.id,
                        name: s.name,
                        nodes: s.nodes.map(n => ({
                            id: n.id,
                            header: n.header,
                            markdownLink: `[${n.header}](node:${n.id})`
                        }))
                    })),
                    markdownLink: `[${lesson.name}](lesson:${lesson.id})`
                }
            };
        } catch (error: any) {
            return { status: "error", message: error.message };
        }
    }
};
