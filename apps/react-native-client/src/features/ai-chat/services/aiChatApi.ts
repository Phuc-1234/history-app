import { apiSlice } from "@/services/apiSlice";

export interface AiChatSessionDto {
    id: string;
    title: string;
    createdAt: string;
    updatedAt: string;
    messages?: { content: string }[];
}

export interface AiChatMessageDto {
    id: string;
    sessionId: string;
    sender: "user" | "assistant";
    content: string;
    createdAt: string;
}

export const aiChatApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        listSessions: builder.query<{ sessions: AiChatSessionDto[] }, void>({
            query: () => "/api/ai-chat/sessions",
            providesTags: ["AiChatSession"],
        }),
        createSession: builder.mutation<{ session: AiChatSessionDto }, { title?: string } | void>({
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
        updateSessionTitle: builder.mutation<
            { session: AiChatSessionDto },
            { sessionId: string; title: string }
        >({
            query: ({ sessionId, title }) => ({
                url: `/api/ai-chat/sessions/${sessionId}`,
                method: "PATCH",
                body: { title },
            }),
            invalidatesTags: ["AiChatSession"],
        }),
        getSessionMessages: builder.query<{ messages: AiChatMessageDto[] }, string>({
            query: (sessionId) => `/api/ai-chat/sessions/${sessionId}/messages`,
            providesTags: (_result, _error, sessionId) => [{ type: "AiChatMessage", id: sessionId }],
        }),
        sendMessage: builder.mutation<
            { userMessage: AiChatMessageDto; assistantMessage: AiChatMessageDto },
            { sessionId: string; content: string }
        >({
            query: ({ sessionId, content }) => ({
                url: `/api/ai-chat/sessions/${sessionId}/messages`,
                method: "POST",
                body: { content },
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
    useUpdateSessionTitleMutation,
    useGetSessionMessagesQuery,
    useSendMessageMutation,
} = aiChatApi;
