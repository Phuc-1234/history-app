// store/authSlice.ts
import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import { UserProfileSummary } from "@history-app/shared";
import { apiSlice } from "@/services/apiSlice";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

interface AuthState {
    profile: UserProfileSummary | null;
}

const initialState: AuthState = {
    profile: null,
};

export const appLogout = createAsyncThunk(
    "auth/appLogout",
    async (_, { dispatch }) => {
        try {
            // 1. Completely delete your authentication tokens from device storage
            if (Platform.OS === "web") {
                try {
                    localStorage.removeItem("access_token");
                    localStorage.removeItem("refresh_token");
                } catch (e) {
                    console.error("localStorage removeItem failed:", e);
                }
            }
            await AsyncStorage.multiRemove(["access_token", "refresh_token"]);
            
            // 2. Clear all RTK Query API cache tables completely 
            // This prevents an absolute security flaw where a logged-out user could still see old queries
            dispatch(apiSlice.util.resetApiState());

            // 3. Log out from Google & Facebook on native platforms
            if (Platform.OS !== "web") {
                try {
                    const { GoogleSignin } = require("@react-native-google-signin/google-signin");
                    GoogleSignin.configure({
                        webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || "YOUR_GOOGLE_WEB_CLIENT_ID.apps.googleusercontent.com",
                        offlineAccess: true,
                    });
                    await GoogleSignin.signOut();
                } catch (e) {
                    console.error("Google Sign-in signOut failed:", e);
                }

                try {
                    const { LoginManager } = require("react-native-fbsdk-next");
                    LoginManager.logOut();
                } catch (e) {
                    console.error("Facebook logOut failed:", e);
                }
            }
        } catch (error) {
            console.error("Error during persistent storage clean:", error);
        }
    }
);

export const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        setProfile: (state, action: PayloadAction<UserProfileSummary | null>) => {
            state.profile = action.payload;
        },
        logout: (state) => {
            state.profile = null;
        },
    },// Listen for the appLogout async lifecycle actions to clear state
    extraReducers: (builder) => {
        builder.addCase(appLogout.fulfilled, (state) => {
            state.profile = null;
        });
    }
});

export const { setProfile, logout } = authSlice.actions; 
export default authSlice.reducer;