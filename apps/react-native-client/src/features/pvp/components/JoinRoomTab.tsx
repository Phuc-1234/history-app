import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    FlatList,
    Image,
    RefreshControl,
} from "react-native";
import { RefreshCw, Users } from "lucide-react-native";
import { colors, radii, spacing, typography } from "@/theme";
import { AvatarWithFrame } from "@/components/ui";
import { useJoinPvpRoomMutation, useGetPublicRoomsQuery } from "../services/pvpApi";
import type { PvpPublicRoomDto, PvpRoom } from "../types";

interface JoinRoomTabProps {
    onRoomJoined: (room: PvpRoom) => void;
}

export function JoinRoomTab({ onRoomJoined }: JoinRoomTabProps) {
    const [code, setCode] = useState("");
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [joiningCode, setJoiningCode] = useState<string | null>(null);

    const [joinRoomMut, { isLoading: isJoining }] = useJoinPvpRoomMutation();
    const {
        data: publicRooms,
        isLoading: isLoadingPublicRooms,
        isFetching: isFetchingPublicRooms,
        refetch: refetchPublicRooms,
    } = useGetPublicRoomsQuery();

    const handleJoinCode = async (targetCode: string) => {
        if (!targetCode.trim() || targetCode.trim().length !== 4) {
            setErrorMsg("Vui lòng nhập mã phòng 4 chữ số");
            return;
        }

        try {
            setErrorMsg(null);
            setJoiningCode(targetCode.trim());
            const room = await joinRoomMut({ roomCode: targetCode.trim() }).unwrap();
            onRoomJoined(room);
        } catch (err: any) {
            console.error("Failed to join room:", err);
            setErrorMsg(err?.data?.error ?? err?.message ?? "Không thể vào phòng");
        } finally {
            setJoiningCode(null);
        }
    };

    const renderPublicRoomItem = ({ item }: { item: PvpPublicRoomDto }) => {
        const isCurrentJoining = joiningCode === item.code;
        return (
            <View style={styles.roomCard}>
                <View style={styles.roomHeader}>
                    <AvatarWithFrame
                        uri={item.hostAvatar}
                        frameUri={item.equippedFrameUrl}
                        size={40}
                        name={item.hostName}
                        borderWidth={1.5}
                        style={{ marginRight: 10 }}
                    />
                    <View style={styles.roomMeta}>
                        <Text style={styles.hostName} numberOfLines={1}>
                            {item.hostName}
                        </Text>
                        <Text style={styles.roomSubInfo}>
                            {item.questionCount} câu • {item.timePerQuestion}s/câu
                        </Text>
                    </View>
                    <View style={styles.codeBadge}>
                        <Text style={styles.codeBadgeText}>#{item.code}</Text>
                    </View>
                </View>

                <View style={styles.roomFooter}>
                    <View style={styles.participantInfo}>
                        <Users size={14} color={colors.neutral600} />
                        <Text style={styles.participantText}>
                            {item.participantCount}/{item.maxParticipants} người
                        </Text>
                    </View>

                    <TouchableOpacity
                        style={[
                            styles.joinPillButton,
                            (isJoining || item.participantCount >= item.maxParticipants) && styles.buttonDisabled,
                        ]}
                        onPress={() => handleJoinCode(item.code)}
                        disabled={isJoining || item.participantCount >= item.maxParticipants}
                    >
                        {isCurrentJoining ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                            <Text style={styles.joinPillText}>
                                {item.participantCount >= item.maxParticipants ? "Đã đầy" : "Vào phòng"}
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <FlatList
            data={publicRooms ?? []}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.container}
            refreshControl={
                <RefreshControl
                    refreshing={isFetchingPublicRooms}
                    onRefresh={refetchPublicRooms}
                    colors={[colors.orange || "#FF9500"]}
                    tintColor={colors.orange || "#FF9500"}
                />
            }
            ListHeaderComponent={
                <View style={styles.headerSection}>
                    <Text style={styles.title}>Nhập mã phòng thi đấu</Text>

                    <TextInput
                        style={styles.codeInput}
                        value={code}
                        onChangeText={(text) => {
                            setCode(text.replace(/[^0-9]/g, "").slice(0, 4));
                            setErrorMsg(null);
                        }}
                        placeholder="1234"
                        placeholderTextColor={colors.neutral400}
                        keyboardType="number-pad"
                        maxLength={4}
                    />

                    {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

                    <TouchableOpacity
                        style={[styles.submitButton, (isJoining || code.length !== 4) && styles.buttonDisabled]}
                        onPress={() => handleJoinCode(code)}
                        disabled={isJoining || code.length !== 4}
                    >
                        {isJoining && joiningCode === code ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.submitButtonText}>Vào phòng</Text>
                        )}
                    </TouchableOpacity>

                    <View style={styles.divider} />

                    <View style={styles.sectionHeaderRow}>
                        <Text style={styles.sectionTitle}>Phòng công khai sẵn có</Text>
                        <TouchableOpacity
                            style={styles.refreshButton}
                            onPress={() => refetchPublicRooms()}
                            disabled={isFetchingPublicRooms}
                        >
                            <RefreshCw size={16} color={colors.primary600} />
                        </TouchableOpacity>
                    </View>

                    {isLoadingPublicRooms && (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="small" color={colors.primary600} />
                            <Text style={styles.loadingText}>Đang tải danh sách phòng...</Text>
                        </View>
                    )}
                </View>
            }
            ListEmptyComponent={
                !isLoadingPublicRooms ? (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>Chưa có phòng công khai nào</Text>
                        <Text style={styles.emptySubText}>
                            Hãy tạo phòng mới hoặc bảo bạn bè gửi mã 4 chữ số!
                        </Text>
                    </View>
                ) : null
            }
            renderItem={renderPublicRoomItem}
        />
    );
}

const styles = StyleSheet.create({
    container: {
        padding: spacing.lg,
        paddingBottom: spacing.xl * 2,
    },
    headerSection: {
        alignItems: "center",
    },
    title: {
        fontSize: 22,
        fontFamily: typography.fonts.extraBold,
        color: colors.neutral900,
        marginBottom: spacing.md,
    },
    codeInput: {
        fontSize: 36,
        letterSpacing: 12,
        textAlign: "center",
        color: colors.primary700,
        backgroundColor: colors.neutral100,
        borderWidth: 2,
        borderColor: colors.primary500,
        borderRadius: radii.container, // 12
        width: 220,
        paddingVertical: spacing.md,
        marginBottom: spacing.md,
        fontFamily: typography.fonts.bold,
    },
    errorText: {
        fontSize: 13,
        fontFamily: typography.fonts.regular,
        color: colors.error600,
        marginBottom: spacing.sm,
    },
    submitButton: {
        backgroundColor: colors.primary600,
        borderRadius: radii.pill, // 30
        paddingVertical: spacing.md,
        width: "100%",
        alignItems: "center",
        marginTop: spacing.xs,
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    submitButtonText: {
        fontSize: 15,
        fontFamily: typography.fonts.medium,
        color: "#FFFFFF",
    },
    divider: {
        height: 1,
        backgroundColor: colors.neutral200,
        width: "100%",
        marginVertical: spacing.lg,
    },
    sectionHeaderRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        width: "100%",
        marginBottom: spacing.md,
    },
    sectionTitle: {
        fontSize: 16,
        fontFamily: typography.fonts.bold,
        color: colors.neutral900,
    },
    refreshButton: {
        padding: spacing.xs,
    },
    loadingContainer: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: spacing.md,
        gap: spacing.xs,
    },
    loadingText: {
        fontSize: 13,
        fontFamily: typography.fonts.regular,
        color: colors.neutral600,
    },
    roomCard: {
        backgroundColor: colors.surface,
        borderRadius: radii.container, // 12
        borderWidth: 1,
        borderColor: colors.neutral200,
        padding: spacing.md,
        marginBottom: spacing.md,
    },
    roomHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: spacing.sm,
    },
    avatar: {
        width: 38,
        height: 38,
        borderRadius: radii.pill,
        backgroundColor: colors.neutral200,
    },
    avatarPlaceholder: {
        width: 38,
        height: 38,
        borderRadius: radii.pill,
        backgroundColor: colors.primary100,
        justifyContent: "center",
        alignItems: "center",
    },
    avatarText: {
        fontSize: 16,
        fontFamily: typography.fonts.bold,
        color: colors.primary700,
    },
    roomMeta: {
        flex: 1,
        marginLeft: spacing.sm,
    },
    hostName: {
        fontSize: 14,
        fontFamily: typography.fonts.bold,
        color: colors.neutral900,
    },
    roomSubInfo: {
        fontSize: 12,
        fontFamily: typography.fonts.regular,
        color: colors.neutral600,
        marginTop: 2,
    },
    codeBadge: {
        backgroundColor: colors.primary50,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: radii.pill,
        borderWidth: 1,
        borderColor: colors.primary200,
    },
    codeBadgeText: {
        fontSize: 13,
        fontFamily: typography.fonts.bold,
        color: colors.primary700,
    },
    roomFooter: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: spacing.xs,
        paddingTop: spacing.xs,
        borderTopWidth: 1,
        borderTopColor: colors.neutral100,
    },
    participantInfo: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    participantText: {
        fontSize: 13,
        fontFamily: typography.fonts.medium,
        color: colors.neutral600,
    },
    joinPillButton: {
        backgroundColor: colors.primary600,
        borderRadius: radii.pill, // 30
        paddingHorizontal: spacing.md + 4,
        paddingVertical: spacing.xs + 2,
    },
    joinPillText: {
        fontSize: 13,
        fontFamily: typography.fonts.bold,
        color: "#FFFFFF",
    },
    emptyContainer: {
        paddingVertical: spacing.xl,
        alignItems: "center",
    },
    emptyText: {
        fontSize: 14,
        fontFamily: typography.fonts.medium,
        color: colors.neutral700,
    },
    emptySubText: {
        fontSize: 12,
        fontFamily: typography.fonts.regular,
        color: colors.neutral500,
        marginTop: 4,
        textAlign: "center",
    },
});

