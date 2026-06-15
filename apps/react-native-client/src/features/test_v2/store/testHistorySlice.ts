// store/testHistorySlice.ts — V2: minimal slice, history comes from API
// Kept for cross-screen cache and backward compat with store.ts
import { createSlice } from "@reduxjs/toolkit";

interface TestHistoryState {
    // Intentionally empty — V2 uses RTK Query for history data
    _placeholder: boolean;
}

const initialState: TestHistoryState = {
    _placeholder: true,
};

const testHistorySlice = createSlice({
    name: "testHistory",
    initialState,
    reducers: {},
});

export default testHistorySlice.reducer;
