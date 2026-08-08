import { apiSlice } from "@/services/apiSlice";
import type {
    CreatePvpRoomRequest,
    JoinPvpRoomRequest,
    PvpRoom,
    SubmitPvpAnswerRequest,
} from "../types";

export const pvpApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        createPvpRoom: builder.mutation<PvpRoom, CreatePvpRoomRequest>({
            query: (body) => ({
                url: "/api/pvp/create",
                method: "POST",
                body,
            }),
        }),

        joinPvpRoom: builder.mutation<PvpRoom, JoinPvpRoomRequest>({
            query: (body) => ({
                url: "/api/pvp/join",
                method: "POST",
                body,
            }),
        }),

        leavePvpRoom: builder.mutation<void, { roomCode: string }>({
            query: (body) => ({
                url: "/api/pvp/leave",
                method: "POST",
                body,
            }),
        }),

        getPvpRoomInfo: builder.query<PvpRoom, string>({
            query: (code) => `/api/pvp/room/${code}`,
        }),

        getActivePvpRoom: builder.query<PvpRoom | null, void>({
            query: () => "/api/pvp/active-room",
        }),

        startPvpRoom: builder.mutation<{ started: boolean }, { roomCode: string }>({
            query: (body) => ({
                url: "/api/pvp/start",
                method: "POST",
                body,
            }),
        }),

        submitPvpAnswer: builder.mutation<
            { scoreEarned: number; totalScore: number },
            SubmitPvpAnswerRequest
        >({
            query: (body) => ({
                url: "/api/pvp/submit-answer",
                method: "POST",
                body,
            }),
        }),

        nextPvpState: builder.mutation<void, { roomCode: string; targetState: "LEADERBOARD" | "NEXT_QUESTION" }>({
            query: (body) => ({
                url: "/api/pvp/next-state",
                method: "POST",
                body,
            }),
        }),

        getCuratedTests: builder.query<Array<{ id: string; title: string; summary: string | null; questionCount: number }>, void>({
            query: () => "/api/pvp/curated-tests",
        }),

        getAvailableQuestionsCount: builder.query<
            { availableCount: number },
            { scopeType?: string; scopeId?: number; testId?: string }
        >({
            query: (params) => ({
                url: "/api/pvp/available-questions-count",
                params,
            }),
        }),
    }),
    overrideExisting: __DEV__,
});

export const {
    useCreatePvpRoomMutation,
    useJoinPvpRoomMutation,
    useGetPvpRoomInfoQuery,
    useLazyGetPvpRoomInfoQuery,
    useGetActivePvpRoomQuery,
    useLazyGetActivePvpRoomQuery,
    useStartPvpRoomMutation,
    useLeavePvpRoomMutation,
    useSubmitPvpAnswerMutation,
    useNextPvpStateMutation,
    useGetCuratedTestsQuery,
    useGetAvailableQuestionsCountQuery,
} = pvpApi;
