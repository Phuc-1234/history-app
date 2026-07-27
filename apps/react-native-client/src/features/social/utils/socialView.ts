import type { SocialUser as ApiSocialUser } from "../types/socialApiTypes";
import type { CardAction, CardUser } from "@/components/ui";

/**
 * View-model cho một người dùng ở tầng UI social.
 *
 * ⚠️ Khác với bản cũ: `friendStatus` và `isFollowing` là HAI TRƯỜNG ĐỘC LẬP,
 * phản ánh đúng backend (kết bạn và theo dõi là hai khái niệm tách biệt).
 * Bản cũ gộp cả hai vào một trường `relation` duy nhất → gây Lỗi 1, 2, 3.
 *
 * `extends CardUser` để thừa hưởng các trường hiển thị chung (id, name, level…)
 * thay vì lặp lại, tránh lệch khi `CardUser` thay đổi.
 */
export interface ViewUser extends CardUser {
    /** Trạng thái kết bạn (độc lập với theo dõi). */
    friendStatus: FriendStatus;

    /** Đang theo dõi người này hay chưa (độc lập với kết bạn). */
    isFollowing: boolean;
}

export type FriendStatus =
    | "friend" // đã là bạn bè
    | "pending_out" // mình đã gửi lời mời, đang chờ đối phương đồng ý
    | "pending_in" // đối phương vừa gửi lời mời cho MÌNH (sửa Lỗi 3)
    | "none"; // chưa có quan hệ kết bạn

/**
 * Chuyển đổi `SocialUser` (từ API) sang `ViewUser` (dùng trong UI).
 *
 * Bản cũ chỉ phân biệt friend/pending/following/none và BỎ SÓT
 * `incoming_request` (Lỗi 3). Bản này ánh xạ đầy đủ 5 giá trị
 * `SocialRelationStatus` của backend sang `friendStatus` + `isFollowing`.
 */
export function toViewUser(user: ApiSocialUser): ViewUser {
    const friendStatus: FriendStatus =
        user.relationStatus === "friend"
            ? "friend"
            : user.relationStatus === "outgoing_request"
              ? "pending_out"
              : user.relationStatus === "incoming_request"
                ? "pending_in" // ← Lỗi 3: trước đây rơi vào nhánh "none"
                : "none";

    return {
        id: user.id,
        name: user.name,
        level: Math.max(1, Math.floor((user.totalXp ?? 0) / 1000) + 1),
        avatar: user.profileImgUrl ?? "",
        title: user.tierName || "Người học lịch sử",
        xp: user.totalXp ?? 0,
        streak: user.currentStreak ?? 0,
        mutualFriends: user.mutualFriends ?? 0,
        winRate: 0,
        friendStatus,
        isFollowing: Boolean(user.isFollowing),
    };
}

/**
 * Tính nội dung hai nút hành động (theo dõi + kết bạn) cho một người dùng.
 *
 * Nút THEO DÕI chỉ phụ thuộc vào `isFollowing` — KHÔNG còn bị ép theo
 * `friendStatus === "friend"` như bản cũ (sửa Lỗi 1: bạn bè chưa chắc đã theo dõi).
 */
export function searchActions(user: ViewUser): {
    follow: CardAction;
    friend: CardAction;
} {
    // Button 1: Theo dõi — icon theo ngữ nghĩa, không dùng "eye-outline" nữa
    // (vì bị trùng với icon "Xem hồ sơ" ở màn hình khác → nhầm lẫn UX).
    const follow: CardAction = user.isFollowing
        ? { label: "Đang theo dõi", icon: "checkmark-circle", variant: "outline" }
        : { label: "Theo dõi", icon: "person-add-outline", variant: "outline" };

    // Button 2: Kết bạn — filled style
    const friend: CardAction =
        user.friendStatus === "friend"
            ? { label: "Bạn bè", icon: "people", variant: "primary" }
            : user.friendStatus === "pending_out"
              ? { label: "Đã gửi", icon: "time", variant: "disabled" }
              : user.friendStatus === "pending_in"
                ? { label: "Trả lời lời mời", icon: "mail", variant: "primary" }
                : { label: "Kết bạn", icon: "person-add", variant: "primary" };

    return { follow, friend };
}
