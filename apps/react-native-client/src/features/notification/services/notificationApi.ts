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
    }),
});

export const {
    useGetNotificationsQuery,
    useMarkNotificationAsReadMutation,
    useMarkAllNotificationsAsReadMutation,
    useToggleHideNotificationMutation,
} = notificationApi;
