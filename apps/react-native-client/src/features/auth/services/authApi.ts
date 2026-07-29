// services/authApi.ts
import { apiSlice } from "@/services/apiSlice";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import {
    LoginRequestBody,
    LoginResponseBody,
    RegisterRequestBody, // Imported from shared contract packages
    RegisterResponseBody,
    VerifyOtpResponseBody, // Map to your backend types
    ResendOtpRequestBody, // Map to your backend types
    ResendOtpResponseBody, // Imported from shared contract packages
    UserProfileResponseBody,
    UserProfileSummary,
    UpdateProfileRequestBody,
    ChangePasswordRequestBody,
    UpdateUserDataRequestBody,
    UpdateUserEmailRequestBody,
} from "@history-app/shared";
import { setProfile } from "../store/authSlice";
import type { RootState } from "@/store/store";

export const authApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        // --- Refactored Login Mutation ---
        login: builder.mutation<LoginResponseBody, LoginRequestBody>({
            query: (credentials) => ({
                url: "/api/auth/login",
                method: "POST",
                body: credentials,
            }),
            async onQueryStarted(_, { dispatch, queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled;
                    console.log("[authApi] login success, data:", data);

                    if (data && "session" in data && data.session) {
                        console.log("[authApi] login saving access_token:", data.session.accessToken);
                        // Persist BOTH tokens safely
                        if (Platform.OS === "web") {
                            try {
                                localStorage.setItem("access_token", data.session.accessToken);
                                localStorage.setItem("refresh_token", data.session.refreshToken);
                            } catch (e) {
                                console.error("localStorage setItem failed:", e);
                            }
                        }
                        await AsyncStorage.multiSet([
                            ["access_token", data.session.accessToken],
                            ["refresh_token", data.session.refreshToken],
                        ]);

                        // Automatically sync global profile store instantly
                        dispatch(setProfile(data.profile));

                        // Safely trigger User tag invalidation after storage write finishes to avoid race conditions
                        dispatch(apiSlice.util.invalidateTags(["User"]));
                    } else {
                        console.warn("[authApi] login response does not contain session:", data);
                    }
                } catch (error) {
                    console.error(
                        "Failed to execute onQueryStarted login side-effects:",
                        error,
                    );
                }
            },
        }),

        registerUser: builder.mutation<
            RegisterResponseBody,
            RegisterRequestBody
        >({
            query: (registerBody) => ({
                url: "/api/auth/register",
                method: "POST",
                body: registerBody,
            }),
            // Invalidates 'User' tag so that components depending on profile details
            // clear out old unauthenticated cache configurations cleanly
            invalidatesTags: ["User"],
        }),

        googleVerify: builder.mutation<LoginResponseBody, { idToken: string }>({
            query: (body) => ({
                url: "/api/auth/google/verify",
                method: "POST",
                body,
            }),
            async onQueryStarted(_, { dispatch, queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled;
                    console.log("[authApi] googleVerify success, data:", data);

                    if (data && "session" in data && data.session) {
                        if (Platform.OS === "web") {
                            try {
                                localStorage.setItem("access_token", data.session.accessToken);
                                localStorage.setItem("refresh_token", data.session.refreshToken);
                            } catch (e) {
                                console.error("localStorage setItem failed:", e);
                            }
                        }
                        await AsyncStorage.multiSet([
                            ["access_token", data.session.accessToken],
                            ["refresh_token", data.session.refreshToken],
                        ]);

                        dispatch(setProfile(data.profile));

                        // Safely trigger User tag invalidation after storage write finishes to avoid race conditions
                        dispatch(apiSlice.util.invalidateTags(["User"]));
                    }
                } catch (error) {
                    console.error(
                        "Failed to execute onQueryStarted googleVerify side-effects:",
                        error,
                    );
                }
            },
        }),

        facebookVerify: builder.mutation<LoginResponseBody, { accessToken: string }>({
            query: (body) => ({
                url: "/api/auth/facebook/verify",
                method: "POST",
                body,
            }),
            async onQueryStarted(_, { dispatch, queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled;
                    console.log("[authApi] facebookVerify success, data:", data);

                    if (data && "session" in data && data.session) {
                        if (Platform.OS === "web") {
                            try {
                                localStorage.setItem("access_token", data.session.accessToken);
                                localStorage.setItem("refresh_token", data.session.refreshToken);
                            } catch (e) {
                                console.error("localStorage setItem failed:", e);
                            }
                        }
                        await AsyncStorage.multiSet([
                            ["access_token", data.session.accessToken],
                            ["refresh_token", data.session.refreshToken],
                        ]);

                        dispatch(setProfile(data.profile));

                        dispatch(apiSlice.util.invalidateTags(["User"]));
                    }
                } catch (error) {
                    console.error(
                        "Failed to execute onQueryStarted facebookVerify side-effects:",
                        error,
                    );
                }
            },
        }),

        verifyOtp: builder.mutation<
            VerifyOtpResponseBody,
            { email: string; token: string }
        >({
            query: (body) => ({
                url: "/api/auth/verify-otp",
                method: "POST",
                body, // Matches backend structure processing verification tokens
            }),
            async onQueryStarted(_, { dispatch, queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled;

                    // Type Guard: Make sure we have a success response (contains session and profile)
                    if (data && "session" in data && data.session) {
                        // FIX HERE: Persist BOTH tokens safely upon verification success
                        if (Platform.OS === "web") {
                            try {
                                localStorage.setItem("access_token", data.session.accessToken);
                                localStorage.setItem("refresh_token", data.session.refreshToken);
                            } catch (e) {
                                console.error("localStorage setItem failed:", e);
                            }
                        }
                        await AsyncStorage.multiSet([
                            ["access_token", data.session.accessToken],
                            ["refresh_token", data.session.refreshToken],
                        ]);
                        dispatch(setProfile(data.profile));

                        // Safely trigger User tag invalidation after storage write finishes to avoid race conditions
                        dispatch(apiSlice.util.invalidateTags(["User"]));
                    }
                } catch (error) {
                    console.error(
                        "Failed handling state persistence updates on OTP match:",
                        error,
                    );
                }
            },
        }),

        resendOtp: builder.mutation<
            ResendOtpResponseBody,
            ResendOtpRequestBody
        >({
            query: (body) => ({
                url: "/api/auth/resend-otp",
                method: "POST",
                body,
            }),
        }),

        getProfile: builder.query<UserProfileResponseBody, void>({
            query: () => ({
                url: "/api/user/profile",
                method: "GET",
            }),
            providesTags: ["User"],
            async onQueryStarted(_, { dispatch, queryFulfilled, getState }) {
                try {
                    const { data } = await queryFulfilled;
                    console.log("[authApi] getProfile success, data:", data);
                    if (data && !("error" in data)) {
                        if ("isGuest" in data && data.isGuest) {
                            // Race condition guard: if login already set a profile in Redux,
                            // do NOT override it with null from a stale getProfile response
                            // that fired before the token was written to storage.
                            const currentProfile = (getState() as RootState).auth.profile;
                            if (currentProfile) {
                                console.log("[authApi] getProfile: got guest response but profile already set in Redux — skipping override");
                                return;
                            }
                            console.log("[authApi] getProfile: user is guest, setting profile to null");
                            dispatch(setProfile(null));
                        } else {
                            console.log("[authApi] getProfile: user is logged in, setting profile:", data);
                            dispatch(setProfile(data as UserProfileSummary));
                        }
                    }
                } catch (error) {
                    console.error("[authApi] Failed to sync profile query error:", error);
                }
            },
        }),

        updateProfile: builder.mutation<UserProfileSummary, UpdateProfileRequestBody>({
            query: (body) => ({
                url: "/api/user/profile",
                method: "PUT",
                body,
            }),
            invalidatesTags: ["User"],
            async onQueryStarted(_, { dispatch, queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled;
                    console.log("[authApi] updateProfile success, data:", data);
                    dispatch(setProfile(data));
                } catch (error) {
                    console.error("[authApi] Failed to update profile:", error);
                }
            },
        }),

        changePassword: builder.mutation<{ message: string }, ChangePasswordRequestBody>({
            query: (body) => ({
                url: "/api/user/change-password",
                method: "PUT",
                body,
            }),
        }),

        updateUserData: builder.mutation<{ message: string }, UpdateUserDataRequestBody>({
            query: (body) => ({
                url: "/api/user/data",
                method: "PUT",
                body,
            }),
            invalidatesTags: ["User"],
            async onQueryStarted(_, { dispatch, queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled;
                    console.log("[authApi] updateUserData success, data:", data);
                    // Refresh profile
                    dispatch(authApi.endpoints.getProfile.initiate(undefined, { forceRefetch: true }));
                } catch (error) {
                    console.error("[authApi] Failed to update user data:", error);
                }
            },
        }),

        updateUserEmail: builder.mutation<{ message: string }, UpdateUserEmailRequestBody>({
            query: (body) => ({
                url: "/api/user/email",
                method: "PUT",
                body,
            }),
            invalidatesTags: ["User"],
            async onQueryStarted(_, { dispatch, queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled;
                    console.log("[authApi] updateUserEmail success, data:", data);
                    // Refresh profile
                    dispatch(authApi.endpoints.getProfile.initiate(undefined, { forceRefetch: true }));
                } catch (error) {
                    console.error("[authApi] Failed to update email:", error);
                }
            },
        }),

        updateUserPassword: builder.mutation<{ message: string }, ChangePasswordRequestBody>({
            query: (body) => ({
                url: "/api/user/password",
                method: "PUT",
                body,
            }),
        }),

        forgotPassword: builder.mutation<{ message: string }, { email: string }>({
            query: (body) => ({
                url: "/api/auth/forgot-password",
                method: "POST",
                body,
            }),
        }),

        verifyForgotOtp: builder.mutation<{ message: string; accessToken: string }, { email: string; token: string }>({
            query: (body) => ({
                url: "/api/auth/verify-forgot-otp",
                method: "POST",
                body,
            }),
            async onQueryStarted(_, { queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled;
                    if (data?.accessToken) {
                        if (Platform.OS === "web") {
                            try {
                                localStorage.setItem("access_token", data.accessToken);
                            } catch (e) {}
                        } else {
                            await AsyncStorage.setItem("access_token", data.accessToken);
                        }
                    }
                } catch (error) {
                    console.error("[authApi] verifyForgotOtp save token error:", error);
                }
            },
        }),

        completeReset: builder.mutation<{ message: string }, { token?: string; newPassword: string }>({
            query: ({ token, newPassword }) => ({
                url: "/api/auth/complete-reset",
                method: "POST",
                headers: token ? { Authorization: `Bearer ${token}` } : undefined,
                body: { newPassword },
            }),
        }),
    }),
    overrideExisting: __DEV__, // Safe hot-reloading for Expo local servers
});

// Export hooks generated automatically by RTK Query compiler rules
export const {
    useLoginMutation,
    useRegisterUserMutation,
    useVerifyOtpMutation,
    useResendOtpMutation,
    useGetProfileQuery,
    useUpdateProfileMutation,
    useChangePasswordMutation,
    useUpdateUserDataMutation,
    useUpdateUserEmailMutation,
    useUpdateUserPasswordMutation,
    useGoogleVerifyMutation,
    useFacebookVerifyMutation,
    useForgotPasswordMutation,
    useVerifyForgotOtpMutation,
    useCompleteResetMutation,
} = authApi;
