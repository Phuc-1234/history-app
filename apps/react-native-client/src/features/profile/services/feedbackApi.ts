import { apiSlice } from "@/services/apiSlice";
import { CreateFeedbackRequestBody, FeedbackDto, AdminFeedbackDto } from "@history-app/shared";

export const feedbackApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        createFeedback: builder.mutation<{ message: string; feedback: FeedbackDto }, CreateFeedbackRequestBody>({
            query: (body) => ({
                url: "/api/user/feedback",
                method: "POST",
                body,
            }),
            invalidatesTags: ["Feedback"],
        }),

        getFeedbackHistory: builder.query<FeedbackDto[], void>({
            query: () => "/api/user/feedback/history",
            providesTags: ["Feedback"],
        }),

        getAdminFeedbacks: builder.query<AdminFeedbackDto[], void>({
            query: () => "/api/admin/feedback",
            providesTags: ["Feedback"],
        }),
    }),
    overrideExisting: __DEV__,
});

export const {
    useCreateFeedbackMutation,
    useGetFeedbackHistoryQuery,
    useGetAdminFeedbacksQuery,
} = feedbackApi;
