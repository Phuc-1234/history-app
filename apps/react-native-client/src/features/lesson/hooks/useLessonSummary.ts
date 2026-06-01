import { useState, useEffect } from "react";

export interface LessonNode {
    id: string;
    text: string;
}

export interface LessonSection {
    id: string;
    title: string;
    nodes?: LessonNode[];
    subsections?: LessonSection[];
}

export interface LessonSummaryData {
    lessonId: string;
    lessonNumber: number;
    title: string;
    description: string;
    hierarchy: string;
    chapterTitle: string;
    videoId?: number;
    videoUrl?: string;
}

// A mock local database dictionary of our lessons
const LESSON_DATABASE: Record<
    string,
    { info: LessonSummaryData; sections: LessonSection[] }
> = {
    "les-1": {
        info: {
            lessonId: "les-1",
            lessonNumber: 1,
            title: "Sự xuất hiện của loài người",
            description:
                "Tìm hiểu nguồn gốc sâu xa của loài người, các bước ngoặt tiến hóa sinh học quan trọng từ vượn thành người và đặc điểm đời sống vật chất, xã hội thời nguyên thủy.",
            hierarchy: "LỊCH SỬ 10 > CHƯƠNG I",
            chapterTitle: "Sử học và đời sống",
            videoId: 1,
            videoUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
        },
        sections: [
            {
                id: "sec-1-1",
                title: "Phần 1: Quá trình tiến hóa từ vượn thành người",
                subsections: [
                    {
                        id: "sec-1-1-sub1",
                        title: "1. Giai đoạn Người tối cổ (Khoảng 4 triệu năm trước)",
                        nodes: [
                            { id: "n1", text: "Biến đổi sinh học: Đã đi bằng hai chân, đôi tay được giải phóng để cầm nắm dụng cụ." },
                            { id: "n2", text: "Dấu tích khảo cổ: Tìm thấy xương hóa thạch ở Đông Phi, đảo Gia-va (In-đô-nê-xi-a), và răng hóa thạch ở Thẩm Khuyên, Thẩm Hai (Việt Nam)." },
                            { id: "n3", text: "Đời sống: Sống thành từng bầy (bầy người nguyên thủy), ghè đẽo thô sơ một mặt mảnh đá làm công cụ chặt." }
                        ]
                    },
                    {
                        id: "sec-1-1-sub2",
                        title: "2. Giai đoạn Người tinh khôn (Khoảng 4 vạn năm trước)",
                        nodes: [
                            { id: "n4", text: "Biến đổi sinh học: Cấu tạo cơ thể hoàn thiện giống người ngày nay, thể tích não lớn, xương cốt nhỏ đi mượt mà hơn." },
                            { id: "n5", text: "Công cụ cải tiến: Biết ghè đẽo hai mặt đá mịn, làm lao, cung tên, và chế tác đồ gốm." }
                        ]
                    }
                ]
            },
            {
                id: "sec-1-2",
                title: "Phần 2: Tổ chức xã hội thời nguyên thủy",
                nodes: [
                    { id: "n6", text: "Thị tộc: Nhóm hơn vài chục gia đình có cùng quan hệ huyết thống, hợp tác lao động chung tuyệt đối." },
                    { id: "n7", text: "Bộ lạc: Tập hợp nhiều thị tộc sống cạnh nhau, có chung vùng săn bắn và ngôn ngữ giao tiếp." }
                ]
            }
        ],
    },
    "les-2": {
        info: {
            lessonId: "les-2",
            lessonNumber: 2,
            title: "Các quốc gia cổ đại phương Đông",
            description:
                "Khám phá sự hình thành của các nền văn minh rực rỡ đầu tiên của nhân loại bên lưu vực các dòng sông lớn châu Á và châu Phi, cùng cấu trúc nhà nước chuyên chế trung ương tập quyền.",
            hierarchy: "LỊCH SỬ 10 > CHƯƠNG I",
            chapterTitle: "Sử học và đời sống",
            videoId: 2,
            videoUrl: "https://test-streams.mux.dev/test_001/stream.m3u8",
        },
        sections: [
            {
                id: "sec-2-1",
                title: "Phần 1: Cơ sở hình thành văn minh",
                subsections: [
                    {
                        id: "sec-2-1-sub1",
                        title: "1. Điều kiện tự nhiên (Hệ thống sông lớn)",
                        nodes: [
                            { id: "n8", text: "Ai Cập cổ đại gắn liền với sông Nile; Lưỡng Hà gắn liền với sông Euphrates và Tigris." },
                            { id: "n9", text: "Ấn Độ phát triển quanh sông Ấn, sông Hằng; Trung Quốc hình thành dọc sông Hoàng Hà, Trường Giang." },
                            { id: "n10", text: "Thuận lợi: Đất phù sa màu mỡ, nguồn nước tưới dồi dào, dễ canh tác lúa nước." },
                            { id: "n11", text: "Khó khăn: Lũ lụt xảy ra thường niên đòi hỏi cư dân phải sớm liên kết làm thủy lợi." }
                        ]
                    },
                    {
                        id: "sec-2-1-sub2",
                        title: "2. Điều kiện kinh tế - xã hội",
                        nodes: [
                            { id: "n12", text: "Nông nghiệp trồng lúa nước giữ vai trò chủ đạo, kết hợp chăn nuôi và thủ công nghiệp." },
                            { id: "n13", text: "Xã hội phân hóa thành 3 giai cấp: Quý tộc (vua, quan lại), nông dân công xã (lực lượng sản xuất chính), và nô lệ." }
                        ]
                    }
                ]
            },
            {
                id: "sec-2-2",
                title: "Phần 2: Chế độ nhà nước và thành tựu văn hóa tiêu biểu",
                subsections: [
                    {
                        id: "sec-2-2-sub1",
                        title: "1. Nhà nước chuyên chế cổ đại phương Đông",
                        nodes: [
                            { id: "n14", text: "Mô hình: Quân chủ chuyên chế trung ương tập quyền, quyền lực tối cao tập trung hoàn toàn vào tay Vua." },
                            { id: "n15", text: "Danh xưng: Ở Ai Cập vua gọi là Pharaoh, Lưỡng Hà gọi là Ensi, Trung Quốc gọi là Thiên tử." }
                        ]
                    },
                    {
                        id: "sec-2-2-sub2",
                        title: "2. Các thành tựu văn hóa cốt lõi",
                        nodes: [
                            { id: "n16", text: "Lịch pháp và Thiên văn: Phát minh ra Nông lịch (1 năm có 365 ngày chia làm 12 tháng)." },
                            { id: "n17", text: "Chữ viết: Chữ tượng hình vẽ lại sự vật (trên giấy papyrus của Ai Cập, trên mai rùa của Trung Quốc)." },
                            { id: "n18", text: "Toán học: Tính được số Pi = 3.16, phát minh số 0 của người Ấn Độ, giỏi hình học biên giới ruộng đất." }
                        ]
                    }
                ]
            }
        ],
    },
    "les-3": {
        info: {
            lessonId: "les-3",
            lessonNumber: 3,
            title: "Các quốc gia cổ đại phương Tây",
            description:
                "Tìm hiểu về cái nôi văn minh Hy Lạp và La Mã cổ đại dọc bờ biển Địa Trung Hải, sự trỗi dậy của kinh tế thương mại hàng hải và mô hình cộng hòa chiếm nô độc đáo.",
            hierarchy: "LỊCH SỬ 10 > CHƯƠNG I",
            chapterTitle: "Sử học và đời sống",
            videoId: 3,
            videoUrl: "https://test-streams.mux.dev/pts_shift/master.m3u8",
        },
        sections: [
            {
                id: "sec-3-1",
                title: "Phần 1: Điều kiện tự nhiên và sự hình thành thành bang",
                subsections: [
                    {
                        id: "sec-3-1-sub1",
                        title: "1. Không gian Địa Trung Hải",
                        nodes: [
                            { id: "n19", text: "Khác biệt phương Đông: Bờ biển khúc khuỷu, nhiều vịnh cảng tự nhiên sâu, lòng đất nhiều khoáng sản (sắt, đồng, vàng)." },
                            { id: "n20", text: "Hạn chế: Đất đai khô cằn, đồi núi chia cắt phức tạp, không thuận lợi trồng lúa lương thực diện rộng." }
                        ]
                    },
                    {
                        id: "sec-3-1-sub2",
                        title: "2. Kinh tế hàng hải và thủ công",
                        nodes: [
                            { id: "n21", text: "Phát triển mạnh thủ công nghiệp: Chế tạo vũ khí sắt, đồ gốm sứ màu sắc, luyện kim tinh xảo." },
                            { id: "n22", text: "Kinh tế hàng hóa: Xuất khẩu rượu nho, dầu ô liu; nhập khẩu ngũ cốc từ các nơi khác thông qua giao thương tàu biển." }
                        ]
                    }
                ]
            },
            {
                id: "sec-3-2",
                title: "Phần 2: Thể chế chính trị Thị quốc chiếm nô",
                nodes: [
                    { id: "n23", text: "Khái niệm Thành bang (Thị quốc): Mỗi thành phố là một quốc gia độc lập có quân đội, luật pháp, tiền tệ riêng (Ví dụ: Athens, Sparta)." },
                    { id: "n24", text: "Bản chất dân chủ chủ nô: Quyền lực nằm trong tay Hội đồng công dân tự do (chỉ nam giới bản địa), còn nô lệ bị coi là vật sở hữu biết nói, không có quyền người." }
                ]
            }
        ],
    },
};

export function useLessonSummary(lessonId: string) {
    const [summaryData, setSummaryData] = useState<LessonSummaryData | null>(
        null,
    );
    const [rootSections, setRootSections] = useState<LessonSection[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);

        // Look up the lesson matching the ID from our mini-database
        const lessonData = LESSON_DATABASE[lessonId];

        if (lessonData) {
            setSummaryData(lessonData.info);
            setRootSections(lessonData.sections);
        } else {
            // Fallback fallback state if the ID isn't found in our mock database yet
            setSummaryData({
                lessonId,
                lessonNumber: 0,
                title: `Lesson Summary ${lessonId}`,
                description: "Nội dung bài học này đang được cập nhật...",
                hierarchy: "LỊCH SỬ 10",
                chapterTitle: "Đang tải chương...",
            });
            setRootSections([]);
        }

        setLoading(false);
    }, [lessonId]); // ✨ CRITICAL: This array triggers the effect to rerun whenever the URL ID changes!

    return { summaryData, rootSections, loading };
}
