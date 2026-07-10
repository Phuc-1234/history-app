import React, { useEffect, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Avatar, SearchActionButton } from "@/components/ui";
import { styles } from "../styles/social.styles";
import { searchActions, type ViewUser } from "../utils/socialView";

/**
 * Thẻ người dùng trong màn "Tìm bạn".
 *
 * Khác với bản cũ:
 * - Nút theo dõi bật/tắt HAI CHIỀU (sửa Lỗi 2): đang theo dõi → bấm để huỷ theo dõi.
 * - Trạng thái theo dõi là "optimistic" nhưng có KHÔI PHỤC khi mutation lỗi
 *   (sửa Lỗi 4): dùng `.unwrap().catch(rollback)` thay vì set rồi quên.
 * - State được đồng bộ khi prop `user` đổi (RTK Query tự refetch sau khi
 *   mutation thành công nhờ `invalidatesTags`).
 */
export function SearchUserCard({
    user,
    onOpen,
    onFollow,
    onUnfollow,
    onFriend,
}: {
    user: ViewUser;
    onOpen: () => void;
    /** Theo dõi — phải trả về Promise (từ RTK Query mutation) để có thể rollback khi lỗi. */
    onFollow: () => Promise<unknown>;
    /** Huỷ theo dõi — trả về Promise để rollback khi lỗi. */
    onUnfollow: () => Promise<unknown>;
    onFriend: () => void;
}) {
    const [localFollowing, setLocalFollowing] = useState(user.isFollowing);

    // Đồng bộ state khi prop đổi (RTK Query refetch sau khi mutation thành công)
    useEffect(() => {
        setLocalFollowing(user.isFollowing);
    }, [user.id, user.isFollowing]);

    // view-model tạm thời để tính nút theo trạng thái optimistic
    const effectiveUser: ViewUser = { ...user, isFollowing: localFollowing };
    const actions = searchActions(effectiveUser);

    const handleFollow = () => {
        if (localFollowing) {
            // Đang theo dõi → huỷ theo dõi (Lỗi 2). Rollback nếu API lỗi (Lỗi 4).
            setLocalFollowing(false);
            onUnfollow().catch(() => setLocalFollowing(true));
        } else {
            // Chưa theo dõi → theo dõi. Rollback nếu API lỗi.
            setLocalFollowing(true);
            onFollow().catch(() => setLocalFollowing(false));
        }
    };

    return (
        <TouchableOpacity style={styles.searchCard} onPress={onOpen} activeOpacity={0.85}>
            <Avatar user={user} />
            <View style={styles.userInfo}>
                <View style={styles.rowCenter}>
                    <Text style={styles.userName} numberOfLines={1}>
                        {user.name}
                    </Text>
                    <View style={styles.levelPill}>
                        <Text style={styles.levelText}>Lv. {user.level}</Text>
                    </View>
                </View>
                <Text style={styles.userTitle} numberOfLines={1}>
                    {user.title}
                </Text>
                <Text style={styles.userMeta}>
                    {user.xp.toLocaleString()} XP - {user.mutualFriends} bạn chung
                </Text>
            </View>
            <View style={styles.searchButtonRow}>
                <SearchActionButton action={actions.follow} type="outline" onPress={handleFollow} />
                <SearchActionButton action={actions.friend} onPress={onFriend} type="filled" />
            </View>
        </TouchableOpacity>
    );
}
