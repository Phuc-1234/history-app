import React from "react";
import { TopBarWrapper } from "../../features/top_bar";
import { ShopView } from "../../features/shop";

export default function ShopScreen() {
  return (
    <TopBarWrapper>
      <ShopView />
    </TopBarWrapper>
  );
}