// services/authApi.ts
import { apiSlice } from "@/services/apiSlice";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
    LoginRequestBody,
    LoginSuccessResponse,
    RegisterRequestBody, // Imported from shared contract packages
    RegisterResponseBody,
    VerifyOtpResponseBody, // Map to your backend types
    ResendOtpRequestBody, // Map to your backend types
    ResendOtpResponseBody, // Imported from shared contract packages
} from "@history-app/shared";
import { setProfile } from "../store/authSlice";

export const authApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        // --- Existing Login Mutation ---
        login: builder.mutation<LoginSuccessResponse, LoginRequestBody>({
            query: (credentials) => ({
                url: "/api/auth/login",
                method: "POST",
                body: credentials,
            }),
            // Invalidate 'User' cache tag on login to force refetching fresh state
            invalidatesTags: ["User"],
            // Seamlessly save the token to storage immediately on success
            async onQueryStarted(_, { queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled;
                    if (data?.session?.accessToken) {
                        await AsyncStorage.setItem(
                            "user_token",
                            data.session.accessToken,
                        );
                    }
                } catch (error) {
                    console.error(
                        "Failed to persist auth token on login:",
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

        verifyOtp: builder.mutation<
            VerifyOtpResponseBody,
            { email: string; token: string }
        >({
            query: (body) => ({
                url: "/api/auth/verify-otp",
                method: "POST",
                body, // Matches backend structure processing verification tokens
            }),
            invalidatesTags: ["User"],
            async onQueryStarted(_, { dispatch, queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled;
                    if ("session" in data && data.session?.accessToken) {
                        // 1. Persist the clean session token strings
                        await AsyncStorage.setItem(
                            "user_token",
                            data.session.accessToken,
                        );

                        // 2. Set the global profile cache to switch guest TopBar screens instantly
                        dispatch(setProfile(data.profile));
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
    }),
    overrideExisting: __DEV__, // Safe hot-reloading for Expo local servers
});

// Export hooks generated automatically by RTK Query compiler rules
export const {
    useLoginMutation,
    useRegisterUserMutation,
    useVerifyOtpMutation,
    useResendOtpMutation,
} = authApi;
