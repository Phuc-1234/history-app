import React, { useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenWrapper } from "../../components/layout/ScreenWrapper";
import { FlashcardFreePlayScreen } from "../../features/flashcard";
import { useAppSelector } from "@/store/storeHook";
import { PremiumModal } from "@/components/PremiumModal";

export default function FlashcardRoute() {
    const router = useRouter();
    const profile = useAppSelector((state) => state.auth.profile);
    const isUserPro = profile?.isPro === true;
    const [premiumModalVisible, setPremiumModalVisible] = useState(!isUserPro);

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

    if (!isUserPro) {
        return (
            <ScreenWrapper
                showTopBar={false}
                branchConfig={{
                    hierarchy: "LỚP SỬ 10 > CHƯƠNG I",
                    title: "Sử học và đời sống",
                    onBackPress: handleBack,
                }}
            >
                <PremiumModal
                    visible={premiumModalVisible}
                    onClose={() => {
                        setPremiumModalVisible(false);
                        handleBack();
                    }}
                    featureName="thẻ lật"
                />
            </ScreenWrapper>
        );
    }

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
