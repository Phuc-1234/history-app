# AI Chat Feature Documentation

**Current Version:** 2.5  
**Module Location:**
- Frontend: [ai-chat](../../apps/react-native-client/src/features/ai-chat)
- Backend: [aiChatRoutes.ts](../../apps/express-server/src/routes/aiChatRoutes.ts), [aiChatController.ts](../../apps/express-server/src/controllers/aiChatController.ts), [aiChatService.ts](../../apps/express-server/src/services/aiChatService.ts), [aiService.ts](../../apps/express-server/src/services/aiService.ts), [contentSearchService.ts](../../apps/express-server/src/services/contentSearchService.ts)

---

## 1. Feature Overview
The AI Chat feature provides students with an interactive Vietnamese History AI study assistant inside the React Native Expo client, backed by an Express.js server, Prisma PostgreSQL database, and Google Gemini LLM API.

### Key Capabilities (v2.2)
- **3 Chat Modes per Session (Switchable Mid-Session):**
  - `COURSE_ONLY` ("Chỉ Giáo Trình"): Restricts AI answers strictly to database course material (`Lesson`, `Section`, `Node`).
  - `COURSE_FIRST` ("Ưu Tiên Giáo Trình"): Uses course material first; places an explicit disclaimer note *before* any external knowledge section.
  - `GENERAL` ("Chung"): Unrestricted general history AI assistant.
  - *Mid-Session Switching:* Users can change the active mode at any point during a chat session via the top mode selector pills. Mode changes trigger a `PATCH /api/ai-chat/sessions/:sessionId` update and apply immediately to subsequent messages.
- **RAG Course Content Search Engine:** Automatically searches top 5 relevant lessons and nodes via [contentSearchService.ts](../../apps/express-server/src/services/contentSearchService.ts) to ground AI responses across the entire course database without restricting searches to active screen grade.
- **Rich Markdown & Deep Link Navigation:** Render chat bubbles with bold, headers, lists, and clickable custom links (`[Title](lesson:ID)`, `[Title](node:ID)`) that navigate to target Expo Router screens ([AiMarkdownMessage.tsx](../../apps/react-native-client/src/features/ai-chat/components/AiMarkdownMessage.tsx)).
- **Active Screen Context & Info Modal (v2.1/v2.5):** Detects user location across all app screens (LessonMenu, LessonSummary, Node, MindMap, Flashcard, Subscription, Tests, Leaderboards, etc.) via [useScreenContext.ts](../../apps/react-native-client/src/features/ai-chat/hooks/useScreenContext.ts) and uses active screen as contextual suggestion. Clicking the screen location tag in the AI Chat header opens an interactive modal explaining screen support status (whether AI directly reads the content or provides general history answers).
- **Periodic Context Summarizer (v2.2):** Replaces rigid 16-message cutoff with a 15-message sliding window plus async background AI context summarization (`aiService.summarizeContext`) every 15 messages. Persists accumulated summary in `AiChatSession.summary` and injects it into Gemini prompt context.
- **Daily Token Quota System & Visual Progress Bar (v2.3/v2.4/v2.6):** Enforces token limits reset at midnight ICT (UTC+7). Shows visual percentage quota bar in chat session drawer (`AiChatOverlay.tsx`). Free users see "Nâng cấp PRO (x10)" pill button linking to Subscription screen (`/(10_proflie)/10_8_subscription`), while PRO users display gold PRO badge. Raw token counts are hidden on FE; descriptions state "Hạn mức gấp 10 lần". Exceeding quota returns HTTP 429 (`QUOTA_EXCEEDED`), pops up mascot upgrade modal (`PremiumModal`), and displays a horizontally centered inline note in chat below the message instead of an error state with retry.
- **Floating Action Button (FAB):** Draggable button ([AiChatFab](../../apps/react-native-client/src/features/ai-chat/components/AiChatFab.tsx)) using `PanResponder`.
- **Voice Recognition Input:** Speech-to-text via `expo-speech-recognition` (`vi-VN`) with animated waveform UI ([VibratingVoiceInput](../../apps/react-native-client/src/features/ai-chat/components/VibratingVoiceInput.tsx)).

---

## 2. Architecture & File Structure

```
history-app/
├── apps/react-native-client/src/features/ai-chat/
│   ├── components/
│   │   ├── AiChatFab.tsx            # Draggable FAB entry button
│   │   ├── AiChatOverlay.tsx        # Main modal overlay UI with mode selector pills
│   │   ├── AiMarkdownMessage.tsx    # Markdown renderer with deep link navigation
│   │   ├── AiSkeletonBubble.tsx     # Skeleton loading animation for AI responses
│   │   └── VibratingVoiceInput.tsx  # Animated voice input wave indicator
│   ├── hooks/
│   │   ├── useAiChatFab.ts          # Gesture & drag-and-clamp logic for FAB
│   │   ├── useAiChatOverlay.ts      # Orchestration hook for chat, mode & session state
│   │   ├── useScreenContext.ts      # Active screen context detector
│   │   └── useVoiceInput.ts         # Expo Speech Recognition listener hook
│   └── services/
│       └── aiChatApi.ts             # RTK Query API slice definitions (v2.0 types & mutations)
└── apps/express-server/src/
    ├── routes/aiChatRoutes.ts       # Express router with requireStudent auth
    ├── controllers/aiChatController.ts # HTTP request handlers with mode & screenContext
    └── services/
        ├── aiChatService.ts         # Session, message & RAG query orchestration
        ├── contentSearchService.ts  # Full-text/keyword course data retrieval engine
        └── aiService.ts             # Gemini API integration with mode system prompts
```

---

## 3. Data Flow

### A. RAG & Mode-Aware Message Processing Flow
```
[User Sends Message in Chat Overlay]
  │
  ├──> Frontend (useAiChatOverlay)
  │      ├── Get active screen context via useScreenContext() ({ screenName, lessonId, nodeId })
  │      ├── Set pendingMessage = { id: tempId, content, status: "sending" }
  │      └── Call RTK Mutation sendMessage({ sessionId, content, screenContext })
  │
  ├──> HTTP POST /api/ai-chat/sessions/:sessionId/messages
  │      └── Body: { content, screenContext: { screenName, lessonId, nodeId } }
  │
  ├──> Backend (aiChatService.sendMessage)
  │      ├── Save User message & screenContext to DB (prisma.aiChatMessage)
  │      ├── Check session.mode (COURSE_ONLY | COURSE_FIRST | GENERAL)
  │      ├── IF mode != GENERAL OR screenContext present:
  │      │     └── Call contentSearchService.searchCourseContent(content, { contextLessonId, contextNodeId })
  │      │           ├── Fetch active Node/Lesson if on screen
  │      │           ├── Perform keyword search on Node.header, Node.body, Lesson.name, Lesson.summary
  │      │           └── Return formatted grounding text + reference links (lesson:id, node:id)
  │      ├── Build context history (sliding window 15 messages) + inject active session summary
  │      ├── Call aiService.callGeminiChat(contents, { mode, groundingContext, screenContextText, summary })
  │      │     ├── Construct system instruction according to mode, summary & citations
  │      │     └── Send request to Gemini API (temperature: 0.2 for COURSE_ONLY, 0.7 for GENERAL)
  │      ├── Save Assistant message to DB
  │      ├── IF totalMessages % 15 === 0:
  │      │     └── Trigger async background call aiService.summarizeContext -> update AiChatSession.summary in DB
  │      └── Return { userMessage, assistantMessage }
  │
  └──> Frontend Response Handling
         ├── RTK Query cache invalidates -> UI renders assistant message via <AiMarkdownMessage>
         └── User clicks markdown link [Bài 3: Cách mạng tháng 8](lesson:3)
               └── AiMarkdownMessage parses 'lesson:3' -> router.push("/(3_4_lessons)/lesson/3")
```

---

## 4. States & Data Models

### Frontend State Schema (`useAiChatOverlay`)
| State Symbol | Type | Default | Description |
|---|---|---|---|
| `selectedSessionId` | `string \| null` | `null` | Active selected session ID |
| `activeMode` | `"COURSE_ONLY" \| "COURSE_FIRST" \| "GENERAL"` | `"GENERAL"` | Active mode of selected chat session |
| `screenContext` | `{ screenName, lessonId, nodeId, topicId }` | `ScreenContextPayload` | Active route & screen metadata |
| `inputText` | `string` | `""` | Text input content |
| `showSessionsDrawer` | `boolean` | `false` | Toggle between Chat view & Session list |
| `pendingMessage` | `{ id, content, status } \| null` | `null` | Optimistic pending user message |

### Backend Database Schema (Prisma)
```prisma
enum AiChatMode {
  COURSE_ONLY
  COURSE_FIRST
  GENERAL
}

model AiChatSession {
  id        String          @id @default(uuid())
  userId    String          @map("user_id")
  title     String
  mode      AiChatMode      @default(GENERAL)
  summary   String?         @db.Text
  createdAt DateTime        @default(now()) @map("created_at")
  updatedAt DateTime        @updatedAt @map("updated_at")
  user      User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  messages  AiChatMessage[]
}

model AiChatMessage {
  id            String        @id @default(uuid())
  sessionId     String        @map("session_id")
  sender        String        // "user" | "assistant"
  content       String        @db.Text
  screenContext Json?         @map("screen_context")
  createdAt     DateTime      @default(now()) @map("created_at")
  session       AiChatSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
}
```

---

## 5. Version Log

| Version | Date | Description |
|---|---|---|
| 1.0 | 2026-07-31 | Initial implementation of AI Chat feature (FE overlay + BE Express/Prisma + Gemini API + Voice Input). |
| 2.0 | 2026-07-31 | Added 3 per-chat modes (`COURSE_ONLY`, `COURSE_FIRST`, `GENERAL`), RAG search engine (`contentSearchService`), Markdown rendering with deep link navigation (`lesson:id`, `node:id`), and screen context awareness (`useScreenContext`). |
| 2.1 | 2026-07-31 | Made active screen context a suggestion for ambiguous terms (e.g., "bài này", "nút này", "ở đây") rather than a scope limit in Course modes (`COURSE_ONLY`, `COURSE_FIRST`). Updated RAG search to search all course material across grades unless query specifies otherwise. |
| 2.2 | 2026-08-02 | Added 15-message periodic context summarization (`aiService.summarizeContext`) with background async execution and `AiChatSession.summary` database persistence. |
| 2.3 | 2026-08-02 | Implemented daily token quota system (`UserAiQuota` model, 50k Free / 500k Pro tokens/day) reset at midnight ICT, HTTP 429 handling, and `PremiumModal` mascot popups on mobile client. |
| 2.4 | 2026-08-02 | Added unsupported screen context boundary handling (`isSupported` flag in `useScreenContext` & `ScreenContextPayload`) so AI politely informs user when screen context is unsupported while continuing to answer general history questions. |
| 2.5 | 2026-08-02 | Enabled local UI mode selection on new un-persisted empty chats prior to database session creation; deferred DB chat session creation until the user sends their first message. |
| 2.6 | 2026-08-03 | Added Easter Egg (`eng on` / `eng off`) feature via `CourseMenuScreen` search bar to toggle `ai-chat` UI text translation, and updated Gemini system prompt to automatically respond in English when user message is in English. |

---

## 6. Bugs and Future Upgrades

### High severity/priority 

### Medium / Low severity & Future Upgrades

1. **Streaming Responses (Server-Sent Events / WebSockets):** Replace chunked POST response with streaming text output.
2. **Offline Cache & Retry Queue:** Store pending messages in AsyncStorage for offline handling when network drops.
3. **Voice Output (Text-to-Speech):** Add optional audio response playback for AI answers.
4. **Real-time Web Search Grounding:**
   - *Current Behavior:* AI relies on pre-trained parametric knowledge (cutoff 2024) and RAG course data. Real-time date context (`Asia/Ho_Chi_Minh`) is injected into system prompts in [aiService.ts](../../apps/express-server/src/services/aiService.ts).
   - *Future Upgrade:* Enable real-time Google Search grounding by adding `tools: [{ googleSearch: {} }]` to the Gemini API request payload in `aiService.ts` for live web search capabilities.
5. **Model Versioning & API Key Compatibility:**
   - Model name is configured via `GEMINI_MODEL` in `.env` (defaults to `gemini-2.5-flash` in [aiService.ts](../../apps/express-server/src/services/aiService.ts)).
   - Existing Google Gemini API keys (`GEMINI_API_KEY_1..3`) work seamlessly across model versions (`gemini-1.5-flash`, `gemini-2.0-flash`, `gemini-2.5-flash`) without requiring new keys.

---

## 7. Maintenance & Development Checklist

### Critical Edge Cases to Check
- **Deep Link Navigation:** Verify route targets exist in Expo Router (`/(3_4_lessons)/lesson/[id]` and `/(3_4_lessons)/lesson/node/[nodeId]`).
- **Course Only Mode Zero-Match:** If `contentSearchService` returns no matching records, Gemini responds with standardized disclaimer ("Rất tiếc, thông tin này chưa có trong bộ giáo trình...").
- **Prisma Schema Sync:** Always run `npx prisma generate --schema=./prisma/schema.prisma` inside `packages/shared` after modifying Prisma schema.
