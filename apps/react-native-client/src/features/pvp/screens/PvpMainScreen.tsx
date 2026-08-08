import React, { useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";
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

interface PvpMainScreenProps {
    onExit?: () => void;
    initialMode?: "AUTO_PICK" | "CURATED";
    initialTestId?: string;
    initialScopeType?: string;
    initialScopeId?: number;
    initialQuestionCount?: number;
}

export function PvpMainScreen({
    onExit,
    initialMode,
    initialTestId,
    initialScopeType,
    initialScopeId,
    initialQuestionCount,
}: PvpMainScreenProps) {
    const profile = useSelector((state: any) => state.auth?.profile);
    const currentUserId = profile?.id ?? "";

    const [activeTab, setActiveTab] = useState<"create" | "join">("create");
    const [currentRoom, setCurrentRoom] = useState<PvpRoom | null>(null);
    const hasAttemptedRestoreRef = React.useRef(false);

    const { data: activeRoomData, refetch: refetchActiveRoom } = useGetActivePvpRoomQuery();
    const [leavePvpRoomMut] = useLeavePvpRoomMutation();

    useEffect(() => {
        if (activeRoomData && !currentRoom && !hasAttemptedRestoreRef.current) {
            hasAttemptedRestoreRef.current = true;
            setCurrentRoom(activeRoomData);
        }
    }, [activeRoomData, currentRoom]);

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
        resetState,
    } = usePvpRealtime(currentRoom?.code ?? null, currentRoom?.participants ?? []);

    const effectiveRoom = currentRoom
        ? {
              ...currentRoom,
              hostUserId: realtimeHostUserId ?? currentRoom.hostUserId,
          }
        : null;

    const handleRoomJoinedOrCreate = (room: PvpRoom) => {
        setCurrentRoom(room);
    };

    const handleLeaveRoom = async () => {
        hasAttemptedRestoreRef.current = true;
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
    };

    // If game has started, switch to full-screen PvpGameScreen
    if (effectiveRoom && isGameStarted) {
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
            />
        );
    }

    const branchConfig = {
        hierarchy: "PVP",
        title: "Thi đấu PVP",
        hideBack: false,
        hideHome: false,
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
    tabContainer: {
        marginHorizontal: spacing.lg,
        marginTop: spacing.md,
        marginBottom: spacing.xs,
        backgroundColor: colors.neutral100,
    },
});
