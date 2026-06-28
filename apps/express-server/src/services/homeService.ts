// services/homeService.ts
import { prisma } from "@history-app/shared";

export class HomeService {
    /**
     * Lấy tất cả dữ liệu cần thiết cho màn hình Trang chủ trong 1 request.
     * - Top 3 bảng xếp hạng XP
     * - 3 bài học đầu tiên (theo vị trí, từ các topic)
     */
    async getHomeData(userId?: string | null) {
        // Chạy song song để tăng performance
        const [top3Users, recentLessons] = await Promise.all([
            // Top 3 BXH theo XP
            prisma.user.findMany({
                where: { isVerified: true },
                orderBy: { totalXp: "desc" },
                take: 3,
                select: {
                    id: true,
                    name: true,
                    totalXp: true,
                    profileImgUrl: true,
                    tier: { select: { name: true, badgeImgUrl: true } } as any,
                },
            }),
            // 3 bài học đầu tiên của hệ thống
            prisma.lesson.findMany({
                orderBy: [{ topicId: "asc" }, { position: "asc" }],
                take: 3,
                select: {
                    id: true,
                    name: true,
                    summary: true,
                    position: true,
                    topicId: true,
                    topic: {
                        select: {
                            name: true,
                            grade: { select: { id: true } },
                        },
                    },
                },
            }),
        ]);

        // Tiến độ bài học của user (nếu đã đăng nhập)
        let lessonProgressMap: Record<number, { completedNodes: number; totalNodes: number }> = {};

        if (userId) {
            const lessonIds = recentLessons.map((l) => l.id);

            // Lấy tất cả section IDs của các bài học này
            const sections = await prisma.section.findMany({
                where: { lessonId: { in: lessonIds } },
                select: { id: true, lessonId: true },
            });

            const sectionIds = sections.map((s) => s.id);
            const sectionToLesson: Record<number, number> = {};
            for (const s of sections) sectionToLesson[s.id] = s.lessonId;

            // Tổng số node
            const allNodes = await prisma.node.findMany({
                where: { sectionId: { in: sectionIds } },
                select: { id: true, sectionId: true },
            });

            // Node đã hoàn thành
            const completedNodes = await prisma.userNodeProgress.findMany({
                where: {
                    userId,
                    nodeId: { in: allNodes.map((n) => n.id) },
                    nodeCompletedAt: { not: null },
                },
                select: { nodeId: true },
            });
            const completedSet = new Set(completedNodes.map((c) => c.nodeId));

            // Tính tổng và đã xong theo lesson
            for (const node of allNodes) {
                const lessonId = sectionToLesson[node.sectionId];
                if (!lessonId) continue;
                if (!lessonProgressMap[lessonId]) {
                    lessonProgressMap[lessonId] = { completedNodes: 0, totalNodes: 0 };
                }
                lessonProgressMap[lessonId].totalNodes += 1;
                if (completedSet.has(node.id)) {
                    lessonProgressMap[lessonId].completedNodes += 1;
                }
            }
        }

        return {
            leaderboard: top3Users.map((u, idx) => ({
                rank: idx + 1,
                id: u.id,
                name: u.name,
                totalXp: u.totalXp,
                avatarUrl: u.profileImgUrl ?? null,
                tierName: (u as any).tier?.name ?? null,
                badgeImgUrl: (u as any).tier?.badgeImgUrl ?? null,
            })),
            lessons: recentLessons.map((l) => ({
                id: l.id,
                name: l.name,
                summary: l.summary ?? null,
                topicName: (l as any).topic?.name ?? null,
                gradeId: (l as any).topic?.grade?.id ?? null,
                progress: lessonProgressMap[l.id] ?? { completedNodes: 0, totalNodes: 0 },
            })),
        };
    }
}

export const homeService = new HomeService();
