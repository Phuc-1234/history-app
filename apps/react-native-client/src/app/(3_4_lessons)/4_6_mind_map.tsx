import React, { useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenWrapper } from "../../components/layout/ScreenWrapper";
import MindMapScreen from "../../features/mind-map/components/MindMapScreen";
import type { MindMapQuery } from "../../features/mind-map/mindMapApi";
import { useAppSelector } from "@/store/storeHook";
import { PremiumModal } from "@/components/PremiumModal";

function toMindMapQuery(params: {
    lessonId?: string;
}): MindMapQuery | undefined {
    if (!params.lessonId) return undefined;

    const lessonId = Number(params.lessonId);
    if (!Number.isInteger(lessonId) || lessonId <= 0) return undefined;

    return { lessonId };
}

export default function MindMapRoute() {
    const router = useRouter();
    const profile = useAppSelector((state) => state.auth.profile);
    const isUserPro = profile?.isPro === true;
    const [premiumModalVisible, setPremiumModalVisible] = useState(!isUserPro);

    const params = useLocalSearchParams<{
        lessonId?: string;
        lessonName?: string;
        lessonPosition?: string;
    }>();
    const query = toMindMapQuery(params);

    const handleBack = () => {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace("/(3_4_lessons)/lesson/default-id");
        }
    };

    if (!isUserPro) {
        return (
            <ScreenWrapper
                showTopBar={false}
                branchConfig={{
                    hierarchy: params.lessonPosition ? `Bài ${params.lessonPosition}` : "Sơ đồ tư duy",
                    title: "Sơ đồ tư duy",
                    subtitle: params.lessonName || "",
                    onBackPress: handleBack,
                }}
            >
                <PremiumModal
                    visible={premiumModalVisible}
                    onClose={() => {
                        setPremiumModalVisible(false);
                        handleBack();
                    }}
                    featureName="mind map"
                />
            </ScreenWrapper>
        );
    }

    return (
        <ScreenWrapper
            showTopBar={false}
            branchConfig={{
                hierarchy: params.lessonPosition ? `Bài ${params.lessonPosition}` : "Sơ đồ tư duy",
                title: "Sơ đồ tư duy",
                subtitle: params.lessonName || "",
                onBackPress: handleBack,
            }}
        >
            <MindMapScreen query={query} />
        </ScreenWrapper>
    );
}
