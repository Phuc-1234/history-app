import type Ionicons from "@expo/vector-icons/build/Ionicons";

/**
 * Dữ liệu tối thiểu để hiển thị một người dùng trong các thẻ UI
 * (avatar, UserCard, SearchUserCard…). Được dùng chung bởi feature
 * `social` và `challenge` nên đặt ở tầng `components/ui`.
 *
 * Các feature có thể mở rộng thêm trường riêng (ví dụ `social` thêm
 * `friendStatus` + `isFollowing`) bằng cách `extends CardUser`.
 */
export interface CardUser {
    id: string;
    name: string;
    level: number;
    avatar: string;
    title: string;
    xp: number;
    streak: number;
    mutualFriends: number;
    winRate: number;
}

/**
 * Mô tả một nút hành động theo trạng thái quan hệ (theo dõi / kết bạn…).
 */
export type CardActionVariant =
    | "primary"
    | "outline"
    | "soft"
    | "danger"
    | "disabled"
    | "secondary"
    | "ghost";

export interface CardAction {
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    variant: CardActionVariant;
}
