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

export class ContentSearchService {
    async searchCourseContent(
        query: string,
        options?: { limit?: number; contextLessonId?: number; contextNodeId?: number }
    ): Promise<GroundingContextResult> {
        const limit = options?.limit || 5;
        const keywords = query
            .trim()
            .split(/\s+/)
            .filter((k) => k.length > 1)
            .slice(0, 5);

        const references: SearchResultItem[] = [];
        const contextBlocks: string[] = [];

        // 1. If explicit contextNodeId or contextLessonId is present, prioritize fetching it first
        if (options?.contextNodeId) {
            const activeNode = await prisma.node.findUnique({
                where: { id: options.contextNodeId },
                include: {
                    section: {
                        include: { lesson: true }
                    }
                }
            });
            if (activeNode) {
                contextBlocks.push(
                    `[ĐANG XEM TRÊN MÀN HÌNH - NÚT KIẾN THỨC ID: ${activeNode.id}]\nTiêu đề: ${activeNode.header || "Nút kiến thức"}\nThuộc bài học ID ${activeNode.section.lessonId}: "${activeNode.section.lesson.name}"\nNội dung: ${activeNode.body}`
                );
                references.push({
                    type: "node",
                    id: activeNode.id,
                    title: activeNode.header || `Nút kiến thức #${activeNode.id}`,
                    snippet: activeNode.body.slice(0, 100),
                    lessonId: activeNode.section.lessonId
                });
            }
        }

        if (options?.contextLessonId && (!options?.contextNodeId || references.length === 0)) {
            const activeLesson = await prisma.lesson.findUnique({
                where: { id: options.contextLessonId },
                include: {
                    sections: {
                        take: 5,
                        include: {
                            nodes: { take: 3 }
                        }
                    }
                }
            });
            if (activeLesson) {
                let text = `[ĐANG XEM TRÊN MÀN HÌNH - BÀI HỌC ID: ${activeLesson.id}]\nTên bài học: ${activeLesson.name}\nTóm tắt: ${activeLesson.summary || "Không có tóm tắt"}\nCấu trúc bài học:`;
                for (const sec of activeLesson.sections) {
                    text += `\n- Mục: ${sec.name}`;
                    for (const nd of sec.nodes) {
                        text += `\n  + Nút ID ${nd.id} ("${nd.header || "Chi tiết"}"): ${nd.body.slice(0, 150)}`;
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

        // 2. Perform text keyword search across Nodes
        const searchORs = keywords.map((k) => ({
            OR: [
                { header: { contains: k, mode: "insensitive" as const } },
                { body: { contains: k, mode: "insensitive" as const } }
            ]
        }));

        const matchingNodes = await prisma.node.findMany({
            where: searchORs.length > 0 ? { OR: searchORs.flatMap((x) => x.OR) } : undefined,
            take: limit,
            include: {
                section: {
                    select: {
                        id: true,
                        name: true,
                        lessonId: true,
                        lesson: { select: { id: true, name: true } }
                    }
                }
            }
        });

        for (const node of matchingNodes) {
            if (!references.some((r) => r.type === "node" && r.id === node.id)) {
                contextBlocks.push(
                    `[NÚT KIẾN THỨC ID: ${node.id}]\nTiêu đề: ${node.header || node.section.name}\nThuộc Bài học ID ${node.section.lessonId}: "${node.section.lesson.name}"\nNội dung: ${node.body}`
                );
                references.push({
                    type: "node",
                    id: node.id,
                    title: node.header || node.section.name,
                    snippet: node.body.slice(0, 100),
                    lessonId: node.section.lessonId
                });
            }
        }

        // 3. Perform search across Lessons if limit not reached
        if (references.length < limit) {
            const lessonSearchORs = keywords.map((k) => ({
                OR: [
                    { name: { contains: k, mode: "insensitive" as const } },
                    { summary: { contains: k, mode: "insensitive" as const } }
                ]
            }));

            const matchingLessons = await prisma.lesson.findMany({
                where: lessonSearchORs.length > 0 ? { OR: lessonSearchORs.flatMap((x) => x.OR) } : undefined,
                take: limit - references.length
            });

            for (const les of matchingLessons) {
                if (!references.some((r) => r.type === "lesson" && r.id === les.id)) {
                    contextBlocks.push(
                        `[BÀI HỌC ID: ${les.id}]\nTên bài học: ${les.name}\nTóm tắt nội dung: ${les.summary || "Không có tóm tắt"}`
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

        return {
            formattedContext: contextBlocks.join("\n\n---\n\n"),
            references
        };
    }
}

export const contentSearchService = new ContentSearchService();
