import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiSlice } from '../services/apiSlice';
import authReducer from "../features/auth/store/authSlice";
import testHistoryReducer from '../features/test_v2/store/testHistorySlice';

// Combine your reducers (add your feature auth or history slices here later)
const rootReducer = combineReducers({
  [apiSlice.reducerPath]: apiSlice.reducer,
  auth: authReducer,
  testHistory: testHistoryReducer,
});

// Configure Redux Persist to save states automatically
const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  // Ensure we don't accidentally try to persist the RTK Query cache state
  blacklist: [apiSlice.reducerPath], 
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // Redux Persist uses some non-serializable actions that we must ignore
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE', 'persist/REGISTER'],
      },
    }).concat(apiSlice.middleware), // Attach RTK Query caching engine middleware
});

export const persistor = persistStore(store);

// Enables refetchOnFocus and refetchOnReconnect capabilities for RTK Query
setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;