import React from "react";
import { TopBarWrapper } from "../../features/top_bar"; // Adjust directory alias mapping to match your project root layout config
import { NationalTestsView } from "../../features/national-tests";

export default function NationalTestsScreen() {
  return (
    <TopBarWrapper>
      <NationalTestsView />
    </TopBarWrapper>
  );
}