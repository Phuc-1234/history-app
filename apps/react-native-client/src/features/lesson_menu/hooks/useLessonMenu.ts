import { useState } from "react";
import { useGetGradeStructureQuery } from "../contentApiSlice";
import { TopicWithContentsDto, CompactTestDto } from "@history-app/shared";

export function useLessonMenu() {
    const [selectedGrade, setSelectedGrade] = useState<number>(11);
    const [expandedTopicId, setExpandedTopicId] = useState<number | null>(null);

    // Fetch live data via RTK Query based on selected grade
    const { currentData: gradeStructure, error, refetch, isFetching } = useGetGradeStructureQuery(selectedGrade);

    const toggleTopic = (topicId: number) => {
        setExpandedTopicId((prev) => (prev === topicId ? null : topicId));
    };

    // UI Mappings extracted cleanly from the API DTO structural contract
    const topics: TopicWithContentsDto[] = gradeStructure?.topics ?? [];
    const finalTest: CompactTestDto | null = gradeStructure?.gradeFirstTest ?? null;

    return {
        selectedGrade,
        setSelectedGrade,
        expandedTopicId,
        toggleTopic,
        topics,
        finalTest,
        loading: !gradeStructure,
        error,
        refetch,
        isFetching,
    };
}