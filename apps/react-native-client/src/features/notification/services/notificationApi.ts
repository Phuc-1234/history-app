import { apiSlice } from "@/services/apiSlice";
import type { SystemNotification } from "../types";

export const notificationApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getNotifications: builder.query<{ notifications: SystemNotification[] }, void>({
            query: () => "/api/notifications",
            providesTags: ["Notification"],
        }),
        markNotificationAsRead: builder.mutation<{ message: string }, string>({
            query: (id) => ({
                url: `/api/notifications/${id}/read`,
                method: "PUT",
            }),
            invalidatesTags: ["Notification"],
        }),
        markAllNotificationsAsRead: builder.mutation<{ message: string }, void>({
            query: () => ({
                url: "/api/notifications/read-all",
                method: "PUT",
            }),
            invalidatesTags: ["Notification"],
        }),
        toggleHideNotification: builder.mutation<
            { message: string; isHidden: boolean },
            { id: string; isHidden?: boolean }
        >({
            query: ({ id, isHidden }) => ({
                url: `/api/notifications/${id}/toggle-hide`,
                method: "PUT",
                body: { isHidden },
            }),
            invalidatesTags: ["Notification"],
        }),
        getReminderSettings: builder.query<{ isEnabled: boolean; times: string[] }, void>({
            query: () => "/api/notifications/reminders",
            providesTags: ["Notification"],
        }),
        updateReminderSettings: builder.mutation<
            { isEnabled: boolean; times: string[] },
            { isEnabled: boolean; times: string[] }
        >({
            query: (body) => ({
                url: "/api/notifications/reminders",
                method: "PUT",
                body,
            }),
            invalidatesTags: ["Notification"],
            async onQueryStarted(body, { dispatch, queryFulfilled }) {
                const patchResult = dispatch(
                    notificationApi.util.updateQueryData("getReminderSettings", undefined, (draft) => {
                        draft.isEnabled = body.isEnabled;
                        draft.times = body.times;
                    })
                );
                try {
                    await queryFulfilled;
                } catch {
                    patchResult.undo();
                }
            },
        }),
        sendTestReminder: builder.mutation<{ message: string; payload: any }, void>({
            query: () => ({
                url: "/api/notifications/reminders/test-trigger",
                method: "POST",
            }),
            invalidatesTags: ["Notification"],
        }),
    }),
});

export const {
    useGetNotificationsQuery,
    useMarkNotificationAsReadMutation,
    useMarkAllNotificationsAsReadMutation,
    useToggleHideNotificationMutation,
    useGetReminderSettingsQuery,
    useUpdateReminderSettingsMutation,
    useSendTestReminderMutation,
} = notificationApi;

