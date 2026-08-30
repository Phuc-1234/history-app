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
| `STUDY_REMINDER` / `Nhắc hẹn` | [studyReminderCron.ts](file:///e:/history-app/apps/express-server/src/services/studyReminderCron.ts), [studyReminderService.ts](file:///e:/history-app/apps/express-server/src/services/studyReminderService.ts) | User | Yes (`db.notification.create`) | Yes (`pushNotificationService.sendToUser`) | Generic Title: `"Nhắc nhở học tập"`<br>Dynamic Body & Side Icon based on 4 rotating categories<br>Data: `{ type: "STUDY_REMINDER", category, targetId, route }` |
| `test_notification` | [notificationRoutes.ts](file:///e:/history-app/apps/express-server/src/routes/notificationRoutes.ts#L67-L139) (`POST /api/notifications/send-test`) | In-memory registered tokens | No | Yes (`sendEachForMulticast`) | Custom title & body payload for dev testing |

### B. Study Reminder ('Nhắc hẹn') Feature Details

The Study Reminder system sends dynamic smart push & DB notifications based on user schedule (frequency and specific times of the day) and user progress:

#### 1. Dynamic Variations & Skip Rules (Sequentially Cycled)
- **Tiếp tục học (`LESSON`):** Identifies the lesson with the highest incomplete progress percentage (`0% < pct < 100%`). Title: `"Nhắc nhở học tập"`, Body: `Tiếp tục bài học "[Tên bài]" ([XX]% hoàn thành) ngay hôm nay nhé!`, Icon: `book-outline`, Deeplink: `/(3_4_lessons)/lesson/[id]`.
- **Chuỗi Streak (`STREAK`):** Encourages continuing or starting streak. Title: `"Nhắc nhở học tập"`, Body: `Duy trì chuỗi [N] ngày liên tục! Vào học ngay hôm nay...`, Icon: `flame-outline`, Deeplink: `/(tabs)/home`.  
  *Skip Rule:* **Skipped if user already gained XP / lit streak flame today** (`lastXpGainedAt` is today in UTC+7).
- **Hạng & XP (`TIER`):** Reminds user of remaining XP to reach the next tier. Title: `"Nhắc nhở học tập"`, Body: `Chỉ còn [N] XP nữa là đạt danh hiệu [Tên hạng]! Cố gắng học tập hôm nay nhé!`, Icon: `trophy-outline`, Deeplink: `/(tabs)/9_1_leaderboard`.  
  *Skip Rule:* **Skipped if user is at the maximum available tier**.
- **Luyện đề (`TEST`):** Identifies a test with low mastery level (< 60% or lowest mastery percentage). Title: `"Nhắc nhở học tập"`, Body: `Ôn luyện lại đề "[Tên đề]" (mức độ thành thạo [XX]%) để cải thiện điểm số nhé!`, Icon: `clipboard-outline`, Deeplink: `/(6_tests)/6_2_ques_choose?testId=[id]`.

#### 2. Three Modal Entry Points
- **Streak Drawer Modal** ([StreakDrawerModal.tsx](file:///e:/history-app/apps/react-native-client/src/features/streak/components/StreakDrawerModal.tsx)): Bell button positioned in the hero card top-right (top-right of biggest flame box, below header `X`).
- **Home Screen Streak Card** ([HomeStreakSection.tsx](file:///e:/history-app/apps/react-native-client/src/features/streak/components/HomeStreakSection.tsx)): Bell button in the top-right corner of the streak banner.
- **Side Navigation Drawer** ([SideDrawerContext.tsx](file:///e:/history-app/apps/react-native-client/src/components/layout/SideDrawerContext.tsx)): Dedicated `"Nhắc hẹn học tập"` drawer menu item.

#### 3. Deep-Linking
Tapping the push notification banner from background/killed state or tapping the notification card inside [NotificationsScreen.tsx](file:///e:/history-app/apps/react-native-client/src/features/notification/screens/NotificationsScreen.tsx) automatically navigates directly to the target lesson, test, streak, or tier screen.

---

### C. Frontend UI Type Handlers (Scaffolded in [NotificationItem.tsx](file:///e:/history-app/apps/react-native-client/src/features/notification/components/NotificationItem.tsx))

The mobile UI supports visual categorization via `notification.type`:
- `"STUDY_REMINDER_*"`: Unified Icon `alarm-outline`, Primary container background (`colors.primaryContainer`) in the in-app notification feed.
- Device System Tray / Push Notifications: Varied side icons per category (`book-outline`, `flame-outline`, `trophy-outline`, `clipboard-outline`).
- `"push"` / `"FRIEND_REQUEST"` / `"FRIEND_ACCEPT"`: Icon `notifications-circle-outline`, Primary container background (`colors.primaryContainer`).
- `"reward"`: Icon `gift-outline`, Background `#FFF9EE`, Icon color `colors.secondary` (Gold/Orange).
- `"achievement"`: Icon `trophy-outline`, Background `#F4F0FA`, Icon color `#8C6BAF` (Purple).
- Fallback / `"SYSTEM"`: Icon `notifications-outline`, Primary container background.

---

## 5. Backend Service & API Specification

### A. PushNotificationService ([pushNotificationService.ts](file:///e:/history-app/apps/express-server/src/services/pushNotificationService.ts)) & StudyReminderService ([studyReminderService.ts](file:///e:/history-app/apps/express-server/src/services/studyReminderService.ts))

- **PushNotificationService:**
  - `registerToken(userId: string, token: string)`: Upserts token in `fcm_tokens` table.
  - `removeToken(token: string)`: Deletes token from `fcm_tokens` table.
  - `sendToUser(userId: string, title: string, body: string, data?: Record<string, string>)`: Sends multicast push via Firebase Admin SDK.
- **StudyReminderService:**
  - `getReminderSettings(userId: string)`: Fetches user's `UserStudyReminder` config.
  - `updateReminderSettings(userId: string, isEnabled: boolean, times: string[])`: Updates frequency & reminder times.
  - `generateReminderPayload(userId: string)`: Evaluates the 4 categories sequentially with skip rules.
  - `sendReminder(userId: string)`: Creates DB `Notification` and sends FCM push with deep-link data.
  - `checkAndSendDueReminders()`: 1-minute interval scanner checking matching `HH:mm` slots in UTC+7.

### B. REST Endpoints ([notificationRoutes.ts](file:///e:/history-app/apps/express-server/src/routes/notificationRoutes.ts))

All user endpoints require JWT authentication via `requireStudent` middleware:

| Method | Endpoint | Auth | Request Body / Params | Response Body | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/notifications/register-token` | `requireStudent` | `{ token: string }` | `{ message: "Token registered successfully" }` | Registers / upserts device FCM token for authenticated user. |
| `POST` | `/api/notifications/send-test` | None (Dev) | `{ title: string, body: string }` | `{ message, successCount, failureCount, totalTokens }` | Broadcasts test notification to in-memory registered devices. |
| `GET` | `/api/notifications` | `requireStudent` | None | `{ notifications: Notification[] }` | Returns user notification list ordered by `createdAt: desc`. |
| `PUT` | `/api/notifications/read-all` | `requireStudent` | None | `{ message: "All notifications marked as read" }` | Sets `isRead: true` for all unread notifications of the user. |
| `PUT` | `/api/notifications/:id/read` | `requireStudent` | Param: `id` | `{ message: "Notification marked as read" }` | Validates ownership and sets `isRead: true` for a single notification. |
| `GET` | `/api/notifications/reminders` | `requireStudent` | None | `{ isEnabled: boolean, times: string[] }` | Fetches study reminder configuration for user. |
| `PUT` | `/api/notifications/reminders` | `requireStudent` | `{ isEnabled, times }` | `{ isEnabled: boolean, times: string[] }` | Updates study reminder configuration for user. |
| `POST` | `/api/notifications/reminders/test-trigger` | `requireStudent` | None | `{ message, payload }` | Sends immediate dynamic test study reminder to user. |

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
  │      └── Deep-links to specific route / lesson / test / leaderboard / streak
  │
  ├── 4. Listen to Cold-Start / Killed Click: messaging().getInitialNotification()
  │      └── Deep-links to specific route / lesson / test / leaderboard / streak
  │
  └── 5. Listen to Token Refresh: messaging().onTokenRefresh(newToken)
         └── Re-register newToken with backend: POST /api/notifications/register-token
```


### B. Notification Screen & Filter Architecture ([NotificationsScreen.tsx](file:///e:/history-app/apps/react-native-client/src/features/notification/screens/NotificationsScreen.tsx))

The screen displays a unified notification feed with a single-select horizontal filter bar:
1. **Single Data Source:** `notificationApi.useGetNotificationsQuery` (fetches `Notification` table records with sender and underlying `FriendRequest` status).
2. **Filter Chips (Single-Select):**
   - **"Tất cả" (Default):** Displays all notifications.
   - **"Lời mời kết bạn":** Filters for `FRIEND_REQUEST` notifications.
   - **"Chấp nhận kết bạn":** Filters for `FRIEND_ACCEPT` notifications.
3. **Interactive Friend Request Cards ([NotificationItem.tsx](file:///e:/history-app/apps/react-native-client/src/features/notification/components/NotificationItem.tsx)):**
   - Renders "Chấp nhận" (Primary pill button) & "Từ chối" (Outline pill button) directly within pending `FRIEND_REQUEST` notification cards.
   - Transitions to status badges ("Đã chấp nhận kết bạn" / "Đã từ chối") once acted upon.
4. **Read/Unread Controls:** Single item mark read and bulk "Đọc tất cả" header action.

**Auto-Sync Triggers:**
- Screen focus listener (`navigation.addListener("focus")`) refetches query.
- App state listener (`AppState.addEventListener("change")` -> `"active"`) refetches query when returning from background.

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
