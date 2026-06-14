# Lesson, Test, Reward V2 Rework Plan

## 1. Goal

Rework Lesson, Test, and Reward features into a richer, more polished learning experience.

Main goals:

- Keep old Lesson/Test/Reward components as backup.
- Build new v2 folders for heavily changed modules.
- Avoid strict shared contracts for now.
- Prefer local frontend/backend types when needed.
- Focus on feature richness, UI quality, and learning flow.
- Do not prioritize security, audit history, or rare edge cases in this phase.

## 2. Non-Goals

This rework will not focus on:

- Strong anti-cheat test security.
- Full audit/history tracking.
- Perfect handling of rare edge cases.
- Refactoring `@shared/types`.
- Maintaining strict shared frontend/backend contracts.
- Reward abuse prevention.

## 3. Architecture Direction

Create new v2 modules instead of deeply mutating existing Lesson/Test/Reward components.

Suggested frontend folders:

```txt
src/features/lesson-v2/
  screens/
  components/
  services/
  api/
  types/
  hooks/

src/features/test-v2/
  screens/
  components/
  services/
  api/
  types/
  hooks/

src/features/reward-v2/
  screens/
  components/
  services/
  api/
  types/
  hooks/
```

Suggested backend folders:

```txt
src/modules/lesson-v2/
src/modules/test-v2/
src/modules/reward-v2/
```

Suggested API folders/routes:

```txt
/api/v2/lessons/...
/api/v2/tests/...
/api/v2/rewards/...
```

Old modules should remain available as backup until v2 is stable.

---

# A. Lesson Rework

## Current Flow

- User selects grade, topic, and lesson from the lesson menu.
- Topic-level and grade-level tests currently hold `testId`.
- Lesson screen shows lesson info, buttons for mindmap/flashcards/test, and full lesson content with sections and nodes.

## New Flow

### Lesson Menu

Grade, topic, and lesson selection remain mostly the same, but each level should show progress percentage.

Progress should be calculated from completed nodes:

```txt
completed nodes / total nodes
```

### Test Entry Changes

Grade/topic/lesson/section/node tests should no longer depend on fixed `testId`.

Instead, each test entry should send:

```txt
presetId
scopeType
scopeId
purpose
```

Example:

```json
{
  "presetId": "default-node-practice",
  "scopeType": "NODE",
  "scopeId": 123,
  "purpose": "PRACTICE"
}
```

Backend auto-picks questions based on preset and scope.

## Lesson Screen V2

### Sections

Sections should support:

- self-reference nested sections
- collapsible UI
- progress percentage
- child nodes
- child sections
- section-level test at the end of each highest-level section

Section progress:

```txt
completed child nodes / total child nodes
```

### Nodes

Nodes become mini-lessons designed for one short learning session.

The lesson screen should show only:

- node header
- status indicator
- completion state
- optional lock/progress UI if needed later

Tapping a node opens a new Node Screen.

## Node Screen

Node Screen should include:

- node content body
- optional video player
- node-level test button if matching questions exist
- previous node button
- next node button
- completion tracking

Node test button should be hidden if there are no relevant questions for that node.

## Node Completion Rule

A node is complete when:

1. User studies long enough, or finishes the video.
2. User passes the node-level test, if the node has one.

If there is no node-level test, studying is enough.

Once completed, a node stays completed forever even if content or tests are added later.

## Database Changes

### New Table: `UserNodeProgress`

```txt
user_id
node_id
studied_at
all_test_passed_at
node_completed_at
```

Meaning:

- `studied_at`: user met study-time/video-completion requirement.
- `all_test_passed_at`: user passed node-level test.
- `node_completed_at`: node is fully complete.

### Node Table Changes

Current `Node`:

```txt
id
position
header
body
imgUrl
sectionId
flashcards
section
questions
```

Suggested changes:

- `body` now stores HTML content.
- Remove `imgUrl`.
- Add nullable `videoId`.
- If `videoId` exists, render video player below body.

## Lesson V2 Potential Issues

- Nested sections may complicate progress calculation.
- Need to prevent slow recursive queries on large lessons.
- Need clear frontend state for collapsed sections.
- Need a stable way to know whether a node has test questions.
- HTML body rendering needs styling control.
- Removing `imgUrl` may require migration or backward compatibility.
- Completion logic must avoid flipping completed nodes back to incomplete.

---

# B. Test Rework

## Current Flow

- API is called per answer submit.
- Evaluation happens at the end.
- User sees score and correct answers after completion.
- Optional hands-free mode exists.

## New Flow

There are two main test modes: Practice and Exam.

### Practice

Duolingo-style flow:

- questions shown in sequence
- answer is checked immediately
- explanation shown immediately
- wrong questions are repeated at the end
- redo questions do not add score

### Exam

Current test-style flow:

- user can jump between questions
- answer review only after submission
- score shown at the end
- supports resume if allowed

## Test Evaluation

Evaluation should happen locally on the frontend.

The start-test API must return full test data:

- questions
- answers
- correct answers
- explanation
- preset snapshot
- generated question sequence

Security is not a concern for this phase.

## Supported Question Types

Must support:

```txt
CHOOSE
PAIR
FILL
MATCH
```

Notes:

- `CHOOSE` supports single or multiple answers.
- `PAIR` / `MATCH` need structured answer data.
- `FILL` should allow local comparison against accepted answers.

## Attempt Review

User should still be able to:

- view old test attempts
- tap one attempt
- see each question
- see user answer
- see correct answer
- see explanation
- see correctness stored from the original attempt

Correctness must be stored in `UserAnswerLog` to avoid recalculation.

## Time Handling

Store time in UTC everywhere.

User clock tampering is acceptable for now.

## Rewards

Remove XP/gold reward granting from test logic.

Rewards should be handled by the reward engine.

## Suggested Tables

### `TestPreset`

```txt
id
name
scopeType
purpose
questionCount
passThreshold
timeLimit
allowResume
allowImmediateReview
allowJumping
showCorrectAnswerImmediately
redoWrongQuestions
difficultyRatioJson
createdAt
updatedAt
```

### `Test`

Manual or official tests only.

```txt
id
title
summary
presetId
isNationalTest
gradeId
topicId
lessonId
sectionId
nodeId
createdAt
updatedAt
```

### `TestQuestion`

Manual tests only.

```txt
testId
questionId
position
```

### `UserTestLog`

Represents a test session.

```txt
id
testId
userId
purpose
status
generatedFromPresetId
score
correctCount
isPassed
startedAt
submittedAt
expiresAt
attemptNumber
questionCount
passThreshold
timeLimit
allowResume
allowImmediateReview
showCorrectAnswerImmediately
redoWrongQuestion
gradeId
topicId
lessonId
sectionId
nodeId
questionSequenceJson
```

### `Question`

Question pool.

```txt
id
type
difficulty
promptText
explanation
document
isActive
gradeId
topicId
lessonId
sectionId
nodeId
```

### `QuestionAnswer`

```txt
id
questionId
content
isCorrect
leftText
rightText
correctAnswer
```

### `UserAnswerLog`

```txt
id
userTestLogId
questionId
type
answerDataJson
isCorrect
scoreAwarded
answeredAt
```

## Test V2 Potential Issues

- Local evaluation means frontend needs complete answer data.
- Question type handling may become complex without clean local services.
- Practice redo flow needs careful separation from scoring.
- Resume behavior differs between practice and exam.
- Existing old attempts may not have enough data for rich review.
- Need migration strategy for old test logs.
- Hands-free mode may need adaptation for sequential practice mode.
- `MATCH` and `PAIR` naming should be clarified to avoid duplicate concepts.

---

# C. Reward Rework

## Goal

Build a new reward engine that handles:

- XP
- gold
- items
- active effects
- streak rewards
- tier rewards
- node/test/section/lesson completion rewards

Rewards should be reusable and triggered by learning events.

## New/Modified Tables

### `reward_rule_items`

```txt
reward_rule_id
item_id
quantity
```

### `reward_rules`

```txt
reward_rule_id
trigger_type
trigger_target_id
attempt_min
attempt_max
xp
gold
is_auto_claim
```

Example trigger types:

```txt
TEST_COMPLETED
NODE_COMPLETED
SECTION_COMPLETED
LESSON_COMPLETED
STREAK_REACHED
TIER_REACHED
```

### `user_rewards`

```txt
user_reward_id
user_id
reward_definition_id
reward_source_type
reward_source_id
attempt_count
reward_status
earned_at
claimed_at
```

Use unique constraints to prevent duplicate rewards.

### `item_definitions`

Renamed from current items table.

```txt
item_definition_id
name
max_stack_size
description
category
is_in_store
price
type
is_consumable
effect_type
effect_value
duration_minutes
allow_stacking
equipment_slot
```

### `user_items`

```txt
user_id
item_definition_id
quantity
```

### `user_active_effect`

```txt
user_active_effect_id
user_id
item_definition_id
effect_type
effect_value
started_at
expires_at
status
```

### `user_equipped_items`

```txt
user_id
equipment_slot
item_definition_id
```

### `tier`

Mostly unchanged.

```txt
tier_id
img_url
name
xp_threshold
description
```

## Reward Flow

When an event happens, for example node completion:

1. Mark node complete.
2. Check matching `reward_rules`.
3. Check `user_rewards` to avoid duplicate reward.
4. Calculate reward amount.
5. Apply active effects.
6. Grant reward or create pending reward.
7. Check section completion.
8. Check lesson completion.
9. Check streak updates.
10. Check tier updates.

## Example

Node completion reward:

```txt
NODE_COMPLETED -> +5 XP -> auto claim
```

If user has active XP multiplier:

```txt
5 XP x 2 = 10 XP
```

Frontend should show a small Android-style toast.

## Seed Data

Seed test items:

- XP x2 boost
- Gold x2 boost
- Avatar frame skin
- Leaderboard row frame skin

Seed reward rules:

- node completed: +5 XP, auto claim
- streak milestone rewards, manual claim
- tier reached rewards, manual claim

## UI Requirements

### Node Completion

Show small toast:

```txt
+5 XP
```

If multiplier active:

```txt
+10 XP - x2 XP Boost
```

### Test Completion

Show reward result and active effect impact.

Example:

```txt
XP +20
Gold +5
XP Boost x2 applied
```

### Streak Popup

Show reward per streak milestone.

User must tap to claim.

### Tier Popup

Tapping tier in the top bar should open the tier reward popup.

## Reward V2 Potential Issues

- Reward engine can accidentally grant duplicates without good unique constraints.
- Need clear attempt-count logic for repeated tests.
- Active effect stacking rules must be simple and predictable.
- Tier reward popup location in current project is unknown.
- Existing reward/item tables may conflict with new table names.
- Need decide whether pending rewards already apply XP/gold or only after claim.
- Need decide whether item rewards are claim-time or earn-time granted.

---

# D. Suggested Implementation Phases

## Phase 1: Structure and API V2 Skeleton

- Create v2 folders.
- Add local types.
- Add v2 API routes.
- Keep old flows untouched.
- Add basic test preset model.
- Add basic start-test API shape.

## Phase 2: Test V2 Core

- Implement test preset selection.
- Implement generated test session.
- Return full question data.
- Implement local evaluation service.
- Support `CHOOSE`, `FILL`, `PAIR`, and `MATCH`.
- Implement practice mode.
- Implement exam mode.
- Store answer logs with correctness.

## Phase 3: Lesson V2 Core

- Add nested section support.
- Add node screen.
- Add progress calculation.
- Add `UserNodeProgress`.
- Add node completion logic.
- Add section-level, lesson-level, topic-level, and grade-level preset-based test entries.

## Phase 4: Reward V2 Core

- Add reward rule engine.
- Add user rewards.
- Add item definitions.
- Add active effects.
- Add node completion XP.
- Add reward toast.
- Add test completion reward display.

## Phase 5: Streak and Tier Rewards

- Add streak milestone rewards.
- Add tier rewards.
- Add manual claim popup.
- Connect tier popup to top bar.
- Seed test data.

## Phase 6: Polish and Migration

- Improve UI states.
- Handle old attempts display.
- Keep old test/lesson pages as fallback.
- Add admin/debug seed data.
- Clean obvious dead code only after v2 is stable.

---

# E. Open Questions

- Should `MATCH` and `PAIR` both exist, or should they be one question type?
- Should pending manual rewards apply XP/gold immediately or only after claim?
- Should a node with no questions skip `all_test_passed_at` or set it automatically?
- What is the exact study-time threshold for node completion?
- Should video completion override time threshold?
- How should old test attempts be displayed if they lack detailed answer data?
- Should generated tests create a `Test` row or only a `UserTestLog` row?
- Should section-level tests use only direct section questions or include child section/node questions?

---

# F. Recommended Decisions

Use these defaults unless there is a strong reason not to:

- Do not create `Test` rows for generated tests.
- Generated tests create only `UserTestLog`.
- `questionSequenceJson` freezes generated question order.
- Practice mode does not support jumping.
- Exam mode supports jumping.
- Practice mode shows answer immediately.
- Exam mode shows answer only after submit.
- Node completion remains permanent.
- Rewards are triggered by domain events, not directly inside UI code.
- Keep reward engine separate from test engine.
- Keep local frontend types inside each v2 feature.
- Avoid touching `@shared/types` during this rework.

