export interface Flashcard {
    id: string;
    front: string;
    back: string;
}

export interface CardState {
    card: Flashcard;
    memorizedCount: number;
}

/** Raw shape returned from the API */
export interface FlashcardApiResponse {
    id: number;
    frontText: string;
    backText: string;
    lessonId: number | null;
    sectionId: number | null;
    nodeId: number | null;
}
