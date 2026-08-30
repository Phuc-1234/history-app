import { AITool } from "../types";
import { prisma } from "@history-app/shared";

export const getGradeOverviewTool: AITool = {
    declaration: {
        name: "get_grade_overview",
        description: "Lấy danh sách tổng quan tất cả các chủ đề (topics) và bài học (lessons) của một khối lớp (10, 11, 12).",
        parameters: {
            type: "OBJECT",
            properties: {
                gradeNumber: {
                    type: "INTEGER",
                    description: "Số lớp: 10, 11, hoặc 12."
                }
            },
            required: ["gradeNumber"]
        }
    },
    execute: async (args: { gradeNumber: number }) => {
        try {
            const grade = await prisma.grade.findUnique({
                where: { id: args.gradeNumber },
                include: {
                    topics: {
                        orderBy: { position: "asc" },
                        include: {
                            lessons: {
                                orderBy: { position: "asc" },
                                select: {
                                    id: true,
                                    name: true,
                                    summary: true,
                                    position: true
                                }
                            }
                        }
                    }
                }
            });

            if (!grade) {
                return { status: "not_found", message: `Không tìm thấy chương trình Lịch sử lớp ${args.gradeNumber}` };
            }

            return {
                status: "success",
                gradeName: `Lịch sử lớp ${grade.id}`,
                gradeMarkdownLink: `[Lịch sử lớp ${args.gradeNumber}](grade:${args.gradeNumber})`,
                topics: grade.topics.map(t => ({
                    id: t.id,
                    name: t.name,
                    lessons: t.lessons.map(l => ({
                        lessonId: l.id,
                        position: l.position,
                        name: `Bài ${l.position}: ${l.name}`,
                        markdownLink: `[Bài ${l.position}: ${l.name}](lesson:${l.id})`
                    }))
                }))
            };
        } catch (error: any) {
            return { status: "error", message: error.message };
        }
    }
};
