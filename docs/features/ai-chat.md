# AI Chat Feature Documentation

**Current Version:** 2.0  
**Module Location:**
- Frontend: [ai-chat](../../apps/react-native-client/src/features/ai-chat)
- Backend: [aiChatRoutes.ts](../../apps/express-server/src/routes/aiChatRoutes.ts), [aiChatController.ts](../../apps/express-server/src/controllers/aiChatController.ts), [aiChatService.ts](../../apps/express-server/src/services/aiChatService.ts), [aiService.ts](../../apps/express-server/src/services/aiService.ts), [contentSearchService.ts](../../apps/express-server/src/services/contentSearchService.ts)

---

## 1. Feature Overview
The AI Chat feature provides students with an interactive Vietnamese & World History AI study assistant inside the React Native Expo client, backed by an Express.js server, Prisma PostgreSQL database, and Google Gemini LLM API.

### Key Capabilities (v2.0)
- **3 Chat Modes per Session:**
  - `COURSE_ONLY` ("Chỉ Giáo Trình"): Restricts AI answers strictly to database course material (`Lesson`, `Section`, `Node`).
  - `COURSE_FIRST` ("Ưu Tiên Giáo Trình"): Uses course material first, with explicit disclaimer note when supplementing external knowledge.
  - `GENERAL` ("Chung"): Unrestricted general history AI assistant.
- **RAG Course Content Search Engine:** Automatically searches top 5 relevant lessons and nodes via [contentSearchService.ts](../../apps/express-server/src/services/contentSearchService.ts) to ground AI responses.
- **Rich Markdown & Deep Link Navigation:** Render chat bubbles with bold, headers, lists, and clickable custom links (`[Title](lesson:ID)`, `[Title](node:ID)`) that navigate to target Expo Router screens ([AiMarkdownMessage.tsx](../../apps/react-native-client/src/features/ai-chat/components/AiMarkdownMessage.tsx)).
- **Active Screen Context Awareness:** Detects user location (`LessonMenuScreen`, `LessonSummaryScreen`, `NodeScreen`) via [useScreenContext.ts](../../apps/react-native-client/src/features/ai-chat/hooks/useScreenContext.ts) to provide localized assistant context.
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
  │      ├── Build context history (sliding window 16 messages)
  │      ├── Call aiService.callGeminiChat(contents, { mode, groundingContext, screenContextText })
  │      │     ├── Construct system instruction according to mode & citations
  │      │     └── Send request to Gemini API (temperature: 0.2 for COURSE_ONLY, 0.7 for GENERAL)
  │      ├── Save Assistant message to DB
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

---

## 6. Future Upgrades

1. **Streaming Responses (Server-Sent Events / WebSockets):** Replace chunked POST response with streaming text output.
2. **Offline Cache & Retry Queue:** Store pending messages in AsyncStorage for offline handling when network drops.
3. **Token Limit & Cost Tracking:** Track token usage per user to enforce daily quotas for free/pro users.
4. **Voice Output (Text-to-Speech):** Add optional audio response playback for AI answers.

---

## 7. Maintenance & Development Checklist

### Critical Edge Cases to Check
- **Deep Link Navigation:** Verify route targets exist in Expo Router (`/(3_4_lessons)/lesson/[id]` and `/(3_4_lessons)/lesson/node/[nodeId]`).
- **Course Only Mode Zero-Match:** If `contentSearchService` returns no matching records, Gemini responds with standardized disclaimer ("Rất tiếc, thông tin này chưa có trong bộ giáo trình...").
- **Prisma Schema Sync:** Always run `npx prisma generate --schema=./prisma/schema.prisma` inside `packages/shared` after modifying Prisma schema.
