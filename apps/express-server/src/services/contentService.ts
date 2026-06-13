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
import {
    ProgressCounts,
    NodeDetailResponse,
} from "../types/progressTypes";

// Extended section type with progress for tree building
type SectionWithProgress = SectionDto & {
    children: SectionWithProgress[];
    nodes: NodeDto[];
    progress: ProgressCounts | null;
};

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

    async getNodesBySection(sectionId: number): Promise<NodeDto[]> {
        const nodes = await prisma.node.findMany({
            where: { sectionId },
            orderBy: { position: "asc" },
        });
        return nodes.map((n) => ({
            id: n.id,
            position: n.position,
            header: n.header,
            body: n.body,
            imgUrl: n.imgUrl ?? null,
            sectionId: n.sectionId ?? null,
        }));
    }

    async getLessonTree(
        lessonId: number,
        userId?: string | null,
    ): Promise<(LessonWithContentDto & { progress?: ProgressCounts | null }) | null> {
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

        // 2b. Fetch user progress if logged in
        const completedNodeIds = new Set<number>();
        if (userId) {
            const progresses = await prisma.userNodeProgress.findMany({
                where: {
                    userId,
                    nodeId: { in: nodes.map((n) => n.id) },
                    nodeCompletedAt: { not: null },
                },
                select: { nodeId: true },
            });
            for (const p of progresses) completedNodeIds.add(p.nodeId);
        }

        // 3. Reconstruct tree elements using map mapping structures
        const map = new Map<number, SectionWithProgress>();

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
                progress: null,
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
                isComplete: completedNodeIds.has(n.id),
            };
            if (n.sectionId && map.has(n.sectionId)) {
                map.get(n.sectionId)!.nodes!.push(nd);
            }
        }

        const roots: SectionWithProgress[] = [];
        for (const s of map.values()) {
            if (s.parentSectionId == null) {
                roots.push(s);
            } else {
                const parent = map.get(s.parentSectionId);
                if (parent) parent.children!.push(s);
                else roots.push(s);
            }
        }

        // 3b. Calculate progress counts bottom-up if user is logged in
        if (userId) {
            const calcProgress = (section: SectionWithProgress): ProgressCounts => {
                let total = section.nodes.length;
                let completed = section.nodes.filter((n) =>
                    completedNodeIds.has(n.id),
                ).length;

                for (const child of section.children) {
                    const childProgress = calcProgress(child);
                    total += childProgress.totalNodes;
                    completed += childProgress.completedNodes;
                }

                section.progress = { totalNodes: total, completedNodes: completed };
                return section.progress;
            };

            let lessonTotal = 0;
            let lessonCompleted = 0;
            for (const root of roots) {
                const p = calcProgress(root);
                lessonTotal += p.totalNodes;
                lessonCompleted += p.completedNodes;
            }

            return {
                id: lessonData.id,
                name: lessonData.name,
                summary: lessonData.summary ?? null,
                position: lessonData.position,
                topicId: lessonData.topicId,
                videos: lessonData.videos,
                sections: roots,
                progress: { totalNodes: lessonTotal, completedNodes: lessonCompleted },
            };
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
            progress: null,
        };
    }

    async generateMindMapForLesson(lessonId: number): Promise<MindMapNode> {
        const lesson = await prisma.lesson.findUnique({
            where: { id: lessonId },
        });
        if (!lesson) throw new Error("Lesson not found");

        const sections = await prisma.section.findMany({
            where: { lessonId },
            orderBy: { position: "asc" },
        });
        const sectionIds = sections.map((s) => s.id);

        const nodes = await prisma.node.findMany({
            where: { sectionId: { in: sectionIds } },
            orderBy: { position: "asc" },
        });

        // Maps
        const nodeMap = new Map<number, MindMapNode>();
        const sectionMap = new Map<number, MindMapNode>();

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
        const lessonChildren: MindMapNode[] = [];
        for (const s of sections) {
            const secObj = sectionMap.get(s.id);
            if (!secObj) continue;

            if (s.parentSectionId !== null && s.parentSectionId !== undefined) {
                const parentSecObj = sectionMap.get(s.parentSectionId);
                if (parentSecObj) {
                    parentSecObj.children!.push(secObj);
                } else {
                    lessonChildren.push(secObj);
                }
            } else {
                lessonChildren.push(secObj);
            }
        }

        return {
            id: lesson.id,
            type: "lesson",
            name: lesson.name,
            children: lessonChildren,
        };
    }

    async getMindMap(params: {
        gradeId?: number;
        topicId?: number;
        lessonId?: number;
    }): Promise<MindMapNode> {
        const { gradeId, topicId, lessonId } = params;

        if (lessonId !== undefined) {
            const lesson = await prisma.lesson.findUnique({
                where: { id: lessonId },
            });
            if (!lesson) throw new Error("Lesson not found");

            const cachedMindMap = await prisma.mindMap.findUnique({
                where: { lessonId },
            });

            if (cachedMindMap) {
                return cachedMindMap.data as unknown as MindMapNode;
            }

            const generatedTree = await this.generateMindMapForLesson(lessonId);

            await prisma.mindMap.create({
                data: {
                    lessonId,
                    data: generatedTree as any,
                },
            });

            return generatedTree;
        }

        if (topicId !== undefined) {
            const topic = await prisma.topic.findUnique({
                where: { id: topicId },
            });
            if (!topic) throw new Error("Topic not found");

            const lessonsList = await prisma.lesson.findMany({
                where: { topicId },
                orderBy: { position: "asc" },
            });

            const lessonNodes: MindMapNode[] = [];
            for (const l of lessonsList) {
                let lessonMindMap = await prisma.mindMap.findUnique({
                    where: { lessonId: l.id },
                });
                let data: MindMapNode;
                if (lessonMindMap) {
                    data = lessonMindMap.data as unknown as MindMapNode;
                } else {
                    data = await this.generateMindMapForLesson(l.id);
                    await prisma.mindMap.create({
                        data: {
                            lessonId: l.id,
                            data: data as any,
                        },
                    });
                }
                lessonNodes.push(data);
            }

            return {
                id: topic.id,
                type: "topic",
                name: topic.name,
                children: lessonNodes,
            };
        }

        if (gradeId !== undefined) {
            const grade = await prisma.grade.findUnique({
                where: { id: gradeId },
            });
            if (!grade) throw new Error("Grade not found");

            const topicsList = await prisma.topic.findMany({
                where: { gradeId },
                orderBy: { position: "asc" },
            });

            const topicNodes: MindMapNode[] = [];
            for (const t of topicsList) {
                const lessonsList = await prisma.lesson.findMany({
                    where: { topicId: t.id },
                    orderBy: { position: "asc" },
                });

                const lessonNodes: MindMapNode[] = [];
                for (const l of lessonsList) {
                    let lessonMindMap = await prisma.mindMap.findUnique({
                        where: { lessonId: l.id },
                    });
                    let data: MindMapNode;
                    if (lessonMindMap) {
                        data = lessonMindMap.data as unknown as MindMapNode;
                    } else {
                        data = await this.generateMindMapForLesson(l.id);
                        await prisma.mindMap.create({
                            data: {
                                lessonId: l.id,
                                data: data as any,
                            },
                        });
                    }
                    lessonNodes.push(data);
                }

                topicNodes.push({
                    id: t.id,
                    type: "topic",
                    name: t.name,
                    children: lessonNodes,
                });
            }

            return {
                id: grade.id,
                type: "grade",
                name: `Grade ${grade.id}`,
                children: topicNodes,
            };
        }

        throw new Error("Invalid parameters");
    }

    async getGradeStructure(
        gradeId: number,
        userId?: string | null,
    ): Promise<GradeStructureDto & { progress?: ProgressCounts | null }> {
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
                    include: {
                        sections: {
                            select: { id: true },
                        },
                    },
                },
                tests: {
                    where: { topicId: { not: null } },
                    orderBy: { id: "asc" },
                },
            },
        });

        // Collect all sectionIds across the grade to batch-fetch nodes
        const allSectionIds: number[] = [];
        for (const topic of topics) {
            for (const lesson of topic.lessons) {
                for (const section of lesson.sections) {
                    allSectionIds.push(section.id);
                }
            }
        }

        // Batch-fetch all nodes in the grade
        const allNodes = await prisma.node.findMany({
            where: { sectionId: { in: allSectionIds } },
            select: { id: true, sectionId: true },
        });

        // Build sectionId -> nodeIds map
        const sectionNodeMap = new Map<number, number[]>();
        for (const n of allNodes) {
            if (!sectionNodeMap.has(n.sectionId)) {
                sectionNodeMap.set(n.sectionId, []);
            }
            sectionNodeMap.get(n.sectionId)!.push(n.id);
        }

        // Fetch completed node IDs if logged in
        const completedNodeIds = new Set<number>();
        if (userId) {
            const progresses = await prisma.userNodeProgress.findMany({
                where: {
                    userId,
                    nodeId: { in: allNodes.map((n) => n.id) },
                    nodeCompletedAt: { not: null },
                },
                select: { nodeId: true },
            });
            for (const p of progresses) completedNodeIds.add(p.nodeId);
        }

        let gradeTotal = 0;
        let gradeCompleted = 0;

        const formattedTopics: (TopicWithContentsDto & { progress?: ProgressCounts | null })[] = topics.map((topic) => {
            const firstTopicTest = topic.tests[0] || null;

            let topicTotal = 0;
            let topicCompleted = 0;

            const lessonsWithProgress = topic.lessons.map((lesson) => {
                let lessonTotal = 0;
                let lessonCompleted = 0;

                for (const section of lesson.sections) {
                    const nodeIds = sectionNodeMap.get(section.id) ?? [];
                    lessonTotal += nodeIds.length;
                    lessonCompleted += nodeIds.filter((id) =>
                        completedNodeIds.has(id),
                    ).length;
                }

                topicTotal += lessonTotal;
                topicCompleted += lessonCompleted;

                return {
                    id: lesson.id,
                    name: lesson.name,
                    summary: lesson.summary ?? null,
                    position: lesson.position,
                    topicId: lesson.topicId,
                    progress: userId
                        ? { totalNodes: lessonTotal, completedNodes: lessonCompleted }
                        : null,
                };
            });

            gradeTotal += topicTotal;
            gradeCompleted += topicCompleted;

            return {
                id: topic.id,
                name: topic.name,
                position: topic.position,
                gradeId: topic.gradeId,
                lessons: lessonsWithProgress,
                firstTest: firstTopicTest
                    ? {
                          id: firstTopicTest.id,
                          title: firstTopicTest.title,
                          questionNumber: firstTopicTest.questionNumber,
                          timeLimit: firstTopicTest.timeLimit,
                      }
                    : null,
                progress: userId
                    ? { totalNodes: topicTotal, completedNodes: topicCompleted }
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
            progress: userId
                ? { totalNodes: gradeTotal, completedNodes: gradeCompleted }
                : null,
        };
    }

    /**
     * Returns full node detail with video info and whether relevant questions exist.
     */
    async getNodeDetail(
        nodeId: number,
        userId?: string | null,
    ): Promise<NodeDetailResponse | null> {
        const node = await prisma.node.findUnique({
            where: { id: nodeId },
            include: {
                video: {
                    select: {
                        id: true,
                        hlsUrl: true,
                        duration: true,
                    },
                },
            },
        });

        if (!node) return null;

        const questionCount = await prisma.question.count({
            where: { nodeId },
        });

        let isStudied: boolean | null = null;
        let isCompleted: boolean | null = null;

        if (userId) {
            const progress = await prisma.userNodeProgress.findUnique({
                where: { userId_nodeId: { userId, nodeId } },
            });
            isStudied = progress?.studiedAt != null;
            isCompleted = progress?.nodeCompletedAt != null;
        }

        return {
            id: node.id,
            position: node.position,
            header: node.header,
            body: node.body,
            imgUrl: node.imgUrl,
            sectionId: node.sectionId,
            videoId: node.videoId,
            video: node.video
                ? {
                      id: node.video.id,
                      hlsUrl: node.video.hlsUrl,
                      duration: node.video.duration,
                  }
                : null,
            hasRelevantQuestions: questionCount > 0,
            isStudied,
            isCompleted,
        };
    }
}

export const contentService = new ContentService();
