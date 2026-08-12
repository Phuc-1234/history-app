import { AITool } from "../types";
import { contentSearchService } from "../../contentSearchService";

export const searchCourseTool: AITool = {
    declaration: {
        name: "search_course_content",
        description: "Tìm kiếm từ khóa hoặc chủ đề lịch sử trong toàn bộ giáo trình ứng dụng. Trả về bài học và các nút kiến thức liên quan.",
        parameters: {
            type: "OBJECT",
            properties: {
                query: {
                    type: "STRING",
                    description: "Từ khóa hoặc câu hỏi lịch sử cần tìm kiếm (ví dụ: 'Cách mạng tháng 8', 'Chiến dịch Điện Biên Phủ', 'Chiến thuật quân sự')."
                },
                gradeFilter: {
                    type: "INTEGER",
                    description: "Tùy chọn lọc theo khối lớp: 10, 11, hoặc 12."
                }
            },
            required: ["query"]
        }
    },
    execute: async (args: { query: string; gradeFilter?: number }) => {
        try {
            const result = await contentSearchService.searchCourseContent(args.query, {
                contextGrade: args.gradeFilter
            });
            return {
                status: "success",
                resultCount: result.references.length,
                formattedContext: result.formattedContext,
                references: result.references
            };
        } catch (error: any) {
            return { status: "error", message: error.message };
        }
    }
};
