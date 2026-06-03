import React from "react";
import { TopBarWrapper } from "../../features/top_bar";
import { LessonMenu } from "../../features/lesson_menu";
import { useRouter } from "expo-router";

const router = useRouter();

export default function LessonsScreen() {
    const handleLessonNavigation = (id: string) => {
        console.log(`${id}`);
        router.push(`/(3_4_lessons)/lesson/${id}`)
    };

    const handleMindmapView = (topicId: string) => {
        console.log(`Open context-mindmap for Topic ID: ${topicId}`);
    };

    const handleTestEngine = (testId: string) => {
        console.log(`Initialize test runner for Test ID: ${testId}`);
        router.push(`/(6_tests)/6_2_ques_choose`);
    };

    return (
        <TopBarWrapper>
            <LessonMenu
                onLessonPress={handleLessonNavigation}
                onMindmapPress={handleMindmapView}
                onTestPress={handleTestEngine}
            />
        </TopBarWrapper>
    );
}
