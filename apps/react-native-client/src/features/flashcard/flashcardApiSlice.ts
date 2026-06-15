import { apiSlice } from "../../services/apiSlice";
import { FlashcardApiResponse, Flashcard } from "./types";

/** Maps raw API response to the Flashcard shape used by UI components */
function mapApiToFlashcard(item: FlashcardApiResponse): Flashcard {
    return {
        id: String(item.id),
        front: item.frontText,
        back: item.backText,
    };
}

export const flashcardApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getFlashcardsByLesson: builder.query<Flashcard[], number>({
            query: (lessonId) => `/api/flashcards/lesson/${lessonId}`,
            transformResponse: (response: FlashcardApiResponse[]) =>
                response.map(mapApiToFlashcard),
        }),

        getFlashcardsBySection: builder.query<Flashcard[], number>({
            query: (sectionId) => `/api/flashcards/section/${sectionId}`,
            transformResponse: (response: FlashcardApiResponse[]) =>
                response.map(mapApiToFlashcard),
        }),

        getFlashcardsByNode: builder.query<Flashcard[], number>({
            query: (nodeId) => `/api/flashcards/node/${nodeId}`,
            transformResponse: (response: FlashcardApiResponse[]) =>
                response.map(mapApiToFlashcard),
        }),
    }),
});

export const {
    useGetFlashcardsByLessonQuery,
    useGetFlashcardsBySectionQuery,
    useGetFlashcardsByNodeQuery,
} = flashcardApi;
