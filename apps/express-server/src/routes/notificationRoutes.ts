import { Router, Request, Response } from 'express';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import * as path from 'path';
import * as fs from 'fs';

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

export default router;
