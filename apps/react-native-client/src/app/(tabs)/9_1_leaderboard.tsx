import * as React from "react";
import { RankingView } from "../../features/leaderboard";
import { ScreenWrapper } from "../../components/layout/ScreenWrapper";

export default function LeaderboardScreen() {
    return (
        <ScreenWrapper>
            <RankingView></RankingView>
        </ScreenWrapper>
    );
}
