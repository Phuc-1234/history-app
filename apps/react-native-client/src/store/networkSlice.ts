import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface NetworkState {
  isNetworkErrorVisible: boolean;
}

const initialState: NetworkState = {
  isNetworkErrorVisible: false,
};

export const networkSlice = createSlice({
  name: 'network',
  initialState,
  reducers: {
    setNetworkErrorVisible: (state, action: PayloadAction<boolean>) => {
      state.isNetworkErrorVisible = action.payload;
    },
  },
});

export const { setNetworkErrorVisible } = networkSlice.actions;
export default networkSlice.reducer;
