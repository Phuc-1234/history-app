# Authentication & User Identity Documentation

**Current Version:** 1.0  
**Module Location:**
- Backend Routes: [authRoutes.ts](../../apps/express-server/src/routes/authRoutes.ts), [userRoutes.ts](../../apps/express-server/src/routes/userRoutes.ts)
- Backend Controllers: [authController.ts](../../apps/express-server/src/controllers/authController.ts), [userController.ts](../../apps/express-server/src/controllers/userController.ts)
- Backend Services: [authService.ts](../../apps/express-server/src/services/authService.ts)
- Backend Middlewares: [authMiddleware.ts](../../apps/express-server/src/middlewares/authMiddleware.ts)
- Config: [supabaseClient.ts](../../apps/express-server/src/config/supabaseClient.ts)
- Database Schema: [schema.prisma](../../packages/shared/prisma/schema.prisma)

---

## 1. Feature Overview
The Authentication module manages identity verification, account registration, session issuance, and user profile synchronization for the application. It relies on **Supabase Auth** as the primary identity provider, synced to a PostgreSQL database (`public.users`) via a PostgreSQL trigger.

### Key Capabilities & Auth Methods
- **Email & Password Authentication:**
  - Standard user registration with 6-digit OTP email verification via Supabase.
  - Password login yielding Supabase JWT Access Tokens and Refresh Tokens.
  - Password reset flow via OTP code verification (`/forgot-password`, `/verify-forgot-otp`, `/complete-reset`).
- **Google OAuth Integration (`/api/auth/google/verify`):**
  - OIDC ID Token exchange via `supabase.auth.signInWithIdToken({ provider: "google", token: idToken })`.
  - Automatic account provisioning and token issuance.
- **Facebook Authentication (`/api/auth/facebook/verify`):**
  - Graph API token validation (`https://graph.facebook.com/me`).
  - User lookup/creation via Supabase Admin API (`admin.createUser`) and magic link session establishment.
- **Session Management & Middleware Authorization:**
  - Token signature verification via RS256/ES256 JWKS public key endpoint (`authMiddleware.ts`).
  - Role-based access control (`requireStudent`, `requireAdmin`, `optionalAuth`).

### PostgreSQL User Sync Trigger (`handle_new_user_sync`)
Whenever a new record is created in Supabase's internal `auth.users` table (via Email, Google, or Facebook), the following trigger executes automatically to populate the `public.users` gamification table:

```sql
BEGIN
  INSERT INTO public.users (    
    id, 
    role,
    name,
    email,
    total_xp, 
    total_gold, 
    is_hidden,
    profile_img_url,
    current_streak,
    highest_streak,
    last_test_passed_at,
    current_tier_index
  )
  VALUES (    
    new.id::text, 
    'STUDENT',    
    COALESCE(new.raw_user_meta_data->>'name', 'New Historian'), 
    new.email,
    0,   
    100, 
    false,                    
    NULL,                     
    0,                        
    0,                        
    NULL,                     
    1                         
  );
  RETURN new;
END;
```

### Core Business Rule
- **Single Identity Principle:** Exactly one unique email corresponds to one user account (`email String? @unique` in `public.users`).

---

## 2. Architecture & File Structure

```
history-app/
├── apps/express-server/src/
│   ├── config/
│   │   └── supabaseClient.ts          # Supabase client instances (Anon client, Admin client, User client factory)
│   ├── controllers/
│   │   ├── authController.ts          # HTTP handlers for register, login, OTP, social auth, password reset
│   │   └── userController.ts          # Handlers for profile fetch, profile update, email update, password change
│   ├── middlewares/
│   │   └── authMiddleware.ts          # JWKS JWT verification middleware (requireStudent, requireAdmin, optionalAuth)
│   ├── routes/
│   │   ├── authRoutes.ts              # /api/auth routes
│   │   └── userRoutes.ts              # /api/user routes
│   └── services/
│       └── authService.ts             # Service layer bridging Supabase Auth API & Prisma DB queries
└── packages/shared/prisma/
    └── schema.prisma                  # Prisma data model mapping public.users
```

---

## 3. Data Flow

### A. Email + Password Registration & Verification Flow
```
[Client] ──> POST /api/auth/register { name, email, password }
               │
               ├──> authController.registerUser()
               │      └── authService.signUpUser() -> supabase.auth.signUp()
               │             │
               │             ├──> [Supabase auth.users] INSERT
               │             │      └── Trigger: handle_new_user_sync -> INSERT INTO public.users
               │             └──> Send 6-digit OTP to user email
               │
[Client] ──> POST /api/auth/verify-otp { email, token }
               │
               └──> authController.verifyOtp()
                      └── authService.verifyOtpToken() -> supabase.auth.verifyOtp()
                             └── Return { session: { accessToken, refreshToken }, profile }
```

### B. Google OAuth Verification Flow
```
[Client (Google SDK)] ──> Obtains Google idToken
                           │
[Client] ──> POST /api/auth/google/verify { idToken }
               │
               └──> authController.verifyGoogleSession()
                      └── authService.getUserViaGoogleToken()
                             └── exchangeGoogleIdToken()
                                    └── supabase.auth.signInWithIdToken({ provider: "google", token: idToken })
                                           │
                                           ├── [New User]: Trigger handle_new_user_sync creates public.users row
                                           └── [Existing User]: Returns active session JWTs
```

### C. Facebook OAuth Flow
```
[Client (Facebook SDK)] ──> Obtains FB accessToken
                             │
[Client] ──> POST /api/auth/facebook/verify { accessToken }
               │
               └──> authController.verifyFacebookSession()
                      └── authService.getUserViaFacebookToken()
                             └── exchangeFacebookAccessToken()
                                    ├── Fetch FB profile (https://graph.facebook.com/me)
                                    ├── Resolve email (fbData.email || 'fb_ID@facebook.placeholder')
                                    ├── Check DB user (prisma.user.findUnique)
                                    ├── IF missing: supabaseAdmin.auth.admin.createUser() -> Trigger fires
                                    ├── Generate magic link: supabaseAdmin.auth.admin.generateLink()
                                    └── Verify magic link: supabase.auth.verifyOtp() -> Returns session
```

### D. Password Change Flow
```
[Client] ──> PUT /api/user/change-password { currentPassword, newPassword }
               │
               └──> userController.changeUserPassword()
                      ├── Check token & get Supabase user email
                      ├── Re-authenticate old password: supabase.auth.signInWithPassword({ email, currentPassword })
                      └── Update password: userSupabase.auth.updateUser({ password: newPassword, current_password })
```

### E. Email Change & OTP Verification Flow
```
[Client] ──> PUT /api/user/email { newEmail }
               │
               └──> userController.updateUserEmail()
                      ├── Check new email uniqueness in prisma.user
                      └── Initiate update: userSupabase.auth.updateUser({ email: newEmail })
                             └── Supabase sends 6-digit OTP to newEmail

[Client] ──> POST /api/user/verify-email { newEmail, token }
               │
               └──> userController.verifyUserEmailChange()
                      ├── Verify OTP: userSupabase.auth.verifyOtp({ email: newEmail, token, type: "email_change" })
                      └── Update DB: prisma.user.update({ where: { id: user.id }, data: { email: newEmail } })
```

---

## 4. States & Data Models

### Database Schema (`public.users` in Prisma)
```prisma
model User {
  id                     String                @id @default(uuid())
  role                   UserRole              @default(STUDENT)
  name                   String
  email                  String?               @unique
  totalXp                Int                   @default(0) @map("total_xp")
  totalGold              Int                   @default(0) @map("total_gold")
  isHidden               Boolean               @default(false) @map("is_hidden")
  profileImgUrl          String?               @map("profile_img_url")
  currentStreak          Int                   @default(0) @map("current_streak")
  highestStreak          Int                   @default(0) @map("highest_streak")
  lastTestPassedAt       DateTime?             @map("last_test_passed_at")
  currentTierIndex       Int                   @default(1) @map("current_tier_index")
  isVerified             Boolean               @default(false) @map("is_verified")
  isPrivate              Boolean               @default(false) @map("is_private")
  allowFollow            Boolean               @default(true) @map("allow_follow")
  allowFriendRequest     Boolean               @default(true) @map("allow_friend_request")
  isPro                  Boolean?              @default(false) @map("is_pro")
  proExpiresAt           DateTime?             @map("pro_expires_at") @db.Timestamptz(6)

  tier                   Tier                  @relation(fields: [currentTierIndex], references: [index])

  @@map("users")
}
```

### JWT Payload Structure (Supabase Issued)
```json
{
  "sub": "user-uuid-v4",
  "email": "student@example.com",
  "role": "authenticated",
  "aal": "aal1",
  "exp": 1754321000,
  "iat": 1754317400
}
```

---

## 5. Version Log

| Version | Date | Description |
|---|---|---|
| 1.0 | 2026-08-04 | Initial documentation of Express/Supabase auth architecture, backend handlers, trigger mechanisms, and security audit. |

---

## 6. Known Logic & Operational Issues

### High Severity Issues

1. **Facebook Placeholder Email Lockout & Protocol Violation**
   - **Location:** [authService.ts](../../apps/express-server/src/services/authService.ts#L87)
   - **Flaw:** Accounts without a Facebook email receive `fb_{id}@facebook.placeholder`.
   - **Impact:** Violates the single email identity rule if placeholder emails collide or are edited. Users with placeholder emails can never receive OTPs for password resets, email updates, or transactional emails.

2. **Passwordless Social Accounts & Password Change Lockout**
   - **Location:** [userController.ts](../../apps/express-server/src/controllers/userController.ts#L276-L282)
   - **Flaw:** Accounts registered solely via Google or Facebook have no password set in Supabase Auth.
   - **Impact:** `changeUserPassword` enforces `supabase.auth.signInWithPassword({ email, password: currentPassword })`. Social users trying to create or change a password will always fail with "Mật khẩu cũ không đúng".

3. **Email Case-Sensitivity & Normalization Mismatch**
   - **Location:** [userController.ts](../../apps/express-server/src/controllers/userController.ts#L152-L161), [schema.prisma](../../packages/shared/prisma/schema.prisma)
   - **Flaw:** Supabase Auth normalizes emails to lowercase, but PostgreSQL `@unique` on `public.users.email` is case-sensitive string matching. Gmail dots (`john.doe@gmail.com` vs `johndoe@gmail.com`) are also unhandled.
   - **Impact:** Direct queries looking up `User@Domain.com` miss records, uniqueness pre-checks in profile update fail, and duplicate email attempts trigger `P2002` Prisma crashes.

4. **`prisma.user.isVerified` Field Sync [FIXED]**
   - **Location:** [authController.ts](../../apps/express-server/src/controllers/authController.ts#L224-L246)
   - **Status:** Fixed. `verifyOtp`, `verifyGoogleSession`, and `verifyFacebookSession` now set `isVerified: true` in `public.users` upon successful token verification.

### Medium Severity Issues

1. **Email Change DB & Auth Sync Desync**
   - **Location:** [userController.ts](../../apps/express-server/src/controllers/userController.ts#L363-L475)
   - **Flaw:** `updateUserEmail` triggers Supabase email update, but `verifyUserEmailChange` only updates `prisma.user` after OTP submission. If Supabase email confirmation settings require confirming old + new email, `auth.users` and `public.users` become out of sync.

---

## 7. Maintenance & Development Checklist

### Critical Checks for Auth Modifications
- **Email Normalization:** Enforce `.toLowerCase().trim()` on all email fields before DB queries or Supabase API calls.
- **Prisma Schema Sync:** Run `npx prisma generate --schema=./prisma/schema.prisma` inside `packages/shared` whenever updating the `User` schema.

