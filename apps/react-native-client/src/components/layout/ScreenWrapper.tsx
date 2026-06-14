import React from "react";
import {
    KeyboardAvoidingView,
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    View,
} from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { Edge } from "react-native-safe-area-context";
import { TopBar } from "../../features/top_bar/components/TopBar";
import { useTopBarData } from "../../features/top_bar/hooks/useTopBarData";
import {
    StreakCelebrationModal,
    StreakModal,
    RewardModal,
} from "../../features/streak";

// ─── Branch Config (matches existing TopBarWrapper/TopBar interface) ────────
export interface BranchConfig {
    hierarchy: string;
    title: string;
    subtitle?: string;
    onBackPress?: () => void;
}

// ─── Props ──────────────────────────────────────────────────────────────────
export interface ScreenWrapperProps {
    children: React.ReactNode;

    /** Show the top bar with user stats (default: true) */
    showTopBar?: boolean;

    /** Branch bar configuration – pass to show the breadcrumb/back bar */
    branchConfig?: BranchConfig;

    /** Enable KeyboardAvoidingView (default: false) */
    enableKeyboardAvoiding?: boolean;
    /** Extra vertical offset for the keyboard avoiding view */
    keyboardVerticalOffset?: number;

    /** Wrap children in a ScrollView (default: false) */
    enableScroll?: boolean;
    /** Style for the ScrollView's contentContainer */
    contentContainerStyle?: StyleProp<ViewStyle>;
    /** Keyboard persist taps behaviour for ScrollView */
    keyboardShouldPersistTaps?: "always" | "never" | "handled";
    /** Bounce effect on scroll (default: true) */
    bounces?: boolean;

    /** Enable pull-to-refresh on the ScrollView (default: false, requires enableScroll) */
    enableRefresh?: boolean;
    /** Whether the refresh indicator is currently spinning */
    refreshing?: boolean;
    /** Callback when the user pulls to refresh */
    onRefresh?: () => void;

    /** Which safe-area edges to respect (default: ['top', 'left', 'right']) */
    safeAreaEdges?: Edge[];

    /** Background colour of the outermost safe-area container (default: '#5856D6') */
    backgroundColor?: string;

    /** Additional style applied to the content container below the top bar */
    style?: StyleProp<ViewStyle>;
}

// ─── Internal: Content layer with optional KAV + Scroll ─────────────────────
function ContentLayer({
    children,
    enableKeyboardAvoiding,
    keyboardVerticalOffset,
    enableScroll,
    contentContainerStyle,
    keyboardShouldPersistTaps,
    bounces,
    enableRefresh,
    refreshing,
    onRefresh,
    style,
}: Omit<
    ScreenWrapperProps,
    | "showTopBar"
    | "branchConfig"
    | "safeAreaEdges"
    | "backgroundColor"
>) {
    // Build the innermost content – either a ScrollView or a plain View
    let content: React.ReactNode;

    if (enableScroll) {
        content = (
            <ScrollView
                style={styles.flex}
                contentContainerStyle={contentContainerStyle}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps={keyboardShouldPersistTaps ?? "handled"}
                bounces={bounces}
                refreshControl={
                    enableRefresh ? (
                        <RefreshControl
                            refreshing={refreshing ?? false}
                            onRefresh={onRefresh}
                            colors={["#5856D6"]}
                            tintColor="#5856D6"
                        />
                    ) : undefined
                }
            >
                {children}
            </ScrollView>
        );
    } else {
        content = (
            <View style={[styles.flex, style]}>
                {children}
            </View>
        );
    }

    // Optionally wrap in KAV
    if (enableKeyboardAvoiding) {
        return (
            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={keyboardVerticalOffset ?? 0}
            >
                {content}
            </KeyboardAvoidingView>
        );
    }

    return <>{content}</>;
}

// ─── Internal: Variant WITH top bar (calls useTopBarData hook) ──────────────
function ScreenWithTopBar({
    children,
    branchConfig,
    safeAreaEdges,
    backgroundColor,
    style,
    ...contentProps
}: ScreenWrapperProps) {
    const { data, streakManager } = useTopBarData();
    return (
        <SafeAreaView
            style={[
                styles.safeArea,
                { backgroundColor: backgroundColor ?? "#5856D6" },
            ]}
            edges={safeAreaEdges ?? ["top", "left", "right"]}
        >
            <TopBar
                data={data}
                branchConfig={branchConfig}
                onOpenStreak={streakManager.openStreak}
            />

            <View style={[styles.content, style]}>
                <ContentLayer {...contentProps}>
                    {children}
                </ContentLayer>
            </View>

            {/* Streak / Reward modals */}
            <StreakCelebrationModal
                visible={streakManager.celebrationVisible}
                onClose={streakManager.closeCelebration}
                currentStreak={data.currentStreak}
                onNext={streakManager.proceedToStreakModal}
            />
            <StreakModal
                visible={streakManager.streakVisible}
                onClose={streakManager.closeStreakModal}
                currentStreak={data.currentStreak}
                rewards={streakManager.rewards}
                milestones={streakManager.milestones}
                onClaimReward={streakManager.handleClaimReward}
            />
            <RewardModal
                visible={streakManager.rewardVisible}
                onClose={streakManager.closeRewardModal}
                goldAmount={50}
                badgeName="Huy hiệu Chăm Chỉ"
            />
        </SafeAreaView>
    );
}

// ─── Internal: Variant WITHOUT top bar (no hook call) ───────────────────────
function ScreenWithoutTopBar({
    children,
    safeAreaEdges,
    backgroundColor,
    style,
    ...contentProps
}: Omit<ScreenWrapperProps, "showTopBar" | "branchConfig">) {
    return (
        <SafeAreaView
            style={[
                styles.safeArea,
                { backgroundColor: backgroundColor ?? "#FFF" },
            ]}
            edges={safeAreaEdges ?? ["top", "left", "right"]}
        >
            <View style={[styles.content, style]}>
                <ContentLayer {...contentProps}>
                    {children}
                </ContentLayer>
            </View>
        </SafeAreaView>
    );
}

// ─── Public API ─────────────────────────────────────────────────────────────
export function ScreenWrapper({
    showTopBar = true,
    ...rest
}: ScreenWrapperProps) {
    if (showTopBar) {
        return <ScreenWithTopBar showTopBar {...rest} />;
    }
    return <ScreenWithoutTopBar {...rest} />;
}

// ─── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    content: {
        flex: 1,
        backgroundColor: "#FFF",
    },
    flex: {
        flex: 1,
    },
});
