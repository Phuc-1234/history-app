import React from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenWrapper } from "../../components/layout/ScreenWrapper";
import { FlashcardFreePlayScreen } from "../../features/flashcard";

export default function FlashcardRoute() {
    const router = useRouter();
    const { lessonId, sectionId, nodeId } = useLocalSearchParams<{ lessonId: string; sectionId: string; nodeId: string }>();

    const numericLessonId = lessonId ? Number(lessonId) : undefined;
    const numericSectionId = sectionId ? Number(sectionId) : undefined;
    const numericNodeId = nodeId ? Number(nodeId) : undefined;

    const handleBack = () => {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace("/(tabs)/lesson" as any);
        }
    };

    return (
        <ScreenWrapper
            showTopBar={false}
            branchConfig={{
                hierarchy: "LỚP SỬ 10 > CHƯƠNG I",
                title: "Sử học và đời sống",
                onBackPress: handleBack,
                
            }}
        >
            <FlashcardFreePlayScreen
                lessonId={numericLessonId}
                sectionId={numericSectionId}
                nodeId={numericNodeId}
            />
        </ScreenWrapper>
    );
}
