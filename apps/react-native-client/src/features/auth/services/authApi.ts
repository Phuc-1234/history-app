// services/authApi.ts
import { apiSlice } from "@/services/apiSlice";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
} from "@history-app/shared";
import { setProfile } from "../store/authSlice";

export const authApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        // --- Refactored Login Mutation ---
        login: builder.mutation<LoginResponseBody, LoginRequestBody>({
            query: (credentials) => ({
                url: "/api/auth/login",
                method: "POST",
                body: credentials,
            }),
            invalidatesTags: ["User"],
            async onQueryStarted(_, { dispatch, queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled;

                    // FIX: Check if 'session' exists in the data object to determine success

                    

                    if (data && "session" in data && data.session) {
                        // Persist BOTH tokens safely
                        await AsyncStorage.multiSet([
                            ["access_token", data.session.accessToken],
                            ["refresh_token", data.session.refreshToken],
                        ]);

                        // Automatically sync global profile store instantly
                        dispatch(setProfile(data.profile));
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

                    // Type Guard: Make sure we have a success response (contains session and profile)
                    if (data && "session" in data && data.session) {
                        // FIX HERE: Persist BOTH tokens safely upon verification success
                        await AsyncStorage.multiSet([
                            ["user_token", data.session.accessToken],
                            ["refresh_token", data.session.refreshToken],
                        ]);
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

        getProfile: builder.query<UserProfileResponseBody, void>({
            query: () => ({
                url: "/api/user/profile",
                method: "GET",
            }),
            providesTags: ["User"],
            async onQueryStarted(_, { dispatch, queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled;
                    if (data && !("error" in data)) {
                        if ("isGuest" in data && data.isGuest) {
                            dispatch(setProfile(null));
                        } else {
                            dispatch(setProfile(data as UserProfileSummary));
                        }
                    }
                } catch (error) {
                    console.error("Failed to sync profile:", error);
                }
            },
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
} = authApi;
