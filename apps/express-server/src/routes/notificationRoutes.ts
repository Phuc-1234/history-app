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

import { pushNotificationService } from '../services/pushNotificationService';

/**
 * API: POST /api/notifications/register-token
 * Receives the FCM token from the device and stores it for the logged in user
 */
router.post('/register-token', requireStudent, async (req: Request, res: Response) => {
  const { token } = req.body;
  const userId = (req as any).user.id;

  if (!token) {
    return res.status(400).json({ error: 'Token is required' });
  }

  try {
    await pushNotificationService.registerToken(userId, token);
    registeredTokens.add(token);
    console.log(`[Notification] Token registered for user ${userId}`);
    return res.status(200).json({ message: 'Token registered successfully' });
  } catch (error: any) {
    console.error('[Notification] Error registering token:', error);
    return res.status(500).json({ error: 'Failed to register token', details: error.message });
  }
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
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            profileImgUrl: true,
            userEquippedItems: {
              where: { equipmentSlot: 'AVT_FRAME' },
              include: { itemDefinition: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const friendRequestIds = notifications
      .filter((n: any) => n.type === 'FRIEND_REQUEST' && n.targetId)
      .map((n: any) => n.targetId);

    const friendRequests = friendRequestIds.length > 0
      ? await db.friendRequest.findMany({
          where: { id: { in: friendRequestIds } },
          select: { id: true, status: true },
        })
      : [];

    const statusMap = new Map<string, string>(
      friendRequests.map((fr: any) => [fr.id, fr.status])
    );

    const pvpRoomCodes = notifications
      .filter((n: any) => n.type === 'PVP_INVITE' && n.targetId)
      .map((n: any) => n.targetId);

    const pvpRooms = pvpRoomCodes.length > 0
      ? await db.pvpRoom.findMany({
          where: {
            OR: [
              { code: { in: pvpRoomCodes } },
              { id: { in: pvpRoomCodes } },
            ],
          },
          include: { participants: { select: { userId: true } } },
          orderBy: { createdAt: 'desc' },
        })
      : [];

    const formattedNotifications = notifications.map((n: any) => {
      let requestStatus: string | null = null;
      if (n.type === 'FRIEND_REQUEST' && n.targetId) {
        requestStatus = statusMap.get(n.targetId) || null;
      }

      let pvpRoomStatus: string | null = null;
      if (n.type === 'PVP_INVITE' && n.targetId) {
        const matchingRoomWhereJoined = pvpRooms.find(
          (r: any) =>
            (r.code === n.targetId || r.id === n.targetId) &&
            r.participants.some((p: any) => p.userId === n.userId)
        );

        if (matchingRoomWhereJoined) {
          pvpRoomStatus = 'ALREADY_JOINED';
          requestStatus = 'ACCEPTED';
        } else {
          const mostRecentRoom = pvpRooms.find(
            (r: any) => r.code === n.targetId || r.id === n.targetId
          );
          if (!mostRecentRoom) {
            pvpRoomStatus = 'NOT_FOUND';
          } else if (mostRecentRoom.status === 'LOBBY') {
            pvpRoomStatus = mostRecentRoom.participants.length >= 8 ? 'FULL' : 'LOBBY';
          } else if (mostRecentRoom.status === 'IN_PROGRESS') {
            pvpRoomStatus = 'IN_PROGRESS';
          } else {
            pvpRoomStatus = 'EXPIRED';
          }
        }
      }

      let formattedSender: {
        id: string;
        name: string;
        profileImgUrl: string | null;
        equippedFrameUrl: string | null;
      } | null = null;
      if (n.sender) {
        const frameUrl = n.sender.userEquippedItems?.[0]?.itemDefinition?.imgUrl ?? null;
        formattedSender = {
          id: n.sender.id,
          name: n.sender.name,
          profileImgUrl: n.sender.profileImgUrl,
          equippedFrameUrl: frameUrl,
        };
      }

      return {
        id: n.id,
        userId: n.userId,
        senderId: n.senderId,
        targetId: n.targetId,
        type: n.type,
        title: n.title,
        body: n.body,
        isRead: n.isRead,
        isHidden: n.isHidden,
        createdAt: n.createdAt,
        updatedAt: n.updatedAt,
        sender: formattedSender,
        requestStatus,
        pvpRoomStatus,
      };
    });

    return res.status(200).json({ notifications: formattedNotifications });
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

/**
 * API: PUT /api/notifications/:id/toggle-hide
 * Toggle or set hidden status for a notification
 */
router.put('/:id/toggle-hide', requireStudent, async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const { id } = req.params;
  const { isHidden } = req.body;
  try {
    const notification = await db.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    const newHiddenState = typeof isHidden === 'boolean' ? isHidden : !notification.isHidden;

    const updated = await db.notification.update({
      where: { id },
      data: { isHidden: newHiddenState },
    });

    return res.status(200).json({
      message: newHiddenState ? 'Notification hidden' : 'Notification unhidden',
      isHidden: updated.isHidden,
    });
  } catch (error: any) {
    console.error('[Notification] Error toggling notification hidden state:', error);
    return res.status(500).json({ error: 'Failed to update notification', details: error.message });
  }
});

import { studyReminderService } from '../services/studyReminderService';

/**
 * API: GET /api/notifications/reminders
 * Fetch study reminder settings for the current user
 */
router.get('/reminders', requireStudent, async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  try {
    const settings = await studyReminderService.getReminderSettings(userId);
    return res.status(200).json(settings);
  } catch (error: any) {
    console.error('[Notification] Error getting reminder settings:', error);
    return res.status(500).json({ error: 'Failed to fetch reminder settings', details: error.message });
  }
});

/**
 * API: PUT /api/notifications/reminders
 * Update study reminder settings for the current user
 */
router.put('/reminders', requireStudent, async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const { isEnabled, times } = req.body;
  try {
    const settings = await studyReminderService.updateReminderSettings(
      userId,
      Boolean(isEnabled),
      Array.isArray(times) ? times : []
    );
    return res.status(200).json(settings);
  } catch (error: any) {
    console.error('[Notification] Error updating reminder settings:', error);
    return res.status(500).json({ error: 'Failed to update reminder settings', details: error.message });
  }
});

/**
 * API: POST /api/notifications/reminders/test-trigger
 * Send an immediate test study reminder for the current user
 */
router.post('/reminders/test-trigger', requireStudent, async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  try {
    const payload = await studyReminderService.sendReminder(userId);
    return res.status(200).json({
      message: 'Test study reminder sent successfully',
      payload,
    });
  } catch (error: any) {
    console.error('[Notification] Error sending test reminder:', error);
    return res.status(500).json({ error: 'Failed to send test reminder', details: error.message });
  }
});

export default router;
