import { apiSlice } from "@/services/apiSlice";
import type {
    StartTestV2Request,
    StartTestV2Response,
    FinishTestV2Response,
    ResumableTestV2Response,
    TestHistoryV2Response,
    TestAttemptDetailV2Response,
    DraftAnswerEntry,
    TestInfoV2Response,
} from "../types";

export const testApiV2 = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        // GET /api/tests-v2/resumable
        checkResumable: builder.query<ResumableTestV2Response, void>({
            query: () => "/api/tests-v2/resumable",
        }),

        // POST /api/tests-v2/info
        getTestInfo: builder.query<TestInfoV2Response, StartTestV2Request>({
            query: (body) => ({
                url: "/api/tests-v2/info",
                method: "POST",
                body,
            }),
        }),

        // POST /api/tests-v2/start
        startTestV2: builder.mutation<StartTestV2Response, StartTestV2Request>({
            query: (body) => ({
                url: "/api/tests-v2/start",
                method: "POST",
                body,
            }),
        }),

        // PUT /api/tests-v2/:logId/draft
        updateDraft: builder.mutation<{ saved: boolean }, { logId: string; draftAnswerJson: DraftAnswerEntry[] }>({
            query: ({ logId, ...body }) => ({
                url: `/api/tests-v2/${logId}/draft`,
                method: "PUT",
                body,
            }),
        }),

        // POST /api/tests-v2/:logId/finish
        finishTestV2: builder.mutation<FinishTestV2Response, { logId: string; draftAnswerJson: DraftAnswerEntry[] }>({
            query: ({ logId, ...body }) => ({
                url: `/api/tests-v2/${logId}/finish`,
                method: "POST",
                body,
            }),
            invalidatesTags: ["User"],
        }),

        // POST /api/tests-v2/:logId/abandon
        abandonTest: builder.mutation<{ abandoned: boolean }, { logId: string }>({
            query: ({ logId }) => ({
                url: `/api/tests-v2/${logId}/abandon`,
                method: "POST",
            }),
        }),

        // GET /api/tests-v2/history
        getTestHistory: builder.query<TestHistoryV2Response, { scopeType?: string; scopeId?: number; testId?: string }>({
            query: (params) => ({
                url: "/api/tests-v2/history",
                params,
            }),
        }),

        // GET /api/tests-v2/history/:logId
        getAttemptDetail: builder.query<TestAttemptDetailV2Response, { logId: string }>({
            query: ({ logId }) => `/api/tests-v2/history/${logId}`,
        }),
        // GET /api/tests-v2/national
        getNationalTests: builder.query<{ id: string; title: string; summary: string | null }[], void>({
            query: () => "/api/tests-v2/national",
        }),
    }),
    overrideExisting: __DEV__,
});

export const {
    useCheckResumableQuery,
    useLazyCheckResumableQuery,
    useGetTestInfoQuery,
    useLazyGetTestInfoQuery,
    useStartTestV2Mutation,
    useUpdateDraftMutation,
    useFinishTestV2Mutation,
    useAbandonTestMutation,
    useGetTestHistoryQuery,
    useLazyGetTestHistoryQuery,
    useGetAttemptDetailQuery,
    useLazyGetAttemptDetailQuery,
    useGetNationalTestsQuery,
    useLazyGetNationalTestsQuery,
} = testApiV2;
