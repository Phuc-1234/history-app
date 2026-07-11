import { useGetGradeStructureQuery } from "../contentApiSlice";
import { TopicWithContentsDto } from "@history-app/shared";

export function useLessonMenu(selectedGrade: number) {
    // Fetch live data via RTK Query based on selected grade
    const { currentData: gradeStructure, error, refetch, isFetching } = useGetGradeStructureQuery(selectedGrade);

    // UI Mappings extracted cleanly from the API DTO structural contract
    const topics: TopicWithContentsDto[] = gradeStructure?.topics ?? [];
    const finalTestPassed = !!gradeStructure?.testPassed;

    return {
        topics,
        finalTestPassed,
        gradeProgress: (gradeStructure as any)?.progress ?? null,
        loading: !gradeStructure,
        error,
        refetch,
        isFetching,
    };
}