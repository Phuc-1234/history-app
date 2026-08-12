import { AITool } from "../types";
import { prisma } from "@history-app/shared";

export const getNodeDetailTool: AITool = {
    declaration: {
        name: "get_node_detail",
        description: "Lấy thông tin chi tiết đầy đủ nội dung của một nút kiến thức (node) theo nodeId bao gồm tiêu đề, văn bản chi tiết (body), mục bài học và tên bài học.",
        parameters: {
            type: "OBJECT",
            properties: {
                nodeId: {
                    type: "INTEGER",
                    description: "ID số nguyên của nút kiến thức (ví dụ: 10, 25)."
                }
            },
            required: ["nodeId"]
        }
    },
    execute: async (args: { nodeId: number }) => {
        try {
            const node = await prisma.node.findUnique({
                where: { id: args.nodeId },
                include: {
                    section: {
                        include: {
                            lesson: {
                                include: {
                                    topic: {
                                        include: { grade: true }
                                    }
                                }
                            }
                        }
                    }
                }
            });

            if (!node) {
                return { status: "not_found", message: `Không tìm thấy nút kiến thức với ID ${args.nodeId}` };
            }

            return {
                status: "success",
                node: {
                    id: node.id,
                    header: node.header,
                    body: node.body,
                    sectionName: node.section.name,
                    lessonId: node.section.lesson.id,
                    lessonName: node.section.lesson.name,
                    grade: node.section.lesson.topic?.grade ? `Lịch sử lớp ${node.section.lesson.topic.grade.id}` : `Lớp ${node.section.lesson.topic?.gradeId}`,
                    markdownLink: `[${node.header}](node:${node.id})`,
                    parentLessonMarkdownLink: `[${node.section.lesson.name}](lesson:${node.section.lesson.id})`
                }
            };
        } catch (error: any) {
            return { status: "error", message: error.message };
        }
    }
};
