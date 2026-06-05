export interface Flashcard {
    id: string;
    front: string;
    back: string;
}

export interface CardState {
    card: Flashcard;
    memorizedCount: number;
}
