import { prisma } from "@history-app/shared";

export interface SearchResultItem {
    type: "lesson" | "section" | "node";
    id: number;
    title: string;
    snippet: string;
    lessonId?: number;
}

export interface GroundingContextResult {
    formattedContext: string;
    references: SearchResultItem[];
}

const STOP_WORDS = new Set([
    "nội", "dung", "có", "gì", "là", "như", "thế", "nào", "bài", "học",
    "các", "những", "cho", "của", "và", "trong", "với", "được", "ra", "đã",
    "thì", "đó", "này", "ở", "trên", "màn", "hình", "đang", "xem", "hỏi", "biết"
]);

export class ContentSearchService {
    async searchCourseContent(
        query: string,
        options?: { limit?: number; contextLessonId?: number; contextNodeId?: number; contextGrade?: number }
    ): Promise<GroundingContextResult> {
        const limit = options?.limit || 5;

        // Detect grade from prompt query if not passed via options
        const gradeMatch = query.match(/\b(?:lớp|khối|grade)\s*(10|11|12)\b/i) || query.match(/\b(10|11|12)\b/);
        const queryGrade = gradeMatch ? parseInt(gradeMatch[1], 10) : undefined;
        // Grade specified explicitly in query (e.g., "Lớp 10")
        const searchGradeFilter = queryGrade ? queryGrade : undefined;

        const keywords = query
            .trim()
            .toLowerCase()
            .split(/\s+/)
            .filter((k) => k.length > 1 && !STOP_WORDS.has(k))
            .slice(0, 5);

        const references: SearchResultItem[] = [];
        const contextBlocks: string[] = [];

        // 1. If active context grade or query grade is present, fetch curriculum list as baseline context
        const listGrade = queryGrade || options?.contextGrade;
        if (listGrade && [10, 11, 12].includes(listGrade)) {
            const gradeTopics = await prisma.topic.findMany({
                where: { gradeId: listGrade },
                orderBy: { position: "asc" },
                include: {
                    lessons: {
                        orderBy: { position: "asc" },
                        select: { id: true, name: true, position: true, summary: true }
                    }
                }
            });

            if (gradeTopics.length > 0) {
                let gradeText = `[DANH SÁCH BÀI HỌC VÀ CHỦ ĐỀ CHUẨN CỦA LỚP ${listGrade}]`;
                for (const top of gradeTopics) {
                    gradeText += `\n- Chủ đề ${top.position}: "${top.name}"`;
                    for (const les of top.lessons) {
                        gradeText += `\n  + [Bài ${les.position}: ${les.name}](lesson:${les.id}): ${les.summary || "Chi tiết bài học"}`;
                    }
                }
                contextBlocks.push(gradeText);
            }
        }

        // 2. If explicit contextNodeId is present, fetch active node details as context suggestion
        if (options?.contextNodeId) {
            const activeNode = await prisma.node.findUnique({
                where: { id: options.contextNodeId },
                include: {
                    section: {
                        include: {
                            lesson: {
                                include: { topic: true }
                            }
                        }
                    }
                }
            });
            if (activeNode) {
                const nodeTitle = activeNode.header || activeNode.section.name || (activeNode.body ? activeNode.body.slice(0, 35).trim() + "..." : "Chi tiết kiến thức");
                contextBlocks.push(
                    `[GỢI Ý BỐI CẢNH MÀN HÌNH - NÚT KIẾN THỨC DÙNG KHI NGƯỜI DÙNG NÓI "nút này", "bài này", "ở đây": "${nodeTitle}"]\nLiên kết: [${nodeTitle}](node:${activeNode.id})\nThuộc [Bài ${activeNode.section.lesson.position}: ${activeNode.section.lesson.name}](lesson:${activeNode.section.lessonId}) (Lớp ${activeNode.section.lesson.topic.gradeId})\nNội dung: ${activeNode.body}`
                );
                references.push({
                    type: "node",
                    id: activeNode.id,
                    title: nodeTitle,
                    snippet: activeNode.body.slice(0, 100),
                    lessonId: activeNode.section.lessonId
                });
            }
        }

        // 3. If explicit contextLessonId is present, fetch active lesson details as context suggestion
        if (options?.contextLessonId && !references.some((r) => r.type === "lesson" && r.id === options.contextLessonId)) {
            const activeLesson = await prisma.lesson.findUnique({
                where: { id: options.contextLessonId },
                include: {
                    topic: true,
                    sections: {
                        take: 5,
                        include: {
                            nodes: { take: 3 }
                        }
                    }
                }
            });
            if (activeLesson) {
                let text = `[GỢI Ý BỐI CẢNH MÀN HÌNH - BÀI HỌC DÙNG KHI NGƯỜI DÙNG NÓI "bài này", "bài học này", "ở đây": "${activeLesson.name}"]\nLiên kết: [${activeLesson.name}](lesson:${activeLesson.id}) (Lớp ${activeLesson.topic.gradeId})\nTóm tắt: ${activeLesson.summary || "Không có tóm tắt"}\nCấu trúc bài học:`;
                for (const sec of activeLesson.sections) {
                    text += `\n- Mục: ${sec.name}`;
                    for (const nd of sec.nodes) {
                        const ndTitle = nd.header || (nd.body ? nd.body.slice(0, 30).trim() + "..." : "Chi tiết");
                        text += `\n  + [${ndTitle}](node:${nd.id}): ${nd.body.slice(0, 150)}`;
                    }
                }
                contextBlocks.push(text);
                references.push({
                    type: "lesson",
                    id: activeLesson.id,
                    title: activeLesson.name,
                    snippet: activeLesson.summary || activeLesson.name
                });
            }
        }

        // 4. Perform keyword search across Nodes (searches ALL nodes unless explicit grade query parameter exists)
        if (keywords.length > 0) {
            const searchORs = keywords.map((k) => ({
                OR: [
                    { header: { contains: k, mode: "insensitive" as const } },
                    { body: { contains: k, mode: "insensitive" as const } }
                ]
            }));

            const gradeFilterNode = searchGradeFilter
                ? { section: { lesson: { topic: { gradeId: searchGradeFilter } } } }
                : {};

            const matchingNodes = await prisma.node.findMany({
                where: {
                    AND: [
                        { OR: searchORs.flatMap((x) => x.OR) },
                        gradeFilterNode
                    ]
                },
                take: limit,
                include: {
                    section: {
                        select: {
                            id: true,
                            name: true,
                            lessonId: true,
                            lesson: { select: { id: true, name: true, position: true } }
                        }
                    }
                }
            });

            for (const node of matchingNodes) {
                if (!references.some((r) => r.type === "node" && r.id === node.id)) {
                    const nodeTitle = node.header || node.section.name || (node.body ? node.body.slice(0, 35).trim() + "..." : "Chi tiết kiến thức");
                    contextBlocks.push(
                        `[NÚT KIẾN THỨC KẾT QUẢ TÌM KIẾM: "${nodeTitle}"]\nLiên kết: [${nodeTitle}](node:${node.id})\nThuộc [Bài ${node.section.lesson.position}: ${node.section.lesson.name}](lesson:${node.section.lessonId})\nNội dung: ${node.body}`
                    );
                    references.push({
                        type: "node",
                        id: node.id,
                        title: nodeTitle,
                        snippet: node.body.slice(0, 100),
                        lessonId: node.section.lessonId
                    });
                }
            }

            // 5. Perform keyword search across Lessons if limit not reached
            if (references.length < limit) {
                const lessonSearchORs = keywords.map((k) => ({
                    OR: [
                        { name: { contains: k, mode: "insensitive" as const } },
                        { summary: { contains: k, mode: "insensitive" as const } }
                    ]
                }));

                const gradeFilterLesson = searchGradeFilter
                    ? { topic: { gradeId: searchGradeFilter } }
                    : {};

                const matchingLessons = await prisma.lesson.findMany({
                    where: {
                        AND: [
                            { OR: lessonSearchORs.flatMap((x) => x.OR) },
                            gradeFilterLesson
                        ]
                    },
                    take: limit - references.length
                });

                for (const les of matchingLessons) {
                    if (!references.some((r) => r.type === "lesson" && r.id === les.id)) {
                        contextBlocks.push(
                            `[BÀI HỌC KẾT QUẢ TÌM KIẾM ID: ${les.id}]\nTên bài học: ${les.name}\nTóm tắt nội dung: ${les.summary || "Không có tóm tắt"}`
                        );
                        references.push({
                            type: "lesson",
                            id: les.id,
                            title: les.name,
                            snippet: les.summary || les.name
                        });
                    }
                }
            }
        }

        return {
            formattedContext: contextBlocks.join("\n\n---\n\n"),
            references
        };
    }
}

export const contentSearchService = new ContentSearchService();
