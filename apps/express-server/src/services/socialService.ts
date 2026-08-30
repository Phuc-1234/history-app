import { prisma } from "@history-app/shared";
import { Prisma } from "@prisma/client";
import { pushNotificationService } from "./pushNotificationService";

const db = prisma as any;

type RelationStatus =
    | "self"
    | "friend"
    | "incoming_request"
    | "outgoing_request"
    | "none";

/**
 * Bộ lọc cho màn tìm bạn social.
 * - `all`: tất cả user (sắp xếp theo XP).
 * - `mutual`: bạn của bạn bè (có bạn chung với mình).
 * - `learning`: học cùng khối lớp (cùng gradeId dựa trên node đã học).
 * - `recent`: hoạt động gần đây (theo studied_at của node progress).
 */
export type SocialSearchFilter = "all" | "mutual" | "learning" | "recent";

/** Giới hạn an hạn cho raw SQL LIMIT để tránh injection/over-fetch. */
function safeRawLimit(value: number, fallback = 80, max = 400): number {
    const n = Math.floor(Number(value) || fallback);
    return Math.min(Math.max(n, 1), max);
}

const userSelect = {
    id: true,
    name: true,
    email: true,
    profileImgUrl: true,
    totalXp: true,
    currentStreak: true,
    lastXpGainedAt: true,
    isHidden: true,
    allowFollow: true,
    allowFriendRequest: true,
    tier: {
        select: {
            name: true,
            badgeImgUrl: true,
        },
    },
    userEquippedItems: {
        where: { equipmentSlot: "AVT_FRAME" },
        include: { itemDefinition: true },
    },
};

function getVnDateString(date: Date = new Date()): string {
    const d = new Date(date);
    const vnTime = new Date(d.getTime() + 7 * 60 * 60 * 1000);
    return vnTime.toISOString().split("T")[0];
}

function normalizeFriendPair(userId: string, friendId: string) {
    return userId < friendId
        ? { userId, friendId }
        : { userId: friendId, friendId: userId };
}

function publicUser(user: any) {
    const todayStr = getVnDateString(new Date());
    const lastXpStr = user.lastXpGainedAt ? getVnDateString(user.lastXpGainedAt) : null;
    const hasCompletedToday = lastXpStr === todayStr;

    return {
        id: user.id,
        name: user.name,
        email: user.email,
        profileImgUrl: user.profileImgUrl ?? null,
        totalXp: user.totalXp ?? 0,
        currentStreak: user.currentStreak ?? 0,
        hasCompletedToday,
        tierName: user.tier?.name ?? null,
        badgeImgUrl: user.tier?.badgeImgUrl ?? null,
        isHidden: user.isHidden ?? false,
        allowFollow: user.allowFollow ?? true,
        allowFriendRequest: user.allowFriendRequest ?? true,
        equippedFrameUrl: user.userEquippedItems && user.userEquippedItems.length > 0
            ? user.userEquippedItems[0].itemDefinition?.imgUrl ?? null
            : null,
    };
}

function requestDto(request: any) {
    const peer = request.sender ?? request.receiver;
    return {
        id: request.id,
        status: request.status,
        createdAt: request.createdAt,
        updatedAt: request.updatedAt,
        senderId: request.senderId,
        receiverId: request.receiverId,
        user: peer ? publicUser(peer) : null,
    };
}

export class SocialService {
    async searchUsers(
        currentUserId: string,
        query = "",
        limit = 20,
        filter: SocialSearchFilter = "all",
    ) {
        const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 50);
        const trimmedQuery = query.trim();

        // Lấy trước tập ID user thoả mãn filter (có thể rỗng = tất cả).
        const filteredIds = await this.collectFilteredUserIds(
            currentUserId,
            filter,
            trimmedQuery,
            safeLimit,
        );

        const users = await db.user.findMany({
            where: {
                id: { not: currentUserId },
                isHidden: false,
                ...(trimmedQuery
                    ? {
                        OR: [
                            { name: { contains: trimmedQuery, mode: "insensitive" } },
                            { email: { contains: trimmedQuery, mode: "insensitive" } },
                        ],
                    }
                    : {}),
                ...(filteredIds ? { id: { in: filteredIds } } : {}),
            },
            select: userSelect,
            orderBy: [{ totalXp: "desc" }, { name: "asc" }],
            take: safeLimit,
        });

        if (users.length === 0) return [];

        const userIds = users.map((u: any) => u.id);

        // Bulk-load mọi quan hệ 1 lần thay vì N+1:
        // - friends của mình (1 query)
        // - bạn bè của tất cả user trong kết quả (1 query bằng raw UNION)
        // - follow của mình tới các user đó (1 query)
        // - friend request pending 2 chiều (1 query)
        const [myFriendSet, theirFriendMap, myFollowSet, pendingMap] =
            await Promise.all([
                this.getRawFriendIdSet(currentUserId),
                this.bulkFriendIdSets(userIds),
                this.getRawFollowingIdSet(currentUserId, userIds),
                this.bulkPendingRequestMap(currentUserId, userIds),
            ]);

        return users.map((user: any) => {
            const theirFriends = theirFriendMap.get(user.id) ?? new Set<string>();
            // Đếm intersection giữa 2 tập bạn bè (đã có sẵn trong bộ nhớ).
            let mutualCount = 0;
            for (const fid of myFriendSet) {
                if (theirFriends.has(fid)) mutualCount++;
            }
            const isFriend = myFriendSet.has(user.id);
            const pending = pendingMap.get(user.id);
            const relationStatus: RelationStatus = isFriend
                ? "friend"
                : pending === "out"
                  ? "outgoing_request"
                  : pending === "in"
                    ? "incoming_request"
                    : "none";
            return {
                ...publicUser(user),
                relationStatus,
                isFollowing: myFollowSet.has(user.id),
                mutualFriends: mutualCount,
            };
        });
    }

    /**
     * Tập hợp ID của các user thoả mãn `filter`.
     * Trả về:
     * - `null`: không cần lọc (lấy tất cả).
     * - `string[]`: ràng buộc WHERE id IN (...).
     *
     * Tách riêng để dễ test và tránh trộn query builder phức tạp.
     */
    private async collectFilteredUserIds(
        currentUserId: string,
        filter: SocialSearchFilter,
        query: string,
        limit: number,
    ): Promise<string[] | null> {
        if (filter === "all") return null;

        if (filter === "mutual") {
            // Lấy ID bạn bè của mình
            const myFriends = await this.getRawFriendIds(currentUserId);
            if (myFriends.length === 0) return [];

            // Lấy ID bạn của bạn bè đó, trừ chính mình và trừ bạn bè trực tiếp.
            // Dùng LIMIT trong SQL để tránh fetch toàn bộ before slice trong JS.
            const myFriendSet = new Set(myFriends);
            const sqlLimit = safeRawLimit(limit, 80, 400);
            const rows: any[] = await db.$queryRaw`
                SELECT id FROM (
                    SELECT "friend_id" AS id
                    FROM friendships
                    WHERE "user_id" IN (${Prisma.join(myFriends)})
                    UNION
                    SELECT "user_id" AS id
                    FROM friendships
                    WHERE "friend_id" IN (${Prisma.join(myFriends)})
                ) AS combined
                LIMIT ${sqlLimit}
            `;
            const ids = new Set<string>();
            for (const r of rows) {
                const id = String(r.id);
                if (
                    id &&
                    id !== currentUserId &&
                    !myFriendSet.has(id)
                ) {
                    ids.add(id);
                }
            }
            return Array.from(ids);
        }

        if (filter === "learning") {
            // Học cùng khối lớp: cùng gradeId phổ biến nhất của mình.
            const myGrade = await this.getPrimaryGradeId(currentUserId);
            if (!myGrade) return [];

            const rawLimit = safeRawLimit(limit);
            const rows: any[] = await db.$queryRaw`
                SELECT DISTINCT u.id
                FROM users u
                JOIN user_node_progress unp ON u.id = unp.user_id
                JOIN nodes n ON n.id = unp.node_id
                JOIN sections s ON n.section_id = s.id
                JOIN lessons l ON s.lesson_id = l.id
                JOIN topics t ON l.topic_id = t.id
                WHERE u.is_hidden = false
                  AND u.is_private = false
                  AND u.id <> ${currentUserId}
                  AND t.grade_id = ${myGrade}
                LIMIT ${rawLimit}
            `;
            return rows.map((r) => String(r.id));
        }

        if (filter === "recent") {
            // Người có hoạt động học gần đây theo studied_at.
            // Phải GROUP BY u.id vì dùng aggregate MAX() trong ORDER BY —
            // nếu không sẽ lỗi "column must appear in GROUP BY" ở PostgreSQL.
            const rawLimit = safeRawLimit(limit);
            const rows: any[] = await db.$queryRaw`
                SELECT u.id
                FROM users u
                JOIN user_node_progress unp ON u.id = unp.user_id
                WHERE u.is_hidden = false
                  AND u.is_private = false
                  AND u.id <> ${currentUserId}
                  AND unp.studied_at IS NOT NULL
                GROUP BY u.id
                ORDER BY MAX(unp.studied_at) DESC
                LIMIT ${rawLimit}
            `;
            return rows.map((r) => String(r.id));
        }

        return null;
    }

    async getUserProfile(currentUserId: string, targetUserId: string) {
        const user = await db.user.findUnique({
            where: { id: targetUserId },
            select: userSelect,
        });

        if (!user || user.isHidden) {
            throw Object.assign(new Error("User not found."), { statusCode: 404 });
        }

        const [friendCount, followerCount, followingCount, relationStatus, isFollowing] =
            await Promise.all([
                this.getFriendCount(targetUserId),
                db.follow.count({ where: { followingId: targetUserId } }),
                db.follow.count({ where: { followerId: targetUserId } }),
                this.getRelationStatus(currentUserId, targetUserId),
                this.isFollowing(currentUserId, targetUserId),
            ]);

        return {
            ...publicUser(user),
            stats: {
                friends: friendCount,
                followers: followerCount,
                following: followingCount,
            },
            relationStatus,
            isFollowing,
        };
    }

    async sendFriendRequest(senderId: string, receiverId: string) {
        if (senderId === receiverId) {
            throw Object.assign(new Error("Cannot send friend request to yourself."), {
                statusCode: 400,
            });
        }

        const receiver = await db.user.findUnique({
            where: { id: receiverId },
            select: {
                id: true,
                isHidden: true,
                allowFriendRequest: true,
            },
        });

        if (!receiver || receiver.isHidden) {
            throw Object.assign(new Error("Receiver not found."), { statusCode: 404 });
        }

        if (!receiver.allowFriendRequest) {
            throw Object.assign(new Error("This user does not allow friend requests."), {
                statusCode: 403,
            });
        }

        if (await this.areFriends(senderId, receiverId)) {
            throw Object.assign(new Error("Users are already friends."), {
                statusCode: 409,
            });
        }

        const reversePending = await db.friendRequest.findFirst({
            where: {
                senderId: receiverId,
                receiverId: senderId,
                status: "PENDING",
            },
        });

        if (reversePending) {
            throw Object.assign(new Error("This user already sent you a pending request."), {
                statusCode: 409,
            });
        }

        const existing = await db.friendRequest.findUnique({
            where: {
                senderId_receiverId: {
                    senderId,
                    receiverId,
                },
            },
        });

        if (existing?.status === "PENDING") {
            throw Object.assign(new Error("Friend request already pending."), {
                statusCode: 409,
            });
        }

        const request = existing
            ? await db.friendRequest.update({
                where: { id: existing.id },
                data: { status: "PENDING" },
                include: { receiver: { select: userSelect } },
            })
            : await db.friendRequest.create({
                data: { senderId, receiverId },
                include: { receiver: { select: userSelect } },
            });

        // Create notification for the receiver
        try {
            const sender = await db.user.findUnique({
                where: { id: senderId },
                select: { name: true },
            });
            const senderName = sender?.name || "Một người dùng";
            const title = "Lời mời kết bạn mới";
            const body = `${senderName} đã gửi cho bạn một lời mời kết bạn.`;
            await db.notification.create({
                data: {
                    userId: receiverId,
                    senderId: senderId,
                    targetId: request.id,
                    type: "FRIEND_REQUEST",
                    title,
                    body,
                },
            });
            await pushNotificationService.sendToUser(receiverId, title, body, { type: "FRIEND_REQUEST" });
        } catch (error) {
            console.error("Failed to create FRIEND_REQUEST notification:", error);
        }

        return requestDto(request);
    }

    async acceptFriendRequest(currentUserId: string, requestId: string) {
        const request = await db.friendRequest.findUnique({ where: { id: requestId } });

        if (!request) {
            throw Object.assign(new Error("Friend request not found."), { statusCode: 404 });
        }
        if (request.receiverId !== currentUserId) {
            throw Object.assign(new Error("Only the receiver can accept this request."), {
                statusCode: 403,
            });
        }
        if (request.status !== "PENDING") {
            throw Object.assign(new Error("Friend request is not pending."), {
                statusCode: 409,
            });
        }

        const pair = normalizeFriendPair(request.senderId, request.receiverId);

        const receiver = await db.user.findUnique({
            where: { id: currentUserId },
            select: { name: true },
        });
        const receiverName = receiver?.name || "Một người dùng";
        const title = "Chấp nhận lời mời kết bạn";
        const body = `${receiverName} đã chấp nhận lời mời kết bạn của bạn.`;

        await db.$transaction([
            db.friendship.upsert({
                where: { userId_friendId: pair },
                update: {},
                create: pair,
            }),
            db.friendRequest.update({
                where: { id: requestId },
                data: { status: "ACCEPTED" },
            }),
            db.notification.create({
                data: {
                    userId: request.senderId,
                    senderId: currentUserId,
                    targetId: requestId,
                    type: "FRIEND_ACCEPT",
                    title,
                    body,
                },
            }),
        ]);

        await pushNotificationService.sendToUser(request.senderId, title, body, { type: "FRIEND_ACCEPT" });

        return { message: "Friend request accepted." };
    }

    async rejectFriendRequest(currentUserId: string, requestId: string) {
        const request = await db.friendRequest.findUnique({ where: { id: requestId } });

        if (!request) {
            throw Object.assign(new Error("Friend request not found."), { statusCode: 404 });
        }
        if (request.receiverId !== currentUserId) {
            throw Object.assign(new Error("Only the receiver can reject this request."), {
                statusCode: 403,
            });
        }
        if (request.status !== "PENDING") {
            throw Object.assign(new Error("Friend request is not pending."), {
                statusCode: 409,
            });
        }

        await db.friendRequest.update({
            where: { id: requestId },
            data: { status: "REJECTED" },
        });

        return { message: "Friend request rejected." };
    }

    async cancelFriendRequest(currentUserId: string, requestId: string) {
        const request = await db.friendRequest.findUnique({ where: { id: requestId } });

        if (!request) {
            throw Object.assign(new Error("Friend request not found."), { statusCode: 404 });
        }
        if (request.senderId !== currentUserId) {
            throw Object.assign(new Error("Only the sender can cancel this request."), {
                statusCode: 403,
            });
        }
        if (request.status !== "PENDING") {
            throw Object.assign(new Error("Friend request is not pending."), {
                statusCode: 409,
            });
        }

        await db.friendRequest.update({
            where: { id: requestId },
            data: { status: "CANCELLED" },
        });

        return { message: "Friend request cancelled." };
    }

    async removeFriend(currentUserId: string, friendId: string) {
        if (currentUserId === friendId) {
            throw Object.assign(new Error("Cannot unfriend yourself."), { statusCode: 400 });
        }

        const pair = normalizeFriendPair(currentUserId, friendId);
        const result = await db.friendship.deleteMany({ where: pair });

        if (result.count === 0) {
            throw Object.assign(new Error("Friendship not found."), { statusCode: 404 });
        }

        return { message: "Friend removed." };
    }

    async getFriends(currentUserId: string) {
        const rows = await db.friendship.findMany({
            where: {
                OR: [{ userId: currentUserId }, { friendId: currentUserId }],
            },
            include: {
                user: { select: userSelect },
                friend: { select: userSelect },
            },
            orderBy: { createdAt: "desc" },
        });

        return rows.map((row: any) => {
            const peer = row.userId === currentUserId ? row.friend : row.user;
            return {
                friendshipId: row.id,
                createdAt: row.createdAt,
                user: publicUser(peer),
            };
        });
    }

    async getIncomingRequests(currentUserId: string) {
        const requests = await db.friendRequest.findMany({
            where: { receiverId: currentUserId, status: "PENDING" },
            include: { sender: { select: userSelect } },
            orderBy: { createdAt: "desc" },
        });
        return requests.map(requestDto);
    }

    async getOutgoingRequests(currentUserId: string) {
        const requests = await db.friendRequest.findMany({
            where: { senderId: currentUserId, status: "PENDING" },
            include: { receiver: { select: userSelect } },
            orderBy: { createdAt: "desc" },
        });
        return requests.map(requestDto);
    }

    async followUser(followerId: string, followingId: string) {
        if (followerId === followingId) {
            throw Object.assign(new Error("Cannot follow yourself."), { statusCode: 400 });
        }

        const target = await db.user.findUnique({
            where: { id: followingId },
            select: {
                id: true,
                isHidden: true,
                allowFollow: true,
            },
        });

        if (!target || target.isHidden) {
            throw Object.assign(new Error("User not found."), { statusCode: 404 });
        }
        if (!target.allowFollow || target.isHidden) {
            throw Object.assign(new Error("This user does not allow direct follows."), {
                statusCode: 403,
            });
        }

        await db.follow.upsert({
            where: {
                followerId_followingId: {
                    followerId,
                    followingId,
                },
            },
            update: {},
            create: { followerId, followingId },
        });

        return { message: "Followed user." };
    }

    async unfollowUser(followerId: string, followingId: string) {
        if (followerId === followingId) {
            throw Object.assign(new Error("Cannot unfollow yourself."), { statusCode: 400 });
        }

        await db.follow.deleteMany({
            where: {
                followerId,
                followingId,
            },
        });

        return { message: "Unfollowed user." };
    }

    async getFollowers(userId: string) {
        await this.ensureVisibleUser(userId);
        const rows = await db.follow.findMany({
            where: { followingId: userId },
            include: { follower: { select: userSelect } },
            orderBy: { createdAt: "desc" },
        });
        return rows.map((row: any) => ({
            followId: row.id,
            createdAt: row.createdAt,
            user: publicUser(row.follower),
        }));
    }

    async getFollowing(userId: string) {
        await this.ensureVisibleUser(userId);
        const rows = await db.follow.findMany({
            where: { followerId: userId },
            include: { following: { select: userSelect } },
            orderBy: { createdAt: "desc" },
        });
        return rows.map((row: any) => ({
            followId: row.id,
            createdAt: row.createdAt,
            user: publicUser(row.following),
        }));
    }

    private async ensureVisibleUser(userId: string) {
        const user = await db.user.findUnique({
            where: { id: userId },
            select: { id: true, isHidden: true },
        });
        if (!user || user.isHidden) {
            throw Object.assign(new Error("User not found."), { statusCode: 404 });
        }
    }

    /**
     * Lấy danh sách ID bạn bè trực tiếp của một user.
     * Vì Friendship dùng cặp (userId, friendId) không đối xứng nên phải UNION 2 phía.
     */
    private async getRawFriendIds(userId: string): Promise<string[]> {
        const rows = await db.friendship.findMany({
            where: { OR: [{ userId }, { friendId: userId }] },
            select: { userId: true, friendId: true },
        });
        const ids = new Set<string>();
        for (const r of rows) {
            if (r.userId !== userId) ids.add(r.userId);
            if (r.friendId !== userId) ids.add(r.friendId);
        }
        return Array.from(ids);
    }

    /** Giống `getRawFriendIds` nhưng trả về Set để tra cứu O(1). */
    private async getRawFriendIdSet(userId: string): Promise<Set<string>> {
        const ids = await this.getRawFriendIds(userId);
        return new Set(ids);
    }

    /**
     * Bulk-load tập bạn bè của nhiều user cùng lúc → tránh N+1.
     * Trả về Map<userId, Set<friendIds>>.
     */
    private async bulkFriendIdSets(
        userIds: string[],
    ): Promise<Map<string, Set<string>>> {
        if (userIds.length === 0) return new Map();
        // Một user có thể xuất hiện ở cột userId HOẶC friendId,
        // nên phải query cả 2 phía rồi gộp.
        const rows: any[] = await db.friendship.findMany({
            where: {
                OR: [
                    { userId: { in: userIds } },
                    { friendId: { in: userIds } },
                ],
            },
            select: { userId: true, friendId: true },
        });
        const result = new Map<string, Set<string>>();
        for (const id of userIds) result.set(id, new Set<string>());
        for (const r of rows) {
            // Nếu r.userId thuộc danh sách → bạn của nó là r.friendId
            result.get(r.userId)?.add(r.friendId);
            // Nếu r.friendId thuộc danh sách → bạn của nó là r.userId
            result.get(r.friendId)?.add(r.userId);
        }
        return result;
    }

    /**
     * Bulk-load tập user mà currentUserId đang follow (chỉ trong userIds).
     */
    private async getRawFollowingIdSet(
        currentUserId: string,
        userIds: string[],
    ): Promise<Set<string>> {
        if (userIds.length === 0) return new Set();
        const rows = await db.follow.findMany({
            where: {
                followerId: currentUserId,
                followingId: { in: userIds },
            },
            select: { followingId: true },
        });
        return new Set(rows.map((r: any) => r.followingId));
    }

    /**
     * Bulk-load trạng thái pending request giữa currentUserId và các user khác.
     * Trả về Map<userId, "out" | "in">:
     * - "out": mình đã gửi lời mời cho user đó
     * - "in": user đó đã gửi lời mời cho mình
     */
    private async bulkPendingRequestMap(
        currentUserId: string,
        userIds: string[],
    ): Promise<Map<string, "out" | "in">> {
        if (userIds.length === 0) return new Map();
        const rows = await db.friendRequest.findMany({
            where: {
                status: "PENDING",
                OR: [
                    { senderId: currentUserId, receiverId: { in: userIds } },
                    { receiverId: currentUserId, senderId: { in: userIds } },
                ],
            },
            select: { senderId: true, receiverId: true },
        });
        const result = new Map<string, "out" | "in">();
        for (const r of rows) {
            if (r.senderId === currentUserId) {
                result.set(r.receiverId, "out");
            } else if (r.receiverId === currentUserId) {
                result.set(r.senderId, "in");
            }
        }
        return result;
    }

    /**
     * Đếm số bạn chung giữa 2 user (dùng cho UserCard + OtherProfileScreen).
     * Intersection của 2 tập bạn bè.
     */
    private async getMutualFriendCount(userAId: string, userBId: string): Promise<number> {
        if (userAId === userBId) return 0;
        const [aFriends, bFriends] = await Promise.all([
            this.getRawFriendIds(userAId),
            this.getRawFriendIds(userBId),
        ]);
        if (aFriends.length === 0 || bFriends.length === 0) return 0;
        const bSet = new Set(bFriends);
        let count = 0;
        for (const id of aFriends) {
            if (bSet.has(id)) count++;
        }
        return count;
    }

    /**
     * Lấy gradeId phổ biến nhất của user (theo số node đã học trong từng khối).
     * Trả về null nếu user chưa học gì → filter "learning" sẽ trả rỗng.
     */
    private async getPrimaryGradeId(userId: string): Promise<number | null> {
        const rows: any[] = await db.$queryRaw`
            SELECT t.grade_id AS "gradeId", COUNT(*)::int AS cnt
            FROM user_node_progress unp
            JOIN nodes n ON n.id = unp.node_id
            JOIN sections s ON n.section_id = s.id
            JOIN lessons l ON s.lesson_id = l.id
            JOIN topics t ON l.topic_id = t.id
            WHERE unp.user_id = ${userId}
            GROUP BY t.grade_id
            ORDER BY cnt DESC, t.grade_id ASC
            LIMIT 1
        `;
        if (!rows || rows.length === 0) return null;
        const gradeId = Number(rows[0].gradeId);
        return Number.isFinite(gradeId) ? gradeId : null;
    }

    /**
     * API cho section "Bạn chung" trong OtherProfileScreen.
     * Trả về danh sách user chung + total count.
     */
    async getMutualFriends(
        currentUserId: string,
        targetUserId: string,
        limit = 10,
    ) {
        const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 50);
        if (currentUserId === targetUserId) {
            return { total: 0, friends: [] };
        }

        const [myFriendsRaw, theirFriendsRaw] = await Promise.all([
            this.getRawFriendIds(currentUserId),
            this.getRawFriendIds(targetUserId),
        ]);
        const theirSet = new Set(theirFriendsRaw);
        const mutualIds = myFriendsRaw.filter((id) => theirSet.has(id));
        if (mutualIds.length === 0) {
            return { total: 0, friends: [] };
        }

        const users = await db.user.findMany({
            where: {
                id: { in: mutualIds },
                isHidden: false,
            },
            select: userSelect,
            take: safeLimit,
            orderBy: { totalXp: "desc" },
        });
        return {
            total: mutualIds.length,
            friends: users.map(publicUser),
        };
    }

    private async getFriendCount(userId: string) {
        return db.friendship.count({
            where: {
                OR: [{ userId }, { friendId: userId }],
            },
        });
    }

    private async areFriends(userAId: string, userBId: string) {
        const pair = normalizeFriendPair(userAId, userBId);
        const friendship = await db.friendship.findUnique({
            where: { userId_friendId: pair },
            select: { id: true },
        });
        return Boolean(friendship);
    }

    private async isFollowing(followerId: string, followingId: string) {
        if (followerId === followingId) return false;
        const follow = await db.follow.findUnique({
            where: {
                followerId_followingId: {
                    followerId,
                    followingId,
                },
            },
            select: { id: true },
        });
        return Boolean(follow);
    }

    private async getRelationStatus(
        currentUserId: string,
        targetUserId: string,
    ): Promise<RelationStatus> {
        if (currentUserId === targetUserId) return "self";

        if (await this.areFriends(currentUserId, targetUserId)) return "friend";

        const request = await db.friendRequest.findFirst({
            where: {
                status: "PENDING",
                OR: [
                    { senderId: currentUserId, receiverId: targetUserId },
                    { senderId: targetUserId, receiverId: currentUserId },
                ],
            },
            select: { senderId: true },
        });

        if (!request) return "none";
        return request.senderId === currentUserId
            ? "outgoing_request"
            : "incoming_request";
    }

    async getXpComparisonData(currentUserId: string, targetUserId: string, range: string) {
        const now = new Date();
        let startDate: Date;
        let mode: "daily" | "weekly" | "monthly" = "daily";

        if (range === "3day") {
            startDate = new Date(now);
            startDate.setUTCDate(now.getUTCDate() - 2);
            startDate.setUTCHours(0, 0, 0, 0);
            mode = "daily";
        } else if (range === "week") {
            startDate = new Date(now);
            startDate.setUTCDate(now.getUTCDate() - 6);
            startDate.setUTCHours(0, 0, 0, 0);
            mode = "daily";
        } else if (range === "month") {
            startDate = new Date(now);
            startDate.setUTCDate(now.getUTCDate() - 29);
            startDate.setUTCHours(0, 0, 0, 0);
            mode = "daily";
        } else if (range === "year") {
            startDate = new Date(now);
            startDate.setUTCMonth(now.getUTCMonth() - 11, 1);
            startDate.setUTCHours(0, 0, 0, 0);
            mode = "monthly";
        } else {
            // "all"
            const oldestLog = await (prisma as any).userXpLog.findFirst({
                where: { userId: { in: [currentUserId, targetUserId] } },
                orderBy: { createdAt: "asc" },
                select: { createdAt: true },
            });
            if (oldestLog) {
                startDate = new Date(oldestLog.createdAt);
                startDate.setUTCHours(0, 0, 0, 0);
            } else {
                startDate = new Date(now);
                startDate.setUTCDate(now.getUTCDate() - 6);
                startDate.setUTCHours(0, 0, 0, 0);
            }
            const spanDays = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
            if (spanDays <= 35) mode = "daily";
            else if (spanDays <= 180) mode = "weekly";
            else mode = "monthly";
        }

        const logs = await (prisma as any).userXpLog.findMany({
            where: {
                userId: { in: [currentUserId, targetUserId] },
                createdAt: { gte: startDate },
            },
            select: {
                userId: true,
                amount: true,
                createdAt: true,
            },
        });

        const getKey = (d: Date): string => {
            const yyyy = d.getUTCFullYear();
            const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
            if (mode === "monthly") return `T${mm}/${yyyy.toString().slice(2)}`;
            if (mode === "weekly") {
                const w = new Date(d);
                const dayIdx = (w.getUTCDay() + 6) % 7;
                w.setUTCDate(w.getUTCDate() - dayIdx);
                const wMm = String(w.getUTCMonth() + 1).padStart(2, "0");
                const wDd = String(w.getUTCDate()).padStart(2, "0");
                return `${wDd}/${wMm}`;
            }
            const dd = String(d.getUTCDate()).padStart(2, "0");
            return `${dd}/${mm}`;
        };

        const myMap = new Map<string, number>();
        const targetMap = new Map<string, number>();

        logs.forEach((log: any) => {
            const key = getKey(new Date(log.createdAt));
            if (log.userId === currentUserId) {
                myMap.set(key, (myMap.get(key) || 0) + log.amount);
            } else {
                targetMap.set(key, (targetMap.get(key) || 0) + log.amount);
            }
        });

        const myXpData: { date: string; xp: number }[] = [];
        const targetXpData: { date: string; xp: number }[] = [];

        const curr = new Date(startDate);
        const seenKeys = new Set<string>();

        while (curr <= now || getKey(curr) === getKey(now)) {
            const key = getKey(curr);
            if (!seenKeys.has(key)) {
                seenKeys.add(key);
                myXpData.push({ date: key, xp: myMap.get(key) || 0 });
                targetXpData.push({ date: key, xp: targetMap.get(key) || 0 });
            }

            if (mode === "monthly") {
                curr.setUTCMonth(curr.getUTCMonth() + 1, 1);
            } else if (mode === "weekly") {
                curr.setUTCDate(curr.getUTCDate() + 7);
            } else {
                curr.setUTCDate(curr.getUTCDate() + 1);
            }
        }

        return {
            range,
            mode,
            startDate: startDate.toISOString().slice(0, 10),
            endDate: now.toISOString().slice(0, 10),
            myXpData,
            targetXpData,
        };
    }
}

export const socialService = new SocialService();
