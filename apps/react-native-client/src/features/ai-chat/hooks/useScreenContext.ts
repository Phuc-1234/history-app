import { useSegments, useGlobalSearchParams } from "expo-router";
import { useAppSelector } from "@/store/storeHook";
import { ScreenContextPayload } from "../services/aiChatApi";

const stripHtml = (html?: string | null): string => {
    if (!html) return "";
    let clean = html.replace(/<[^>]*>/g, " ");

    const entities: Record<string, string> = {
        "&nbsp;": " ",
        "&lt;": "<",
        "&gt;": ">",
        "&amp;": "&",
        "&quot;": '"',
        "&apos;": "'",
        "&cent;": "¢",
        "&pound;": "£",
        "&yen;": "¥",
        "&euro;": "€",
        "&copy;": "©",
        "&reg;": "®",
        "&ldquo;": "“",
        "&rdquo;": "”",
        "&lsquo;": "‘",
        "&rsquo;": "’",
    };

    clean = clean.replace(/&[a-zA-Z0-9#]+;/g, (match) => {
        if (entities[match]) return entities[match];
        if (match.startsWith("&#")) {
            const code = parseInt(match.slice(2, -1), 10);
            if (!isNaN(code)) return String.fromCharCode(code);
        }
        return match;
    });

    clean = clean.replace(/<[^>]*>/g, " ");
    return clean.replace(/\s+/g, " ").trim();
};

const getSnippet = (text: string, maxLength = 60): string => {
    if (!text) return "";
    const clean = text.trim();
    if (clean.length <= maxLength) return clean;
    return `${clean.slice(0, maxLength).trim()}...`;
};

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

    // Helper: Find lesson name or node title/snippet from RTK Query cache if available
    let resolvedLessonName = params.lessonName;
    let resolvedNodeTitle: string | undefined;

    if (queries) {
        for (const queryKey of Object.keys(queries)) {
            if (lessonId && queryKey.startsWith(`getLessonTree(${lessonId})`)) {
                const qData = queries[queryKey]?.data;
                if (qData?.name && !resolvedLessonName) {
                    resolvedLessonName = `Bài ${qData.position}: ${qData.name}`;
                }
            }
            if (nodeId) {
                if (queryKey.startsWith(`getNodeDetail(${nodeId})`)) {
                    const nodeData = queries[queryKey]?.data;
                    if (nodeData) {
                        if (nodeData.header?.trim()) {
                            resolvedNodeTitle = nodeData.header.trim();
                        } else if (nodeData.body) {
                            const clean = stripHtml(nodeData.body);
                            if (clean) {
                                resolvedNodeTitle = getSnippet(clean, 60);
                            }
                        }
                    }
                }
                if (queryKey.startsWith("getLessonTree(")) {
                    const qData = queries[queryKey]?.data;
                    if (qData?.sections) {
                        const findNode = (sections: any[]): { header?: string | null; body?: string } | undefined => {
                            for (const sec of sections) {
                                if (sec.nodes) {
                                    const matched = sec.nodes.find((n: any) => n.id === nodeId);
                                    if (matched) return matched;
                                }
                                if (sec.children) {
                                    const res = findNode(sec.children);
                                    if (res) return res;
                                }
                            }
                            return undefined;
                        };
                        const matched = findNode(qData.sections);
                        if (matched) {
                            if (!resolvedNodeTitle) {
                                if (matched.header?.trim()) {
                                    resolvedNodeTitle = matched.header.trim();
                                } else if (matched.body) {
                                    const clean = stripHtml(matched.body);
                                    if (clean) {
                                        resolvedNodeTitle = getSnippet(clean, 60);
                                    }
                                }
                            }
                            if (!resolvedLessonName && qData.name) {
                                resolvedLessonName = `Bài ${qData.position}: ${qData.name}`;
                            }
                        }
                    }
                }
            }
        }
    }

    // Supported study/lesson routes
    if (routeStr.includes("lesson_menu")) {
        return {
            screenName: grade ? `Môn học Lớp ${grade}` : "Danh sách bài học",
            topicId,
            grade,
            isSupported: true,
        };
    }

    if (routeStr.includes("node") || nodeId) {
        const title = resolvedNodeTitle
            ? `Nút: "${resolvedNodeTitle}"`
            : (resolvedLessonName ? `Chi tiết: ${resolvedLessonName}` : (nodeId ? `Nút kiến thức #${nodeId}` : "Chi tiết kiến thức"));
        return {
            screenName: title,
            nodeId,
            lessonId,
            grade,
            isSupported: true,
        };
    }

    if (routeStr.includes("mind_map")) {
        return {
            screenName: resolvedLessonName ? `Sơ đồ tư duy: ${resolvedLessonName}` : (lessonId ? `Sơ đồ tư duy Bài #${lessonId}` : "Sơ đồ tư duy"),
            lessonId,
            grade,
            isSupported: true,
        };
    }

    if (routeStr.includes("4_5_fcard_complete")) {
        return {
            screenName: resolvedLessonName ? `Hoàn thành thẻ: ${resolvedLessonName}` : "Hoàn thành thẻ ghi nhớ",
            lessonId,
            grade,
            isSupported: true,
        };
    }

    if (routeStr.includes("fcard")) {
        return {
            screenName: resolvedLessonName ? `Thẻ ghi nhớ: ${resolvedLessonName}` : (lessonId ? `Thẻ ghi nhớ Bài #${lessonId}` : "Thẻ ghi nhớ"),
            lessonId,
            grade,
            isSupported: true,
        };
    }

    if (routeStr.includes("lesson") || lessonId) {
        return {
            screenName: resolvedLessonName ? resolvedLessonName : (lessonId ? `Bài học #${lessonId}` : "Tóm tắt bài học"),
            lessonId,
            grade,
            isSupported: true,
        };
    }

    if (routeStr.includes("2_1_lessons")) {
        return { screenName: "Danh mục bài học", isSupported: true };
    }

    // Profile & Subscription screens
    if (routeStr.includes("10_8_subscription")) {
        return { screenName: "Gói đăng ký PRO", isSupported: false };
    }
    if (routeStr.includes("10_7_feedback_history")) {
        return { screenName: "Lịch sử phản hồi", isSupported: false };
    }
    if (routeStr.includes("10_6_feedback")) {
        return { screenName: "Gửi phản hồi & góp ý", isSupported: false };
    }
    if (routeStr.includes("10_5_test_detail")) {
        return { screenName: "Chi tiết bài làm", isSupported: false };
    }
    if (routeStr.includes("10_4_test_history")) {
        return { screenName: "Lịch sử làm bài", isSupported: false };
    }
    if (routeStr.includes("10_3_password_change")) {
        return { screenName: "Đổi mật khẩu", isSupported: false };
    }
    if (routeStr.includes("10_2_profile_edit")) {
        return { screenName: "Chỉnh sửa hồ sơ", isSupported: false };
    }
    if (routeStr.includes("10_1_profile")) {
        return { screenName: "Hồ sơ cá nhân", isSupported: false };
    }

    // Tests & Practice
    if (routeStr.includes("6_2_ques_choose")) {
        return {
            screenName: params.scopeType ? `Bài luyện tập / kiểm tra (${params.scopeType})` : "Màn hình bài kiểm tra",
            lessonId,
            grade,
            isSupported: false,
        };
    }
    if (routeStr.includes("5_1_national_tests")) {
        return { screenName: "Thi thử quốc gia", isSupported: false };
    }

    // Main Tab Screens
    if (routeStr.includes("home")) {
        return { screenName: "Trang chủ", isSupported: false };
    }
    if (routeStr.includes("9_1_leaderboard")) {
        return { screenName: "Bảng xếp hạng", isSupported: false };
    }
    if (routeStr.includes("8_2_buy_gold")) {
        return { screenName: "Cửa hàng vàng", isSupported: false };
    }
    if (routeStr.includes("7_1_item")) {
        return { screenName: "Tủ đồ vật phẩm", isSupported: false };
    }
    if (routeStr.includes("admin_feedback")) {
        return { screenName: "Quản lý góp ý", isSupported: false };
    }

    // Social screens
    if (routeStr.includes("friends")) {
        return { screenName: "Danh sách bạn bè", isSupported: false };
    }
    if (routeStr.includes("requests")) {
        return { screenName: "Lời mời kết bạn", isSupported: false };
    }
    if (routeStr.includes("search")) {
        return { screenName: "Tìm kiếm bạn bè", isSupported: false };
    }
    if (routeStr.includes("profile")) {
        return { screenName: "Hồ sơ bạn bè", isSupported: false };
    }

    // Auth screens
    if (routeStr.includes("1_1_login")) {
        return { screenName: "Đăng nhập", isSupported: false };
    }
    if (routeStr.includes("1_2_register")) {
        return { screenName: "Đăng ký", isSupported: false };
    }
    if (routeStr.includes("1_3_forgot")) {
        return { screenName: "Quên mật khẩu", isSupported: false };
    }
    if (routeStr.includes("1_4_otp_forgot")) {
        return { screenName: "Xác thực OTP", isSupported: false };
    }
    if (routeStr.includes("1_5_new_pass_forgot")) {
        return { screenName: "Đặt lại mật khẩu", isSupported: false };
    }
    if (routeStr.includes("1_6_otp_confirm")) {
        return { screenName: "Xác nhận đăng ký", isSupported: false };
    }

    // Miscellaneous
    if (routeStr.includes("notifications")) {
        return { screenName: "Thông báo", isSupported: false };
    }
    if (routeStr.includes("onboarding")) {
        return { screenName: "Giới thiệu ứng dụng", isSupported: false };
    }

    // Fallback: clean up raw route string if unmapped
    const cleanRouteName = routeStr
        ? routeStr.replace(/\([^)]+\)\//g, "").replace(/^\d+_\d+_/, "").replace(/_/g, " ")
        : "Trang chủ";

    return {
        screenName: cleanRouteName ? `Màn hình: ${cleanRouteName}` : "Trang chủ",
        lessonId,
        grade,
        isSupported: false,
    };
}
