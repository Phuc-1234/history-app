import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import AsyncStorage from '@react-native-async-storage/async-storage';
// import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { API_BASE_URL } from './config';

// TODO: use secure storeage for prod
// Safe secure key retrieval based on active platform target
const getAuthToken = async () => {
  if (Platform.OS === 'web') {
    try {
      return localStorage.getItem('access_token');
    } catch (e) {
      console.error("Failed to read from localStorage:", e);
    }
  }
  return await AsyncStorage.getItem('access_token');
};

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    prepareHeaders: async (headers, { endpoint }) => {
      // Automatically pull token from the platform's active store
      const token = await getAuthToken();
      console.log("[apiSlice] prepareHeaders - fetched token:", token);
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }

      if (["updateProfile", "updateUserData", "updateUserEmail"].includes(endpoint)) {
        const refreshToken =
          Platform.OS === "web"
            ? localStorage.getItem("refresh_token")
            : await AsyncStorage.getItem("refresh_token");

        if (refreshToken) {
          headers.set("x-refresh-token", refreshToken);
        }
      }

      return headers;
    },
  }),
  // Tag types are used for automatic caching and invalidation later
  tagTypes: ['User', 'History'],
  endpoints: () => ({}), // We keep this empty and inject endpoints via code separation
});
