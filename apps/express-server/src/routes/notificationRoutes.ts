import { Router, Request, Response } from 'express';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import * as path from 'path';
import * as fs from 'fs';
import { requireStudent } from "../middlewares/authMiddleware";
import { prisma } from "@history-app/shared";

const db = prisma as any;
const router = Router();

// In-memory store for registered FCM tokens (for testing purposes)
// In a real application, you should save this in MongoDB/PostgreSQL associated with users
const registeredTokens = new Set<string>();

// Initialize Firebase Admin SDK
const serviceAccountPath = path.resolve(__dirname, '../../service-account.json');
let firebaseInitialized = false;

try {
  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    if (getApps().length === 0) {
      initializeApp({
        credential: cert(serviceAccount),
      });
    }
    firebaseInitialized = true;
    console.log('🔥 Firebase Admin SDK initialized successfully.');
  } else {
    console.warn(
      '⚠️  [Firebase Warning]: service-account.json not found at ' +
        serviceAccountPath +
        '. Push notifications will not be sent.'
    );
  }
} catch (error) {
  console.error('❌ Failed to initialize Firebase Admin SDK:', error);
}

/**
 * API: POST /api/notifications/register-token
 * Receives the FCM token from the device and stores it
 */
router.post('/register-token', (req: Request, res: Response) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: 'Token is required' });
  }

  registeredTokens.add(token);
  console.log(`[Notification] Token registered. Total tokens: ${registeredTokens.size}`);
  
  return res.status(200).json({
    message: 'Token registered successfully',
    totalTokens: registeredTokens.size,
  });
});

/**
 * API: POST /api/notifications/send-test
 * Sends a push notification to all registered tokens
 */
router.post('/send-test', async (req: Request, res: Response) => {
  const { title, body } = req.body;

  if (!title || !body) {
    return res.status(400).json({ error: 'Title and body are required' });
  }

  if (!firebaseInitialized) {
    return res.status(500).json({
      error: 'Firebase Admin SDK is not initialized. Please place service-account.json in the express-server folder.',
    });
  }

  if (registeredTokens.size === 0) {
    return res.status(400).json({
      error: 'No registered tokens found. Please run the mobile app to register at least one device.',
    });
  }

  const tokensArray = Array.from(registeredTokens);
  console.log(`[Notification] Sending message to ${tokensArray.length} tokens...`);

  const message = {
    notification: {
      title,
      body,
    },
    // We can also send extra custom data if needed
    data: {
      click_action: 'FLUTTER_NOTIFICATION_CLICK', // standard legacy handler mapping
      type: 'test_notification',
    },
    tokens: tokensArray,
  };

  try {
    // sendEachForMulticast is the modern Firebase Admin API for sending to multiple tokens
    const response = await getMessaging().sendEachForMulticast(message);
    
    console.log(`[Notification] Send result: ${response.successCount} success, ${response.failureCount} failed`);
    
    // Clean up expired/invalid tokens returned by Firebase
    response.responses.forEach((resp, idx) => {
      if (!resp.success) {
        const errorCode = resp.error?.code;
        if (
          errorCode === 'messaging/invalid-registration-token' ||
          errorCode === 'messaging/registration-token-not-registered'
        ) {
          const invalidToken = tokensArray[idx];
          registeredTokens.delete(invalidToken);
          console.log(`[Notification] Cleaned up invalid token: ${invalidToken}`);
        }
      }
    });

    return res.status(200).json({
      message: 'Push notification request processed',
      successCount: response.successCount,
      failureCount: response.failureCount,
      totalTokens: registeredTokens.size,
    });
  } catch (error: any) {
    console.error('[Notification] Error sending multicast message:', error);
    return res.status(500).json({
      error: 'Failed to send notification',
      details: error.message,
    });
  }
});

/**
 * API: GET /api/notifications
 * Fetch all notifications for the logged in student
 */
router.get('/', requireStudent, async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  try {
    const notifications = await db.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return res.status(200).json({ notifications });
  } catch (error: any) {
    console.error('[Notification] Error fetching notifications:', error);
    return res.status(500).json({ error: 'Failed to fetch notifications', details: error.message });
  }
});

/**
 * API: PUT /api/notifications/read-all
 * Mark all notifications for the user as read
 */
router.put('/read-all', requireStudent, async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  try {
    await db.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return res.status(200).json({ message: 'All notifications marked as read' });
  } catch (error: any) {
    console.error('[Notification] Error marking all as read:', error);
    return res.status(500).json({ error: 'Failed to mark all as read', details: error.message });
  }
});

/**
 * API: PUT /api/notifications/:id/read
 * Mark a specific notification as read
 */
router.put('/:id/read', requireStudent, async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const { id } = req.params;
  try {
    const notification = await db.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    await db.notification.update({
      where: { id },
      data: { isRead: true },
    });

    return res.status(200).json({ message: 'Notification marked as read' });
  } catch (error: any) {
    console.error('[Notification] Error marking notification as read:', error);
    return res.status(500).json({ error: 'Failed to mark notification as read', details: error.message });
  }
});

export default router;
