# History App

Ứng dụng học Lịch sử theo phong cách gamification, được tổ chức theo dạng monorepo với:

- `apps/react-native-client`: ứng dụng mobile/web bằng Expo, React Native, Expo Router.
- `apps/express-server`: REST API bằng Express.js và TypeScript.
- `packages/shared`: Prisma client, database schema và kiểu dữ liệu dùng chung giữa client/server.

## Kiến trúc tổng quan

```text
history-app/
├── apps/
│   ├── react-native-client/       # Expo Router app
│   └── express-server/            # Express REST API
├── packages/
│   └── shared/                    # Prisma + shared DTO/type contracts
├── json/                          # Seed SQL/JSON theo bài học
├── postman/                       # Collection và environment test API
├── package.json                   # npm workspaces
└── app.json
```

## Nguyên tắc tổ chức client

Phần code tính năng của React Native client nằm trong:

```text
apps/react-native-client/src/features
```

Thư mục:

```text
apps/react-native-client/src/app
```

chủ yếu chỉ dùng cho Expo Router: khai báo route, tab, stack, lấy params và kết nối sang màn hình/hook/component trong `features`. Khi thêm hoặc sửa nghiệp vụ, UI chính, hook, API slice, state hoặc component của một tính năng, ưu tiên đặt trong `src/features/<feature-name>` thay vì nhồi logic vào file route trong `src/app`.

Ví dụ:

- `src/app/(tabs)/2_1_lessons.tsx` chỉ điều hướng và render `LessonMenu`.
- `src/app/(3_4_lessons)/lesson/[id].tsx` lấy `id`, bọc `TopBarWrapper`, rồi render `LessonSummary`.
- `src/app/(6_tests)/6_2_ques_choose.tsx` lấy `testId`, rồi render `TestContainer`.

## Tech stack

| Phần | Công nghệ |
| --- | --- |
| Client | Expo SDK 56, React Native 0.85, React 19, TypeScript, Expo Router |
| State/API client | Redux Toolkit, RTK Query, Redux Persist, AsyncStorage |
| UI/mobile | React Native SVG, Reanimated, Gesture Handler, Safe Area Context, Expo Linear Gradient, Expo Image, lucide-react-native, Ionicons |
| Backend | Express.js, TypeScript, ts-node-dev |
| Auth | Supabase Auth/session flow, JWT middleware, Google verify endpoint |
| Database | PostgreSQL, Prisma 7, `@prisma/adapter-pg`, `pg` |
| Shared contracts | `@history-app/shared` package |

## Tính năng client hiện có

Các feature chính trong `apps/react-native-client/src/features`:

| Feature | Vai trò |
| --- | --- |
| `auth` | Đăng nhập, đăng ký, xác thực OTP, Google verify, lưu session, sync profile |
| `forgot_password` | Quên mật khẩu, xác thực OTP quên mật khẩu, đặt mật khẩu mới |
| `lesson_menu` | Cấu trúc lớp/chủ đề/bài học từ API `grade-struct` |
| `lesson` | Tổng quan bài học, cây lesson/section/node |
| `mind-map` | Sơ đồ tư duy từ API `/api/content/mindmap`, layout node/edge bằng SVG |
| `flashcard` | Màn hình học flashcard và màn hình hoàn thành |
| `test` | Engine làm bài, câu hỏi chọn đáp án/điền/nối cột, lịch sử và chi tiết bài làm |
| `leaderboard` | Bảng xếp hạng từ API gamification |
| `profile` | Hồ sơ, sửa hồ sơ, đổi mật khẩu |
| `top_bar` | Top bar dùng chung, dữ liệu XP/gold/streak/profile |
| `streak` | Modal phần thưởng, streak và celebration |
| `reward-popup` | UI popup phần thưởng/tier path |
| `videostream` | Video lesson, player, loading/error state |
| `shop` | Cửa hàng hiện đang dùng mock data phía client |
| `inventory` | Hành trang hiện đang dùng mock data phía client |
| `national-tests` | Danh sách đề thi quốc gia hiện đang dùng mock data phía client |

## Route client

```text
src/app/
├── index.tsx                         # Redirect sang onboarding screen1
├── _layout.tsx                       # Root providers: Redux, PersistGate, SafeArea, Stack
├── (routing)/                        # Onboarding + welcome
│   ├── screen1.tsx
│   ├── screen2.tsx
│   └── welcome.tsx
├── (1_auth)/                         # Auth routes
│   ├── 1_1_login.tsx
│   ├── 1_2_register.tsx
│   ├── 1_3_forgot.tsx
│   ├── 1_4_otp_forgot.tsx
│   ├── 1_5_new_pass_forgot.tsx
│   └── 1_6_otp_confirm.tsx
├── (tabs)/                           # Bottom tabs
│   ├── 2_1_lessons.tsx
│   ├── 5_1_national_tests.tsx
│   ├── 7_1_inventory.tsx
│   ├── 8_1_store.tsx
│   ├── 9_1_leaderboard.tsx
│   └── 10_1_profile.tsx
├── (3_4_lessons)/                    # Lesson detail flow
│   ├── lesson/[id].tsx
│   ├── 4_4_fcard.tsx
│   ├── 4_5_fcard_complete.tsx
│   └── 4_6_mind_map.tsx
├── (6_tests)/
│   └── 6_2_ques_choose.tsx
└── (10_proflie)/                     # Giữ nguyên tên folder hiện tại trong code
    ├── 10_2_profile_edit.tsx
    ├── 10_3_password_change.tsx
    ├── 10_4_test_history.tsx
    └── 10_5_test_detail.tsx
```

Lưu ý: một số route placeholder như `4_1_mixed_slide.tsx`, `4_2_mixed_ques.tsx`, `4_3_mixed_complete.tsx` đang tồn tại nhưng chưa có nội dung đáng kể.

## Backend API

Server mount các route chính trong `apps/express-server/src/index.ts`:

| Prefix | Chức năng |
| --- | --- |
| `/api/auth` | Auth, OTP, refresh token, Google verify, forgot password |
| `/api/user` | Profile, cập nhật dữ liệu người dùng, đổi mật khẩu/email |
| `/api/content` | Grade/topic/lesson/section/node tree, mind map |
| `/api/gamification` | Leaderboard, tier, milestone reward, item |
| `/api/tests` | Start test, lấy summary test |
| `/api/test-logs` | Jump câu hỏi, submit answer, finish test |
| `/api/admin` | CRUD grade/topic/lesson/section/node/user/video/question/test cho admin |
| `/api/healthcheck` | Health check |

Một số endpoint đang được client gọi:

```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/verify-otp
POST /api/auth/resend-otp
POST /api/auth/refresh-token
POST /api/auth/google/verify
POST /api/auth/forgot-password
POST /api/auth/verify-forgot-otp
POST /api/auth/complete-reset

GET  /api/user/profile
PUT  /api/user/profile
PUT  /api/user/data
PUT  /api/user/email
PUT  /api/user/change-password
PUT  /api/user/password

GET  /api/content/grade-struct/:gradeId
GET  /api/content/lessons/:lessonId/tree
GET  /api/content/mindmap?lessonId=:lessonId

GET  /api/gamification/leaderboard?limit=20&page=1&sort=xp

POST /api/tests/:testId/start
GET  /api/tests/:testId/summary
POST /api/test-logs/:logId/jump
POST /api/test-logs/:logId/submit-answer
POST /api/test-logs/:logId/finish
```

## Database

Prisma schema nằm ở:

```text
packages/shared/prisma/schema.prisma
```

Các nhóm model chính:

```text
Grade -> Topic -> Lesson -> Section -> Node
                       ├── Video
                       ├── Flashcard
                       └── Question

Test -> TestQuestion -> Question -> QuestionAnswer
User -> UserTestLog -> UserAnswerLog
User -> UserFlashcard
User -> UserItem -> Item
User -> PendingReward
User -> Tier
MilestoneReward -> Item
```

Enum chính:

- `QuestionType`: `CHOOSE`, `FILL`, `MATCH`
- `UserRole`: `STUDENT`, `ADMIN`, `SUPER_ADMIN`
- `ItemType`: `FRAME`, `BOOST_XP_TIME`, `BOOST_GOLD_TIME`, `BOOST_XP_PASS`, `BOOST_GOLD_PASS`
- `RewardSourceType`: `STREAK`, `TIER`
- `RewardType`: `ITEM`, `XP`, `GOLD`
- `VideoStatus`: `PENDING`, `PROCESSING`, `READY`, `FAILED`

## Cài đặt

Yêu cầu:

- Node.js
- PostgreSQL
- Supabase project cho auth/session

Cài dependencies ở root:

```bash
npm install
```

Generate Prisma client:

```bash
npx prisma generate --schema=packages/shared/prisma/schema.prisma
```

Chạy migration:

```bash
npx prisma migrate dev --schema=packages/shared/prisma/schema.prisma
```

Build package shared:

```bash
npm run build:shared
```

## Environment variables

Backend/shared cần các biến môi trường sau. Tùy cách chạy, đặt `.env` ở vị trí mà process đọc được; code hiện tại có đọc `.env` từ package/server và fallback theo `dotenv.config()`.

```env
DATABASE_URL=postgresql://user:password@host:6543/dbname
MIGRATION_DATABASE_URL=postgresql://user:password@host:5432/dbname

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

PORT=5000
```

Client dùng:

```env
EXPO_PUBLIC_APP_ENV=local
EXPO_PUBLIC_API_URL=http://localhost:5000
EXPO_PUBLIC_API_URL_FEATURE=https://your-feature-server.example.com
EXPO_PUBLIC_API_URL_PRODUCTION=https://your-production-server.example.com
```

Với thiết bị Android/iOS thật, kiểm tra `apps/react-native-client/src/services/config.ts` và đổi `LOCAL_COMPUTER_IP` sang IPv4 của máy chạy backend.

## Chạy development

Chạy server từ root:

```bash
npm run server
```

Chạy client từ root:

```bash
npm run client
```

Các mode client:

```bash
npm run client:local
npm run client:feature
npm run client:dev
```

Hoặc chạy trực tiếp trong client:

```bash
cd apps/react-native-client
npx expo start
```

## Build/deploy

Build shared:

```bash
npm run build:shared
```

Build server:

```bash
npm run build:server
```

Build cho Render:

```bash
npm run build:render
```

Start server build output:

```bash
npm run start:render
```

## Seed/content

Repo có dữ liệu học tập và seed trong:

```text
json/
bai1_lien_hop_quoc_file_moi_seed.md
bai2_den_bai4_seed.md
bai2_den_bai9_full_noi_dung.md
bai5_den_bai9_docx_full_noi_dung/
```

Ngoài ra server có script:

```text
apps/express-server/src/scripts/seeds.ts
```

## Postman

Collection và environment nằm trong:

```text
postman/
```

Dùng để test nhanh các endpoint auth, content, test và gamification.

## Ghi chú hiện trạng

- README cũ bị lỗi encoding tiếng Việt; file này đã được viết lại bằng UTF-8.
- `src/app` nên giữ vai trò routing/kết nối, còn code tính năng nên tiếp tục nằm trong `src/features`.
- `shop`, `inventory`, `national-tests` hiện đang dùng dữ liệu mock phía client, chưa phải luồng API đầy đủ.
- Một số comment/text trong source đang bị mojibake; README này không sửa source code ngoài tài liệu.

## Quy tắc Đánh giá Câu hỏi Điền từ (Fill Question Evaluation Policy)

Cơ chế đánh giá câu hỏi điền từ (FILL question) được đồng bộ hóa nhất quán giữa FE và BE theo các bước sau:

1. **Chuẩn hóa chuỗi (Normalization)**:
   * Chuyển về chữ thường (lowercase).
   * Loại bỏ toàn bộ các dấu câu chuẩn và các ký tự đặc biệt (`.,\/#!$%\^&\*;:{}=\-_`~()?"'’‘“”\[\]{}`).
   * Rút gọn các khoảng trắng thừa ở giữa và hai đầu chuỗi thành một khoảng trắng duy nhất.
   * Giữ nguyên các ký tự có dấu tiếng Việt (đ, â, ă, ê, ô, ơ, ư, và các dấu thanh).

2. **Kiểm tra chữ số trước (Numeric Check)**:
   * Trích xuất toàn bộ các chuỗi chữ số liên tiếp từ câu trả lời của người dùng và đáp án đúng.
   * Chuyển đổi các chuỗi chữ số này thành các mảng số nguyên tương ứng (loại bỏ số 0 ở đầu, ví dụ `"04"` thành `4`).
   * Nếu danh sách số nguyên trích xuất được không khớp nhau hoàn toàn về thứ tự và giá trị, câu trả lời bị đánh giá là **Sai ngay lập tức** mà không cần so khớp chữ.

3. **Tính toán khoảng cách lỗi (Typo Allowance)**:
   * Tính toán khoảng cách Levenshtein giữa chuỗi của người dùng và đáp án đúng (sau khi đã chuẩn hóa).
   * Ngưỡng lỗi chính tả được chấp nhận dựa trên số lượng từ (syllables) của đáp án đúng:
     * **1 từ**: Yêu cầu khớp tuyệt đối (không cho phép lỗi chính tả, khoảng cách Levenshtein = 0).
     * **2 từ**: Cho phép tối đa 1 lỗi chính tả (khoảng cách Levenshtein $\le$ 1).
     * **Từ 3 đến 5 từ**: Cho phép tối đa 2 lỗi chính tả (khoảng cách Levenshtein $\le$ 2).
     * **Từ 6 từ trở lên**: Cho phép tối đa 3 lỗi chính tả (khoảng cách Levenshtein $\le$ 3).

4. **Đánh giá chi tiết**:
   * Câu trả lời được so sánh lần lượt với từng đáp án được chấp nhận (accepted answers). Nếu khớp với bất kỳ đáp án nào thỏa mãn các điều kiện trên, câu trả lời sẽ được coi là **Đúng**.

## Quy tắc Đánh giá Câu hỏi Nối cột và Nhiều lựa chọn (Match and Multiple Choice Scoring Policy)

Cơ chế chấm điểm cho câu hỏi Nối cột (MATCH) và Chọn nhiều đáp án (CHOOSE với > 1 đáp án đúng) được đồng bộ hóa nhất quán giữa FE và BE như sau:

1. **Câu hỏi Nối cột (MATCH)**:
   * **Điểm tối đa (maxScore)**: Tính theo công thức `max(0.25, floor(N / 2) * 0.25)` với `N` là tổng số cặp (pairs) cần nối.
     * 2-3 cặp: `0.25` điểm.
     * 4-5 cặp: `0.5` điểm.
     * 6-7 cặp: `0.75` điểm.
     * 8-9 cặp: `1.0` điểm.
   * **Cơ chế chấm điểm**: Áp dụng quy tắc "Tất cả hoặc không có gì" (All-or-nothing). Người làm bài phải nối chính xác toàn bộ các cặp mới được nhận điểm tối đa (`maxScore`). Nếu nối sai bất kỳ cặp nào, điểm nhận được sẽ là `0`.

2. **Câu hỏi Chọn nhiều đáp án (CHOOSE với > 1 đáp án đúng)**:
   * **Điểm tối đa (maxScore)**: Tính theo công thức tương tự MATCH: `max(0.25, floor(M / 2) * 0.25)` với `M` là tổng số tùy chọn (options) của câu hỏi.
     * 2-3 tùy chọn: `0.25` điểm.
     * 4-5 tùy chọn: `0.5` điểm.
   * **Cơ chế chấm điểm**: 
     * Cộng điểm: Nhận `+maxScore / số đáp án đúng` cho mỗi đáp án đúng được chọn.
     * Trừ điểm: Bị phạt `-maxScore / số đáp án sai` cho mỗi đáp án sai được chọn (để hạn chế việc chọn bừa).
     * Điểm tối thiểu cho mỗi câu hỏi là `0` (không lấy điểm âm).

## Giấy phép

Dự án riêng tư. Tất cả quyền được bảo lưu.
