import { useState, useEffect } from "react";
import { useGetGradeStructureQuery } from "../contentApiSlice";
import { TopicWithContentsDto, CompactTestDto } from "@history-app/shared";

export function useLessonMenu() {
    const [selectedGrade, setSelectedGrade] = useState<number>(11);
    const [expandedTopicId, setExpandedTopicId] = useState<number | null>(null);

    // Fetch live data via RTK Query based on selected grade
    const { data: gradeStructure, isLoading, isFetching, error, refetch } = useGetGradeStructureQuery(selectedGrade);

    const [loadedGrade, setLoadedGrade] = useState<number | null>(null);

    useEffect(() => {
        if (!isFetching && gradeStructure) {
            setLoadedGrade(selectedGrade);
        }
    }, [isFetching, gradeStructure, selectedGrade]);

    const isGradeSwitching = selectedGrade !== loadedGrade;

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
        loading: isGradeSwitching,
        error,
        refetch,
        isFetching,
    };
}