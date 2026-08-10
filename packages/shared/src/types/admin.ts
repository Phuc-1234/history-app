// types/admin.ts
// Admin CRUD API contracts for content management (grade, topic, lesson, section, node)

import { GradeDto, TopicDto, LessonDto, SectionDto, NodeDto } from "./content";

// ─── Grade ───────────────────────────────────────────────────────────────────

export interface CreateGradeBody {
    id: number; // Grade id is manually specified (e.g. 10, 11, 12)
    state?: "PUBLIC" | "PRIVATE";
    isPro?: boolean;
    imgUrl?: string | null;
}

export interface UpdateGradeBody {
    state?: "PUBLIC" | "PRIVATE";
    isPro?: boolean;
    imgUrl?: string | null;
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
    isPro?: boolean;
    imgUrl?: string | null;
}

export interface UpdateLessonBody {
    name?: string;
    summary?: string;
    position?: number;
    topicId?: number;
    isPro?: boolean;
    imgUrl?: string | null;
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
    lastXpGainedAt: string | Date | null;
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
    isPro?: boolean;
    imgUrl?: string | null;
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
    isPro?: boolean;
    imgUrl?: string | null;
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
    isPro: boolean;
    imgUrl: string | null;
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

// ─── Reward Rule ──────────────────────────────────────────────────────────────

export type RewardTriggerType =
    | "MANUAL_TEST_COMPLETE"
    | "AUTO_NODE_TEST_COMPLETE"
    | "AUTO_SECTION_TEST_COMPLETE"
    | "AUTO_LESSON_TEST_COMPLETE"
    | "AUTO_TOPIC_TEST_COMPLETE"
    | "AUTO_GRADE_TEST_COMPLETE"
    | "AUTO_PERSONAL_PRACTICE_COMPLETE"
    | "AUTO_WRONG_PRACTICE_COMPLETE"
    | "STREAK_REACHED"
    | "TIER_REACHED";

export interface RewardRuleItemDto {
    itemDefinitionId: number;
    quantity: number;
    itemDefinition?: ItemDefinitionDto;
}

export interface CreateRewardRuleBody {
    triggerType: RewardTriggerType;
    triggerTargetId?: string | null;
    triggerTimeMin: number;
    triggerTimeMax?: number | null;
    xp?: number;
    gold?: number;
    rewardRuleItems?: { itemDefinitionId: number; quantity: number }[];
}

export interface UpdateRewardRuleBody {
    triggerType?: RewardTriggerType;
    triggerTargetId?: string | null;
    triggerTimeMin?: number;
    triggerTimeMax?: number | null;
    xp?: number;
    gold?: number;
    rewardRuleItems?: { itemDefinitionId: number; quantity: number }[];
}

export interface RewardRuleDto {
    id: number;
    triggerType: RewardTriggerType;
    triggerTargetId: string | null;
    triggerTimeMin: number;
    triggerTimeMax: number | null;
    xp: number;
    gold: number;
    rewardRuleItems: RewardRuleItemDto[];
}

// ─── Item Definitions ─────────────────────────────────────────────────────────

export type ItemDefinitionType = "SKIN" | "XP_MUL" | "GOLD_MUL" | "BADGE";
export type EquipmentSlot = "AVT_FRAME" | "BACKGROUND";

export interface CreateItemDefinitionBody {
    name: string;
    description?: string | null;
    shownInStore?: boolean;
    price?: number;
    itemType: ItemDefinitionType;
    effectValue?: number | null;
    imgUrl?: string | null;
    shopImgUrl?: string | null;
    equipmentSlot?: EquipmentSlot | null;
    durationMinutes?: number | null;
}

export interface UpdateItemDefinitionBody {
    name?: string;
    description?: string | null;
    shownInStore?: boolean;
    price?: number;
    itemType?: ItemDefinitionType;
    effectValue?: number | null;
    imgUrl?: string | null;
    shopImgUrl?: string | null;
    equipmentSlot?: EquipmentSlot | null;
    durationMinutes?: number | null;
}

export interface ItemDefinitionDto {
    id: number;
    name: string;
    description: string | null;
    shownInStore: boolean;
    price: number;
    itemType: ItemDefinitionType;
    effectValue: number | null;
    imgUrl: string | null;
    shopImgUrl: string | null;
    equipmentSlot: EquipmentSlot | null;
    durationMinutes: number | null;
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
// ─── Tier ────────────────────────────────────────────────────────────────────

export interface CreateTierBody {
    index: number;
    name: string;
    badgeImgUrl?: string | null;
    description?: string | null;
    xpThreshold: number;
    xpReward?: number;
    goldReward?: number;
    rewardRuleItems?: { itemDefinitionId: number; quantity: number }[];
}

export interface UpdateTierBody {
    name?: string;
    badgeImgUrl?: string | null;
    description?: string | null;
    xpThreshold?: number;
    xpReward?: number;
    goldReward?: number;
    rewardRuleItems?: { itemDefinitionId: number; quantity: number }[];
}

export interface AdminTierDto {
    index: number;
    name: string;
    badgeImgUrl: string | null;
    description: string | null;
    xpThreshold: number;
    rewardRule?: RewardRuleDto | null;
}

// ─── Gold Package ─────────────────────────────────────────────────────────────

export interface GoldPackageDto {
    id: string;
    name: string;
    goldAmount: number;
    bonusGold: number;
    priceVnd: number;
    isActive: boolean;
    displayOrder: number;
    createdAt: string;
    updatedAt: string;
}

export interface CreateGoldPackageBody {
    name: string;
    goldAmount: number;
    bonusGold?: number;
    priceVnd: number;
    isActive?: boolean;
    displayOrder?: number;
}

export interface UpdateGoldPackageBody {
    name?: string;
    goldAmount?: number;
    bonusGold?: number;
    priceVnd?: number;
    isActive?: boolean;
    displayOrder?: number;
}

// ─── Pro Package ──────────────────────────────────────────────────────────────

export interface ProPackageDto {
    id: string;
    name: string;
    durationDays: number;
    priceVnd: number;
    originalPriceVnd: number | null;
    description: string | null;
    isRecommended: boolean;
    isActive: boolean;
    displayOrder: number;
    createdAt: string;
    updatedAt: string;
}

export interface CreateProPackageBody {
    name: string;
    durationDays: number;
    priceVnd: number;
    originalPriceVnd?: number | null;
    description?: string | null;
    isRecommended?: boolean;
    isActive?: boolean;
    displayOrder?: number;
}

export interface UpdateProPackageBody {
    name?: string;
    durationDays?: number;
    priceVnd?: number;
    originalPriceVnd?: number | null;
    description?: string | null;
    isRecommended?: boolean;
    isActive?: boolean;
    displayOrder?: number;
}
