import { apiSlice } from "@/services/apiSlice";
import type {
    StartTestResponse,
    JumpRequest,
    JumpResponse,
    SubmitAnswerRequest,
    SubmitAnswerResponse,
    FinishTestResponse,
} from "@history-app/shared";

export const testApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        // POST /api/tests/:testId/start
        startTest: builder.mutation<StartTestResponse, { testId: string }>({
            query: ({ testId }) => ({
                url: `/api/tests/${testId}/start`,
                method: "POST",
                headers: {
                    "x-timezone-offset": String(new Date().getTimezoneOffset()),
                },
            }),
        }),

        // POST /api/test-logs/:logId/jump
        jumpToQuestion: builder.mutation<JumpResponse, { logId: string; targetIndex: number }>({
            query: ({ logId, targetIndex }) => ({
                url: `/api/test-logs/${logId}/jump`,
                method: "POST",
                body: { targetIndex } satisfies JumpRequest,
            }),
        }),

        // POST /api/test-logs/:logId/submit-answer
        submitAnswer: builder.mutation<SubmitAnswerResponse, { logId: string } & SubmitAnswerRequest>({
            query: ({ logId, ...body }) => ({
                url: `/api/test-logs/${logId}/submit-answer`,
                method: "POST",
                body,
            }),
        }),

        // POST /api/test-logs/:logId/finish
        finishTest: builder.mutation<FinishTestResponse, { logId: string }>({
            query: ({ logId }) => ({
                url: `/api/test-logs/${logId}/finish`,
                method: "POST",
            }),
        }),
    }),
    overrideExisting: __DEV__,
});

export const {
    useStartTestMutation,
    useJumpToQuestionMutation,
    useSubmitAnswerMutation,
    useFinishTestMutation,
} = testApi;
