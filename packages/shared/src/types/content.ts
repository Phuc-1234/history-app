// types/content.ts
// Strict request/response types for the content API endpoints

export interface GradeDto {
    id: number;
    state: "PUBLIC" | "PRIVATE";
}

export interface TopicDto {
    id: number;
    name: string;
    position: number;
    gradeId: number;
}

export interface LessonDto {
    id: number;
    name: string;
    summary?: string | null;
    position: number;
    topicId: number;
}

export interface NodeDto {
    id: number;
    position: number;
    header: string;
    body: string;
    imgUrl?: string | null;
    sectionId: number | null;
}

export interface SectionDto {
    id: number;
    name: string;
    summary?: string | null;
    position: number;
    lessonId: number;
    parentSectionId?: number | null;
    // nested children (tree shape)
    children?: SectionDto[];
    // nodes directly under this section
    nodes?: NodeDto[];
}

// ---- Response bodies ----
export type GetGradesResponse = { grades: GradeDto[] } | { error: string };

export type GetTopicsResponse = { topics: TopicDto[] } | { error: string };

export type GetLessonsResponse = { lessons: LessonDto[] } | { error: string };

export type GetSectionsResponse =
    | { sections: SectionDto[] }
    | { error: string };

// Tree response for a lesson: top-level sections (with children recursively) and stand-alone nodes
export type GetLessonTreeResponse = { tree: SectionDto[] } | { error: string };
