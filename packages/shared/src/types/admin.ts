// types/admin.ts
// Admin CRUD API contracts for content management (grade, topic, lesson, section, node)

import { GradeDto, TopicDto, LessonDto, SectionDto, NodeDto } from "./content";

// ─── Grade ───────────────────────────────────────────────────────────────────

export interface CreateGradeBody {
    id: number; // Grade id is manually specified (e.g. 10, 11, 12)
    state?: "PUBLIC" | "PRIVATE";
}

export interface UpdateGradeBody {
    state?: "PUBLIC" | "PRIVATE";
}

export type AdminGradeResponse = GradeDto | { error: string };
export type AdminGradesResponse = { grades: GradeDto[] } | { error: string };

// ─── Topic ───────────────────────────────────────────────────────────────────

export interface CreateTopicBody {
    name: string;
    position: number;
    gradeId: number;
}

export interface UpdateTopicBody {
    name?: string;
    position?: number;
}

export type AdminTopicResponse = TopicDto | { error: string };

// ─── Lesson ──────────────────────────────────────────────────────────────────

export interface CreateLessonBody {
    name: string;
    summary?: string;
    position: number;
    topicId: number;
}

export interface UpdateLessonBody {
    name?: string;
    summary?: string;
    position?: number;
}

export type AdminLessonResponse = LessonDto | { error: string };

// ─── Section ─────────────────────────────────────────────────────────────────

export interface CreateSectionBody {
    name: string;
    summary?: string;
    position: number;
    lessonId: number;
    parentSectionId?: number;
}

export interface UpdateSectionBody {
    name?: string;
    summary?: string;
    position?: number;
    parentSectionId?: number | null;
}

export type AdminSectionResponse = SectionDto | { error: string };

// ─── Node ─────────────────────────────────────────────────────────────────────

export interface CreateNodeBody {
    position: number;
    header?: string;
    body: string;
    imgUrl?: string;
    sectionId: number;
}

export interface UpdateNodeBody {
    position?: number;
    header?: string;
    body?: string;
    imgUrl?: string | null;
}

export type AdminNodeResponse = NodeDto | { error: string };

// ─── Generic delete response ─────────────────────────────────────────────────

export type DeleteResponse = { message: string } | { error: string };

// ─── User ─────────────────────────────────────────────────────────────────────

export interface UpdateUserBody {
    role?: "STUDENT" | "ADMIN" | "SUPER_ADMIN";
    isHidden?: boolean;
    isVerified?: boolean;
    totalXp?: number;
    totalGold?: number;
}

export interface AdminUserDto {
    id: string;
    email: string;
    name: string;
    role: string;
    totalXp: number;
    totalGold: number;
    isHidden: boolean;
    isVerified: boolean;
    profileImgUrl: string | null;
    currentStreak: number;
    highestStreak: number;
}

// ─── Video ────────────────────────────────────────────────────────────────────

export interface CreateVideoBody {
    title: string;
    position: number;
    summary?: string;
    hlsUrl: string;
    lessonId: number;
}

export interface UpdateVideoBody {
    title?: string;
    position?: number;
    summary?: string;
    hlsUrl?: string;
    lessonId?: number;
}

export interface AdminVideoDto {
    id: string;
    title: string;
    position: number;
    summary: string | null;
    hlsUrl: string;
    status: string;
    lessonId: number | null;
}

// ─── Question ─────────────────────────────────────────────────────────────────

export interface CreateQuestionBody {
    type: "CHOOSE" | "FILL" | "MATCH";
    difficulty: number;
    promptText: string;
    document?: string;
    gradeId?: number;
    topicId?: number;
    lessonId?: number;
    sectionId?: number;
    nodeId?: number;
    answers: {
        content: string;
        isCorrect?: boolean | null;
        leftText?: string | null;
        rightText?: string | null;
        correctAnswer?: string | null;
    }[];
}

export interface UpdateQuestionBody {
    type?: "CHOOSE" | "FILL" | "MATCH";
    difficulty?: number;
    promptText?: string;
    document?: string;
    gradeId?: number;
    topicId?: number;
    lessonId?: number;
    sectionId?: number;
    nodeId?: number;
    answers?: {
        content: string;
        isCorrect?: boolean | null;
        leftText?: string | null;
        rightText?: string | null;
        correctAnswer?: string | null;
    }[];
}

export interface AdminQuestionAnswerDto {
    id: number;
    content: string;
    isCorrect: boolean | null;
    leftText: string | null;
    rightText: string | null;
    correctAnswer: string | null;
}

export interface AdminQuestionDto {
    id: number;
    type: string;
    difficulty: number;
    promptText: string;
    document: string | null;
    gradeId: number | null;
    topicId: number | null;
    lessonId: number | null;
    sectionId: number | null;
    nodeId: number | null;
    answers: AdminQuestionAnswerDto[];
}

// ─── Test ─────────────────────────────────────────────────────────────────────

export interface CreateTestBody {
    title: string;
    summary?: string;
    isManual: boolean;
    isNationalTest: boolean;
    questionNumber: number;
    timeLimit?: number;
    xpReward: number;
    goldReward: number;
    passThreshold: number;
    gradeId?: number;
    topicId?: number;
    lessonId?: number;
    sectionId?: number;
    questionIds?: number[];
}

export interface UpdateTestBody {
    title?: string;
    summary?: string;
    isManual?: boolean;
    isNationalTest?: boolean;
    questionNumber?: number;
    timeLimit?: number;
    xpReward?: number;
    goldReward?: number;
    passThreshold?: number;
    gradeId?: number;
    topicId?: number;
    lessonId?: number;
    sectionId?: number;
    questionIds?: number[];
}

export interface AdminTestDto {
    id: string;
    title: string;
    summary: string | null;
    isManual: boolean;
    isNationalTest: boolean;
    questionNumber: number;
    timeLimit: number | null;
    xpReward: number;
    goldReward: number;
    passThreshold: number;
    gradeId: number | null;
    topicId: number | null;
    lessonId: number | null;
    sectionId: number | null;
    questionIds: number[];
}

