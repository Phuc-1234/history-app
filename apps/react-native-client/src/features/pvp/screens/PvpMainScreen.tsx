import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, BackHandler } from "react-native";
import { Swords } from "lucide-react-native";
import { ScreenWrapper } from "@/components/layout/ScreenWrapper";
import { SlidingTabBar } from "@/components/SlidingTabBar";
import { colors, radii, spacing, typography } from "@/theme";
import { CreateRoomTab } from "../components/CreateRoomTab";
import { JoinRoomTab } from "../components/JoinRoomTab";
import { PvpLobbyView } from "../components/PvpLobbyView";
import { PvpGameScreen } from "./PvpGameScreen";
import { usePvpRealtime } from "../hooks/usePvpRealtime";
import { useGetActivePvpRoomQuery, useLeavePvpRoomMutation } from "../services/pvpApi";
import { useSelector } from "react-redux";
import type { PvpRoom } from "../types";
import { useFocusEffect, useRouter } from "expo-router";

interface PvpMainScreenProps {
    onExit?: () => void;
    initialMode?: "AUTO_PICK" | "CURATED";
    initialTestId?: string;
    initialScopeType?: string;
    initialScopeId?: number;
    initialQuestionCount?: number;
}

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

export function PvpMainScreen({
    onExit,
    initialMode,
    initialTestId,
    initialScopeType,
    initialScopeId,
    initialQuestionCount,
}: PvpMainScreenProps) {
    const router = useRouter();
    const profile = useSelector((state: any) => state.auth?.profile);
    const currentUserId = profile?.id ?? "";

    const [activeTab, setActiveTab] = useState<"create" | "join">("create");
    const [currentRoom, setCurrentRoom] = useState<PvpRoom | null>(null);

    const { data: activeRoomData, refetch: refetchActiveRoom } = useGetActivePvpRoomQuery();
    const [leavePvpRoomMut] = useLeavePvpRoomMutation();

    useFocusEffect(
        React.useCallback(() => {
            refetchActiveRoom();
        }, [refetchActiveRoom])
    );

    const {
        participants,
        isGameStarted,
        currentQuestionIndex,
        totalQuestions,
        timeLimitSeconds,
        currentQuestion,
        questionResult,
        finalLeaderboard,
        answeredUserIds,
        showLeaderboard,
        rankChanges,
        hostUserId: realtimeHostUserId,
        onlineUserIds,
        resetState,
    } = usePvpRealtime(currentRoom?.code ?? null, currentRoom, currentUserId);

    const effectiveRoom = currentRoom
        ? {
              ...currentRoom,
              hostUserId: realtimeHostUserId ?? currentRoom.hostUserId,
          }
        : null;

    const handleRoomJoinedOrCreate = (room: PvpRoom) => {
        setCurrentRoom(room);
    };

    const handleLeaveRoom = useCallback(async () => {
        if (currentRoom?.code) {
            try {
                await leavePvpRoomMut({ roomCode: currentRoom.code }).unwrap();
            } catch (err) {
                console.error("Failed to leave room on backend:", err);
            }
        }
        setCurrentRoom(null);
        resetState();
        refetchActiveRoom();
    }, [currentRoom?.code, leavePvpRoomMut, resetState, refetchActiveRoom]);

    const handleBackPress = useCallback(() => {
        if (effectiveRoom) {
            handleLeaveRoom();
        } else if (onExit) {
            onExit();
        } else {
            router.back();
        }
    }, [effectiveRoom, handleLeaveRoom, onExit, router]);

    useEffect(() => {
        if (!effectiveRoom || isGameStarted || effectiveRoom.status === "IN_PROGRESS") return;

        const onHardwareBackPress = () => {
            handleBackPress();
            return true;
        };

        const subscription = BackHandler.addEventListener("hardwareBackPress", onHardwareBackPress);
        return () => subscription.remove();
    }, [effectiveRoom, isGameStarted, handleBackPress]);

    // If game has started or is IN_PROGRESS, switch to full-screen PvpGameScreen
    if (effectiveRoom && (isGameStarted || effectiveRoom.status === "IN_PROGRESS")) {
        return (
            <PvpGameScreen
                roomCode={effectiveRoom.code}
                timeLimitSeconds={timeLimitSeconds}
                currentQuestionIndex={currentQuestionIndex}
                totalQuestions={totalQuestions}
                question={currentQuestion}
                questionResult={questionResult}
                finalLeaderboard={finalLeaderboard}
                answeredUserIds={answeredUserIds}
                currentUserId={currentUserId}
                showLeaderboard={showLeaderboard}
                rankChanges={rankChanges}
                isHost={effectiveRoom.hostUserId === currentUserId}
                autoNext={effectiveRoom.autoNext}
                transitionInterval={effectiveRoom.transitionInterval}
                onExitGame={handleLeaveRoom}
                activeUserIds={onlineUserIds}
            />
        );
    }

    const branchConfig = {
        hierarchy: "PVP",
        title: "Thi đấu PVP",
        hideBack: false,
        hideHome: false,
        onBackPress: handleBackPress,
    };

    // If in lobby, show PvpLobbyView wrapped in ScreenWrapper
    if (effectiveRoom) {
        return (
            <ScreenWrapper showTopBar={false} branchConfig={branchConfig} showHistoricalBackground={false}>
                <PvpLobbyView
                    room={effectiveRoom}
                    participants={participants.length > 0 ? participants : effectiveRoom.participants}
                    currentUserId={currentUserId}
                    onLeaveRoom={handleLeaveRoom}
                />
            </ScreenWrapper>
        );
    }

    // Default screen: Tabs (Tạo phòng | Vào phòng) wrapped in ScreenWrapper
    return (
        <ScreenWrapper showTopBar={false} branchConfig={branchConfig} showHistoricalBackground={false}>
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

                {/* Active Room Re-entry Banner Section */}
                {activeRoomData && !currentRoom && (
                    <View style={styles.activeRoomCard}>
                        <View style={styles.activeRoomHeader}>
                            <View style={styles.activeRoomBadge}>
                                <Text style={styles.activeRoomBadgeText}>
                                    {activeRoomData.status === "IN_PROGRESS" ? "ĐANG THI ĐẤU" : "PHÒNG CHỜ"}
                                </Text>
                            </View>
                            <Text style={styles.activeRoomCode}>Phòng #{activeRoomData.code}</Text>
                        </View>

                        <Text style={styles.activeRoomSubtext}>
                            Bạn đang có một phòng thi đấu chưa kết thúc ({activeRoomData.questionCount} câu hỏi).
                        </Text>

                        <View style={styles.activeRoomActions}>
                            <TouchableOpacity
                                style={styles.reenterButton}
                                onPress={() => setCurrentRoom(activeRoomData)}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.reenterButtonText}>Quay lại phòng</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.leaveActiveButton}
                                onPress={async () => {
                                    try {
                                        await leavePvpRoomMut({ roomCode: activeRoomData.code }).unwrap();
                                    } catch (err) {
                                        console.error("Failed to leave active room:", err);
                                    }
                                    refetchActiveRoom();
                                }}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.leaveActiveButtonText}>Rời phòng</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Sliding Tab Bar */}
                <SlidingTabBar
                    tabs={[
                        { key: "create", label: "Tạo phòng" },
                        { key: "join", label: "Vào phòng" },
                    ]}
                    activeTab={activeTab}
                    onChangeTab={(key) => setActiveTab(key as "create" | "join")}
                    containerStyle={styles.tabContainer}
                    indicatorColor={colors.primary600}
                    activeColor="#FFFFFF"
                    inactiveColor={colors.neutral600}
                    pill
                />

                {/* Tab content */}
                {activeTab === "create" ? (
                    <CreateRoomTab
                        onRoomCreated={handleRoomJoinedOrCreate}
                        initialMode={initialMode}
                        initialTestId={initialTestId}
                        initialScopeType={initialScopeType as any}
                        initialScopeId={initialScopeId}
                        initialQuestionCount={initialQuestionCount}
                    />
                ) : (
                    <JoinRoomTab onRoomJoined={handleRoomJoinedOrCreate} />
                )}
            </View>
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFFFFF",
    },
    activeRoomCard: {
        marginHorizontal: spacing.lg,
        marginTop: spacing.md,
        padding: spacing.md,
        backgroundColor: colors.primary100 || "#FDF3EA",
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: colors.primary200 || "#F5D0A9",
    },
    activeRoomHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: spacing.xs,
    },
    activeRoomBadge: {
        backgroundColor: colors.primary600 || "#C37938",
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: radii.pill,
    },
    activeRoomBadgeText: {
        ...typography.caption,
        color: "#FFFFFF",
        fontWeight: "700",
        fontSize: 10,
    },
    activeRoomCode: {
        ...typography.titleMedium,
        color: colors.neutral900,
        fontWeight: "700",
    },
    activeRoomSubtext: {
        ...typography.caption,
        color: colors.neutral700,
        marginBottom: spacing.md,
    },
    activeRoomActions: {
        flexDirection: "row",
        gap: spacing.sm,
    },
    reenterButton: {
        flex: 2,
        backgroundColor: colors.primary600 || "#C37938",
        paddingVertical: spacing.sm,
        borderRadius: radii.pill,
        alignItems: "center",
    },
    reenterButtonText: {
        ...typography.labelLarge,
        color: "#FFFFFF",
        fontWeight: "700",
    },
    leaveActiveButton: {
        flex: 1,
        backgroundColor: colors.neutral100,
        paddingVertical: spacing.sm,
        borderRadius: radii.pill,
        alignItems: "center",
        borderWidth: 1,
        borderColor: colors.neutral300,
    },
    leaveActiveButtonText: {
        ...typography.caption,
        color: colors.error600 || "#D9383A",
        fontWeight: "600",
    },
    tabContainer: {
        marginHorizontal: spacing.lg,
        marginTop: spacing.md,
        marginBottom: spacing.xs,
        backgroundColor: colors.neutral100,
    },
});

