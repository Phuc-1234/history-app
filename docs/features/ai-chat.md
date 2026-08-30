# AI Chat Feature Documentation

**Current Version:** 3.1  
**Module Location:**
- Frontend: [ai-chat](../../apps/react-native-client/src/features/ai-chat)
- Backend: [aiChatRoutes.ts](../../apps/express-server/src/routes/aiChatRoutes.ts), [aiChatController.ts](../../apps/express-server/src/controllers/aiChatController.ts), [aiChatService.ts](../../apps/express-server/src/services/aiChatService.ts), [aiService.ts](../../apps/express-server/src/services/aiService.ts), [ai-tools](../../apps/express-server/src/services/ai-tools), [contentSearchService.ts](../../apps/express-server/src/services/contentSearchService.ts)

---

## 1. Feature Overview
The AI Chat feature provides students with an interactive Vietnamese History AI study assistant inside the React Native Expo client, backed by an Express.js server, Prisma PostgreSQL database, and Google Gemini LLM API.

### Key Capabilities
- **3 Chat Modes per Session (Switchable Mid-Session):**
  - `COURSE_ONLY` ("Chỉ Giáo Trình"): Restricts AI answers strictly to database course material (`Lesson`, `Section`, `Node`).
  - `COURSE_FIRST` ("Ưu Tiên Giáo Trình"): Uses course material first; places an explicit disclaimer note *before* any external knowledge section.
  - `GENERAL` ("Chung"): Unrestricted general history AI assistant.
  - *Mid-Session Switching:* Users can change the active mode at any point during a chat session via the top mode selector pills. Mode changes trigger a `PATCH /api/ai-chat/sessions/:sessionId` update and apply immediately to subsequent messages.
- **3 Model Tiers with Unified Function Calling RAG (v3.1):**
  - All 3 tiers (`LOW`, `MEDIUM`, `HIGH`) use the same Agentic RAG engine powered by Gemini Native Function Calling (`tools: [{ functionDeclarations }]`) and modular AI Tools (`ai-tools/`).
  - Tiers differ solely in their maximum allowed roundtrip iterations (calls between backend and Gemini API during tool execution per message turn):
    - `LOW` ("Thấp"): Tối đa **1 roundtrip** (1 lần gọi tool). Phù hợp tra cứu nhanh 1 bài/nút cụ thể.
    - `MEDIUM` ("Trung bình"): Tối đa **3 roundtrips**. Cân bằng giữa tốc độ phản hồi và độ sâu thông tin.
    - `HIGH` ("Cao"): Tối đa **5 roundtrips**. Cho phép đối chiếu, tra cứu nhiều bài học và tổng hợp kiến thức liên môn/liên bài phức tạp.
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
│   │   ├── AiChatOverlay.tsx        # Main modal overlay UI with mode & tier selectors
│   │   ├── AiMarkdownMessage.tsx    # Markdown renderer with deep link navigation
│   │   ├── AiSkeletonBubble.tsx     # Skeleton loading animation for AI responses
│   │   └── VibratingVoiceInput.tsx  # Animated voice input wave indicator
│   ├── hooks/
│   │   ├── useAiChatFab.ts          # Gesture & drag-and-clamp logic for FAB
│   │   ├── useAiChatOverlay.ts      # Orchestration hook for chat, mode, tier & session state
│   │   ├── useScreenContext.ts      # Active screen context detector
│   │   └── useVoiceInput.ts         # Expo Speech Recognition listener hook
│   └── services/
│       └── aiChatApi.ts             # RTK Query API slice definitions (v3.1 types & mutations)
└── apps/express-server/src/
    ├── routes/aiChatRoutes.ts       # Express router with requireStudent auth
    ├── controllers/aiChatController.ts # HTTP request handlers with mode, tier & screenContext
    └── services/
        ├── aiChatService.ts         # Session, message & tier orchestration
        ├── ai-tools/                # Modular Gemini Native Tools (lesson, node, quiz, search)
        ├── contentSearchService.ts  # Fallback search / course data helper
        └── aiService.ts             # Gemini API integration with Tool Calling engine & prompts
```

---

## 3. Data Flow

### A. RAG & Tier-Aware Message Processing Flow
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
  │      ├── Retrieve session.modelTier (LOW | MEDIUM | HIGH) -> map to maxRoundtrips:
  │      │     ├── LOW    => maxRoundtrips = 1
  │      │     ├── MEDIUM => maxRoundtrips = 3
  │      │     └── HIGH   => maxRoundtrips = 5
  │      ├── Build context history (sliding window 15 messages) + inject active session summary
  │      ├── Call aiService.callGeminiWithTools(formattedContents, {
  │      │       mode: session.mode,
  │      │       screenContextText,
  │      │       isSupportedScreen,
  │      │       summary: session.summary,
  │      │       maxRoundtrips
  │      │   })
  │      │     ├── Execute Gemini function calling loop up to maxRoundtrips
  │      │     ├── Invoke matching tool declarations from ai-tools registry
  │      │     └── Generate final grounded response
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
| `selectedModelTier` | `"LOW" \| "MEDIUM" \| "HIGH"` | `"MEDIUM"` | Active model tier (Thấp / Trung bình / Cao) |
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

enum AiModelTier {
  LOW
  MEDIUM
  HIGH
}

model AiChatSession {
  id        String          @id @default(uuid())
  userId    String          @map("user_id")
  title     String
  mode      AiChatMode      @default(GENERAL)
  modelTier AiModelTier     @default(MEDIUM) @map("model_tier")
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
| 3.0 | 2026-08-12 | Introduced High Model Tier (`AiModelTier`: `MEDIUM` / `HIGH`), Gemini Native Function Calling (`tools: [{ functionDeclarations }]`), modular AI Tool directory (`ai-tools/`), app domain overview (`appInfo.ts`), and automatic fallback to Medium RAG mode. |
| 3.1 | 2026-08-22 | Nâng cấp hệ thống Model Tier lên 3 cấp độ (`LOW` / `MEDIUM` / `HIGH` tương ứng Thấp / Trung bình / Cao). Đồng nhất cơ chế RAG cho cả 3 tiers sang Gemini Native Function Calling với giới hạn roundtrips khác nhau (LOW: tối đa 1 roundtrip, MEDIUM: tối đa 3 roundtrips, HIGH: tối đa 5 roundtrips). |
| 3.2 | 2026-08-30 | Sửa lỗi tra cứu bài học theo số thứ tự khối lớp (ví dụ "bài 2 lớp 10") thông qua hỗ trợ `gradeNumber` & `lessonPosition` trực tiếp trong `get_lesson_detail` và `contentSearchService`; loại bỏ hoàn toàn việc nhắc đến mã ID/thuật ngữ kỹ thuật CSDL trong câu trả lời AI; xử lý làm sạch các liên kết markdown giả lập như `(search:...)` và áp dụng `usePreventDoubleTap` khi click link điều hướng trên client. |

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

