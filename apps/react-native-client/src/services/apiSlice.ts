import {
  createApi,
  fetchBaseQuery,
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { API_BASE_URL } from './config';
import { setNetworkErrorVisible } from '../store/networkSlice';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

/**
 * Lấy dữ liệu từ storage theo platform
 */
const getStorageItem = async (key: string): Promise<string | null> => {
  if (Platform.OS === 'web') {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.error(`[apiSlice] Failed to read ${key} from localStorage:`, e);
      return null;
    }
  }

  return await AsyncStorage.getItem(key);
};

/**
 * Lưu dữ liệu vào storage theo platform
 */
const setStorageItem = async (key: string, value: string): Promise<void> => {
  if (Platform.OS === 'web') {
    try {
      localStorage.setItem(key, value);
      return;
    } catch (e) {
      console.error(`[apiSlice] Failed to write ${key} to localStorage:`, e);
      return;
    }
  }

  await AsyncStorage.setItem(key, value);
};

/**
 * Xóa toàn bộ token
 */
const clearAuthTokens = async (): Promise<void> => {
  if (Platform.OS === 'web') {
    try {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      return;
    } catch (e) {
      console.error('[apiSlice] Failed to clear tokens from localStorage:', e);
      return;
    }
  }

  await AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY]);
};

/**
 * Base query gốc
 * Mỗi request sẽ tự lấy access_token trong storage
 * rồi gắn vào header Authorization
 */
const baseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,

  prepareHeaders: async (headers, { endpoint }) => {
    const token = await getStorageItem(ACCESS_TOKEN_KEY);

    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }

    if (['updateProfile', 'updateUserData', 'updateUserEmail'].includes(endpoint)) {
      const refreshToken = await getStorageItem(REFRESH_TOKEN_KEY);
      if (refreshToken) {
        headers.set('x-refresh-token', refreshToken);
      }
    }

    return headers;
  },
});

/**
 * Base query có hỗ trợ tự động refresh token
 */
const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  // 1. Gọi request ban đầu
  let result = await baseQuery(args, api, extraOptions);

  // 2. Nếu access token hết hạn hoặc không hợp lệ
  if (result.error && Number(result.error.status) === 401) {
    console.log('[apiSlice] Access token expired, entering reauth flow...');

    const state = api.getState() as any;
    const isLoggedIn = !!state?.auth?.profile;

    const refreshToken = await getStorageItem(REFRESH_TOKEN_KEY);

    // 3. Không có refresh token thì logout hoặc show dialog
    if (!refreshToken) {
      console.log('[apiSlice] No refresh token found in storage, logging out...');

      await clearAuthTokens();

      if (isLoggedIn) {
        const { setSessionExpired } = await import('@/features/auth/store/authSlice');
        api.dispatch(setSessionExpired(true));
      }

      return result;
    }

    try {
      
      const refreshResult = await fetch(
        `${API_BASE_URL}/api/auth/refresh-token`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },

          /**
           * Nếu backend nhận refreshToken:
           */
          body: JSON.stringify({
            refreshToken,
          }),

          /**
           * Nếu backend nhận refresh_token thì đổi thành:
           *
           * body: JSON.stringify({
           *   refresh_token: refreshToken,
           * }),
           */
        }
      );

      // 4. Refresh thành công
      if (refreshResult.ok) {
        const refreshData = (await refreshResult.json()) as {
          accessToken?: string;
          refreshToken?: string;
          access_token?: string;
          refresh_token?: string;
        };

        /**
         * Hỗ trợ cả 2 kiểu response:
         *
         * {
         *   accessToken: "...",
         *   refreshToken: "..."
         * }
         *
         * hoặc:
         *
         * {
         *   access_token: "...",
         *   refresh_token: "..."
         * }
         */
        const newAccessToken =
          refreshData.accessToken || refreshData.access_token;

        const newRefreshToken =
          refreshData.refreshToken || refreshData.refresh_token;

        if (!newAccessToken) {
          throw new Error('Refresh API did not return new access token');
        }

        // 5. Lưu access token mới
        await setStorageItem(ACCESS_TOKEN_KEY, newAccessToken);

        // 6. Nếu backend trả refresh token mới thì lưu lại luôn
        if (newRefreshToken) {
          await setStorageItem(REFRESH_TOKEN_KEY, newRefreshToken);
        }

        console.log('[apiSlice] Token refreshed successfully');

        // 7. Gọi lại request ban đầu với access token mới
        result = await baseQuery(args, api, extraOptions);
      } else {
        // 8. Refresh token hết hạn hoặc không hợp lệ
        console.warn('[apiSlice] Refresh token expired/invalid, logging out...');

        await clearAuthTokens();

        if (isLoggedIn) {
          const { setSessionExpired } = await import('@/features/auth/store/authSlice');
          api.dispatch(setSessionExpired(true));
        }
      }
    } catch (err) {
      // 9. Lỗi mạng hoặc lỗi parse response
      console.error('[apiSlice] Token refresh failed with error:', err);

      await clearAuthTokens();

      if (isLoggedIn) {
        const { setSessionExpired } = await import('@/features/auth/store/authSlice');
        api.dispatch(setSessionExpired(true));
      }
    }
  }

  if (
    result.error &&
    (result.error.status === 'FETCH_ERROR' || result.error.status === 'TIMEOUT_ERROR')
  ) {
    api.dispatch(setNetworkErrorVisible(true));
  }

  return result;
};

export const apiSlice = createApi({
  reducerPath: 'api',
  // Tag types are used for automatic caching and invalidation later
  baseQuery: baseQueryWithReauth,

  tagTypes: ['User', 'History', 'Feedback', 'Notification', 'AiChatSession', 'AiChatMessage', 'AiQuota', 'PvpPublicRooms', 'ActivePvpRoom'],

  endpoints: () => ({}),
});
