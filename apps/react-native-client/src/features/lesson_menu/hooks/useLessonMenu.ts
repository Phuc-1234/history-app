import { setProfile } from "@/features/auth/store/authSlice";
import { useState, useEffect } from "react";

export interface Lesson {
    id: string;
    title: string;
    lessonNumber: number;
}

export interface Topic {
    id: string;
    title: string; // e.g., "CHỦ ĐỀ 1: THẾ GIỚI CỔ ĐẠI"
    description: string; // e.g., "Khám phá nguồn gốc loài người..."
    lessons: Lesson[];
    topicTestId: string; // Used for "KIỂM TRA CHỦ ĐỀ"
}

export interface GradeData {
    gradeId: number; // 10, 11, or 12
    topics: Topic[];
    finalTestId: string; // Used for "THI CUỐI KỲ"
}

export function useLessonMenu() {

    

    const [selectedGrade, setSelectedGrade] = useState<number>(11); // Defaults to Grade 11 like your screenshot
    const [expandedTopicId, setExpandedTopicId] = useState<string | null>(
        "topic-1",
    ); // Default open topic
    const [data, setData] = useState<GradeData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulating API loading of historical curriculum structure
        const fetchMenuData = () => {
            const mockData: GradeData[] = [
                {
                    gradeId: 10,
                    finalTestId: "final-test-10",
                    topics: [],
                },
                {
                    gradeId: 11,
                    finalTestId: "final-test-11",
                    topics: [
                        {
                            id: "topic-1",
                            title: "CHỦ ĐỀ 1: THẾ GIỚI CỔ ĐẠI",
                            description:
                                "Khám phá nguồn gốc loài người và văn minh đầu tiên",
                            topicTestId: "topic-test-1",
                            lessons: [
                                {
                                    id: "les-1",
                                    lessonNumber: 1,
                                    title: "Sự xuất hiện của loài người",
                                },
                                {
                                    id: "les-2",
                                    lessonNumber: 2,
                                    title: "Các quốc gia cổ đại phương Đông",
                                },
                                {
                                    id: "les-3",
                                    lessonNumber: 3,
                                    title: "Các quốc gia cổ đại phương Tây",
                                },
                            ],
                        },
                        {
                            id: "topic-2",
                            title: "CHỦ ĐỀ 2: VIỆT NAM TỪ NGUỒN GỐC",
                            description:
                                "Thời kỳ Hùng Vương và văn minh Văn Lang",
                            topicTestId: "topic-test-2",
                            lessons: [],
                        },
                        {
                            id: "topic-3",
                            title: "CHỦ ĐỀ 3: THỜI KỲ BẮC THUỘC",
                            description:
                                "Các cuộc khởi nghĩa giành độc lập dân tộc",
                            topicTestId: "topic-test-3",
                            lessons: [],
                        },
                        {
                            id: "topic-4",
                            title: "CHỦ ĐỀ 4: BUỔI ĐẦU ĐỘC LẬP",
                            description: "Thời kỳ Ngô - Đinh - Tiền Lê",
                            topicTestId: "topic-test-4",
                            lessons: [],
                        },
                    ],
                },
                {
                    gradeId: 12,
                    finalTestId: "final-test-12",
                    topics: [],
                },
            ];

            setData(mockData);
            setLoading(false);
        };

        fetchMenuData();
    }, []);

    const toggleTopic = (topicId: string) => {
        setExpandedTopicId((prev) => (prev === topicId ? null : topicId));
    };

    const currentGradeData =
        data.find((g) => g.gradeId === selectedGrade) || null;

    return {
        selectedGrade,
        setSelectedGrade,
        expandedTopicId,
        toggleTopic,
        currentGradeData,
        loading,
    };
}
