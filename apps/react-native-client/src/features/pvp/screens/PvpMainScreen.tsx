import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { ScreenWrapper } from "@/components/layout/ScreenWrapper";
import { SlidingTabBar } from "@/components/SlidingTabBar";
import { colors, radii, spacing, typography } from "@/theme";
import { CreateRoomTab } from "../components/CreateRoomTab";
import { JoinRoomTab } from "../components/JoinRoomTab";
import { PvpLobbyView } from "../components/PvpLobbyView";
import { PvpGameScreen } from "./PvpGameScreen";
import { usePvpRealtime } from "../hooks/usePvpRealtime";
import { useSelector } from "react-redux";
import type { PvpRoom } from "../types";

export function PvpMainScreen({ onExit }: { onExit?: () => void }) {
    const profile = useSelector((state: any) => state.auth?.profile);
    const currentUserId = profile?.id ?? "";

    const [activeTab, setActiveTab] = useState<"create" | "join">("create");
    const [currentRoom, setCurrentRoom] = useState<PvpRoom | null>(null);

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
        resetState,
    } = usePvpRealtime(currentRoom?.code ?? null, currentRoom?.participants ?? []);

    const handleRoomJoinedOrCreate = (room: PvpRoom) => {
        setCurrentRoom(room);
    };

    const handleLeaveRoom = () => {
        setCurrentRoom(null);
        resetState();
    };

    // If game has started, switch to full-screen PvpGameScreen
    if (currentRoom && isGameStarted) {
        return (
            <PvpGameScreen
                roomCode={currentRoom.code}
                timeLimitSeconds={timeLimitSeconds}
                currentQuestionIndex={currentQuestionIndex}
                totalQuestions={totalQuestions}
                question={currentQuestion}
                questionResult={questionResult}
                finalLeaderboard={finalLeaderboard}
                answeredUserIds={answeredUserIds}
                currentUserId={currentUserId}
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
    if (currentRoom) {
        return (
            <ScreenWrapper showTopBar={false} branchConfig={branchConfig} showHistoricalBackground={false}>
                <PvpLobbyView
                    room={currentRoom}
                    participants={participants.length > 0 ? participants : currentRoom.participants}
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
                    <CreateRoomTab onRoomCreated={handleRoomJoinedOrCreate} />
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
