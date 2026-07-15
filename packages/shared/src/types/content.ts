// types/content.ts
// Strict request/response types for the content API endpoints

export interface GradeDto {
    id: number;
    state: "PUBLIC" | "PRIVATE";
    isPro?: boolean;
    imgUrl?: string | null;
    masteryPercentage?: number | null;
}

export interface TopicDto {
    id: number;
    name: string;
    position: number;
    gradeId: number;
    masteryPercentage?: number | null;
}

export interface LessonDto {
    id: number;
    name: string;
    summary?: string | null;
    position: number;
    topicId: number;
    isPro?: boolean;
    imgUrl?: string | null;
    masteryPercentage?: number | null;
}

export interface NodeDto {
    id: number;
    position: number;
    header: string | null;
    body: string;
    imgUrl?: string | null;
    videoId?: string | null;
    sectionId: number | null;
    isComplete?: boolean | null;
    masteryPercentage?: number | null;
}

export interface SectionDto {
    id: number;
    name: string;
    summary?: string | null;
    position: number;
    lessonId: number;
    parentSectionId?: number | null;
    masteryPercentage?: number | null;
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

export type GetNodesResponse = { nodes: NodeDto[] } | { error: string };



// ---- Mind Map Types ----
export interface MindMapNode {
    id: number;
    type: "grade" | "topic" | "lesson" | "section" | "node";
    name?: string;
    header?: string | null;
    body?: string;
    children?: MindMapNode[];
}

export interface MindMapRequestQuery {
    gradeId?: string;
    topicId?: string;
    lessonId?: string;
}

export type GetMindMapResponse = { tree: MindMapNode } | { error: string };


// get grade structure

export interface CompactTestDto {
    id: string;
    title: string;
    questionNumber: number;
    timeLimit: number | null;
    isPassed?: boolean | null;
}

export interface TopicWithContentsDto {
    id: number;
    name: string;
    position: number;
    gradeId: number;
    lessons: LessonDto[];
    testPassed?: boolean | null;
    masteryPercentage?: number | null;
}

export interface GradeStructureDto {
    topics: TopicWithContentsDto[];
    testPassed?: boolean | null;
    masteryPercentage?: number | null;
}

export type GetGradeStructureParams = { gradeId: string };
export type GetGradeStructureResponse = GradeStructureDto | { error: string };



// new lesson sum
export interface CompactVideoDto {
    id: string;
    hlsUrl: string;
}

export interface LessonWithContentDto extends LessonDto {
    videos: CompactVideoDto[];
    sections: SectionDto[];
}

// Explicit API Contract types
export type GetLessonTreeParams = { lessonId: string };
export type GetLessonTreeResponse = LessonWithContentDto | { error: string };