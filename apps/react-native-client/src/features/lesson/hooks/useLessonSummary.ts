import { useGetLessonTreeQuery } from "../lessonApiSlice";

// Overwritten: Using your precise Prisma-derived models and DTO structures directly
export interface LessonNode {
    id: number; // Swapped to match backend autoincrement integer [cite: 11]
    position: number; // From backend schema [cite: 11]
    header: string | null; // From backend schema [cite: 11]
    body: string; // From backend schema [cite: 11]
    imgUrl: string | null; // From backend schema [cite: 11]
    isComplete?: boolean | null;
}

export interface LessonSection {
    id: number; // Swapped to match backend autoincrement integer [cite: 8]
    name: string; // Replaced title with name from schema [cite: 8]
    summary: string | null; // From backend schema [cite: 8]
    position: number; // From backend schema [cite: 8]
    children: LessonSection[]; // Self-referencing recursive section tree layout [cite: 10]
    nodes: LessonNode[]; // Bound database node contents [cite: 11]
    progress?: { totalNodes: number; completedNodes: number } | null;
}

export interface LessonSummaryData {
    lessonId: number; // Swapped string -> number [cite: 3]
    position: number; // Changed lessonNumber -> position [cite: 3]
    name: string; // Changed title -> name [cite: 3]
    summary: string | null; // Changed description -> summary [cite: 3]
    topicId: number; // Linked directly from schema [cite: 3]
    videoId?: string; // Maps cleanly to Video model's UUID String [cite: 4]
    videoUrl?: string; // Maps cleanly to hlsUrl from schema [cite: 5]
}

export function useLessonSummary(lessonIdStr: string) {
    // Overwrite safety: Convert URL string identifiers safely to backend integers
    const lessonId = Number(lessonIdStr);
    const isInvalidId = Number.isNaN(lessonId);

    // RTK Query hooks handle internal cache states, reloading flags, and background fetches automatically
    const { data: lessonData, isLoading, error } = useGetLessonTreeQuery(lessonId, {
        skip: isInvalidId, // Guard execution against malformed route state
    });

    if (isInvalidId || error || !lessonData) {
        return {
            summaryData: null,
            rootSections: [] as LessonSection[],
            loading: isInvalidId ? false : isLoading,
        };
    }

    // Extract first target video parameters dynamically if attached to the collection
    const targetVideo = lessonData.videos && lessonData.videos.length > 0 ? lessonData.videos[0] : null;

    // Map properties accurately to fit client visual component formats
    const summaryData: LessonSummaryData = {
        lessonId: lessonData.id,
        position: lessonData.position,
        name: lessonData.name,
        summary: lessonData.summary || "",
        topicId: lessonData.topicId,
        videoId: targetVideo?.id,
        videoUrl: targetVideo?.hlsUrl,
    };

    // The backend tree assembler already computes the hierarchy recursively inside .sections
    const rootSections = lessonData.sections as unknown as LessonSection[];

    return {
        summaryData,
        rootSections,
        loading: isLoading,
    };
}