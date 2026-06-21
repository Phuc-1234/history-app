import React from "react";
import { LessonMenu } from "../components/LessonMenu";
import { useRouter, useLocalSearchParams } from "expo-router";

export function LessonMenuScreen() {
    const router = useRouter();
    const { grade } = useLocalSearchParams();
    const selectedGrade = grade ? parseInt(grade as string, 10) : 11;

    const handleLessonNavigation = (id: number) => {
        router.push(`/(3_4_lessons)/lesson/${id}`);
    };

    const handleMindmapView = (topicId: number) => {
        console.log(`Open context-mindmap for Topic ID: ${topicId}`);
    };

    const handleTestEngine = (scopeType: string, scopeId: number) => {
        router.push({
            pathname: "/(6_tests)/6_2_ques_choose",
            params: {
                scopeType,
                scopeId: String(scopeId),
                purposeType: "EXAM",
            },
        });
    };

    return (
        <LessonMenu
            selectedGrade={selectedGrade}
            onLessonPress={handleLessonNavigation}
            onMindmapPress={handleMindmapView}
            onTestPress={handleTestEngine}
        />
    );
}
