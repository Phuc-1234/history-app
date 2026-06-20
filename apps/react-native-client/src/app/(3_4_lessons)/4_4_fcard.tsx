import React, { useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenWrapper } from "../../components/layout/ScreenWrapper";
import {
    FlashcardPlayScreen,
    FlashcardFreePlayScreen,
    FlashcardModeModal,
} from "../../features/flashcard";
import type { FlashcardMode } from "../../features/flashcard";

export default function FlashcardRoute() {
    const router = useRouter();
    const { lessonId, sectionId } = useLocalSearchParams<{ lessonId: string; sectionId: string }>();
    const [selectedMode, setSelectedMode] = useState<FlashcardMode | null>(null);
    const [modalVisible, setModalVisible] = useState(true);

    const numericLessonId = lessonId ? Number(lessonId) : undefined;
    const numericSectionId = sectionId ? Number(sectionId) : undefined;

    const handleBack = () => {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace("/(tabs)/lesson" as any);
        }
    };

    const handleSelectMode = (mode: FlashcardMode) => {
        setSelectedMode(mode);
        setModalVisible(false);
    };

    const handleCloseModal = () => {
        setModalVisible(false);
        // If no mode selected, go back
        if (!selectedMode) {
            handleBack();
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
            {/* Mode Selection Modal */}
            <FlashcardModeModal
                visible={modalVisible}
                onSelectMode={handleSelectMode}
                onClose={handleCloseModal}
            />

            {/* Render selected mode */}
            {selectedMode === "memorize" && (
                <FlashcardPlayScreen lessonId={numericLessonId} sectionId={numericSectionId} />
            )}
            {selectedMode === "free" && (
                <FlashcardFreePlayScreen lessonId={numericLessonId} sectionId={numericSectionId} />
            )}
        </ScreenWrapper>
    );
}
