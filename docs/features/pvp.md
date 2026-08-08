# Real-time PVP Competition Feature Documentation

**Current Version:** 2.2  
**Module Location:**
- Backend Routes: [pvpRoutes.ts](file:///e:/history-app/apps/express-server/src/routes/pvpRoutes.ts)
- Backend Controllers: [pvpController.ts](file:///e:/history-app/apps/express-server/src/controllers/pvpController.ts)
- Backend Services: [pvpService.ts](file:///e:/history-app/apps/express-server/src/services/pvpService.ts)
- Backend Types: [pvpTypes.ts](file:///e:/history-app/apps/express-server/src/types/pvpTypes.ts)
- Frontend Feature: [pvp](file:///e:/history-app/apps/react-native-client/src/features/pvp)
  - Screens: [PvpMainScreen.tsx](file:///e:/history-app/apps/react-native-client/src/features/pvp/screens/PvpMainScreen.tsx), [PvpGameScreen.tsx](file:///e:/history-app/apps/react-native-client/src/features/pvp/screens/PvpGameScreen.tsx)
  - Components: [CreateRoomTab.tsx](file:///e:/history-app/apps/react-native-client/src/features/pvp/components/CreateRoomTab.tsx), [JoinRoomTab.tsx](file:///e:/history-app/apps/react-native-client/src/features/pvp/components/JoinRoomTab.tsx), [PvpLobbyView.tsx](file:///e:/history-app/apps/react-native-client/src/features/pvp/components/PvpLobbyView.tsx)
  - Hooks: [usePvpRealtime.ts](file:///e:/history-app/apps/react-native-client/src/features/pvp/hooks/usePvpRealtime.ts)
  - Services & API: [pvpApi.ts](file:///e:/history-app/apps/react-native-client/src/features/pvp/services/pvpApi.ts)
  - Types: [types.ts](file:///e:/history-app/apps/react-native-client/src/features/pvp/types.ts)
- Database Schema: [schema.prisma](file:///e:/history-app/packages/shared/prisma/schema.prisma)

---

## 1. Feature Overview

The PVP (Player vs Player) Competition system provides real-time synchronous multiplayer quiz battles for up to 8 participants per room.

### Core Key Capabilities
- **Room Creation & Configuration:** Host selects question count (5, 10, 15) and time limit per question (10s, 15s, 30s). Questions can be generated from specific test presets (`testId`) or auto-picked based on scope.
- **Unique 4-Digit Room Codes:** Non-conflicting short numeric codes generated for room entry.
- **Real-time Synchronized Gameplay:** Server-driven game loop using Supabase Admin WebSockets (`pvp_{roomCode}`) for broadcast events.
- **Dynamic Speed Bonus Scoring:** Score rewards both correctness and answer speed (up to 2x multiplier for immediate responses).
- **Auto-Advancing Timer Cycle:** Server manages per-question duration and automatically resolves early if all room participants answer before timeout.
- **Live Leaderboard & Inter-Question Animations:** Real-time point gain notifications, mascot feedback, and final game standings.

---

## 2. Architecture & File Structure

```
history-app/
├── apps/express-server/src/
│   ├── controllers/
│   │   └── pvpController.ts       # Route handlers (create, join, info, start, submit)
│   ├── routes/
│   │   └── pvpRoutes.ts           # Express router for /api/pvp/*
│   ├── services/
│   │   └── pvpService.ts          # Core PVP engine, room lifecycle & timer loop
│   └── types/
│       └── pvpTypes.ts            # Backend DTO contracts
├── apps/react-native-client/src/features/pvp/
│   ├── components/
│   │   ├── CreateRoomTab.tsx      # Room creation form component
│   │   ├── JoinRoomTab.tsx        # 4-digit code room join input component
│   │   └── PvpLobbyView.tsx       # Pre-game lobby view displaying player cards
│   ├── hooks/
│   │   └── usePvpRealtime.ts      # Custom hook managing Supabase Realtime channel
│   ├── screens/
│   │   ├── PvpMainScreen.tsx      # Main tab/lobby container screen
│   │   └── PvpGameScreen.tsx      # Full-screen active game view with live timer
│   ├── services/
│   │   └── pvpApi.ts              # RTK Query API slice for PVP HTTP endpoints
│   ├── types.ts                   # Frontend TypeScript types
│   └── index.ts                   # Module barrel export
└── packages/shared/prisma/
    └── schema.prisma              # PvpRoom & PvpParticipant data models
```

---

## 3. Data Models & Database Schemas

### Prisma Models ([schema.prisma](file:///e:/history-app/packages/shared/prisma/schema.prisma#L793-L832))

#### `PvpRoom`
- `id` (`String @id @default(uuid())`): Internal room UUID.
- `code` (`String @unique`): 4-digit public room code.
- `hostUserId` (`String`): User ID of room creator.
- `status` (`PvpRoomStatus`): Status enum (`LOBBY`, `IN_PROGRESS`, `FINISHED`, `CANCELLED`).
- `questionCount` (`Int`): Total questions in room (default `10`).
- `timePerQuestion` (`Int`): Seconds allowed per question (default `15`).
- `questionSequenceJson` (`Json`): Ordered array of question IDs `[number]`.
- `currentQuestionIndex` (`Int`): Active question index (0-indexed).
- `isPublic` (`Boolean @default(true)`): Room visibility mode (public vs private).

#### `PvpParticipant`
- `id` (`String @id @default(uuid())`): Participant entry ID.
- `roomId` (`String`): Foreign key to `PvpRoom`.
- `userId` (`String`): Foreign key to `User`.
- `score` (`Float`): Total cumulative score in room (default `0`).
- `answersJson` (`Json`): Array of submitted answer records `[{ questionIndex, questionId, userAnswer, scoreEarned, timeTakenSeconds }]`.

---

## 4. API Endpoints & Request/Response Contracts

### HTTP REST Endpoints ([pvpRoutes.ts](file:///e:/history-app/apps/express-server/src/routes/pvpRoutes.ts))

#### 1. `POST /api/pvp/create`
Creates a new room with host as first participant.
- **Request Body (`CreatePvpRoomRequest`):**
  ```json
  {
    "questionCount": 10,
    "timePerQuestion": 15,
    "testId": "optional-test-uuid",
    "scopeType": "LESSON",
    "scopeId": 12,
    "isPublic": true
  }
  ```
- **Response (`PvpRoomDto`):** Room details including 4-digit code and initial ordered question list.

#### 2. `POST /api/pvp/join`
Joins an existing room in `LOBBY` status. Maximum 8 participants.
- **Request Body (`JoinPvpRoomRequest`):**
  ```json
  { "roomCode": "1234" }
  ```
- **Response (`PvpRoomDto`):** Updated room object. Also triggers `PLAYER_JOINED` broadcast event.

#### 3. `GET /api/pvp/room/:code`
Fetches room details by code.

#### 4. `POST /api/pvp/start`
Host-only action to start the match.
- **Request Body:** `{ "roomCode": "1234" }`
- **Behavior:** Updates status to `IN_PROGRESS`, broadcasts `GAME_START`, and starts `runRoomQuestionCycle` loop.

#### 5. `POST /api/pvp/submit-answer`
Submits player answer for current question.
- **Request Body (`SubmitPvpAnswerRequest`):**
  ```json
  {
    "roomCode": "1234",
    "questionIndex": 0,
    "userAnswer": { "selectedOptions": [1] },
    "timeTakenSeconds": 4
  }
  ```
- **Response:** `{ "scoreEarned": 560, "totalScore": 560 }`
- **Behavior:** Calculates score, updates participant record, broadcasts `PLAYER_ANSWERED`. If all participants have answered, cancels active question timer early.

#### 6. `GET /api/pvp/curated-tests`
Fetches list of available preset tests for room host selection.
- **Response:** `Array<{ id: string, title: string, summary: string | null, questionCount: number }>`

#### 7. `GET /api/pvp/available-questions-count`
Calculates available active question count for a selected scope or curated test.
- **Query Params:** `scopeType`, `scopeId`, `testId`
- **Response:** `{ "availableCount": 24 }`

#### 8. `GET /api/pvp/public-rooms`
Fetches active public rooms in `LOBBY` status, excluding rooms created by or joined by current user.
- **Response (`PvpPublicRoomDto[]`):** `Array<{ id, code, hostUserId, hostName, hostAvatar, questionCount, timePerQuestion, participantCount, maxParticipants, createdAt }>`

---

## 5. Real-time Supabase Broadcast Channel Protocol

- **Channel Identifier:** `pvp_${roomCode}`
- **Client Handler:** [usePvpRealtime.ts](file:///e:/history-app/apps/react-native-client/src/features/pvp/hooks/usePvpRealtime.ts)

### Broadcast Events

| Event Name | Trigger | Payload Contents |
| :--- | :--- | :--- |
| `PLAYER_JOINED` | Participant joins lobby | `{ participants: PvpParticipantDto[] }` |
| `GAME_START` | Host starts game | `{ roomCode: string, questionCount: number }` |
| `QUESTION_START` | Server moves to question | `{ questionIndex, totalQuestions, timeLimitSeconds, question: QuestionV2Dto }` |
| `PLAYER_ANSWERED` | Participant submits answer | `{ userId: string, questionIndex: number }` |
| `QUESTION_RESULT` | Question timer ends / all answered | `{ questionIndex, correctAnswerData, explanation, leaderboard: PvpParticipantDto[] }` |
| `GAME_OVER` | All questions finished | `{ leaderboard: PvpLeaderboardEntry[] }` |

---

## 6. Scoring System & Speed Bonus Calculation

Evaluated in [pvpService.ts](file:///e:/history-app/apps/express-server/src/services/pvpService.ts) using the shared [scoreEngine.ts](file:///e:/history-app/apps/express-server/src/services/scoreEngine.ts) from `test_v2`:

1. **Parity with Test V2 Evaluation:**
   - **CHOOSE Single:** `maxScore = 0.25` → Exact match yields `0.25`. Base score = $0.25 \times 400 = 100$ pts.
   - **CHOOSE Multi:** `maxScore = Math.max(0.25, Math.floor(N / 2) * 0.25)`. Partial credit awarded per correct option, deducted per wrong option. Base score = $\text{scoreAwarded} \times 400$.
   - **FILL:** `maxScore = 0.5` → Text normalized (case-insensitive, punctuation stripped), digit exact match enforced, Levenshtein distance typo tolerance. Exact match yields `0.5`. Base score = $0.5 \times 400 = 200$ pts.
   - **MATCH:** `maxScore = Math.max(0.25, Math.floor(P / 2) * 0.25)`. All left-right pairs must match correctly. Base score = $\text{scoreAwarded} \times 400$.
2. **Base Score Formula:**
   $$\text{baseScore} = \text{scoreAwarded} \times 400$$
3. **Speed Multiplier Formula:**
   $$\text{speedBonus} = 1 + \frac{\max(0, \text{timePerQuestion} - \text{timeTakenSeconds})}{\text{timePerQuestion}}$$
4. **Total Points Earned:**
   $$\text{scoreEarned} = \text{Math.round}(\text{baseScore} \times \text{speedBonus})$$
   *(Example: Single choice answered instantly yields $100 \times 2.0 = 200$ pts; Fill answered instantly yields $200 \times 2.0 = 400$ pts)*.

---

## 7. Game Timer Cycle Lifecycle

Managed asynchronously in [pvpService.ts](file:///e:/history-app/apps/express-server/src/services/pvpService.ts#L346-L444):

```mermaid
sequenceDiagram
    autonumber
    actor Host
    actor Client
    participant Server as PvpService
    participant Timer as In-Memory Timer
    participant DB as Prisma DB
    participant Channel as Supabase Realtime

    Host->>Server: POST /api/pvp/start
    Server->>DB: Update room status = IN_PROGRESS
    Server->>Channel: Broadcast GAME_START
    Server->>Server: Kick off runRoomQuestionCycle()

    loop For each question in sequence
        Server->>DB: Update currentQuestionIndex
        Server->>Channel: Broadcast QUESTION_START (question DTO)
        
        par Wait timer OR all answered
            Server->>Timer: Set setTimeout(timePerQuestion * 1000 + 500)
        and Players submit answers
            Client->>Server: POST /api/pvp/submit-answer
            Server->>DB: Update score & answerJson
            Server->>Channel: Broadcast PLAYER_ANSWERED
            alt All active participants answered
                Server->>Timer: Call resolveAnswer() (cancel timeout early)
            end
        end

        Server->>DB: Fetch ordered leaderboard & correct answer
        Server->>Channel: Broadcast QUESTION_RESULT (State 2: Inline Correct Answer & Points)
        
        alt autoNext is enabled
            Server->>Server: Wait transitionInterval seconds
        else autoNext is disabled
            Host->>Server: POST /api/pvp/next-state (targetState = LEADERBOARD)
        end

        Server->>Channel: Broadcast SHOW_LEADERBOARD (State 3: Leaderboard modal)
        
        alt autoNext is enabled
            Server->>Server: Wait transitionInterval seconds
        else autoNext is disabled
            Host->>Server: POST /api/pvp/next-state (targetState = NEXT_QUESTION)
        end
    end

    Server->>DB: Update status = FINISHED
    Server->>Channel: Broadcast GAME_OVER (final leaderboard)
```

---

## 8. Frontend User Experience & Components

1. **[PvpMainScreen.tsx](file:///e:/history-app/apps/react-native-client/src/features/pvp/screens/PvpMainScreen.tsx):** Root feature entry point. Manages active tab state (`create` / `join`), room join/create handlers, and conditionally renders `PvpLobbyView` or full-screen `PvpGameScreen`.
2. **[CreateRoomTab.tsx](file:///e:/history-app/apps/react-native-client/src/features/pvp/components/CreateRoomTab.tsx):** Pill selection UI for question count (5, 10, 15) and time limit (10s, 15s, 30s).
3. **[JoinRoomTab.tsx](file:///e:/history-app/apps/react-native-client/src/features/pvp/components/JoinRoomTab.tsx):** 4-digit code input field with auto-submit validation.
4. **[PvpLobbyView.tsx](file:///e:/history-app/apps/react-native-client/src/features/pvp/components/PvpLobbyView.tsx):** Lobby screen displaying 4-digit room code badge, participant list (up to 8), host "Start Match" button, and non-host waiting indicator.
5. **[PvpGameScreen.tsx](file:///e:/history-app/apps/react-native-client/src/features/pvp/screens/PvpGameScreen.tsx):**
   - Animated top countdown bar using Reanimated `withTiming`.
   - Question components reuse: `ChooseQuestion`, `FillQuestion`, `MatchQuestion`.
   - Inter-question result modal featuring `PracticeFeedbackMascot`, point gain badges (`+560 điểm!`), and rank updates.
   - Final game-over victory/ranking screen with exit options.

---

## 9. Known Issues & Remediation Strategy

### Issue 1 (Small): Host can start room with 1 player
- **Status:** FIXED
- **Existence:** Confirmed.
- **Root Cause:** Neither `PvpLobbyView.tsx` nor backend `startRoom` in `pvpService.ts` checks if `participants.length >= 2`.
- **Remediation:** Enforce `participants.length >= 2` validation in backend `startRoom` service and disable host "Start" button on FE with descriptive helper message when single player.

### Issue 2 (Small): Result modal does not display correct answer
- **Status:** FIXED
- **Existence:** Confirmed.
- **Root Cause:** Backend sends `correctAnswerData` in `QUESTION_RESULT` broadcast payload, but `PvpGameScreen.tsx` inter-question result modal (`<Modal visible={!!questionResult}>`) only renders explanation text and ignores `correctAnswerData`.
- **Remediation:** Render a formatted "Đáp án đúng" preview section inside the result modal for `CHOOSE`, `FILL`, and `MATCH` question types.

### Issue 3 (Big): No re-join flow if player leaves app/screen
- **Status:** FIXED
- **Existence:** Confirmed.
- **Root Cause:** Room state (`currentRoom`) is stored solely in local React `useState` of `PvpMainScreen.tsx`. Back navigation unmounts the component and clears room state. No active session recovery API exists.
- **Remediation:**
  1. Add `GET /api/pvp/active-room` backend endpoint returning user's active `LOBBY` or `IN_PROGRESS` room.
  2. Call active room recovery on FE `PvpMainScreen` mount and restore lobby/game session automatically.

### Issue 4 (Big): Old players appear in newly created rooms after game finish
- **Status:** FIXED
- **Existence:** Confirmed.
- **Root Cause:** `usePvpRealtime.ts` initializes `participants` state once with `useState(initialParticipants)`. Calling `resetState()` on game finish does not clear `participants` (`setParticipants([])`), nor does the hook re-sync `participants` when a new room is set. `PvpMainScreen.tsx` falls back to `participants.length > 0 ? participants : currentRoom.participants`, displaying leftover players.
- **Remediation:**
  1. Update `resetState()` in `usePvpRealtime.ts` to call `setParticipants([])`.
  2. Add `useEffect` in `usePvpRealtime.ts` to sync `setParticipants(initialParticipants)` whenever `roomCode` or `initialParticipants` changes.

---

## 10. Version Log

### Version 2.1

#### 1. 4-State Game Loop Progression Flow
- **State 1 (Answering):** Active question widgets (`CHOOSE`, `FILL`, `MATCH`).
- **State 2 (Inline Results):** Correct answer options, explanation, and mascot score gain rendered directly on screen body inside [PvpGameScreen.tsx](file:///e:/history-app/apps/react-native-client/src/features/pvp/screens/PvpGameScreen.tsx). Question controls disabled.
- **State 3 (Leaderboard Modal):** Broadcast `SHOW_LEADERBOARD` triggers modal standings overlay (answer details omitted).
- **State 4 (Next Question):** Advance `currentQuestionIndex` or end match.

#### 2. Transition Mode Control (`autoNext` & `transitionInterval`)
- Added `autoNext` (Boolean) and `transitionInterval` (Int) fields to `PvpRoom` model in [schema.prisma](file:///e:/history-app/packages/shared/prisma/schema.prisma).
- Added room creation settings in [CreateRoomTab.tsx](file:///e:/history-app/apps/react-native-client/src/features/pvp/components/CreateRoomTab.tsx).
- Added `POST /api/pvp/next-state` endpoint in [pvpRoutes.ts](file:///e:/history-app/apps/express-server/src/routes/pvpRoutes.ts) allowing room host to manually advance from State 2 → 3 → 4 when `autoNext = false`.

#### 3. Leaderboard Placement Differences
- Calculated rank deltas (`prevRank - currentRank`) in [usePvpRealtime.ts](file:///e:/history-app/apps/react-native-client/src/features/pvp/hooks/usePvpRealtime.ts).
- Rendered green `+N` and red `-N` rank badges next to participant ranks inside leaderboard modal.

#### 4. Test V2 Scoring Parity & Partial Credit Support
- Aligned PVP answer evaluation in `submitAnswer` with `scoreEngine.ts`.
- Used `evalRes.scoreAwarded * 400` as base score to preserve partial credit, multiplied by speed bonus ($1.0\times - 2.0\times$). 

### Version 2.2

#### 1. Curated Tests vs Auto-Pick Question Selection
- Added support for selecting curated preset tests (`testId`) or auto-picking questions based on scope (`scopeType` & `scopeId`) in [CreateRoomTab.tsx](file:///e:/history-app/apps/react-native-client/src/features/pvp/components/CreateRoomTab.tsx).
- Added `GET /api/pvp/curated-tests` endpoint.

#### 2. Cascading Scope Selection
- Added scope level selection (`NATIONAL`, `GRADE`, `TOPIC`, `LESSON`, `SECTION`, `NODE`) with dynamic cascading dropdown pickers using content hierarchy APIs.

#### 3. Available Question Count Preview & Validation
- Added `GET /api/pvp/available-questions-count` endpoint.
- Displayed real-time available question count badge on frontend.
- Constrained selected question count to not exceed total available pool size.

#### 4. Custom Numeric Question Input
- Added numeric `TextInput` allowing users to type custom question counts alongside shortcut pills.

#### 5. Room Privacy Settings (Public vs Private)
- Added `isPublic` (`Boolean`, default `true`) column to `PvpRoom` model in [schema.prisma](file:///e:/history-app/packages/shared/prisma/schema.prisma).
- Added 2 toggle pill buttons ("Công khai" / "Riêng tư") at top of room creation screen right below screen title in [CreateRoomTab.tsx](file:///e:/history-app/apps/react-native-client/src/features/pvp/components/CreateRoomTab.tsx).

#### 6. Public Room Discovery & Excluded Own Rooms
- Added `GET /api/pvp/public-rooms` endpoint in [pvpRoutes.ts](file:///e:/history-app/apps/express-server/src/routes/pvpRoutes.ts) and [pvpService.ts](file:///e:/history-app/apps/express-server/src/services/pvpService.ts), querying rooms with `isPublic = true`, `status = LOBBY`, `hostUserId != userId`, and `participants` not containing current user.
- Integrated public room list into [JoinRoomTab.tsx](file:///e:/history-app/apps/react-native-client/src/features/pvp/components/JoinRoomTab.tsx) with pull-to-refresh, room code badges, host info, participant counts (`X/8`), and direct join actions while retaining manual 4-digit code entry.

#### 7. Host Transfer & Room Cleanup on Participant Leave
- **Host Transfer:** When room host leaves and participants remain, [pvpService.ts](file:///e:/history-app/apps/express-server/src/services/pvpService.ts) automatically reassigns `hostUserId` to the next participant (`remainingParticipants[0].userId`) and broadcasts `hostUserId` in `PLAYER_JOINED` event. [PvpMainScreen.tsx](file:///e:/history-app/apps/react-native-client/src/features/pvp/screens/PvpMainScreen.tsx) dynamically updates UI controls for the new host.
- **Room Cleanup:** When the last participant leaves, active question timers are cleared and room status is set to `CANCELLED`.

#### 8. Question Count Clamping & Toast Validation
- Clamped numeric question input in [CreateRoomTab.tsx](file:///e:/history-app/apps/react-native-client/src/features/pvp/components/CreateRoomTab.tsx) to strictly positive values (`> 0`).
- Prevented room creation and displayed error toast via `toastService.show` if `questionCount > availableCount`.
