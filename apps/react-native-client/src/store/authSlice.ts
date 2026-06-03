// store/authSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { UserProfileSummary } from "@history-app/shared";

interface AuthState {
    profile: UserProfileSummary | null;
}

const initialState: AuthState = {
    profile: null,
};

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
    },
});

export const { setProfile, logout } = authSlice.actions; 
export default authSlice.reducer;