// services/authApi.ts
import { apiSlice } from "@/services/apiSlice";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { 
    LoginRequestBody, 
    LoginSuccessResponse 
} from "@history-app/shared";

export const authApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
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
                        await AsyncStorage.setItem("user_token", data.session.accessToken);
                    }
                } catch (error) {
                    console.error("Failed to persist auth token on login:", error);
                }
            },
        }),
    }),
    overrideExisting: __DEV__, // Safe hot-reloading for Expo local servers
});

export const { useLoginMutation } = authApi;