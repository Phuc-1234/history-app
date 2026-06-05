// services/contentService.ts
import { prisma } from "@history-app/shared";
import {
    SectionDto,
    NodeDto,
    LessonDto,
    TopicDto,
    GradeDto,
    MindMapNode,
    TopicWithContentsDto,
    GradeStructureDto,
    CompactTestDto,
    LessonWithContentDto
} from "@history-app/shared";

export class ContentService {
    async getAllGrades(): Promise<GradeDto[]> {
        const grades = await prisma.grade.findMany({
            select: { id: true, state: true },
        });
        return grades.map((g) => ({ id: g.id, state: g.state }));
    }

    async getTopicsByGrade(gradeId: number): Promise<TopicDto[]> {
        const topics = await prisma.topic.findMany({
            where: { gradeId },
            select: { id: true, name: true, position: true, gradeId: true },
        });
        return topics.map((t) => ({
            id: t.id,
            name: t.name,
            position: t.position,
            gradeId: t.gradeId,
        }));
    }

    async getLessonsByTopic(topicId: number): Promise<LessonDto[]> {
        const lessons = await prisma.lesson.findMany({
            where: { topicId },
            select: {
                id: true,
                name: true,
                summary: true,
                position: true,
                topicId: true,
            },
        });
        return lessons.map((l) => ({
            id: l.id,
            name: l.name,
            summary: l.summary ?? null,
            position: l.position,
            topicId: l.topicId,
        }));
    }

    async getSectionsByLesson(lessonId: number): Promise<SectionDto[]> {
        const sections = await prisma.section.findMany({
            where: { lessonId },
            select: {
                id: true,
                name: true,
                summary: true,
                position: true,
                lessonId: true,
                parentSectionId: true,
            },
            orderBy: { position: "asc" },
        });

        // Build tree
        const map = new Map<
            number,
            SectionDto & { children: SectionDto[]; nodes?: NodeDto[] }
        >();
        for (const s of sections) {
            map.set(s.id, {
                id: s.id,
                name: s.name,
                summary: s.summary ?? null,
                position: s.position,
                lessonId: s.lessonId,
                parentSectionId: s.parentSectionId ?? null,
                children: [],
                nodes: [],
            });
        }

        const roots: SectionDto[] = [];
        for (const s of map.values()) {
            if (s.parentSectionId == null) {
                roots.push(s);
            } else {
                const parent = map.get(s.parentSectionId);
                if (parent) parent.children!.push(s);
                else roots.push(s); // Fallback if parent missing
            }
        }

        return roots;
    }

    async getLessonTree(
        lessonId: number,
    ): Promise<LessonWithContentDto | null> {
        // 1. Fetch lesson details along with its nested videos and sections in parallel
        const [lessonData, sections] = await Promise.all([
            prisma.lesson.findUnique({
                where: { id: lessonId },
                select: {
                    id: true,
                    name: true,
                    summary: true,
                    position: true,
                    topicId: true,
                    videos: {
                        select: {
                            id: true,
                            hlsUrl: true,
                        },
                        orderBy: { position: "asc" },
                    },
                },
            }),
            prisma.section.findMany({
                where: { lessonId },
                select: {
                    id: true,
                    name: true,
                    summary: true,
                    position: true,
                    lessonId: true,
                    parentSectionId: true,
                },
                orderBy: { position: "asc" },
            }),
        ]);

        if (!lessonData) return null;

        // 2. Fetch nodes cleanly by targeting the extracted section IDs from step 1
        const sectionIds = sections.map((s) => s.id);
        const nodes = await prisma.node.findMany({
            where: {
                sectionId: { in: sectionIds },
            },
            select: {
                id: true,
                position: true,
                header: true,
                body: true,
                imgUrl: true,
                sectionId: true,
            },
        });

        // 3. Reconstruct tree elements using map mapping structures
        const map = new Map<
            number,
            SectionDto & { children: SectionDto[]; nodes: NodeDto[] }
        >();

        for (const s of sections) {
            map.set(s.id, {
                id: s.id,
                name: s.name,
                summary: s.summary ?? null,
                position: s.position,
                lessonId: s.lessonId,
                parentSectionId: s.parentSectionId ?? null,
                children: [],
                nodes: [],
            });
        }

        for (const n of nodes) {
            const nd: NodeDto = {
                id: n.id,
                position: n.position,
                header: n.header,
                body: n.body,
                imgUrl: n.imgUrl ?? null,
                sectionId: n.sectionId ?? null,
            };
            if (n.sectionId && map.has(n.sectionId)) {
                map.get(n.sectionId)!.nodes!.push(nd);
            }
        }

        const roots: SectionDto[] = [];
        for (const s of map.values()) {
            if (s.parentSectionId == null) {
                roots.push(s);
            } else {
                const parent = map.get(s.parentSectionId);
                if (parent) parent.children!.push(s);
                else roots.push(s);
            }
        }

        // 4. Return parent lesson wrapper along with attached nested lists
        return {
            id: lessonData.id,
            name: lessonData.name,
            summary: lessonData.summary ?? null,
            position: lessonData.position,
            topicId: lessonData.topicId,
            videos: lessonData.videos,
            sections: roots,
        };
    }

    async getMindMap(params: {
        gradeId?: number;
        topicId?: number;
        lessonId?: number;
    }): Promise<MindMapNode> {
        const { gradeId, topicId, lessonId } = params;

        let topics: any[] = [];
        let lessons: any[] = [];
        let sections: any[] = [];
        let nodes: any[] = [];
        let rootNode: MindMapNode;

        if (gradeId !== undefined) {
            const grade = await prisma.grade.findUnique({
                where: { id: gradeId },
            });
            if (!grade) throw new Error("Grade not found");

            topics = await prisma.topic.findMany({
                where: { gradeId },
                orderBy: { position: "asc" },
            });
            const topicIds = topics.map((t) => t.id);

            lessons = await prisma.lesson.findMany({
                where: { topicId: { in: topicIds } },
                orderBy: { position: "asc" },
            });
            const lessonIds = lessons.map((l) => l.id);

            sections = await prisma.section.findMany({
                where: { lessonId: { in: lessonIds } },
                orderBy: { position: "asc" },
            });
            const sectionIds = sections.map((s) => s.id);

            nodes = await prisma.node.findMany({
                where: { sectionId: { in: sectionIds } },
                orderBy: { position: "asc" },
            });

            rootNode = {
                id: grade.id,
                type: "grade",
                name: `Grade ${grade.id}`,
                children: [],
            };
        } else if (topicId !== undefined) {
            const topic = await prisma.topic.findUnique({
                where: { id: topicId },
            });
            if (!topic) throw new Error("Topic not found");

            topics = [topic];

            lessons = await prisma.lesson.findMany({
                where: { topicId },
                orderBy: { position: "asc" },
            });
            const lessonIds = lessons.map((l) => l.id);

            sections = await prisma.section.findMany({
                where: { lessonId: { in: lessonIds } },
                orderBy: { position: "asc" },
            });
            const sectionIds = sections.map((s) => s.id);

            nodes = await prisma.node.findMany({
                where: { sectionId: { in: sectionIds } },
                orderBy: { position: "asc" },
            });

            rootNode = {
                id: topic.id,
                type: "topic",
                name: topic.name,
                children: [],
            };
        } else if (lessonId !== undefined) {
            const lesson = await prisma.lesson.findUnique({
                where: { id: lessonId },
            });
            if (!lesson) throw new Error("Lesson not found");

            lessons = [lesson];

            sections = await prisma.section.findMany({
                where: { lessonId },
                orderBy: { position: "asc" },
            });
            const sectionIds = sections.map((s) => s.id);

            nodes = await prisma.node.findMany({
                where: { sectionId: { in: sectionIds } },
                orderBy: { position: "asc" },
            });

            rootNode = {
                id: lesson.id,
                type: "lesson",
                name: lesson.name,
                children: [],
            };
        } else {
            throw new Error("Invalid parameters");
        }

        // Maps
        const nodeMap = new Map<number, MindMapNode>();
        const sectionMap = new Map<number, MindMapNode>();
        const lessonMap = new Map<number, MindMapNode>();
        const topicMap = new Map<number, MindMapNode>();

        // 1. Nodes
        for (const n of nodes) {
            nodeMap.set(n.id, {
                id: n.id,
                type: "node",
                header: n.header,
                body: n.body,
            });
        }

        // 2. Sections
        for (const s of sections) {
            sectionMap.set(s.id, {
                id: s.id,
                type: "section",
                name: s.name,
                children: [],
            });
        }

        // 3. Lessons
        for (const l of lessons) {
            lessonMap.set(l.id, {
                id: l.id,
                type: "lesson",
                name: l.name,
                children: [],
            });
        }

        // 4. Topics
        for (const t of topics) {
            topicMap.set(t.id, {
                id: t.id,
                type: "topic",
                name: t.name,
                children: [],
            });
        }

        // Link them up:
        // A. Nodes to Sections
        for (const n of nodes) {
            const nodeObj = nodeMap.get(n.id);
            const parentSecObj = sectionMap.get(n.sectionId);
            if (nodeObj && parentSecObj) {
                parentSecObj.children!.push(nodeObj);
            }
        }

        // B. Sections to parent Sections or Lessons
        for (const s of sections) {
            const secObj = sectionMap.get(s.id);
            if (!secObj) continue;

            if (s.parentSectionId !== null && s.parentSectionId !== undefined) {
                const parentSecObj = sectionMap.get(s.parentSectionId);
                if (parentSecObj) {
                    parentSecObj.children!.push(secObj);
                } else {
                    const lessonObj = lessonMap.get(s.lessonId);
                    if (lessonObj) {
                        lessonObj.children!.push(secObj);
                    }
                }
            } else {
                const lessonObj = lessonMap.get(s.lessonId);
                if (lessonObj) {
                    lessonObj.children!.push(secObj);
                }
            }
        }

        // C. Lessons to Topics
        for (const l of lessons) {
            const lessonObj = lessonMap.get(l.id);
            const topicObj = topicMap.get(l.topicId);
            if (lessonObj && topicObj) {
                topicObj.children!.push(lessonObj);
            }
        }

        // D. Topics to Grade
        for (const t of topics) {
            const topicObj = topicMap.get(t.id);
            if (topicObj && gradeId !== undefined) {
                rootNode.children!.push(topicObj);
            }
        }

        // E. Special case for root node linking:
        if (topicId !== undefined) {
            const topicObj = topicMap.get(topicId);
            if (topicObj) {
                rootNode.children = topicObj.children;
            }
        } else if (lessonId !== undefined) {
            const lessonObj = lessonMap.get(lessonId);
            if (lessonObj) {
                rootNode.children = lessonObj.children;
            }
        }

        return rootNode;
    }

    async getGradeStructure(gradeId: number): Promise<GradeStructureDto> {
        const gradeTest = await prisma.test.findFirst({
            where: { gradeId },
            orderBy: { id: "asc" },
        });

        const topics = await prisma.topic.findMany({
            where: { gradeId },
            orderBy: { position: "asc" },
            include: {
                lessons: {
                    orderBy: { position: "asc" },
                },
                tests: {
                    where: { topicId: { not: null } },
                    orderBy: { id: "asc" },
                },
            },
        });

        const formattedTopics: TopicWithContentsDto[] = topics.map((topic) => {
            const firstTopicTest = topic.tests[0] || null;

            return {
                id: topic.id,
                name: topic.name,
                position: topic.position,
                gradeId: topic.gradeId,
                lessons: topic.lessons.map((lesson) => ({
                    id: lesson.id,
                    name: lesson.name,
                    summary: lesson.summary ?? null,
                    position: lesson.position,
                    topicId: lesson.topicId,
                })),
                firstTest: firstTopicTest
                    ? {
                          id: firstTopicTest.id,
                          title: firstTopicTest.title,
                          questionNumber: firstTopicTest.questionNumber,
                          timeLimit: firstTopicTest.timeLimit,
                      }
                    : null,
            };
        });

        return {
            topics: formattedTopics,
            gradeFirstTest: gradeTest
                ? {
                      id: gradeTest.id,
                      title: gradeTest.title,
                      questionNumber: gradeTest.questionNumber,
                      timeLimit: gradeTest.timeLimit,
                  }
                : null,
        };
    }
}

export const contentService = new ContentService();
