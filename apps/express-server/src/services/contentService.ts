// services/contentService.ts
import { prisma } from "@history-app/shared";
import { Prisma } from "@prisma/client";
import { expandScopeToQuestionWhere } from "./testServiceV2";
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
    testPassed?: boolean | null;
};

export class ContentService {
    async getMasteryPercentage(
        userId: string | null | undefined,
        scopeType: string,
        scopeId: number,
    ): Promise<number | null> {
        if (!userId) return null;

        const where = await expandScopeToQuestionWhere(scopeType, scopeId);
        const questions = await prisma.question.findMany({
            where: { ...where, isActive: true, answerDataJson: { not: Prisma.DbNull } },
            select: { id: true },
        });

        if (questions.length === 0) return null;

        const questionIds = questions.map((q) => q.id);

        const masteries = await prisma.userQuestionMastery.findMany({
            where: {
                userId,
                questionId: { in: questionIds },
            },
            select: { level: true },
        });

        if (masteries.length === 0) return null;

        const totalLevel = masteries.reduce((sum, m) => sum + m.level, 0);
        const maxPossibleLevel = masteries.length * 5;

        return Math.round((totalLevel / maxPossibleLevel) * 100);
    }

    async getAllGrades(userId?: string | null): Promise<GradeDto[]> {
        const grades = await prisma.grade.findMany({
            select: { id: true, state: true, isPro: true, imgUrl: true },
        });
        return Promise.all(
            grades.map(async (g) => ({
                id: g.id,
                state: g.state,
                isPro: g.isPro,
                imgUrl: g.imgUrl,
                masteryPercentage: userId ? await this.getMasteryPercentage(userId, "GRADE", g.id) : null,
            }))
        );
    }

    async getTopicsByGrade(gradeId: number, userId?: string | null): Promise<TopicDto[]> {
        const topics = await prisma.topic.findMany({
            where: { gradeId },
            select: { id: true, name: true, position: true, gradeId: true },
        });
        return Promise.all(
            topics.map(async (t) => ({
                id: t.id,
                name: t.name,
                position: t.position,
                gradeId: t.gradeId,
                masteryPercentage: userId ? await this.getMasteryPercentage(userId, "TOPIC", t.id) : null,
            }))
        );
    }

    async getLessonsByTopic(topicId: number, userId?: string | null): Promise<LessonDto[]> {
        const lessons = await prisma.lesson.findMany({
            where: { topicId },
            select: {
                id: true,
                name: true,
                summary: true,
                position: true,
                topicId: true,
                isPro: true,
                imgUrl: true,
            },
        });
        return Promise.all(
            lessons.map(async (l) => ({
                id: l.id,
                name: l.name,
                summary: l.summary ?? null,
                position: l.position,
                topicId: l.topicId,
                isPro: l.isPro,
                imgUrl: l.imgUrl,
                masteryPercentage: userId ? await this.getMasteryPercentage(userId, "LESSON", l.id) : null,
            }))
        );
    }

    async getSectionsByLesson(lessonId: number, userId?: string | null): Promise<SectionDto[]> {
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

        // Recursively apply mastery percentages
        const applyMastery = async (s: SectionDto) => {
            s.masteryPercentage = userId ? await this.getMasteryPercentage(userId, "SECTION", s.id) : null;
            if (s.children) {
                await Promise.all(s.children.map(applyMastery));
            }
        };

        await Promise.all(roots.map(applyMastery));
        return roots;
    }

    async getNodesBySection(sectionId: number, userId?: string | null): Promise<NodeDto[]> {
        const nodes = await prisma.node.findMany({
            where: { sectionId },
            orderBy: { position: "asc" },
        });
        return Promise.all(
            nodes.map(async (n) => ({
                id: n.id,
                position: n.position,
                header: n.header,
                body: n.body,
                imgUrl: n.imgUrl ?? null,
                videoId: n.videoId ?? null,
                sectionId: n.sectionId ?? null,
                masteryPercentage: userId ? await this.getMasteryPercentage(userId, "NODE", n.id) : null,
            }))
        );
    }

    async getLessonTree(
        lessonId: number,
        userId?: string | null,
    ): Promise<(LessonWithContentDto & { progress?: ProgressCounts | null; testPassed?: boolean | null; masteryPercentage?: number | null }) | null> {
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
                    isPro: true,
                    imgUrl: true,
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
                videoId: true,
                sectionId: true,
            },
            orderBy: { position: "asc" },
        });

        // 2b. Fetch user progress and passed tests if logged in
        const completedNodeIds = new Set<number>();
        const passedScopeKeys = new Set<string>();
        if (userId) {
            const [progresses, passedTests] = await Promise.all([
                prisma.userNodeProgress.findMany({
                    where: {
                        userId,
                        nodeId: { in: nodes.map((n) => n.id) },
                        nodeCompletedAt: { not: null },
                    },
                    select: { nodeId: true },
                }),
                prisma.userTestLog.findMany({
                    where: {
                        userId,
                        isPassed: true,
                        scopeType: { in: ["LESSON", "SECTION"] },
                    },
                    select: { scopeType: true, scopeId: true },
                })
            ]);
            for (const p of progresses) completedNodeIds.add(p.nodeId);
            for (const pt of passedTests) {
                if (pt.scopeType && pt.scopeId != null) {
                    passedScopeKeys.add(`${pt.scopeType}:${pt.scopeId}`);
                }
            }
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
                testPassed: userId ? passedScopeKeys.has(`SECTION:${s.id}`) : false,
                masteryPercentage: null,
            });
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

        // Calculate mastery percentages for nodes, top-level sections (roots), and lesson
        const nodeMasteryMap = new Map<number, number | null>();
        const sectionMasteryMap = new Map<number, number | null>();
        let lessonMastery: number | null = null;

        if (userId) {
            const nodeIds = nodes.map(n => n.id);
            const rootIds = roots.map(r => r.id);

            const [nodeMasteries, sectionMasteries, lMastery] = await Promise.all([
                Promise.all(nodeIds.map(id => this.getMasteryPercentage(userId, "NODE", id))),
                Promise.all(rootIds.map(id => this.getMasteryPercentage(userId, "SECTION", id))),
                this.getMasteryPercentage(userId, "LESSON", lessonId)
            ]);

            nodeIds.forEach((id, i) => nodeMasteryMap.set(id, nodeMasteries[i]));
            rootIds.forEach((id, i) => sectionMasteryMap.set(id, sectionMasteries[i]));
            lessonMastery = lMastery;
        }

        for (const n of nodes) {
            const nd: NodeDto = {
                id: n.id,
                position: n.position,
                header: n.header,
                body: n.body,
                imgUrl: n.imgUrl ?? null,
                videoId: n.videoId ?? null,
                sectionId: n.sectionId ?? null,
                isComplete: completedNodeIds.has(n.id),
                masteryPercentage: nodeMasteryMap.get(n.id) ?? null,
            };
            if (n.sectionId && map.has(n.sectionId)) {
                map.get(n.sectionId)!.nodes!.push(nd);
            }
        }

        for (const s of roots) {
            s.masteryPercentage = sectionMasteryMap.get(s.id) ?? null;
        }

        // 3b. Calculate progress counts bottom-up
        const calcProgress = (section: SectionWithProgress): ProgressCounts => {
            let total = section.nodes.length;
            let completed = section.nodes.filter((n) =>
                completedNodeIds.has(n.id),
            ).length;

            // Include section test if it's a top-level section
            if (section.parentSectionId === null) {
                total += 1;
                if (userId && passedScopeKeys.has(`SECTION:${section.id}`)) {
                    completed += 1;
                }
            }

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

        // Include lesson test
        lessonTotal += 1;
        const lessonTestPassed = userId ? passedScopeKeys.has(`LESSON:${lessonId}`) : false;
        if (lessonTestPassed) {
            lessonCompleted += 1;
        }

        return {
            id: lessonData.id,
            name: lessonData.name,
            summary: lessonData.summary ?? null,
            position: lessonData.position,
            topicId: lessonData.topicId,
            isPro: lessonData.isPro,
            imgUrl: lessonData.imgUrl,
            videos: lessonData.videos,
            sections: roots,
            progress: { totalNodes: lessonTotal, completedNodes: lessonCompleted },
            testPassed: lessonTestPassed,
            masteryPercentage: lessonMastery,
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
                const rawData = cachedMindMap.data as any;
                if (rawData && Array.isArray(rawData.sections)) {
                    return convertSectionsToMindMapNode(lessonId, lesson.name, rawData.sections);
                }
                return rawData as unknown as MindMapNode;
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
    ): Promise<GradeStructureDto & { progress?: ProgressCounts | null; masteryPercentage?: number | null; wrongQuestionCount?: number; answeredQuestionCount?: number }> {
        const topics = await prisma.topic.findMany({
            where: { gradeId },
            orderBy: { position: "asc" },
            include: {
                lessons: {
                    orderBy: { position: "asc" },
                    include: {
                        sections: {
                            select: { id: true, parentSectionId: true },
                        },
                    },
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

        // BATCH-FETCH ALL NODES IN THE GRADE
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

        // Fetch completed node IDs and passed tests if logged in
        const completedNodeIds = new Set<number>();
        const passedTestIds = new Set<string>();
        const passedScopeKeys = new Set<string>(); // "SECTION:5", "LESSON:3", etc.
        if (userId) {
            const [progresses, passedTests] = await Promise.all([
                prisma.userNodeProgress.findMany({
                    where: {
                        userId,
                        nodeId: { in: allNodes.map((n) => n.id) },
                        nodeCompletedAt: { not: null },
                    },
                    select: { nodeId: true },
                }),
                prisma.userTestLog.findMany({
                    where: {
                        userId,
                        isPassed: true,
                    },
                    select: { testId: true, scopeType: true, scopeId: true },
                }),
            ]);

            for (const p of progresses) completedNodeIds.add(p.nodeId);
            for (const pt of passedTests) {
                if (pt.testId) passedTestIds.add(pt.testId);
                if (pt.scopeType && pt.scopeId != null) {
                    passedScopeKeys.add(`${pt.scopeType}:${pt.scopeId}`);
                }
            }
        }

        let gradeTotal = 0;
        let gradeCompleted = 0;

        const formattedTopics = await Promise.all(
            topics.map(async (topic) => {
                let topicTotal = 0;
                let topicCompleted = 0;

                const lessonsWithProgress = await Promise.all(
                    topic.lessons.map(async (lesson) => {
                        let lessonTotal = 0;
                        let lessonCompleted = 0;

                        for (const section of lesson.sections) {
                            const nodeIds = sectionNodeMap.get(section.id) ?? [];
                            lessonTotal += nodeIds.length;
                            lessonCompleted += nodeIds.filter((id) =>
                                completedNodeIds.has(id),
                            ).length;

                            // Include section-level test if it's a top-level section
                            if (section.parentSectionId === null) {
                                lessonTotal += 1;
                                if (userId && passedScopeKeys.has(`SECTION:${section.id}`)) {
                                    lessonCompleted += 1;
                                }
                            }
                        }

                        // Lesson test as progress unit
                        const lessonTestPassed = passedScopeKeys.has(`LESSON:${lesson.id}`);
                        lessonTotal += 1;
                        if (userId && lessonTestPassed) {
                            lessonCompleted += 1;
                        }

                        topicTotal += lessonTotal;
                        topicCompleted += lessonCompleted;

                        const lessonMastery = userId ? await this.getMasteryPercentage(userId, "LESSON", lesson.id) : null;

                        return {
                            id: lesson.id,
                            name: lesson.name,
                            summary: lesson.summary ?? null,
                            position: lesson.position,
                            topicId: lesson.topicId,
                            isPro: lesson.isPro,
                            progress: { totalNodes: lessonTotal, completedNodes: lessonCompleted },
                            testPassed: userId ? lessonTestPassed : null,
                            masteryPercentage: lessonMastery,
                        };
                    })
                );

                // Topic test as progress unit
                const topicTestPassed = passedScopeKeys.has(`TOPIC:${topic.id}`);
                topicTotal += 1;
                if (userId && topicTestPassed) {
                    topicCompleted += 1;
                }

                gradeTotal += topicTotal;
                gradeCompleted += topicCompleted;

                const topicMastery = userId ? await this.getMasteryPercentage(userId, "TOPIC", topic.id) : null;

                return {
                    id: topic.id,
                    name: topic.name,
                    position: topic.position,
                    gradeId: topic.gradeId,
                    lessons: lessonsWithProgress,
                    testPassed: userId ? topicTestPassed : null,
                    progress: { totalNodes: topicTotal, completedNodes: topicCompleted },
                    masteryPercentage: topicMastery,
                };
            })
        );

        // Grade test as progress unit
        const gradeTestPassed = passedScopeKeys.has(`GRADE:${gradeId}`);
        gradeTotal += 1;
        if (userId && gradeTestPassed) {
            gradeCompleted += 1;
        }

        const gradeMastery = userId ? await this.getMasteryPercentage(userId, "GRADE", gradeId) : null;

        const wrongQuestionCount = userId ? await prisma.userQuestionMastery.count({
            where: {
                userId,
                consecutiveCorrect: 0,
                question: {
                    gradeId,
                    isActive: true,
                    answerDataJson: { not: Prisma.DbNull }
                }
            }
        }) : 0;

        const answeredQuestionCount = userId ? await prisma.userQuestionMastery.count({
            where: {
                userId,
                question: {
                    gradeId,
                    isActive: true,
                    answerDataJson: { not: Prisma.DbNull }
                }
            }
        }) : 0;

        return {
            topics: formattedTopics,
            testPassed: userId ? gradeTestPassed : null,
            progress: { totalNodes: gradeTotal, completedNodes: gradeCompleted },
            masteryPercentage: gradeMastery,
            wrongQuestionCount,
            answeredQuestionCount,
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

    /**
     * Helper to verify if the user can access a PRO-locked Grade, Lesson, or Node.
     * Admins and Super Admins always have access.
     */
    async checkProAccess(
        userId: string | null,
        scopeType: "GRADE" | "LESSON" | "NODE",
        scopeId: number,
    ): Promise<boolean> {
        let isUserPro = false;
        if (userId) {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { isPro: true, proExpiresAt: true, role: true },
            });
            if (user?.role === "ADMIN" || user?.role === "SUPER_ADMIN") {
                return true;
            }
            isUserPro = user?.isPro === true && (!user.proExpiresAt || new Date(user.proExpiresAt) > new Date());
        }

        if (scopeType === "GRADE") {
            const grade = await prisma.grade.findUnique({
                where: { id: scopeId },
                select: { isPro: true },
            });
            if (grade?.isPro && !isUserPro) {
                return false;
            }
        } else if (scopeType === "LESSON") {
            const lesson = await prisma.lesson.findUnique({
                where: { id: scopeId },
                select: { isPro: true, topic: { select: { grade: { select: { isPro: true } } } } },
            });
            const lessonIsPro = lesson?.isPro || (lesson as any)?.topic?.grade?.isPro;
            if (lessonIsPro && !isUserPro) {
                return false;
            }
        } else if (scopeType === "NODE") {
            const node = await prisma.node.findUnique({
                where: { id: scopeId },
                select: {
                    section: {
                        select: {
                            lesson: {
                                select: {
                                    isPro: true,
                                    topic: {
                                        select: {
                                            grade: {
                                                select: {
                                                    isPro: true,
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            });
            const nodeIsPro = (node as any)?.section?.lesson?.isPro || (node as any)?.section?.lesson?.topic?.grade?.isPro;
            if (nodeIsPro && !isUserPro) {
                return false;
            }
        }

        return true;
    }


}

function convertSectionsToMindMapNode(lessonId: number, lessonName: string, sections: any[]): MindMapNode {
    let idCounter = Date.now();
    const walkSection = (s: any): MindMapNode => {
        const children: MindMapNode[] = [];
        if (s.nodes && Array.isArray(s.nodes)) {
            for (const n of s.nodes) {
                children.push({
                    id: n.id || idCounter++,
                    type: "node",
                    header: n.header || null,
                    body: n.body || "",
                });
            }
        }
        if (s.children && Array.isArray(s.children)) {
            for (const child of s.children) {
                children.push(walkSection(child));
            }
        }
        return {
            id: s.id || idCounter++,
            type: "section",
            name: s.name,
            children,
        };
    };

    return {
        id: lessonId,
        type: "lesson",
        name: lessonName,
        children: sections.map(walkSection),
    };
}

export const contentService = new ContentService();
