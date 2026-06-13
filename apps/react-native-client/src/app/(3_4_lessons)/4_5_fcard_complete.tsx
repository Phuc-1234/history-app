import React from "react";
import { useRouter } from "expo-router";
import { ScreenWrapper } from "../../components/layout/ScreenWrapper";
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
        <ScreenWrapper
            branchConfig={{
                hierarchy: "LỚP SỬ 10 > CHƯƠNG I",
                title: "Sử học và đời sống",
                onBackPress: handleBack,
            }}
        >
            <FlashcardCompleteScreen />
        </ScreenWrapper>
    );
}
