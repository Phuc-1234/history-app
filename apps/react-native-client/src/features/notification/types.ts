export interface SystemNotification {
    id: string;
    type: "system" | "push" | "reward" | "achievement";
    title: string;
    body: string;
    timestamp: string;
    isRead: boolean;
}
