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
    grade?: number;
    isSupported?: boolean;
}

export interface AiChatMessageDto {
    id: string;
    sessionId: string;
    sender: "user" | "assistant";
    content: string;
    screenContext?: ScreenContextPayload;
    createdAt: string;
}

export interface UserAiQuotaDto {
    tokensUsed: number;
    dailyLimit: number;
    isPro: boolean;
}

export const aiChatApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getUserQuota: builder.query<UserAiQuotaDto, void>({
            query: () => "/api/ai-chat/quota",
            providesTags: ["AiQuota"],
        }),
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
            async onQueryStarted({ sessionId, title, mode }, { dispatch, queryFulfilled }) {
                const patchResult = dispatch(
                    aiChatApi.util.updateQueryData("listSessions", undefined, (draft) => {
                        const session = draft.sessions.find((s) => s.id === sessionId);
                        if (session) {
                            if (mode !== undefined) session.mode = mode;
                            if (title !== undefined) session.title = title;
                        }
                    })
                );
                try {
                    await queryFulfilled;
                } catch {
                    patchResult.undo();
                }
            },
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
                "AiQuota",
            ],
        }),
    }),
});

export const {
    useGetUserQuotaQuery,
    useListSessionsQuery,
    useCreateSessionMutation,
    useDeleteSessionMutation,
    useUpdateSessionMutation,
    useGetSessionMessagesQuery,
    useSendMessageMutation,
} = aiChatApi;
