import React, { useState, useMemo } from "react";
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    FlatList,
    ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/theme/colors";
import { typography } from "@/theme/typography";
import { AvatarWithFrame } from "@/components/ui/AvatarWithFrame";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { useGetFriendsQuery } from "@/features/social/services/socialApi";
import { useInviteFriendToPvpRoomMutation } from "../services/pvpApi";
import { toastService } from "@/services/toastService";
import type { PvpParticipant } from "../types";

interface InviteFriendsModalProps {
    visible: boolean;
    onClose: () => void;
    roomCode: string;
    participants: PvpParticipant[];
}

export function InviteFriendsModal({
    visible,
    onClose,
    roomCode,
    participants,
}: InviteFriendsModalProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [invitedUserIds, setInvitedUserIds] = useState<Set<string>>(new Set());
    const [invitingUserId, setInvitingUserId] = useState<string | null>(null);

    const { data: friendsData, isLoading, isError, refetch } = useGetFriendsQuery(undefined, {
        skip: !visible,
    });
    const [inviteFriendMut] = useInviteFriendToPvpRoomMutation();

    const participantUserIds = useMemo(() => {
        return new Set(participants.map((p) => p.userId));
    }, [participants]);

    const friendsList = useMemo(() => {
        const list = friendsData?.friends ?? [];
        return list.filter((f) => {
            const user = f.user;
            if (!user) return false;
            // Exclude users already in the room
            if (participantUserIds.has(user.id)) return false;
            // Search query filter
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim();
                return user.name.toLowerCase().includes(q) || (user.email && user.email.toLowerCase().includes(q));
            }
            return true;
        });
    }, [friendsData, participantUserIds, searchQuery]);

    const handleInvite = async (targetUserId: string, targetUserName: string) => {
        if (invitingUserId) return;
        setInvitingUserId(targetUserId);

        try {
            await inviteFriendMut({ roomCode, targetUserId }).unwrap();
            setInvitedUserIds((prev) => new Set([...prev, targetUserId]));
            toastService.show(`Đã gửi lời mời đến ${targetUserName}!`, "success");
        } catch (err: any) {
            console.error("Failed to invite friend:", err);
            const msg = err?.data?.error ?? err?.message ?? "Không thể gửi lời mời";
            toastService.show(msg, "error");
        } finally {
            setInvitingUserId(null);
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <TouchableOpacity
                    style={styles.backdrop}
                    activeOpacity={1}
                    onPress={onClose}
                />
                <View style={styles.modalContent}>
                    {/* Header */}
                    <View style={styles.headerRow}>
                        <View style={styles.headerTitleContainer}>
                            <Ionicons name="person-add" size={20} color={colors.primary} />
                            <Text style={styles.headerTitle}>Mời bạn bè tham gia</Text>
                        </View>
                        <TouchableOpacity
                            onPress={onClose}
                            style={styles.closeButton}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Ionicons name="close" size={22} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    {/* Search Bar */}
                    <View style={styles.searchBar}>
                        <Ionicons name="search" size={18} color={colors.textMuted} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Tìm kiếm bạn bè..."
                            placeholderTextColor={colors.textPlaceholder}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            autoCapitalize="none"
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchQuery("")}>
                                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Friends List */}
                    {isLoading ? (
                        <View style={styles.centerContainer}>
                            <ActivityIndicator size="small" color={colors.primary} />
                            <Text style={styles.loadingText}>Đang tải danh sách bạn bè...</Text>
                        </View>
                    ) : isError ? (
                        <View style={styles.centerContainer}>
                            <Text style={styles.errorText}>Không thể tải danh sách bạn bè.</Text>
                            <TouchableOpacity onPress={() => refetch()} style={styles.retryButton}>
                                <Text style={styles.retryText}>Thử lại</Text>
                            </TouchableOpacity>
                        </View>
                    ) : friendsList.length === 0 ? (
                        <View style={styles.centerContainer}>
                            <Ionicons name="people-outline" size={40} color={colors.textMuted} />
                            <Text style={styles.emptyText}>
                                {searchQuery.trim()
                                    ? "Không tìm thấy bạn bè nào phù hợp."
                                    : "Không còn bạn bè nào để mời."}
                            </Text>
                        </View>
                    ) : (
                        <FlatList
                            data={friendsList}
                            keyExtractor={(item) => item.friendshipId || item.user.id}
                            contentContainerStyle={styles.listContent}
                            showsVerticalScrollIndicator={false}
                            renderItem={({ item }) => {
                                const user = item.user;
                                const isInvited = invitedUserIds.has(user.id);
                                const isInviting = invitingUserId === user.id;

                                return (
                                    <View style={styles.friendRow}>
                                        <AvatarWithFrame
                                            uri={user.profileImgUrl}
                                            frameUri={user.equippedFrameUrl}
                                            size={42}
                                            name={user.name}
                                        />
                                        <View style={styles.friendInfo}>
                                            <Text style={styles.friendName} numberOfLines={1}>
                                                {user.name}
                                            </Text>
                                            <Text style={styles.friendXp}>
                                                {user.totalXp.toLocaleString()} XP
                                            </Text>
                                        </View>

                                        {isInviting ? (
                                            <ActivityIndicator size="small" color={colors.primary} style={styles.inviteSpinner} />
                                        ) : isInvited ? (
                                            <View style={styles.invitedBadge}>
                                                <Ionicons name="checkmark" size={14} color={colors.success} />
                                                <Text style={styles.invitedText}>Đã mời</Text>
                                            </View>
                                        ) : (
                                            <PrimaryButton
                                                label="Mời"
                                                icon="person-add"
                                                variant="primary"
                                                style={styles.inviteButton}
                                                onPress={() => handleInvite(user.id, user.name)}
                                            />
                                        )}
                                    </View>
                                );
                            }}
                        />
                    )}
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.55)",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    backdrop: {
        ...StyleSheet.absoluteFill,
    },
    modalContent: {
        width: "100%",
        maxHeight: "80%",
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 16,
        borderWidth: 1.5,
        borderColor: colors.borderMedium,
    },
    headerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 14,
    },
    headerTitleContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    headerTitle: {
        fontFamily: typography.fonts.bold,
        fontSize: 16,
        color: colors.textPrimary,
    },
    closeButton: {
        padding: 4,
    },
    searchBar: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.inputBackground,
        borderRadius: 30,
        paddingHorizontal: 12,
        paddingVertical: 8,
        gap: 8,
        marginBottom: 12,
    },
    searchInput: {
        flex: 1,
        fontFamily: typography.fonts.regular,
        fontSize: 13,
        color: colors.textPrimary,
        padding: 0,
    },
    listContent: {
        gap: 10,
        paddingBottom: 8,
    },
    friendRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 8,
        paddingHorizontal: 10,
        backgroundColor: colors.background,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.borderMedium,
        gap: 12,
    },
    friendInfo: {
        flex: 1,
        gap: 2,
    },
    friendName: {
        fontFamily: typography.fonts.bold,
        fontSize: 14,
        color: colors.textPrimary,
    },
    friendXp: {
        fontFamily: typography.fonts.regular,
        fontSize: 11,
        color: colors.textMuted,
    },
    inviteButton: {
        minHeight: 34,
        paddingHorizontal: 14,
        paddingVertical: 6,
    },
    inviteSpinner: {
        paddingHorizontal: 16,
    },
    invitedBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 30,
        backgroundColor: colors.successContainer,
    },
    invitedText: {
        fontFamily: typography.fonts.semiBold,
        fontSize: 12,
        color: colors.success,
    },
    centerContainer: {
        paddingVertical: 40,
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
    },
    loadingText: {
        fontFamily: typography.fonts.regular,
        fontSize: 13,
        color: colors.textMuted,
    },
    errorText: {
        fontFamily: typography.fonts.regular,
        fontSize: 13,
        color: colors.error,
    },
    retryButton: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        backgroundColor: colors.primary,
        borderRadius: 30,
    },
    retryText: {
        fontFamily: typography.fonts.semiBold,
        fontSize: 12,
        color: "#FFFFFF",
    },
    emptyText: {
        fontFamily: typography.fonts.regular,
        fontSize: 13,
        color: colors.textMuted,
        textAlign: "center",
    },
});
