import React from "react";
import { ScreenWrapper } from "../../components/layout/ScreenWrapper";
import { LessonMenu } from "../../features/lesson_menu";
import { useRouter } from "expo-router";

export default function LessonsScreen() {
    const router = useRouter();
    const handleLessonNavigation = (id: number) => {
        console.log(`${id}`);
        router.push(`/(3_4_lessons)/lesson/${id}`)
    };

    const handleMindmapView = (topicId: number) => {
        console.log(`Open context-mindmap for Topic ID: ${topicId}`);
    };

    const handleTestEngine = (testId: string) => {
        console.log(`Initialize test runner for Test ID: ${testId}`);
        router.push({ pathname: "/(6_tests)/6_2_ques_choose", params: { testId } });
    };

    return (
        <ScreenWrapper>
            <LessonMenu
                onLessonPress={handleLessonNavigation}
                onMindmapPress={handleMindmapView}
                onTestPress={handleTestEngine}
            />
        </ScreenWrapper>
    );
}
