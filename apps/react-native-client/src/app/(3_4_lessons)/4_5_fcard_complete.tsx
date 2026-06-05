import React from "react";
import { useRouter } from "expo-router";
import { TopBarWrapper } from "../../features/top_bar";
import { FlashcardCompleteScreen } from "../../features/flashcard";

export default function FlashcardCompleteRoute() {
    const router = useRouter();

    const handleBack = () => {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace("/(tabs)/lesson");
        }
    };

    return (
        <TopBarWrapper
            branchConfig={{
                hierarchy: "LỚP SỬ 10 > CHƯƠNG I",
                title: "Sử học và đời sống",
                onBackPress: handleBack,
            }}
        >
            <FlashcardCompleteScreen />
        </TopBarWrapper>
    );
}
