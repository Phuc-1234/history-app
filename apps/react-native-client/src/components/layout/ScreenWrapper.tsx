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
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import type { Edge } from "react-native-safe-area-context";
import { useSegments } from "expo-router";
import { TopBar } from "../../features/top_bar/components/TopBar";
import { useTopBarData } from "../../features/top_bar/hooks/useTopBarData";
import {
    StreakCelebrationModal,
    StreakModal,
    RewardModal,
} from "../../features/streak";
import { colors } from "../../theme/colors";
import HistoricalBackground from "./HistoricalBackground";

// ─── Branch Config (matches existing TopBarWrapper/TopBar interface) ────────
export interface BranchConfig {
    hierarchy: string;
    title?: string;
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

    /** Show historical moving background (default: true) */
    showHistoricalBackground?: boolean;
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
                            colors={[colors.primary]}
                            tintColor={colors.primary}
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
    showHistoricalBackground = true,
    ...contentProps
}: ScreenWrapperProps) {
    const { data, streakManager } = useTopBarData();
    const segments = useSegments() as string[];
    const insets = useSafeAreaInsets();

    const isInTabs = segments.includes("(tabs)");
    const hasBottomEdge = safeAreaEdges ? safeAreaEdges.includes("bottom") : !isInTabs;
    const resolvedEdges = (safeAreaEdges ?? (isInTabs ? ["top", "left", "right"] : ["top", "left", "right", "bottom"]))
        .filter((edge) => edge !== "bottom");

    return (
        <SafeAreaView
            style={[
                styles.safeArea,
                { backgroundColor: backgroundColor ?? colors.background },
            ]}
            edges={resolvedEdges}
        >
            <TopBar
                data={data}
                branchConfig={branchConfig}
                onOpenStreak={streakManager.openStreak}
            />

            <View style={[styles.content, style, hasBottomEdge && { paddingBottom: insets.bottom }]}>
                {showHistoricalBackground && <HistoricalBackground />}
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
    showHistoricalBackground = true,
    branchConfig,
    ...contentProps
}: Omit<ScreenWrapperProps, "showTopBar">) {
    const segments = useSegments() as string[];
    const insets = useSafeAreaInsets();

    const isInTabs = segments.includes("(tabs)");
    const hasBottomEdge = safeAreaEdges ? safeAreaEdges.includes("bottom") : !isInTabs;
    const resolvedEdges = (safeAreaEdges ?? (isInTabs ? ["top", "left", "right"] : ["top", "left", "right", "bottom"]))
        .filter((edge) => edge !== "bottom");

    return (
        <SafeAreaView
            style={[
                styles.safeArea,
                { backgroundColor: backgroundColor ?? colors.background },
            ]}
            edges={resolvedEdges}
        >
            {branchConfig && (
                <TopBar
                    showStatsBar={false}
                    branchConfig={branchConfig}
                />
            )}
            <View style={[styles.content, style, hasBottomEdge && { paddingBottom: insets.bottom }]}>
                {showHistoricalBackground && <HistoricalBackground />}
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
    showHistoricalBackground = true,
    ...rest
}: ScreenWrapperProps) {
    if (showTopBar) {
        return <ScreenWithTopBar showTopBar showHistoricalBackground={showHistoricalBackground} {...rest} />;
    }
    return <ScreenWithoutTopBar showHistoricalBackground={showHistoricalBackground} {...rest} />;
}

// ─── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    content: {
        flex: 1,
        backgroundColor: colors.background,
    },
    flex: {
        flex: 1,
    },
});
