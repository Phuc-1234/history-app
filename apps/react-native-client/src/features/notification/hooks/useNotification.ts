import { useEffect } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import { notificationService } from '../services/notificationService';
import { toastService } from '@/services/toastService';
import { useAppSelector } from '@/store/storeHook';

export function useNotification() {
  const profileId = useAppSelector((state) => state.auth.profile?.id);

  // 1. Request notification permissions (required for Android 13+ / API 33+)
  async function requestNotificationPermission() {
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true; // Android versions below 13 grant permission automatically upon install
  }

  useEffect(() => {
    let isMounted = true;
    let unsubscribeForeground = () => {};
    let unsubscribeNotificationOpened = () => {};
    let unsubscribeTokenRefresh = () => {};

    const setupNotification = async () => {
      try {
        const hasPermission = await requestNotificationPermission();
        if (!hasPermission) {
          console.log('Notification permission denied');
          return;
        }

        const token = await notificationService.getFCMToken();
        if (token && isMounted) {
          await notificationService.registerTokenWithBackend(token);
        }
      } catch (e) {
        console.warn('[Firebase setupNotification] failed:', e);
      }
    };

    setupNotification();

    try {
      // 2. Listen to foreground messages (App is open)
      unsubscribeForeground = messaging().onMessage(async (remoteMessage) => {
        console.log('Foreground message received:', remoteMessage);
        
        // Show beautiful slide-down toast notification instead of basic alert dialog
        toastService.show(
          `${remoteMessage.notification?.title || 'Thông báo mới'}: ${remoteMessage.notification?.body || ''}`,
          "info"
        );
      });

      // 3. Listen to background actions (User clicks notification when app is in background)
      unsubscribeNotificationOpened = messaging().onNotificationOpenedApp((remoteMessage) => {
        console.log('User clicked notification (Background state):', remoteMessage);
        // TODO: Handle navigation here
      });

      // 4. Listen to app startup from killed state (User clicks notification when app is killed)
      messaging()
        .getInitialNotification()
        .then((remoteMessage) => {
          if (remoteMessage && isMounted) {
            console.log('App opened from notification (Killed state):', remoteMessage);
            // TODO: Handle navigation here
          }
        })
        .catch(err => console.warn('[Firebase getInitialNotification] failed:', err));

      // 5. Auto refresh token when Firebase updates it
      unsubscribeTokenRefresh = messaging().onTokenRefresh(async (newToken) => {
        console.log('FCM Token refreshed:', newToken);
        if (isMounted) {
          await notificationService.registerTokenWithBackend(newToken);
        }
      });
    } catch (e) {
      console.warn('[Firebase messaging listeners] failed to initialize. Firebase is likely not initialized natively:', e);
    }

    return () => {
      isMounted = false;
      unsubscribeForeground();
      unsubscribeNotificationOpened();
      unsubscribeTokenRefresh();
    };
  }, [profileId]);
}
