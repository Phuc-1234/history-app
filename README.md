# History App

Ứng dụng học tập Lịch sử theo phong cách Duolingo — gamified learning platform được xây dựng dưới dạng **monorepo** với React Native (Expo) client và Express.js backend, sử dụng Supabase Auth + PostgreSQL (Prisma ORM).

## Tổng quan kiến trúc

```
history-app/
├── apps/
│   ├── react-native-client/    # Mobile app (Expo SDK 56, React Native 0.85)
│   └── express-server/         # REST API backend (Express + TypeScript)
├── packages/
│   └── shared/                 # Shared Prisma client (Prisma 7 + PostgreSQL)
├── package.json                # Monorepo root (npm workspaces)
└── app.json                    # Expo Router plugin config
```

## Tech Stack

| Layer | Công nghệ |
|-------|-----------|
| **Mobile Client** | React Native 0.85, Expo SDK 56, Expo Router, TypeScript |
| **Backend API** | Express.js, TypeScript, ts-node-dev |
| **Auth** | Supabase Auth (email/password + OTP verification) |
| **Database** | PostgreSQL (Prisma 7 với `@prisma/adapter-pg`) |
| **UI Libraries** | `lucide-react-native`, `expo-linear-gradient`, `react-native-svg` |

## Tính năng chính

### Hệ thống học tập
- **Bài học (Lessons)** — Nội dung được tổ chức theo cấu trúc phân cấp: `Grade → Topic → Lesson → Section → Node`
- **Slide bài học** — Mixed slides kết hợp nội dung và câu hỏi tương tác
- **Flashcard** — Thẻ ghi nhớ với hệ thống ôn tập (spaced repetition qua `UserFlashcard`)
- **Bài kiểm tra (Tests)** — Hỗ trợ 3 loại câu hỏi: Trắc nghiệm (CHOOSE), Điền đáp án (FILL), Nối cột (MATCH)
- **Đề thi quốc gia** — National tests với giới hạn thời gian

### Gamification
- **XP & Vàng (Gold)** — Hệ thống điểm kinh nghiệm và tiền tệ
- **Chuỗi học tập (Streak)** — Theo dõi chuỗi ngày học liên tục với milestone rewards
- **Hệ thống Tier** — Cấp bậc dựa trên XP tích lũy
- **Leaderboard** — Bảng xếp hạng người dùng
- **Cửa hàng (Store)** — Mua vật phẩm bằng vàng (frame, boost XP, boost gold)
- **Hành trang (Inventory)** — Quản lý vật phẩm đã sở hữu
- **Phần thưởng (Pending Rewards)** — Phần thưởng từ streak/tier chờ nhận

### Xác thực
- Đăng ký / Đăng nhập (email + password)
- Xác thực OTP qua email
- Đăng nhập xã hội (Google, Facebook — UI sẵn)
- Quên mật khẩu + đặt lại mật khẩu
- Thay đổi mật khẩu trong hồ sơ

## Cấu trúc Screen (React Native Client)

```
src/app/
├── index.tsx                          # Redirect → /login
├── _layout.tsx                        # Root Stack layout
├── (1_auth)/
│   ├── 1_1_login.tsx                  # Đăng nhập
│   ├── 1_2_register.tsx               # Đăng ký
│   ├── 1_3_forgot.tsx                 # Quên mật khẩu
│   ├── 1_4_otp_forgot.tsx             # OTP xác minh (quên MK)
│   ├── 1_5_new_pass_forgot.tsx        # Đặt mật khẩu mới
│   └── 1_6_otp_confirm.tsx            # OTP xác minh (đăng ký)
├── (tabs)/
│   ├── _layout.tsx                    # Bottom tab navigation
│   ├── 2_1_lessons.tsx                # Danh sách bài học
│   ├── 5_1_national_tests.tsx         # Đề thi quốc gia
│   ├── 7_1_inventory.tsx              # Hành trang
│   ├── 8_1_store.tsx                  # Cửa hàng
│   ├── 9_1_leaderboard.tsx            # Bảng xếp hạng
│   └── 10_1_profile.tsx               # Hồ sơ cá nhân
├── (3_4_lessons)/
│   ├── 3_1_lesson_summary.tsx         # Tổng quan bài học
│   ├── 4_1_mixed_slide.tsx            # Slide học tập
│   ├── 4_2_mixed_ques.tsx             # Câu hỏi trong slide
│   ├── 4_3_mixed_complete.tsx         # Hoàn thành bài học
│   ├── 4_4_fcard.tsx                  # Flashcard học tập
│   ├── 4_5_fcard_complete.tsx         # Hoàn thành flashcard
│   └── 4_6_mind_map.tsx              # Sơ đồ tư duy (zoom/pan, collapse/expand)
├── (6_tests)/
│   ├── 6_1_test_summary.tsx           # Tổng quan bài test
│   └── 6_2_ques_choose.tsx            # Làm bài trắc nghiệm
└── (10_proflie)/
    ├── 10_2_profile_edit.tsx          # Chỉnh sửa hồ sơ
    └── 10_3_password_change.tsx       # Đổi mật khẩu
```

## API Endpoints (Express Server)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `POST` | `/api/auth/register` | Đăng ký tài khoản mới |
| `POST` | `/api/auth/login` | Đăng nhập (trả về session + user profile) |
| `POST` | `/api/auth/verify-otp` | Xác minh OTP email |
| `GET`  | `/api/healthcheck` | Health check endpoint |

## Database Schema (Prisma)

Sơ đồ thực thể chính:

```
Grade → Topic → Lesson → Section → Node
                  ↓         ↓        ↓
             Flashcard  Flashcard  Flashcard
                  ↓         ↓
              Test (scoped to Grade/Topic/Lesson/Section)
                  ↓
           Question → QuestionAnswer
                  ↓
           TestQuestion (pivot: Test ↔ Question)

User ←→ Tier (current tier by XP)
  ├── UserTestLog → UserAnswerLog
  ├── UserFlashcard
  ├── UserItem → Item
  └── PendingReward → Item

Item types: FRAME, BOOST_XP_TIME, BOOST_GOLD_TIME, BOOST_XP_PASS, BOOST_GOLD_PASS
Question types: CHOOSE, FILL, MATCH
```

## Cài đặt & Chạy dự án

### Yêu cầu
- Node.js
- PostgreSQL database
- Supabase project (cho authentication)

### Environment Variables

Tạo file `.env` ở thư mục root:

```env
# Supabase (cho Express Server)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# PostgreSQL (cho Prisma — dùng Session/Transaction pooler)
DATABASE_URL=postgresql://user:password@host:6543/dbname
MIGRATION_DATABASE_URL=postgresql://user:password@host:5432/dbname

PORT=5000
```

### Cài đặt

```bash
# Cài đặt tất cả dependencies (tự chạy prisma generate)
npm install

# Chạy migration
npx prisma migrate dev --schema=packages/shared/prisma/schema.prisma
```

### Chạy development

```bash
# Khởi động React Native client (Expo)
cd apps/react-native-client && npx expo start

# Khởi động Express server
cd apps/express-server && npm run dev
```

## Components tái sử dụng

| Component | Mô tả |
|-----------|-------|
| `Button` | Nút bấm với variant primary/outline, gradient shadow |
| `Input` | TextInput với icon bên trái, toggle ẩn/hiện password |
| `SocialLoginButtons` | Nút đăng nhập Google + Facebook |
| `RewardModal` | Popup phần thưởng (vàng + huy hiệu) với animation |
| `StreakModal` | Bottom sheet chi tiết chuỗi học tập + milestones |
| `StreakCelebrationModal` | Popup ăn mừng chuỗi ngày với flame animation |

## Giấy phép

Dự án riêng tư. Tất cả quyền được bảo lưu.
