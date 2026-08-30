import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import * as path from 'path';
import * as fs from 'fs';
import { prisma } from '@history-app/shared';

const db = prisma as any;

let firebaseInitialized = false;

function getServiceAccountCredentials(): any | null {
  const candidatePaths = [
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH,
    '/etc/secrets/service-account.json',
    path.resolve(process.cwd(), 'service-account.json'),
    path.resolve(process.cwd(), 'apps/express-server/service-account.json'),
    path.resolve(__dirname, '../../service-account.json'),
    path.resolve(__dirname, '../../../service-account.json'),
  ].filter((p): p is string => Boolean(p));

  for (const filePath of candidatePaths) {
    if (fs.existsSync(filePath)) {
      try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
      } catch (err) {
        console.error(`[PushNotification Error] Failed to parse service-account.json at ${filePath}:`, err);
      }
    }
  }

  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } catch {
      try {
        const decoded = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT, 'base64').toString('utf8');
        return JSON.parse(decoded);
      } catch (err) {
        console.error('[PushNotification Error] Failed to parse FIREBASE_SERVICE_ACCOUNT env var:', err);
      }
    }
  }

  return null;
}

try {
  const serviceAccount = getServiceAccountCredentials();
  if (serviceAccount) {
    if (getApps().length === 0) {
      initializeApp({
        credential: cert(serviceAccount),
      });
    }
    firebaseInitialized = true;
    console.log('[PushNotification] Firebase Admin SDK initialized.');
  } else {
    console.warn('[PushNotification Warning] service-account.json not found in candidate paths (/etc/secrets, cwd, apps/express-server).');
  }
} catch (error) {
  console.error('[PushNotification Error] Failed to initialize Firebase Admin SDK:', error);
}

export class PushNotificationService {
  /**
   * Register or update an FCM token for a specific user in database
   */
  async registerToken(userId: string, token: string): Promise<void> {
    if (!token || !userId) return;

    await db.fcmToken.upsert({
      where: { token },
      update: { userId, updatedAt: new Date() },
      create: { userId, token },
    });
  }

  /**
   * Delete an FCM token from database
   */
  async removeToken(token: string): Promise<void> {
    if (!token) return;
    try {
      await db.fcmToken.delete({ where: { token } });
    } catch {
      // Ignore if already deleted
    }
  }

  /**
   * Send push notification to a specific user by userId
   */
  async sendToUser(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, string>
  ): Promise<void> {
    if (!firebaseInitialized) {
      console.warn('[PushNotification] Firebase is not initialized, skipping push send.');
      return;
    }

    try {
      const userTokens = await db.fcmToken.findMany({
        where: { userId },
        select: { token: true },
      });

      if (!userTokens || userTokens.length === 0) {
        console.log(`[PushNotification] No registered FCM tokens found for user: ${userId}`);
        return;
      }

      const tokens = userTokens.map((t: any) => t.token);
      const message = {
        notification: { title, body },
        data: data || {},
        android: {
          priority: 'high' as const,
          notification: {
            sound: 'default',
            priority: 'high' as const,
            channelId: 'default',
            defaultSound: true,
            defaultVibrateTimings: true,
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              contentAvailable: true,
            },
          },
        },
        tokens,
      };

      const response = await getMessaging().sendEachForMulticast(message);
      console.log(`[PushNotification] Sent to user ${userId}: ${response.successCount} success, ${response.failureCount} failed`);

      // Clean up invalid or expired tokens
      const invalidTokens: string[] = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          const errorCode = resp.error?.code;
          if (
            errorCode === 'messaging/invalid-registration-token' ||
            errorCode === 'messaging/registration-token-not-registered'
          ) {
            invalidTokens.push(tokens[idx]);
          }
        }
      });

      if (invalidTokens.length > 0) {
        await db.fcmToken.deleteMany({
          where: { token: { in: invalidTokens } },
        });
        console.log(`[PushNotification] Cleaned up ${invalidTokens.length} invalid token(s).`);
      }
    } catch (error) {
      console.error('[PushNotification Error] Failed to send push notification:', error);
    }
  }
}

export const pushNotificationService = new PushNotificationService();
