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
    topicId?: number;
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
    videoId?: string | null;
    sectionId: number;
}

export interface UpdateNodeBody {
    position?: number;
    header?: string;
    body?: string;
    imgUrl?: string | null;
    videoId?: string | null;
    sectionId?: number;
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
    email: string | null;
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
    position?: number;
    summary?: string;
    hlsUrl: string;
    lessonId?: number | null;
}

export interface UpdateVideoBody {
    title?: string;
    position?: number;
    summary?: string;
    hlsUrl?: string;
    lessonId?: number | null;
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
    document?: string | null;
    explanation?: string | null;
    isActive?: boolean;
    scopeId?: number | null;
    scopeType?: "GRADE" | "TOPIC" | "LESSON" | "SECTION" | "NODE" | "NATIONAL" | null;
    answerDataJson: any;
    // Backup
    gradeId?: number | null;
    topicId?: number | null;
    lessonId?: number | null;
    sectionId?: number | null;
    nodeId?: number | null;
    answers?: {
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
    document?: string | null;
    explanation?: string | null;
    isActive?: boolean;
    scopeId?: number | null;
    scopeType?: "GRADE" | "TOPIC" | "LESSON" | "SECTION" | "NODE" | "NATIONAL" | null;
    answerDataJson?: any;
    // Backup
    gradeId?: number | null;
    topicId?: number | null;
    lessonId?: number | null;
    sectionId?: number | null;
    nodeId?: number | null;
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
    explanation: string | null;
    isActive: boolean;
    scopeId: number | null;
    scopeType: string | null;
    answerDataJson: any;
    // Backup
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
    summary?: string | null;
    presetId?: string | null;
    scopeId?: number | null;
    scopeType?: "GRADE" | "TOPIC" | "LESSON" | "SECTION" | "NODE" | "NATIONAL" | null;
    isNationalTest: boolean;
    questionIds?: number[];
    // Backup
    isManual?: boolean;
    questionNumber?: number;
    timeLimit?: number | null;
    xpReward?: number;
    goldReward?: number;
    passThreshold?: number;
    gradeId?: number | null;
    topicId?: number | null;
    lessonId?: number | null;
    sectionId?: number | null;
}

export interface UpdateTestBody {
    title?: string;
    summary?: string | null;
    presetId?: string | null;
    scopeId?: number | null;
    scopeType?: "GRADE" | "TOPIC" | "LESSON" | "SECTION" | "NODE" | "NATIONAL" | null;
    isNationalTest?: boolean;
    questionIds?: number[];
    // Backup
    isManual?: boolean;
    questionNumber?: number;
    timeLimit?: number | null;
    xpReward?: number;
    goldReward?: number;
    passThreshold?: number;
    gradeId?: number | null;
    topicId?: number | null;
    lessonId?: number | null;
    sectionId?: number | null;
}

export interface AdminTestDto {
    id: string;
    title: string;
    summary: string | null;
    presetId: string | null;
    scopeId: number | null;
    scopeType: string | null;
    isNationalTest: boolean;
    questionIds: number[];
    // Backup
    isManual: boolean;
    questionNumber: number;
    timeLimit: number | null;
    xpReward: number;
    goldReward: number;
    passThreshold: number;
    gradeId: number | null;
    topicId: number | null;
    lessonId: number | null;
    sectionId: number | null;
}

// ─── Flashcard ───────────────────────────────────────────────────────────────

export interface FlashcardDto {
    id: number;
    frontText: string;
    backText: string;
    lessonId: number | null;
    sectionId: number | null;
    nodeId: number | null;
}

export interface CreateFlashcardBody {
    frontText: string;
    backText: string;
    lessonId?: number;
    sectionId?: number;
    nodeId?: number;
}

export interface UpdateFlashcardBody {
    frontText?: string;
    backText?: string;
    lessonId?: number | null;
    sectionId?: number | null;
    nodeId?: number | null;
}

export type AdminFlashcardResponse = FlashcardDto | { error: string };
export type AdminFlashcardsResponse = { flashcards: FlashcardDto[] } | { error: string };

// ─── Test Preset ─────────────────────────────────────────────────────────────

export interface CreateTestPresetBody {
    name: string;
    purposeType: "EXAM" | "PRACTICE";
    questionCount?: number | null;
    passThreshold?: number;
    timeLimit?: number | null;
    difficultyRatioJson?: any;
}

export interface UpdateTestPresetBody {
    name?: string;
    purposeType?: "EXAM" | "PRACTICE";
    questionCount?: number | null;
    passThreshold?: number;
    timeLimit?: number | null;
    difficultyRatioJson?: any;
}

export interface TestPresetDto {
    id: string;
    name: string;
    purposeType: "EXAM" | "PRACTICE";
    questionCount: number | null;
    passThreshold: number;
    timeLimit: number | null;
    difficultyRatioJson: any;
}

// ─── Scope Test Preset Default ────────────────────────────────────────────────

export interface ScopeTestPresetDefaultDto {
    scopeType: "GRADE" | "TOPIC" | "LESSON" | "SECTION" | "NODE" | "NATIONAL";
    purposeType: "EXAM" | "PRACTICE";
    defaultTestPresetId: string;
}

export interface SetScopeTestPresetDefaultBody {
    scopeType: "GRADE" | "TOPIC" | "LESSON" | "SECTION" | "NODE" | "NATIONAL";
    purposeType: "EXAM" | "PRACTICE";
    defaultTestPresetId: string;
}

export interface AdminFeedbackDto {
    id: string;
    userId: string;
    content: string;
    type: string; // "BUG" | "FEATURE" | "OTHER" | "INCORRECT_INFO"
    createdAt: string;
    targetType?: string | null;
    targetId?: string | null;
    targetName?: string | null;
    user: {
        name: string;
        email: string | null;
        profileImgUrl: string | null;
    };
}





