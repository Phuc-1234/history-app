import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SettingsState {
  soundEnabled: boolean;
  hapticsEnabled: boolean;
}

const initialState: SettingsState = {
  soundEnabled: true,
  hapticsEnabled: true,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    toggleSound: (state) => {
      state.soundEnabled = !state.soundEnabled;
    },
    setSoundEnabled: (state, action: PayloadAction<boolean>) => {
      state.soundEnabled = action.payload;
    },
    toggleHaptics: (state) => {
      state.hapticsEnabled = !state.hapticsEnabled;
    },
    setHapticsEnabled: (state, action: PayloadAction<boolean>) => {
      state.hapticsEnabled = action.payload;
    },
  },
});

export const { toggleSound, setSoundEnabled, toggleHaptics, setHapticsEnabled } = settingsSlice.actions;

export default settingsSlice.reducer;
