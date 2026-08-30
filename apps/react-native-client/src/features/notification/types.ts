export interface SystemNotification {
    id: string;
    userId?: string;
    senderId?: string | null;
    targetId?: string | null;
    type: string; // "FRIEND_REQUEST" | "FRIEND_ACCEPT" | "SYSTEM" | "push" etc.
    title: string;
    body: string;
    isRead: boolean;
    isHidden?: boolean;
    createdAt: string;
    updatedAt?: string;
    timestamp?: string;
    sender?: {
        id: string;
        name: string;
        profileImgUrl?: string | null;
        equippedFrameUrl?: string | null;
    } | null;
    requestStatus?: "PENDING" | "ACCEPTED" | "REJECTED" | "CANCELLED" | null;
}
