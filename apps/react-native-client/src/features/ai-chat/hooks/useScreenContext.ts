import { useSegments, useLocalSearchParams } from "expo-router";
import { ScreenContextPayload } from "../services/aiChatApi";

export function useScreenContext(): ScreenContextPayload {
    const segments = useSegments() as string[];
    const params = useLocalSearchParams<{ id?: string; nodeId?: string; topicId?: string }>();

    const routeStr = segments.join("/");

    if (routeStr.includes("lesson_menu")) {
        return {
            screenName: "LessonMenuScreen",
            topicId: params.topicId ? Number(params.topicId) : undefined,
        };
    }

    if (routeStr.includes("node") || params.nodeId) {
        return {
            screenName: "NodeScreen",
            nodeId: params.nodeId ? Number(params.nodeId) : undefined,
            lessonId: params.id ? Number(params.id) : undefined,
        };
    }

    if (routeStr.includes("lesson") && params.id) {
        return {
            screenName: "LessonSummaryScreen",
            lessonId: Number(params.id),
        };
    }

    return {
        screenName: routeStr || "MainScreen",
    };
}
