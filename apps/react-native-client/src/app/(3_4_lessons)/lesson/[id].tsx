import React from "react";
import { ActivityIndicator, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenWrapper } from "../../../components/layout/ScreenWrapper";
import { LessonSummary, useLessonSummary } from "../../../features/lesson";

export default function LessonSummaryScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { summaryData, rootSections, loading, isFetching, refetch } = useLessonSummary(
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
                onBackPress: () => router.back(),
            }}
            showTopBar={false}
            enableScroll={true}
            enableRefresh={true}
            refreshing={isFetching}
            onRefresh={refetch}
        >
            <LessonSummary
                data={summaryData}
                sections={rootSections}
                onNodePress={(nodeId) => {
                    // Collect all node IDs across sections for prev/next nav
                    const collectNodeIds = (sections: any[]): number[] => {
                        let ids: number[] = [];
                        for (const s of sections) {
                            if (s.nodes) ids.push(...s.nodes.map((n: any) => n.id));
                            if (s.children) ids.push(...collectNodeIds(s.children));
                        }
                        return ids;
                    };
                    const allNodeIds = collectNodeIds(rootSections);
                    router.push({
                        pathname: "/(3_4_lessons)/lesson/node/[nodeId]",
                        params: {
                            nodeId: String(nodeId),
                            sectionNodeIds: allNodeIds.join(","),
                            lessonName: summaryData.name,
                        },
                    } as any);
                }}
                onSectionTestPress={(sectionId) => {
                    router.push({
                        pathname: "/(6_tests)/6_2_ques_choose",
                        params: {
                            scopeType: "SECTION",
                            scopeId: String(sectionId),
                            purposeType: "PRACTICE",
                        },
                    });
                }}
                onActionPress={(actionType) => {
                    console.log(
                        `Action triggers profile route pipeline: ${actionType} for Lesson ID: ${id}`,
                    );
                    if (actionType === "flashcard") {
                        router.push(`/(3_4_lessons)/4_4_fcard?lessonId=${id}`);
                    } else if (actionType === "mindmap") {
                        router.push({
                            pathname: "/(3_4_lessons)/4_6_mind_map",
                            params: {
                                lessonId: id,
                                lessonName: summaryData.name,
                                lessonPosition: String(summaryData.position),
                            },
                        } as any);
                    } else if (actionType === "quiz") {
                        router.push({
                            pathname: "/(6_tests)/6_2_ques_choose",
                            params: {
                                scopeType: "LESSON",
                                scopeId: id,
                                purposeType: "EXAM",
                            },
                        });
                    }
                }}
            />
        </ScreenWrapper>
    );
}
