import React from "react";
import { ActivityIndicator, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenWrapper } from "../../../components/layout/ScreenWrapper";
import { LessonSummary, useLessonSummary } from "../../../features/lesson";

export default function LessonSummaryScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { summaryData, rootSections, loading } = useLessonSummary(
        id || "default-id",
    );

    if (loading || !summaryData) {
        return (
            <View
                style={{
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                }}
            >
                <ActivityIndicator size="large" color="#5856D6" />
            </View>
        );
    }

    return (
        <ScreenWrapper
            branchConfig={{
                hierarchy: `Bài ${summaryData.position}`,
                title: summaryData.name,
                onBackPress: () => router.back(),
            }}
        >
            <LessonSummary
                data={summaryData}
                sections={rootSections}
                onNodePress={(nodeId) => {
                    router.push(`/(3_4_lessons)/lesson/node/${nodeId}`);
                }}
                onActionPress={(actionType) => {
                    console.log(
                        `Action triggers profile route pipeline: ${actionType} for Lesson ID: ${id}`,
                    );
                    if (actionType === "flashcard") {
                        router.push(`/(3_4_lessons)/4_4_fcard?lessonId=${id}`);
                    } else if (actionType === "mindmap") {
                        router.push(`/(3_4_lessons)/4_6_mind_map?lessonId=${id}`);
                    } else if (actionType === "quiz") {
                        router.push(`/(6_tests)/6_2_ques_choose`);
                    }
                }}
            />
        </ScreenWrapper>
    );
}
