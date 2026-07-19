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
        const [top3Users, allLessons] = await Promise.all([
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
                    userEquippedItems: {
                        where: { equipmentSlot: "AVT_FRAME" },
                        select: {
                            itemDefinition: {
                                select: { imgUrl: true }
                            }
                        }
                    }
                },
            }),
            // Tất cả bài học kèm topic, grade và sections -> nodes
            prisma.lesson.findMany({
                orderBy: [{ topicId: "asc" }, { position: "asc" }],
                select: {
                    id: true,
                    name: true,
                    summary: true,
                    position: true,
                    topicId: true,
                    topic: {
                        select: {
                            name: true,
                            position: true,
                            gradeId: true,
                        },
                    },
                    sections: {
                        select: {
                            nodes: {
                                select: { id: true },
                            },
                        },
                    },
                },
            }),
        ]);

        // Gom danh sách node IDs theo bài học
        const allNodeIds: number[] = [];
        const lessonNodeMap = new Map<number, number[]>();

        for (const l of allLessons) {
            const nodeIds: number[] = [];
            for (const sec of l.sections) {
                for (const node of sec.nodes) {
                    nodeIds.push(node.id);
                    allNodeIds.push(node.id);
                }
            }
            lessonNodeMap.set(l.id, nodeIds);
        }

        // Lấy node đã hoàn thành của user (nếu đã đăng nhập)
        const completedNodeSet = new Set<number>();
        if (userId && allNodeIds.length > 0) {
            const completedNodes = await prisma.userNodeProgress.findMany({
                where: {
                    userId,
                    nodeId: { in: allNodeIds },
                    nodeCompletedAt: { not: null },
                },
                select: { nodeId: true },
            });
            for (const c of completedNodes) {
                completedNodeSet.add(c.nodeId);
            }
        }

        // Tính tiến độ của từng bài học
        const lessonProgressList = allLessons.map((l) => {
            const nodeIds = lessonNodeMap.get(l.id) ?? [];
            const totalNodes = nodeIds.length;
            const completedNodes = nodeIds.filter((id) => completedNodeSet.has(id)).length;
            const percentage = totalNodes > 0 ? completedNodes / totalNodes : 0;
            return {
                lesson: l,
                totalNodes,
                completedNodes,
                percentage,
            };
        });

        // Lọc các bài học chưa hoàn thành 100% (completedNodes < totalNodes)
        let eligibleLessons = lessonProgressList.filter(
            (item) => item.totalNodes === 0 || item.completedNodes < item.totalNodes
        );

        if (eligibleLessons.length === 0) {
            eligibleLessons = lessonProgressList;
        }

        // Sắp xếp theo % hoàn thành giảm dần (ưu tiên bài học đang học dở có % cao nhất)
        eligibleLessons.sort((a, b) => {
            if (b.percentage !== a.percentage) {
                return b.percentage - a.percentage;
            }
            if (b.completedNodes !== a.completedNodes) {
                return b.completedNodes - a.completedNodes;
            }
            if (a.lesson.topic.gradeId !== b.lesson.topic.gradeId) {
                return a.lesson.topic.gradeId - b.lesson.topic.gradeId;
            }
            if (a.lesson.topic.position !== b.lesson.topic.position) {
                return a.lesson.topic.position - b.lesson.topic.position;
            }
            return a.lesson.position - b.lesson.position;
        });

        const selectedLessons = eligibleLessons.slice(0, 3);

        return {
            leaderboard: top3Users.map((u, idx) => ({
                rank: idx + 1,
                id: u.id,
                name: u.name,
                totalXp: u.totalXp,
                avatarUrl: u.profileImgUrl ?? null,
                equippedFrameUrl: u.userEquippedItems?.[0]?.itemDefinition?.imgUrl ?? null,
                tierName: (u as any).tier?.name ?? null,
                badgeImgUrl: (u as any).tier?.badgeImgUrl ?? null,
            })),
            lessons: selectedLessons.map((item) => ({
                id: item.lesson.id,
                name: item.lesson.name,
                summary: item.lesson.summary ?? null,
                topicName: item.lesson.topic?.name ?? null,
                gradeId: item.lesson.topic?.gradeId ?? null,
                progress: {
                    completedNodes: item.completedNodes,
                    totalNodes: item.totalNodes,
                },
            })),
        };
    }
}

export const homeService = new HomeService();
