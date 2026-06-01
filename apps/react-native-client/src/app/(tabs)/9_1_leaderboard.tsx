import * as React from "react";
import { RankingView } from "../../features/leaderboard";
import { TopBarWrapper } from "@/features/top_bar";

export default function LeaderboardScreen() {
    return (
        <TopBarWrapper>
            <RankingView></RankingView>
        </TopBarWrapper>
    );
}
