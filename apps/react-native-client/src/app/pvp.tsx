import React from "react";
import { useRouter } from "expo-router";
import { PvpMainScreen } from "@/features/pvp";

export default function PvpRoute() {
    const router = useRouter();
    return <PvpMainScreen onExit={() => router.back()} />;
}
