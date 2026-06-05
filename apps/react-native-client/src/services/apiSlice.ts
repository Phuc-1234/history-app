import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import AsyncStorage from '@react-native-async-storage/async-storage';
// import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { API_BASE_URL } from './config';

// TODO: use secure storeage for prod
// Safe secure key retrieval based on active platform target
const getAuthToken = async () => {
  // if (Platform.OS === 'web') {
  //   return await AsyncStorage.getItem('user_token');
  // } else {
  //   return await SecureStore.getItemAsync('user_token');
  // }
  
  return await AsyncStorage.getItem('access_token');
};

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    prepareHeaders: async (headers) => {
      // Automatically pull token from the platform's active store
      const token = await getAuthToken();
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  // Tag types are used for automatic caching and invalidation later
  tagTypes: ['User', 'History'],
  endpoints: () => ({}), // We keep this empty and inject endpoints via code separation
});