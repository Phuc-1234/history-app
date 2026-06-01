// services/contentService.ts
import { prisma } from "@history-app/shared";
import {
    SectionDto,
    NodeDto,
    LessonDto,
    TopicDto,
    GradeDto,
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

    async getLessonTree(lessonId: number): Promise<SectionDto[]> {
        // Fetch sections and nodes, then assemble tree where nodes are attached to sections
        const [sections, nodes] = await Promise.all([
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
            prisma.node.findMany({
                where: {
                    sectionId: {
                        in: (
                            await prisma.section.findMany({
                                where: { lessonId },
                                select: { id: true },
                            })
                        ).map((s) => s.id),
                    },
                },
                select: {
                    id: true,
                    position: true,
                    header: true,
                    body: true,
                    imgUrl: true,
                    sectionId: true,
                },
            }),
        ]);

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

        return roots;
    }
}

export const contentService = new ContentService();
