import { useGetGradeStructureQuery } from "../contentApiSlice";
import { TopicWithContentsDto, CompactTestDto } from "@history-app/shared";

export function useLessonMenu(selectedGrade: number) {
    // Fetch live data via RTK Query based on selected grade
    const { currentData: gradeStructure, error, refetch, isFetching } = useGetGradeStructureQuery(selectedGrade);

    // UI Mappings extracted cleanly from the API DTO structural contract
    const topics: TopicWithContentsDto[] = gradeStructure?.topics ?? [];
    const finalTest: CompactTestDto | null = gradeStructure?.gradeFirstTest ?? null;

    return {
        topics,
        finalTest,
        loading: !gradeStructure,
        error,
        refetch,
        isFetching,
    };
}