import { apiSlice } from "@/services/apiSlice";

export type AiChatModeType = "COURSE_ONLY" | "COURSE_FIRST" | "GENERAL";

export interface AiChatSessionDto {
    id: string;
    title: string;
    mode: AiChatModeType;
    createdAt: string;
    updatedAt: string;
    messages?: { content: string }[];
}

export interface ScreenContextPayload {
    screenName?: string;
    lessonId?: number;
    nodeId?: number;
    topicId?: number;
}

export interface AiChatMessageDto {
    id: string;
    sessionId: string;
    sender: "user" | "assistant";
    content: string;
    screenContext?: ScreenContextPayload;
    createdAt: string;
}

export const aiChatApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        listSessions: builder.query<{ sessions: AiChatSessionDto[] }, void>({
            query: () => "/api/ai-chat/sessions",
            providesTags: ["AiChatSession"],
        }),
        createSession: builder.mutation<
            { session: AiChatSessionDto },
            { title?: string; mode?: AiChatModeType } | void
        >({
            query: (body) => ({
                url: "/api/ai-chat/sessions",
                method: "POST",
                body: body || {},
            }),
            invalidatesTags: ["AiChatSession"],
        }),
        deleteSession: builder.mutation<{ success: boolean }, string>({
            query: (sessionId) => ({
                url: `/api/ai-chat/sessions/${sessionId}`,
                method: "DELETE",
            }),
            invalidatesTags: ["AiChatSession"],
        }),
        updateSession: builder.mutation<
            { session: AiChatSessionDto },
            { sessionId: string; title?: string; mode?: AiChatModeType }
        >({
            query: ({ sessionId, title, mode }) => ({
                url: `/api/ai-chat/sessions/${sessionId}`,
                method: "PATCH",
                body: { title, mode },
            }),
            invalidatesTags: ["AiChatSession"],
        }),
        getSessionMessages: builder.query<{ messages: AiChatMessageDto[] }, string>({
            query: (sessionId) => `/api/ai-chat/sessions/${sessionId}/messages`,
            providesTags: (_result, _error, sessionId) => [{ type: "AiChatMessage", id: sessionId }],
        }),
        sendMessage: builder.mutation<
            { userMessage: AiChatMessageDto; assistantMessage: AiChatMessageDto },
            { sessionId: string; content: string; screenContext?: ScreenContextPayload }
        >({
            query: ({ sessionId, content, screenContext }) => ({
                url: `/api/ai-chat/sessions/${sessionId}/messages`,
                method: "POST",
                body: { content, screenContext },
            }),
            invalidatesTags: (_result, _error, { sessionId }) => [
                { type: "AiChatMessage", id: sessionId },
                "AiChatSession",
            ],
        }),
    }),
});

export const {
    useListSessionsQuery,
    useCreateSessionMutation,
    useDeleteSessionMutation,
    useUpdateSessionMutation,
    useGetSessionMessagesQuery,
    useSendMessageMutation,
} = aiChatApi;
