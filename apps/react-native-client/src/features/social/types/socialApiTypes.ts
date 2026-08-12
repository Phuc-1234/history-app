export type SocialRelationStatus =
    | "self"
    | "friend"
    | "incoming_request"
    | "outgoing_request"
    | "none";

/**
 * Bộ lọc cho màn "Tìm bạn" (4 SegmentTabs).
 * Phải khớp đúng với `SocialSearchFilter` ở backend.
 */
export type SocialSearchFilter = "all" | "mutual" | "learning" | "recent";

export interface SocialUser {
    id: string;
    name: string;
    email?: string | null;
    profileImgUrl?: string | null;
    totalXp: number;
    currentStreak: number;
    tierName?: string | null;
    badgeImgUrl?: string | null;
    isPrivate?: boolean;
    allowFollow?: boolean;
    allowFriendRequest?: boolean;
    relationStatus?: SocialRelationStatus;
    isFollowing?: boolean;
    equippedFrameUrl?: string | null;
    /** Số bạn chung với người dùng hiện tại (do backend tính). */
    mutualFriends?: number;
}

export interface SocialProfile extends SocialUser {
    stats: {
        friends: number;
        followers: number;
        following: number;
    };
    relationStatus: SocialRelationStatus;
    isFollowing: boolean;
}

export interface FriendRequestDto {
    id: string;
    status: "PENDING" | "ACCEPTED" | "REJECTED" | "CANCELLED";
    createdAt: string;
    updatedAt: string;
    senderId: string;
    receiverId: string;
    user: SocialUser | null;
}

export interface FriendDto {
    friendshipId: string;
    createdAt: string;
    user: SocialUser;
}

export interface FollowDto {
    followId: string;
    createdAt: string;
    user: SocialUser;
}

export interface MessageResponse {
    message: string;
}
