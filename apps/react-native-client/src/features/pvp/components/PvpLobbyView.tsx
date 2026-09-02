import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator, FlatList, Clipboard } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radii, spacing, typography } from "@/theme";
import { AvatarWithFrame } from "@/components/ui";
import { toastService } from "@/services/toastService";
import { API_BASE_URL } from "@/services/config";
import type { PvpParticipant, PvpRoom } from "../types";
import { useStartPvpRoomMutation } from "../services/pvpApi";
import { Swords, Link2, QrCode } from "lucide-react-native";
import { InviteFriendsModal } from "./InviteFriendsModal";
import { PvpQrModal } from "./PvpQrModal";

const SWORD_BACKGROUNDS = [
    { size: 40, top: "10%", left: "5%", rotate: "15deg" },
    { size: 80, top: "15%", right: "8%", rotate: "-25deg" },
    { size: 50, top: "35%", left: "15%", rotate: "45deg" },
    { size: 90, top: "45%", right: "12%", rotate: "30deg" },
    { size: 60, top: "60%", left: "8%", rotate: "-15deg" },
    { size: 100, bottom: "10%", right: "5%", rotate: "20deg" },
    { size: 70, bottom: "15%", left: "12%", rotate: "-35deg" },
    { size: 45, top: "25%", left: "45%", rotate: "60deg" },
    { size: 55, bottom: "25%", left: "35%", rotate: "-40deg" },
];

interface PvpLobbyViewProps {
    room: PvpRoom;
    participants: PvpParticipant[];
    currentUserId: string;
    onLeaveRoom: () => void;
}

export function PvpLobbyView({ room, participants, currentUserId, onLeaveRoom }: PvpLobbyViewProps) {
    const isHost = room.hostUserId === currentUserId;
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [isQrModalOpen, setIsQrModalOpen] = useState(false);
    const [startRoomMut, { isLoading: isStarting }] = useStartPvpRoomMutation();

    const handleStart = async () => {
        try {
            await startRoomMut({ roomCode: room.code }).unwrap();
        } catch (err) {
            console.error("Failed to start PVP room:", err);
        }
    };

    const handleCopyLink = () => {
        const link = `${API_BASE_URL}/pvp/${room.code}`;
        Clipboard.setString(link);
        toastService.show("Đã sao chép liên kết phòng!", "success");
    };

    return (
        <View style={styles.container}>
            {/* Background Swords */}
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
                {SWORD_BACKGROUNDS.map((item, idx) => (
                    <View
                        key={`bg-sword-${idx}`}
                        style={{
                            position: "absolute",
                            top: item.top as any,
                            left: item.left as any,
                            right: item.right as any,
                            bottom: item.bottom as any,
                            opacity: 0.12,
                        }}
                    >
                        <Swords size={item.size} color={colors.primary || "#c37938"} />
                    </View>
                ))}
            </View>
            {/* Header / Room Code Badge */}
            <View style={styles.codeCard}>
                <Text style={styles.codeLabel}>Mã phòng thi đấu</Text>
                <Text style={styles.codeText}>{room.code}</Text>
                <Text style={styles.configSubtitle}>
                    {room.questionCount} câu hỏi • {room.timePerQuestion}s / câu
                </Text>

                {/* Right side floating action buttons */}
                <View style={styles.floatingActionColumn}>
                    <TouchableOpacity
                        style={styles.iconActionButton}
                        onPress={handleCopyLink}
                        activeOpacity={0.8}
                    >
                        <Link2 size={16} color="#FFFFFF" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.iconActionButton}
                        onPress={() => setIsQrModalOpen(true)}
                        activeOpacity={0.8}
                    >
                        <QrCode size={16} color="#FFFFFF" />
                    </TouchableOpacity>

                    {participants.length < 8 && (
                        <TouchableOpacity
                            style={styles.iconActionButton}
                            onPress={() => setIsInviteModalOpen(true)}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="person-add" size={16} color="#FFFFFF" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Participants list */}
            <Text style={styles.sectionTitle}>
                Người chơi trong phòng ({participants.length}/8)
            </Text>

            <FlatList
                data={participants}
                keyExtractor={(item) => item.userId}
                contentContainerStyle={styles.listContainer}
                renderItem={({ item }) => {
                    const isMe = item.userId === currentUserId;
                    const isRoomHost = item.userId === room.hostUserId;
                    return (
                        <View style={[styles.playerCard, isMe && styles.playerCardMe]}>
                            <AvatarWithFrame
                                uri={item.profileImgUrl}
                                frameUri={item.equippedFrameUrl}
                                size={44}
                                name={item.name}
                                borderWidth={2}
                                style={{ marginRight: 12 }}
                            />
                            <View style={styles.playerInfo}>
                                <Text style={styles.playerName} numberOfLines={1}>
                                    {item.name} {isMe ? "(Bạn)" : ""}
                                </Text>
                            </View>
                            {isRoomHost ? (
                                <View style={styles.hostBadge}>
                                    <Text style={styles.hostBadgeText}>Chủ phòng</Text>
                                </View>
                            ) : null}
                        </View>
                    );
                }}
            />

            {/* Invite Friends Modal */}
            <InviteFriendsModal
                visible={isInviteModalOpen}
                onClose={() => setIsInviteModalOpen(false)}
                roomCode={room.code}
                participants={participants}
            />

            {/* QR Code Modal */}
            <PvpQrModal
                visible={isQrModalOpen}
                onClose={() => setIsQrModalOpen(false)}
                roomCode={room.code}
            />

            {/* Bottom action controls */}
            <View style={styles.footer}>
                {isHost ? (
                    <>
                        {participants.length < 2 ? (
                            <Text style={styles.minPlayerNotice}>Cần ít nhất 2 người chơi để bắt đầu thi đấu</Text>
                        ) : null}
                        <TouchableOpacity
                            style={[styles.startButton, (isStarting || participants.length < 2) && styles.buttonDisabled]}
                            onPress={handleStart}
                            disabled={isStarting || participants.length < 2}
                        >
                            {isStarting ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text style={styles.startButtonText}>Bắt đầu thi đấu</Text>
                            )}
                        </TouchableOpacity>
                    </>
                ) : (
                    <View style={styles.waitingBanner}>
                        <ActivityIndicator color={colors.primary600} style={{ marginRight: spacing.sm }} />
                        <Text style={styles.waitingText}>Đang chờ chủ phòng bắt đầu...</Text>
                    </View>
                )}

                <TouchableOpacity style={styles.leaveButton} onPress={onLeaveRoom}>
                    <Text style={styles.leaveButtonText}>Rời phòng</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: spacing.lg,
        backgroundColor: colors.neutral50,
    },
    codeCard: {
        backgroundColor: colors.primary600,
        borderRadius: radii.container,
        padding: spacing.lg,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: spacing.lg,
        position: "relative",
    },
    codeLabel: {
        fontSize: 14,
        fontFamily: typography.fonts.medium,
        color: colors.primary100,
        letterSpacing: 1,
    },
    codeText: {
        fontSize: 42,
        fontFamily: typography.fonts.bold,
        color: "#FFFFFF",
        letterSpacing: 8,
        marginVertical: spacing.xs,
    },
    configSubtitle: {
        fontSize: 13,
        fontFamily: typography.fonts.regular,
        color: colors.primary100,
    },
    floatingActionColumn: {
        position: "absolute",
        right: spacing.md,
        top: 0,
        bottom: 0,
        justifyContent: "center",
        alignItems: "center",
        gap: spacing.xs + 2,
    },
    iconActionButton: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: "rgba(255, 255, 255, 0.2)",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.35)",
    },
    sectionTitle: {
        fontSize: 18,
        fontFamily: typography.fonts.bold,
        color: colors.neutral900,
        marginBottom: spacing.md,
    },
    listContainer: {
        gap: spacing.sm,
    },
    playerCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        borderRadius: radii.container,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.neutral200,
    },
    playerCardMe: {
        borderColor: colors.primary500,
        backgroundColor: colors.primary50,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        marginRight: spacing.md,
    },
    avatarPlaceholder: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.primary200,
        alignItems: "center",
        justifyContent: "center",
        marginRight: spacing.md,
    },
    avatarInitials: {
        fontSize: 18,
        fontFamily: typography.fonts.bold,
        color: colors.primary800,
    },
    playerInfo: {
        flex: 1,
    },
    playerName: {
        fontSize: 16,
        fontFamily: typography.fonts.regular,
        color: colors.neutral900,
    },
    hostBadge: {
        backgroundColor: colors.primary100,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xxs,
        borderRadius: radii.pill,
    },
    hostBadgeText: {
        fontSize: 12,
        fontFamily: typography.fonts.medium,
        color: colors.primary700,
    },
    footer: {
        marginTop: spacing.md,
        gap: spacing.sm,
    },
    startButton: {
        backgroundColor: colors.primary600,
        borderRadius: radii.pill,
        paddingVertical: spacing.md,
        alignItems: "center",
    },
    minPlayerNotice: {
        fontSize: 13,
        fontFamily: typography.fonts.regular,
        color: colors.neutral500,
        textAlign: "center",
        marginBottom: spacing.xs,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    startButtonText: {
        fontSize: 15,
        fontFamily: typography.fonts.medium,
        color: "#FFFFFF",
    },
    waitingBanner: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: spacing.md,
        backgroundColor: colors.primary50,
        borderRadius: radii.pill,
    },
    waitingText: {
        fontSize: 15,
        fontFamily: typography.fonts.medium,
        color: colors.primary700,
    },
    leaveButton: {
        alignItems: "center",
        paddingVertical: spacing.sm,
    },
    leaveButtonText: {
        fontSize: 14,
        fontFamily: typography.fonts.medium,
        color: colors.error600,
    },
});
