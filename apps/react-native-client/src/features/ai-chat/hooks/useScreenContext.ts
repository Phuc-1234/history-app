import { useSegments, useGlobalSearchParams } from "expo-router";
import { useAppSelector } from "@/store/storeHook";
import { ScreenContextPayload } from "../services/aiChatApi";

export function useScreenContext(): ScreenContextPayload {
    const segments = useSegments() as string[];
    const params = useGlobalSearchParams<{
        id?: string;
        lessonId?: string;
        nodeId?: string;
        topicId?: string;
        grade?: string;
        lessonName?: string;
        scopeType?: string;
        scopeId?: string;
    }>();

    const queries = useAppSelector((state: any) => state.api?.queries);

    const routeStr = segments.join("/");

    const lessonIdStr = params.lessonId || params.id;
    const lessonId = lessonIdStr && !isNaN(Number(lessonIdStr)) ? Number(lessonIdStr) : undefined;
    const nodeId = params.nodeId && !isNaN(Number(params.nodeId)) ? Number(params.nodeId) : undefined;
    const topicId = params.topicId && !isNaN(Number(params.topicId)) ? Number(params.topicId) : undefined;
    const grade = params.grade && !isNaN(Number(params.grade)) ? Number(params.grade) : undefined;

    // Helper: Find lesson name or node title from RTK Query cache if available
    let resolvedLessonName = params.lessonName;
    let resolvedNodeHeader: string | undefined;

    if (queries) {
        for (const queryKey of Object.keys(queries)) {
            if (lessonId && queryKey.startsWith(`getLessonTree(${lessonId})`)) {
                const qData = queries[queryKey]?.data;
                if (qData?.name && !resolvedLessonName) {
                    resolvedLessonName = `Bài ${qData.position}: ${qData.name}`;
                }
            }
            if (nodeId && queryKey.startsWith("getLessonTree(")) {
                const qData = queries[queryKey]?.data;
                if (qData?.sections) {
                    const findNodeHeader = (sections: any[]): string | undefined => {
                        for (const sec of sections) {
                            if (sec.nodes) {
                                const matched = sec.nodes.find((n: any) => n.id === nodeId);
                                if (matched) return matched.header || sec.name;
                            }
                            if (sec.children) {
                                const res = findNodeHeader(sec.children);
                                if (res) return res;
                            }
                        }
                        return undefined;
                    };
                    const header = findNodeHeader(qData.sections);
                    if (header) {
                        resolvedNodeHeader = header;
                        if (!resolvedLessonName && qData.name) {
                            resolvedLessonName = `Bài ${qData.position}: ${qData.name}`;
                        }
                    }
                }
            }
        }
    }

    if (routeStr.includes("lesson_menu")) {
        return {
            screenName: grade ? `Môn học Lớp ${grade}` : "Danh sách bài học",
            topicId,
            grade,
        };
    }

    if (routeStr.includes("node") || nodeId) {
        const title = resolvedNodeHeader
            ? `Nút: "${resolvedNodeHeader}"`
            : (resolvedLessonName ? `Chi tiết: ${resolvedLessonName}` : (nodeId ? `Nút kiến thức #${nodeId}` : "Chi tiết kiến thức"));
        return {
            screenName: title,
            nodeId,
            lessonId,
            grade,
        };
    }

    if (routeStr.includes("mind_map")) {
        return {
            screenName: resolvedLessonName ? `Sơ đồ tư duy: ${resolvedLessonName}` : (lessonId ? `Sơ đồ tư duy Bài #${lessonId}` : "Sơ đồ tư duy"),
            lessonId,
            grade,
        };
    }

    if (routeStr.includes("fcard")) {
        return {
            screenName: resolvedLessonName ? `Thẻ ghi nhớ: ${resolvedLessonName}` : (lessonId ? `Thẻ ghi nhớ Bài #${lessonId}` : "Thẻ ghi nhớ"),
            lessonId,
            grade,
        };
    }

    if (routeStr.includes("lesson") || lessonId) {
        return {
            screenName: resolvedLessonName ? resolvedLessonName : (lessonId ? `Bài học #${lessonId}` : "Tóm tắt bài học"),
            lessonId,
            grade,
        };
    }

    if (routeStr.includes("6_2_ques_choose")) {
        return {
            screenName: params.scopeType ? `Bài luyện tập / kiểm tra (${params.scopeType})` : "Màn hình bài kiểm tra",
            lessonId,
            grade,
        };
    }

    if (routeStr.includes("home")) {
        return { screenName: "Trang chủ" };
    }
    if (routeStr.includes("9_1_leaderboard")) {
        return { screenName: "Bảng xếp hạng" };
    }
    if (routeStr.includes("8_2_buy_gold")) {
        return { screenName: "Cửa hàng vàng" };
    }
    if (routeStr.includes("7_1_item")) {
        return { screenName: "Tủ đồ vật phẩm" };
    }
    if (routeStr.includes("5_1_national_tests")) {
        return { screenName: "Thi thử quốc gia" };
    }
    if (routeStr.includes("10_1_profile")) {
        return { screenName: "Hồ sơ cá nhân" };
    }

    return {
        screenName: routeStr ? `Màn hình: ${routeStr}` : "Trang chủ",
        lessonId,
        grade,
    };
}
