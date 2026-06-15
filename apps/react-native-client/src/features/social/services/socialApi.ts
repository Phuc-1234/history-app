import { apiSlice } from "@/services/apiSlice";
import type {
    FollowDto,
    FriendDto,
    FriendRequestDto,
    MessageResponse,
    SocialProfile,
    SocialUser,
} from "../types/socialApiTypes";

export const socialApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        searchSocialUsers: builder.query<
            { users: SocialUser[] },
            { q?: string; limit?: number } | void
        >({
            query: (params) => ({
                url: "/api/social/users/search",
                params: {
                    q: params?.q ?? "",
                    limit: params?.limit ?? 20,
                },
            }),
            providesTags: ["User"],
        }),
        getSocialProfile: builder.query<{ profile: SocialProfile }, string>({
            query: (userId) => `/api/social/users/${userId}/profile`,
            providesTags: ["User"],
        }),
        getFriends: builder.query<{ friends: FriendDto[] }, void>({
            query: () => "/api/social/friends",
            providesTags: ["User"],
        }),
        getIncomingFriendRequests: builder.query<
            { requests: FriendRequestDto[] },
            void
        >({
            query: () => "/api/social/friends/requests/incoming",
            providesTags: ["User"],
        }),
        getOutgoingFriendRequests: builder.query<
            { requests: FriendRequestDto[] },
            void
        >({
            query: () => "/api/social/friends/requests/outgoing",
            providesTags: ["User"],
        }),
        sendFriendRequest: builder.mutation<
            { request: FriendRequestDto },
            { receiverId: string }
        >({
            query: (body) => ({
                url: "/api/social/friends/request",
                method: "POST",
                body,
            }),
            invalidatesTags: ["User"],
        }),
        acceptFriendRequest: builder.mutation<MessageResponse, string>({
            query: (requestId) => ({
                url: `/api/social/friends/requests/${requestId}/accept`,
                method: "POST",
            }),
            invalidatesTags: ["User"],
        }),
        rejectFriendRequest: builder.mutation<MessageResponse, string>({
            query: (requestId) => ({
                url: `/api/social/friends/requests/${requestId}/reject`,
                method: "POST",
            }),
            invalidatesTags: ["User"],
        }),
        cancelFriendRequest: builder.mutation<MessageResponse, string>({
            query: (requestId) => ({
                url: `/api/social/friends/requests/${requestId}`,
                method: "DELETE",
            }),
            invalidatesTags: ["User"],
        }),
        removeFriend: builder.mutation<MessageResponse, string>({
            query: (friendId) => ({
                url: `/api/social/friends/${friendId}`,
                method: "DELETE",
            }),
            invalidatesTags: ["User"],
        }),
        followUser: builder.mutation<MessageResponse, string>({
            query: (userId) => ({
                url: `/api/social/follow/${userId}`,
                method: "POST",
            }),
            invalidatesTags: ["User"],
        }),
        unfollowUser: builder.mutation<MessageResponse, string>({
            query: (userId) => ({
                url: `/api/social/follow/${userId}`,
                method: "DELETE",
            }),
            invalidatesTags: ["User"],
        }),
        getFollowers: builder.query<{ followers: FollowDto[] }, string>({
            query: (userId) => `/api/social/users/${userId}/followers`,
            providesTags: ["User"],
        }),
        getFollowing: builder.query<{ following: FollowDto[] }, string>({
            query: (userId) => `/api/social/users/${userId}/following`,
            providesTags: ["User"],
        }),
    }),
    overrideExisting: __DEV__,
});

export const {
    useAcceptFriendRequestMutation,
    useCancelFriendRequestMutation,
    useFollowUserMutation,
    useGetFollowersQuery,
    useGetFollowingQuery,
    useGetFriendsQuery,
    useGetIncomingFriendRequestsQuery,
    useGetOutgoingFriendRequestsQuery,
    useGetSocialProfileQuery,
    useRejectFriendRequestMutation,
    useRemoveFriendMutation,
    useSearchSocialUsersQuery,
    useSendFriendRequestMutation,
    useUnfollowUserMutation,
} = socialApi;
