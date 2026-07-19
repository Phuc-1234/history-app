import messaging from '@react-native-firebase/messaging';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../../../services/config';

const ACCESS_TOKEN_KEY = 'access_token';

const getAccessToken = async (): Promise<string | null> => {
  if (Platform.OS === 'web') {
    try {
      return localStorage.getItem(ACCESS_TOKEN_KEY);
    } catch {
      return null;
    }
  }
  return await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
};

/**
 * Service to handle notification logic
 */
export const notificationService = {
  /**
   * Get the FCM token for the device
   */
  async getFCMToken(): Promise<string | null> {
    try {
      const token = await messaging().getToken();
      console.log('FCM Token:', token);
      return token;
    } catch (error) {
      console.error('Failed to get FCM token:', error);
      return null;
    }
  },

  /**
   * Save the FCM token to the server database
   */
  async registerTokenWithBackend(token: string): Promise<boolean> {
    try {
      const accessToken = await getAccessToken();
      if (!accessToken) {
        console.log('[FCM] No access token found in storage, skipping registration.');
        return false;
      }

      console.log('Registering token with backend:', token);
      const response = await fetch(`${API_BASE_URL}/api/notifications/register-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ token }),
      });
      
      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      console.log('FCM Token registered successfully with backend');
      return true;
    } catch (error) {
      console.error('Failed to register FCM token with backend:', error);
      return false;
    }
  },

  /**
   * Delete the FCM token (useful on logout)
   */
  async deleteFCMToken(): Promise<void> {
    try {
      await messaging().deleteToken();
      console.log('FCM Token deleted successfully');
    } catch (error) {
      console.error('Failed to delete FCM token:', error);
    }
  }
};
