# 📖 History App

Ứng dụng học tập Lịch sử Việt Nam được xây dựng theo kiến trúc **monorepo**, gồm React Native client (Expo) và Express.js server với MongoDB.

---

## 🏗️ Kiến trúc dự án

```
history-app/
├── apps/
│   ├── express-server/          # Backend API server (Node.js + Express + MongoDB)
│   └── react-native-client/    # Frontend mobile app (React Native + Expo)
├── packages/
│   └── shared/                  # Shared utilities & validators
├── package.json                # Root workspace configuration
└── PROMPT.md                   # Documentation (Vietnamese)
```

---

## 🛠️ Công nghệ sử dụng

### Backend — `apps/express-server/`
| Công nghệ | Phiên bản | Mô tả |
|-----------|-----------|-------|
| Node.js | — | Runtime |
| Express | 4.19.2 | Web framework |
| TypeScript | 5.3.3 | Ngôn ngữ lập trình |
| MongoDB + Mongoose | 8.3.0 | Cơ sở dữ liệu |
| CORS | 2.8.5 | Cross-origin requests |
| ts-node-dev | — | Hot reload development |

### Frontend — `apps/react-native-client/`
| Công nghệ | Phiên bản | Mô tả |
|-----------|-----------|-------|
| React Native | 0.83.6 | Mobile framework |
| Expo SDK | 55.0.24 | Development platform |
| Expo Router | 55.0.14 | File-based routing |
| React Native Reanimated | 4.2.1 | Animations |
| React Native Gesture Handler | 2.30.0 | Touch gestures |
| TypeScript | — | Ngôn ngữ lập trình |

**Nền tảng hỗ trợ:** iOS, Android, Web

### Shared Package — `packages/shared/`
- Logic validation dùng chung giữa client và server
- Hàm `validateChooseAnswer()` cho kiểm tra đáp án trắc nghiệm

---

## 📂 Cấu trúc chi tiết

### Express Server
```
apps/express-server/
├── src/
│   ├── config/
│   │   └── db.ts                    # Kết nối MongoDB
│   ├── controllers/
│   │   └── QuestionController.ts    # Xử lý request
│   ├── models/
│   │   └── Question.ts             # Mongoose schema
│   ├── routes/
│   │   └── QuestionRoutes.ts       # API routes
│   └── index.ts                    # Entry point (port 5000)
├── package.json
└── tsconfig.json
```

### React Native Client
```
apps/react-native-client/
├── src/
│   └── app/
│       ├── _layout.tsx             # Root layout (Stack navigation)
│       └── index.tsx              # Home screen
├── assets/
│   └── images/                    # Icons, splash screens, logos
├── app.json                       # Expo configuration
├── package.json
└── tsconfig.json
```

---

## 🚀 Cài đặt & Chạy dự án

### Yêu cầu
- Node.js >= 18
- MongoDB chạy本地 (localhost:27017)
- Expo CLI (cho mobile development)

### Cài đặt dependencies

```bash
npm install
```

### Chạy Server (Backend)

```bash
npm run server
```

Server chạy tại `http://localhost:5000`

### Chạy Client (Frontend)

```bash
npx expo start
```

Khởi động Expo dev server cho React Native app.

---

## 📡 API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/api/questions/verify` | Kiểm tra đáp án người dùng |

### Question Model

```typescript
{
  type: "choose" | "fill" | "match",   // Loại câu hỏi
  grade: Number,                        // Lớp
  topic: String,                        // Chủ đề
  // ... các trường khác
}
```

---

## ✨ Tính năng

### Đã triển khai
- ✅ Hệ thống quản lý câu hỏi (trắc nghiệm, điền khuyết, ghép nối)
- ✅ API kiểm tra đáp án
- ✅ Shared validation logic giữa client & server
- ✅ Ứng dụng mobile cross-platform (iOS, Android, Web)
- ✅ Kiến trúc monorepo với shared package

### Đang phát triển
- 🔄 **Mind Map tương tác** — Công cụ học tập trực quan cho các sự kiện lịch sử
  - Hỗ trợ zoom, kéo thả, tự động fit
  - Nhánh màu sắc phân loại nội dung
  - Nội dung theo chương: *Kháng chiến chống Pháp (1946-1954)*
- 🔄 Hệ thống gamification (tiền, avatar, tiến độ)
- 🔄 Theo dõi tiến trình học tập

---

## ⚙️ Cấu hình

### Biến môi trường (`.env` trong `apps/express-server/`)

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/history-app
```

### Expo Experiments
- React Compiler: enabled
- Typed Routes: enabled

---

## 👥 Đóng góp

Code ownership: [@Phuc-1234](https://github.com/Phuc-1234)

---

## 📄 License

Private project
