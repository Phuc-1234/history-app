import { prisma } from "@history-app/shared";

const db = prisma as any;

type RelationStatus =
    | "self"
    | "friend"
    | "incoming_request"
    | "outgoing_request"
    | "none";

const userSelect = {
    id: true,
    name: true,
    email: true, 
    profileImgUrl: true, 
    totalXp: true,
    currentStreak: true,
    isPrivate: true,
    allowFollow: true,
    allowFriendRequest: true,
    tier: {
        select: {
            name: true,
            badgeImgUrl: true,
        },
    },
};

function normalizeFriendPair(userId: string, friendId: string) {
    return userId < friendId
        ? { userId, friendId }
        : { userId: friendId, friendId: userId };
}

function publicUser(user: any) {
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        profileImgUrl: user.profileImgUrl ?? null,
        totalXp: user.totalXp ?? 0,
        currentStreak: user.currentStreak ?? 0,
        tierName: user.tier?.name ?? null,
        badgeImgUrl: user.tier?.badgeImgUrl ?? null,
        isPrivate: user.isPrivate ?? false,
        allowFollow: user.allowFollow ?? true,
        allowFriendRequest: user.allowFriendRequest ?? true,
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
    async searchUsers(currentUserId: string, query = "", limit = 20) {
        const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 50);
        const trimmedQuery = query.trim();

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
            },
            select: userSelect,
            orderBy: [{ totalXp: "desc" }, { name: "asc" }],
            take: safeLimit,
        });

        return Promise.all(
            users.map(async (user: any) => ({
                ...publicUser(user),
                relationStatus: await this.getRelationStatus(currentUserId, user.id),
                isFollowing: await this.isFollowing(currentUserId, user.id),
            })),
        );
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
        ]);

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
                isPrivate: true,
                allowFollow: true,
            },
        });

        if (!target || target.isHidden) {
            throw Object.assign(new Error("User not found."), { statusCode: 404 });
        }
        if (!target.allowFollow || target.isPrivate) {
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
}

export const socialService = new SocialService();
