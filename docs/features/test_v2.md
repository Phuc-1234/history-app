# Test System V2 Documentation

**Current Version:** 2.0  
**Module Location:**
- Backend Routes: [testRoutesV2.ts](../../apps/express-server/src/routes/testRoutesV2.ts)
- Backend Controllers: [testControllerV2.ts](../../apps/express-server/src/controllers/testControllerV2.ts)
- Backend Services: [testServiceV2.ts](../../apps/express-server/src/services/testServiceV2.ts), [scoreEngine.ts](../../apps/express-server/src/services/scoreEngine.ts)
- Backend Types: [testV2Types.ts](../../apps/express-server/src/types/testV2Types.ts)
- Frontend Feature: [features/test_v2](../../apps/react-native-client/src/features/test_v2)
  - Components: [TestContainer.tsx](../../apps/react-native-client/src/features/test_v2/components/TestContainer.tsx), [TestIntro.tsx](../../apps/react-native-client/src/features/test_v2/components/TestIntro.tsx), [ChooseQuestion.tsx](../../apps/react-native-client/src/features/test_v2/components/ChooseQuestion.tsx), [FillQuestion.tsx](../../apps/react-native-client/src/features/test_v2/components/FillQuestion.tsx), [MatchQuestion.tsx](../../apps/react-native-client/src/features/test_v2/components/MatchQuestion.tsx)
  - Hooks: [useTestRunner.ts](../../apps/react-native-client/src/features/test_v2/hooks/useTestRunner.ts)
  - Services & Store: [testApi.ts](../../apps/react-native-client/src/features/test_v2/services/testApi.ts), [scoreEngine.ts](../../apps/react-native-client/src/features/test_v2/services/scoreEngine.ts), [testHistorySlice.ts](../../apps/react-native-client/src/features/test_v2/store/testHistorySlice.ts)
  - Screens: [TestHistoryScreen.tsx](../../apps/react-native-client/src/features/test_v2/screens/TestHistoryScreen.tsx), [TestDetailScreen.tsx](../../apps/react-native-client/src/features/test_v2/screens/TestDetailScreen.tsx)
- Database Schema: [schema.prisma](../../packages/shared/prisma/schema.prisma)

---

## 1. Feature Overview

The Test System V2 is a unified testing engine supporting both **PRACTICE** (immediate feedback per question, optional retry) and **EXAM** (timed test, nav grid, bulk submission) modes across multiple granular scopes (`GRADE`, `TOPIC`, `LESSON`, `SECTION`, `NODE`, `NATIONAL`).

### Core Design Principles
- **Unified Engine:** Single API surface (`/api/tests-v2/*`) and shared question runner state machine for both exam and practice modes.
- **Dynamic Scope Expansion:** Automated question pool expansion down/up entity hierarchies.
- **Smart Question Selection:** Support for algorithmic auto-picking strategies (`BALANCED`, `LOW_MASTERY`, `WRONG`) alongside manual/curated tests (`testId`).
- **Resumability & Draft Auto-Saving:** Active EXAM sessions auto-save draft responses every 3 seconds (debounced) and can be resumed if unexpired.
- **Client & Server Scoring Parity:** Deterministic grading rules executed on backend upon submission, and locally on frontend during Practice mode for instant sound/mascot feedback.
- **Question Mastery Tracking:** Individual user performance per question (`UserQuestionMastery`) updates level (0-5) and consecutive correct counts upon test finish.

---

## 2. Architecture & File Structure

```
history-app/
├── apps/express-server/src/
│   ├── controllers/
│   │   └── testControllerV2.ts       # HTTP handlers for start, draft, finish, abandon, resumable, history, info
│   ├── routes/
│   │   └── testRoutesV2.ts           # /api/tests-v2 endpoints
│   ├── services/
│   │   ├── scoreEngine.ts            # Hardcoded server-side question evaluation & scoring rules
│   │   └── testServiceV2.ts          # Core service: scope expansion, auto-picking, draft sync, test finish transaction
│   └── types/
│       └── testV2Types.ts            # DTOs, request/response interfaces, answer data contracts
├── apps/react-native-client/src/features/test_v2/
│   ├── components/
│   │   ├── ChooseQuestion.tsx        # Single / Multi choice UI component
│   │   ├── FillQuestion.tsx          # Text fill-in-the-blank input UI component
│   │   ├── MatchQuestion.tsx         # Pair-matching drag/tap UI component
│   │   ├── PracticeFeedbackMascot.tsx# Mascot feedback view for practice mode
│   │   ├── TestContainer.tsx         # Primary question renderer & layout controller
│   │   └── TestIntro.tsx             # Pre-test preview screen
│   ├── hooks/
│   │   └── useTestRunner.ts          # State machine hook managing timer, answers, draft sync, submission
│   ├── screens/
│   │   ├── TestDetailScreen.tsx      # Post-test attempt review with detailed answer breakdown
│   │   └── TestHistoryScreen.tsx     # Past test attempts history listing
│   ├── services/
│   │   ├── scoreEngine.ts            # Client-side local question evaluator for practice mode feedback
│   │   └── testApi.ts                # RTK Query API slice for /api/tests-v2 endpoints
│   ├── store/
│   │   └── testHistorySlice.ts       # Redux slice for history state caching
│   ├── types.ts                      # Frontend TypeScript DTO types
│   └── index.ts                      # Public exports
└── packages/shared/prisma/
    └── schema.prisma                 # UserTestLog, UserAnswerLog, Question, UserQuestionMastery models
```

---

## 3. Data Models & Database Schemas

### Main Database Tables

#### `UserTestLog`
Tracks an entire test session (attempt).
- `id` (`String @id @default(uuid())`)
- `userId` (`String`)
- `testId` (`String?`) - NULL for auto-picked tests
- `purposeType` (`PurposeType`: `EXAM` | `PRACTICE`)
- `status` (`TestStatusType`: `IN_PROGRESS` | `COMPLETED` | `EXPIRED` | `ABANDONED`)
- `score` (`Int`) - Percentage score (0-100)
- `scoreAwarded` (`Float`), `maxScore` (`Float`)
- `isPassed` (`Boolean?`)
- `startedAt`, `submittedAt`, `expiresAt` (`DateTime?`)
- `attemptNumber` (`Int`)
- `questionCount` (`Int`), `passThreshold` (`Int`), `timeLimit` (`Int?`)
- `scopeType` (`ScopeType?`), `scopeId` (`Int?`)
- `questionSequenceJson` (`Json`) - Array of `questionId` integers specifying test question order
- `draftAnswerJson` (`Json`) - Array of `DraftAnswerEntry` objects auto-saved in progress
- `autoPickStrategy` (`AutoPickStrategy?`: `BALANCED` | `LOW_MASTERY` | `WRONG`)

#### `UserAnswerLog`
Stores final graded answer record per question when a test is finished.
- `id` (`String @id`)
- `userTestLogId` (`String`)
- `questionId` (`Int`)
- `type` (`QuestionType`: `CHOOSE` | `FILL` | `MATCH`)
- `answerDataJson` (`Json`) - User submitted response
- `scoreAwarded` (`Float`), `maxScore` (`Float`)
- `answeredAt` (`DateTime`)

#### `Question`
- `id` (`Int @id @default(autoincrement())`)
- `type` (`QuestionType`)
- `difficulty` (`Int`) - 1 to 4
- `promptText` (`String`), `document` (`String?`), `explanation` (`String?`)
- `answerDataJson` (`Json`) - Contains correct options, accepted text strings, or pair matches
- `scopeType` (`ScopeType?`), `scopeId` (`Int?`)
- `isActive` (`Boolean`)

#### `UserQuestionMastery`
Tracks user mastery per question across attempts.
- `userId` (`String`), `questionId` (`Int`) (Composite key)
- `level` (`Int`) - 0 to 5
- `consecutiveCorrect` (`Int`)

---

## 4. Question Types & Answer Data Contracts

### 1. CHOOSE (`QuestionType = "CHOOSE"`)
- **Question Correct Data (`Question.answerDataJson`):**
  ```json
  {
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctOption": [0]
  }
  ```
- **User Draft/Answer Data (`UserChooseAnswer`):**
  ```json
  {
    "selectedOptions": [0]
  }
  ```

### 2. FILL (`QuestionType = "FILL"`)
- **Question Correct Data (`Question.answerDataJson`):**
  ```json
  {
    "acceptedAnswers": ["Ngo Quyen", "Ngô Quyền"]
  }
  ```
- **User Draft/Answer Data (`UserFillAnswer`):**
  ```json
  {
    "typedAnswer": "ngo quyen"
  }
  ```

### 3. MATCH (`QuestionType = "MATCH"`)
- **Question Correct Data (`Question.answerDataJson`):**
  ```json
  {
    "pairs": [
      { "left": "938", "right": "Bạch Đằng" },
      { "1077", "right": "Như Nguyệt" }
    ]
  }
  ```
- **User Draft/Answer Data (`UserMatchAnswer`):**
  ```json
  {
    "pairs": [
      { "left": "938", "right": "Bạch Đằng" }
    ]
  }
  ```

---

## 5. Backend Core Logic

### Scope Expansion (`expandScopeToQuestionWhere`)
Recursively expands parent scopes to include all child entity question pools:
- `NODE`: `scopeType = NODE AND scopeId = :id`
- `SECTION`: Includes section questions + child section questions + node questions under those sections.
- `LESSON`: Includes lesson questions + all root & nested section questions + node questions.
- `TOPIC`: Includes topic questions + lesson questions + section questions + node questions.
- `GRADE`: Includes grade questions + topic questions + lesson questions + section questions + node questions.
- `NATIONAL`: `scopeType = NATIONAL`

### Auto-Picking Strategies (`autoPickQuestions`)
1. `BALANCED` (Default):
   - Fetches questions directly under target scope.
   - If more questions are required, allocates targets to child scopes using a square-root weighted distribution formula (`w = sqrt(pool_size)`).
   - Falls back to global question pool if target count is not reached.
2. `LOW_MASTERY`:
   - Prioritizes questions with `UserQuestionMastery.level <= 2` (80% target ratio).
   - Fills remaining 20% from questions with `level >= 3`.
3. `WRONG`:
   - Prioritizes questions with `UserQuestionMastery.consecutiveCorrect == 0` (80% target ratio).
   - Fills remaining 20% from questions with `consecutiveCorrect >= 1`.

### Presets & Configuration Hierarchy
When starting a test, parameters (`questionCount`, `passThreshold`, `timeLimit`, `difficultyRatioJson`) resolve in order:
1. Direct Request overrides (`req.body`)
2. Specific Test object configuration (if `testId` provided)
3. Matched `TestPreset` (or `ScopeTestPresetDefault`)
4. Default fallback values (`questionCount = 10`, `passThreshold = 80`, `timeLimit = 15` for EXAM / `null` for PRACTICE)

### Scoring Engine Logic (`scoreEngine.ts`)
- **CHOOSE:**
  - Single Choice (`correctOption.length <= 1`): `maxScore = 0.25`. Awarded full `0.25` if exact single option matches.
  - Multi Choice: `maxScore = Math.max(0.25, Math.floor(options.length / 2) * 0.25)`. Correct selections earn `maxScore / correctCount`; incorrect selections deduct `maxScore / incorrectCount`. Score clamped to `>= 0`.
- **FILL:**
  - `maxScore = 0.5`.
  - Normalizes text (lowercase, punctuation stripped, whitespace collapsed).
  - Exact match on extracted digits required.
  - Evaluates string similarity using Levenshtein distance: allowed typos scale with word count (1 word: 0 typos, 2 words: 1 typo, 3-5 words: 2 typos, >=6 words: 3 typos).
- **MATCH:**
  - `maxScore = Math.max(0.25, Math.floor(pairs.length / 2) * 0.25)`.
  - Full `maxScore` awarded if all left-right pairs match correctly; otherwise `0`.

### Test Submission Transaction (`finishTest`)
1. Executes in Prisma database transaction.
2. Atomically sets `submittedAt = now()` and `status = COMPLETED` to prevent double submission.
3. Evaluates all test questions via `scoreAllQuestions`.
4. Writes `UserAnswerLog` entries for every question.
5. Updates `UserQuestionMastery`:
   - Correct answer: increments `level` (up to max 5) and `consecutiveCorrect`.
   - Incorrect answer: decrements `level` (down to min 0) and resets `consecutiveCorrect = 0`.
6. Calculates total earned XP and Gold and triggers progress/reward consequences.

---

## 6. Frontend Execution & Component Architecture

### `useTestRunner` Custom Hook State Machine
Manages test execution lifecycle across states:
- `idle`: Not started / inactive.
- `loading`: Requesting `/start` or `/resumable`.
- `running`: Active session in progress.
- `submitting`: Sending `/finish` request.
- `completed`: Test finished, showing result view.

#### Key Mechanics:
- **Timer (EXAM Mode):** Calculates remaining time based on `session.expiresAt`. Auto-submits test when time reaches 0.
- **Draft Auto-Sync:** Debounces draft answers sync to backend (`PUT /api/tests-v2/:logId/draft`) every 3 seconds.
- **Practice Local Evaluation:** Invokes local `evaluateQuestion` on `confirmAnswer` to play correct/wrong audio feedback without network latency.
- **Redo Wrong (PRACTICE Mode):** `redoWrong()` filters question sequence to only incorrectly answered questions and resets local draft/eval state for another attempt.

### Component Structure
- `TestContainer`: Root container hosting navigation header, progress indicator, question component switcher, bottom action toolbar, and question drawer grid.
- `TestIntro`: Displays test parameters, rewards preview, and "Start Test" trigger.
- `ChooseQuestion`: Render component for single/multi choice options.
- `FillQuestion`: Render component for text entry with keyboard handling.
- `MatchQuestion`: Render component for interactive pair matching.
- `PracticeFeedbackMascot`: Animated mascot displaying immediate correctness feedback in Practice mode.

---

## 7. API Endpoints Reference

| Endpoint | Method | Middleware | Request Body / Query | Description |
| :--- | :--- | :--- | :--- | :--- |
| `/api/tests-v2/resumable` | GET | `requireStudent` | None | Returns active unexpired EXAM session if any; abandons stale practice sessions. |
| `/api/tests-v2/info` | POST | `requireStudent` | `StartTestV2Request` | Fetches test metadata, question count, time limit, and reward preview before starting. |
| `/api/tests-v2/start` | POST | `requireStudent` | `StartTestV2Request` | Initializes a new test log attempt and returns question sequence + DTOs. |
| `/api/tests-v2/:logId/draft` | PUT | `requireStudent` | `{ draftAnswerJson: DraftAnswerEntry[] }` | Auto-saves student draft answer state. |
| `/api/tests-v2/:logId/finish` | POST | `requireStudent` | `{ draftAnswerJson, seenQuestionIds }` | Grades submitted answers, updates user mastery, calculates rewards and progress. |
| `/api/tests-v2/:logId/abandon`| POST | `requireStudent` | None | Marks an active test log status as `ABANDONED`. |
| `/api/tests-v2/history` | GET | `requireStudent` | `scopeType`, `scopeId`, `testId` | Returns past test attempt logs. |
| `/api/tests-v2/history/:logId`| GET | `requireStudent` | None | Returns detailed question breakdown and user answers for a past attempt. |
| `/api/tests-v2/national` | GET | `optionalAuth` | None | Returns list of available National tests. |
| `/api/tests-v2/practice-stats`| GET | `requireStudent` | `scopeType`, `scopeId` | Returns summary count of wrong and answered questions for practice mode. |
