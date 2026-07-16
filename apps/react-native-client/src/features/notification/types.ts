export interface SystemNotification {
    id: string;
    type: string; // "FRIEND_REQUEST" | "FRIEND_ACCEPT" | "SYSTEM" | "push" etc.
    title: string;
    body: string;
    isRead: boolean;
    createdAt: string;
    timestamp?: string;
}
