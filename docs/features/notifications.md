# Notification System Documentation

**Current Version:** 1.0  
**Module Location:**
- Backend Routes: [notificationRoutes.ts](file:///e:/history-app/apps/express-server/src/routes/notificationRoutes.ts), [socialRoutes.ts](file:///e:/history-app/apps/express-server/src/routes/socialRoutes.ts)
- Backend Services: [pushNotificationService.ts](file:///e:/history-app/apps/express-server/src/services/pushNotificationService.ts), [socialService.ts](file:///e:/history-app/apps/express-server/src/services/socialService.ts)
- Database Schema: [schema.prisma](file:///e:/history-app/packages/shared/prisma/schema.prisma) (`Notification`, `FcmToken`)
- Frontend Feature: [features/notification](file:///e:/history-app/apps/react-native-client/src/features/notification)
  - Screens: [NotificationsScreen.tsx](file:///e:/history-app/apps/react-native-client/src/features/notification/screens/NotificationsScreen.tsx)
  - Components: [NotificationItem.tsx](file:///e:/history-app/apps/react-native-client/src/features/notification/components/NotificationItem.tsx)
  - Hooks: [useNotification.ts](file:///e:/history-app/apps/react-native-client/src/features/notification/hooks/useNotification.ts)
  - Services: [notificationService.ts](file:///e:/history-app/apps/react-native-client/src/features/notification/services/notificationService.ts), [notificationApi.ts](file:///e:/history-app/apps/react-native-client/src/features/notification/services/notificationApi.ts)
  - Types: [types.ts](file:///e:/history-app/apps/react-native-client/src/features/notification/types.ts)
- Frontend Routing & Integration:
  - App Route: [notifications.tsx](file:///e:/history-app/apps/react-native-client/src/app/notifications.tsx)
  - App Root Hook Mount: [_layout.tsx](file:///e:/history-app/apps/react-native-client/src/app/_layout.tsx)
  - Header Bell Icon: [HomeScreen.tsx](file:///e:/history-app/apps/react-native-client/src/features/home/screens/HomeScreen.tsx)
  - Navigation Drawer: [SideDrawerContext.tsx](file:///e:/history-app/apps/react-native-client/src/components/layout/SideDrawerContext.tsx)

---

## 1. Feature Overview

The Notification System is a hybrid communication engine combining:
1. **Persistent In-App Database Notifications:** User-specific notification records stored in PostgreSQL (`Notification` table) for inbox history, read/unread states, and dual-tab aggregation (Friend Requests vs. System Notifications).
2. **Push Notifications (FCM / APNs):** Remote push dispatch powered by Firebase Cloud Messaging Admin SDK (`firebase-admin`) on the backend and `@react-native-firebase/messaging` on the mobile client.
3. **In-App Toast Alerts:** Immediate foreground notification banners rendered via [toastService.ts](file:///e:/history-app/apps/react-native-client/src/services/toastService.ts) when receiving remote push events while the app is active.

---

## 2. Architecture & File Structure

```
history-app/
├── apps/
│   ├── express-server/
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   │   └── notificationRoutes.ts    # HTTP endpoints for token registration, test push, inbox fetch, read toggles
│   │   │   └── services/
│   │   │       ├── pushNotificationService.ts # Firebase Admin SDK wrapper, token upsert/cleanup & multicast dispatch
│   │   │       └── socialService.ts         # Emits FRIEND_REQUEST and FRIEND_ACCEPT notifications
│   │   └── service-account.json             # Firebase service account credential file (optional fallback if absent)
│   └── react-native-client/
│       └── src/
│           ├── app/
│           │   ├── _layout.tsx              # Mounts useNotification() listener hook globally
│           │   └── notifications.tsx        # Expo Router route wrapper for NotificationsScreen
│           └── features/
│               └── notification/
│                   ├── components/
│                   │   └── NotificationItem.tsx # Renders individual notification cards with type-specific icons
│                   ├── hooks/
│                   │   └── useNotification.ts  # Handles permissions, token registration, foreground toast, background click
│                   ├── screens/
│                   │   └── NotificationsScreen.tsx # Multi-tab screen combining Friend Requests & DB Notifications
│                   ├── services/
│                   │   ├── notificationApi.ts  # RTK Query API slice for DB notifications
│                   │   └── notificationService.ts # Native FCM token getter, backend registration, and delete methods
│                   ├── types.ts             # SystemNotification interface
│                   └── index.ts             # Public feature barrel export
└── packages/
    └── shared/
        └── prisma/
            └── schema.prisma                # Notification and FcmToken Prisma schema models
```

---

## 3. Database Models & Schema

Defined in [schema.prisma](file:///e:/history-app/packages/shared/prisma/schema.prisma):

```prisma
model Notification {
  id        String   @id @default(uuid())
  userId    String   @map("user_id")
  type      String   // "FRIEND_REQUEST" | "FRIEND_ACCEPT" | "SYSTEM" | "reward" | "achievement"
  title     String
  body      String
  isRead    Boolean  @default(false) @map("is_read")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  user      User     @relation(fields: [userId], references: [id], onDelete: Restrict)

  @@map("notifications")
}

model FcmToken {
  id        String   @id @default(uuid())
  userId    String   @map("user_id")
  token     String   @unique
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  user User @relation(fields: [userId], references: [id], onDelete: Restrict)

  @@index([userId])
  @@map("fcm_tokens")
}
```

### Key DB Details
- **Multi-Device Support:** A single `User` can have multiple `FcmToken` records (e.g. tablet, phone, multiple logins). `FcmToken.token` is unique.
- **Cascading & Safety:** Deleting a user is restricted (`onDelete: Restrict`) if notifications or tokens are attached.
- **Indexing:** `FcmToken` has an index on `userId` for multicast query lookup.

---

## 4. Current Notification Types & Triggers

### A. Currently Active in Production Backend

| Notification Type | Trigger Origin | Target User | In-App DB Record | Remote FCM Push | Payload / Action |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `FRIEND_REQUEST` | [socialService.sendFriendRequest](file:///e:/history-app/apps/express-server/src/services/socialService.ts#L380-L401) | Receiver | Yes (`db.notification.create`) | Yes (`pushNotificationService.sendToUser`) | Title: `"Lời mời kết bạn mới"`<br>Body: `"${senderName} đã gửi cho bạn một lời mời kết bạn."`<br>Data: `{ type: "FRIEND_REQUEST" }` |
| `FRIEND_ACCEPT` | [socialService.acceptFriendRequest](file:///e:/history-app/apps/express-server/src/services/socialService.ts#L428-L453) | Original Sender | Yes (`db.notification.create`) | Yes (`pushNotificationService.sendToUser`) | Title: `"Chấp nhận lời mời kết bạn"`<br>Body: `"${receiverName} đã chấp nhận lời mời kết bạn của bạn."`<br>Data: `{ type: "FRIEND_ACCEPT" }` |
| `test_notification` | [notificationRoutes.ts](file:///e:/history-app/apps/express-server/src/routes/notificationRoutes.ts#L67-L139) (`POST /api/notifications/send-test`) | In-memory registered tokens | No | Yes (`sendEachForMulticast`) | Custom title & body payload for dev testing |

### B. Frontend UI Type Handlers (Scaffolded in [NotificationItem.tsx](file:///e:/history-app/apps/react-native-client/src/features/notification/components/NotificationItem.tsx))

The mobile UI supports visual categorization via `notification.type`:
- `"push"` / `"FRIEND_REQUEST"` / `"FRIEND_ACCEPT"`: Icon `notifications-circle-outline`, Primary container background (`colors.primaryContainer`).
- `"reward"`: Icon `gift-outline`, Background `#FFF9EE`, Icon color `colors.secondary` (Gold/Orange).
- `"achievement"`: Icon `trophy-outline`, Background `#F4F0FA`, Icon color `#8C6BAF` (Purple).
- Fallback / `"SYSTEM"`: Icon `notifications-outline`, Primary container background.

---

## 5. Backend Service & API Specification

### A. PushNotificationService ([pushNotificationService.ts](file:///e:/history-app/apps/express-server/src/services/pushNotificationService.ts))

- **Initialization:** Loads `service-account.json` from `apps/express-server/service-account.json`. If missing, warns on console and safely skips push dispatches without failing parent transactions.
- **Methods:**
  - `registerToken(userId: string, token: string): Promise<void>`: Upserts token in `fcm_tokens` table.
  - `removeToken(token: string): Promise<void>`: Deletes token from `fcm_tokens` table.
  - `sendToUser(userId: string, title: string, body: string, data?: Record<string, string>): Promise<void>`:
    1. Fetches all tokens for `userId` from `db.fcmToken`.
    2. Sends multicast message using Firebase Admin `getMessaging().sendEachForMulticast(message)`.
    3. Detects invalid / expired tokens (`messaging/invalid-registration-token`, `messaging/registration-token-not-registered`).
    4. Automatically purges dead tokens from `fcm_tokens` via `db.fcmToken.deleteMany`.

### B. REST Endpoints ([notificationRoutes.ts](file:///e:/history-app/apps/express-server/src/routes/notificationRoutes.ts))

All user endpoints require JWT authentication via `requireStudent` middleware:

| Method | Endpoint | Auth | Request Body / Params | Response Body | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/notifications/register-token` | `requireStudent` | `{ token: string }` | `{ message: "Token registered successfully" }` | Registers / upserts device FCM token for authenticated user. |
| `POST` | `/api/notifications/send-test` | None (Dev) | `{ title: string, body: string }` | `{ message, successCount, failureCount, totalTokens }` | Broadcasts test notification to in-memory registered devices. |
| `GET` | `/api/notifications` | `requireStudent` | None | `{ notifications: Notification[] }` | Returns user notification list ordered by `createdAt: desc`. |
| `PUT` | `/api/notifications/read-all` | `requireStudent` | None | `{ message: "All notifications marked as read" }` | Sets `isRead: true` for all unread notifications of the user. |
| `PUT` | `/api/notifications/:id/read` | `requireStudent` | Param: `id` | `{ message: "Notification marked as read" }` | Validates ownership and sets `isRead: true` for a single notification. |

---

## 6. Frontend Architecture & Lifecycle

### A. Global Setup Hook: `useNotification` ([useNotification.ts](file:///e:/history-app/apps/react-native-client/src/features/notification/hooks/useNotification.ts))
Mounted once at root layout [_layout.tsx](file:///e:/history-app/apps/react-native-client/src/app/_layout.tsx#L37). Re-runs when `auth.profile.id` changes.

```
[App Mount / User Login]
  │
  ├── 1. Request Android 13+ Notification Permission (PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS)
  │      └── If granted:
  │            ├── Get token from Firebase: messaging().getToken()
  │            └── Register with backend: POST /api/notifications/register-token
  │
  ├── 2. Listen to Foreground Messages: messaging().onMessage(remoteMessage)
  │      └── Display slide-down in-app toast: toastService.show("${title}: ${body}", "info")
  │
  ├── 3. Listen to Background Click: messaging().onNotificationOpenedApp(remoteMessage)
  │      └── Logs remoteMessage (TODO: route navigation handler)
  │
  ├── 4. Listen to Cold-Start / Killed Click: messaging().getInitialNotification()
  │      └── Logs remoteMessage (TODO: route navigation handler)
  │
  └── 5. Listen to Token Refresh: messaging().onTokenRefresh(newToken)
         └── Re-register newToken with backend: POST /api/notifications/register-token
```

### B. Notification Screen & Tab Architecture ([NotificationsScreen.tsx](file:///e:/history-app/apps/react-native-client/src/features/notification/screens/NotificationsScreen.tsx))

The screen aggregates two separate data sources via a 3-tab segmented control:
1. **Source 1: Friend Requests API** (`socialApi.useGetIncomingFriendRequestsQuery`)
   - Shows pending friend requests with Accept (`acceptFriendRequest`) and Reject (`rejectFriendRequest`) buttons using [UserCard](file:///e:/history-app/apps/react-native-client/src/components/ui/UserCard.tsx).
2. **Source 2: System Notifications API** (`notificationApi.useGetNotificationsQuery`)
   - Shows persistent notifications from `Notification` table.
   - Allows marking single item read (`markNotificationAsRead`) or bulk read (`markAllNotificationsAsRead`).
   - Formats relative time via `formatRelativeTime` (`"Vừa xong"`, `"X phút trước"`, `"X giờ trước"`, `"Hôm qua"`, `"dd/MM/yyyy"`).

**Tab Breakdown:**
- **"Tất cả" (Default):** Displays both Friend Requests section (if any) and System Notifications section.
- **"Lời mời":** Displays only incoming Friend Requests with Accept/Reject actions.
- **"Hệ thống":** Displays only DB System Notifications with "Đọc tất cả" header action.

**Auto-Sync Triggers:**
- Screen focus listener (`navigation.addListener("focus")`) refetches both queries.
- App state listener (`AppState.addEventListener("change")` -> `"active"`) refetches both queries when returning from background.

---

## 7. Known Gaps & Upgrade Checklist

When expanding or upgrading notifications in future tasks, refer to the following catalog of pending items:

### 1. Deep-Linking & Click Navigation
- [ ] **Issue:** [useNotification.ts](file:///e:/history-app/apps/react-native-client/src/features/notification/hooks/useNotification.ts#L60-L74) currently logs `remoteMessage` to console on notification click without navigating.
- [ ] **Fix:** Parse `remoteMessage.data.type` or `remoteMessage.data.route` and call `router.push(route)` (e.g. `/notifications`, `/pvp`, `/other-profile/:id`).

### 2. Unread Badge Counters
- [ ] **Issue:** Neither the Home bell icon ([HomeScreen.tsx](file:///e:/history-app/apps/react-native-client/src/features/home/screens/HomeScreen.tsx#L235)) nor the Side Drawer item ([SideDrawerContext.tsx](file:///e:/history-app/apps/react-native-client/src/components/layout/SideDrawerContext.tsx#L186)) display an unread badge badge counter.
- [ ] **Fix:** Aggregate `unreadNotificationsCount` + `incomingFriendRequestsCount` and render a numerical/dot badge on the bell and drawer icons.

### 3. Logout Token Invalidation
- [ ] **Issue:** [authSlice.appLogout](file:///e:/history-app/apps/react-native-client/src/features/auth/store/authSlice.ts#L18) does not invoke `notificationService.deleteFCMToken()` or call the backend to delete the user's `FcmToken` entry.
- [ ] **Fix:** Call `notificationService.deleteFCMToken()` and add a backend route `DELETE /api/notifications/unregister-token` during logout.

### 4. Standardized Push Payload Contract
- [ ] **Issue:** Push payloads currently only send `{ type: "FRIEND_REQUEST" }` without standardized metadata.
- [ ] **Recommendation:** Standardize data payloads across all push events:
  ```typescript
  interface PushPayloadData {
    type: "FRIEND_REQUEST" | "FRIEND_ACCEPT" | "PVP_INVITE" | "STREAK_REMINDER" | "TIER_UPGRADE" | "SYSTEM";
    targetId?: string;
    route?: string;
    senderId?: string;
    metadata?: string; // JSON stringified extra attributes
  }
  ```

### 5. Candidate Events for New Notifications
- **Streak Protection / Reminders:** Daily cron reminder at 20:00 ICT for users with $XP = 0$ on the current day to preserve their streak.
- **PvP Challenges & Match Invites:** Real-time push / DB notification when invited to a private room.
- **Tier Upgrades & Gamification:** Notifications upon tier promotion (e.g. Bronze -> Silver) or milestone badge unlocks.
- **Subscription Events:** Notifications for subscription activation, renewal reminders, or payment receipts.
- **Admin Broadcasts:** Admin dashboard panel to broadcast notifications with rich text to all users or specific segments.

### 6. Pagination & DB Cleanup
- [ ] **Pagination:** `GET /api/notifications` currently returns all user records without pagination. Add cursor-based or limit/offset pagination (`take: 20`, `skip: 0` or `cursor`).
- [ ] **Test Route Cleanup:** `POST /api/notifications/send-test` in [notificationRoutes.ts](file:///e:/history-app/apps/express-server/src/routes/notificationRoutes.ts#L89) uses an in-memory `Set<string>` instead of querying the `fcm_tokens` database table.
