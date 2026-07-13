// types/auth.ts
// Use a lightweight local `UserRole` union to avoid brittle imports from the generated Prisma client
// during typechecking across package boundaries.
export type UserRole = "STUDENT" | "ADMIN" | "SUPER_ADMIN";


export interface RegisterRequestBody {
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
}

export interface LoginRequestBody {
    email?: string;
    password?: string;
}

export interface RegisterCredentials {
    email: string;
    password: string;
    name: string;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface VerifyOtpRequestBody {
    email?: string;
    token?: string; // This handles the 6-digit code string
}

export interface VerifyOtpCredentials {
    email: string;
    token: string;
}

export interface AuthenticatedUserPayload {
    id: string;
    email: string;
    name: string;
    role: UserRole; // Enforces 'STUDENT' | 'ADMIN' perfectly
    totalGold: number;
    totalXp: number;
    accessToken?: string; // Optional, included in login/register responses
    refreshToken?: string; // Optional, included in login/register responses
}
// The machine-readable error format for your frontend interceptors
export type AuthErrorCode = "TOKEN_EXPIRED" | "TOKEN_INVALID" | "TOKEN_MISSING";

export interface ApiAuthErrorResponse {
    error: string;
    code: AuthErrorCode;
}

// Request structure sent by React Native
export interface RefreshTokenRequestBody {
    refreshToken: string;
}

// Response structure returned by your backend pass-through
export interface RefreshTokenResponse {
    accessToken: string;
    refreshToken: string;
}

export type RefreshTokenResponseBody =
    | RefreshTokenResponse
    | ApiAuthErrorResponse
    | { error: string }; // Fallback generic error structure

// Slim, Supabase-agnostic session token shape for the client to store
export interface SessionTokens {
    accessToken: string;
    refreshToken: string;
    expiresAt: number; // Unix epoch seconds
}

// --- POST /auth/register ---
export interface RegisterSuccessResponse {
    message: string;
    user: { id: string; email: string | null };
    session: SessionTokens | null;
}

export type RegisterResponseBody = RegisterSuccessResponse | { error: string };

// Shared profile shape returned by login, verify-otp, and GET /user/profile
// Matches the "student" branch of GET /user/profile (with tier info)
export interface UserProfileSummary {
    id: string;
    name: string;
    email: string | null;
    totalXp: number;
    totalGold: number;
    profileImgUrl: string | null;
    currentStreak: number;
    tierName: string | null;
    badgeImgUrl: string | null;
    equippedFrameUrl?: string | null;
    role?: UserRole;
    isPro?: boolean;
    proExpiresAt?: string | null;
}

// --- POST /auth/login ---
export interface LoginSuccessResponse {
    status: "success";
    message: string;
    session: SessionTokens;
    profile: UserProfileSummary;
}

export interface LoginRequiresVerificationResponse {
    status: "requires_verification";
    error: string;
    requiresVerification: true;
}

export interface LoginFailureResponse {
    status: "error";
    error: string;
}

// Your final unified response body type
export type LoginResponseBody =
    | LoginSuccessResponse
    | LoginRequiresVerificationResponse
    | LoginFailureResponse;

// --- POST /auth/verify-otp ---
export interface VerifyOtpSuccessResponse {
    message: string;
    session: SessionTokens;
    profile: UserProfileSummary;
}

export type VerifyOtpResponseBody =
    | VerifyOtpSuccessResponse
    | { error: string };

// --- POST /auth/resend-otp ---
export interface ResendOtpRequestBody {
    email: string;
}

export interface ResendOtpSuccessResponse {
    status: "success";
    message: string;
}

export interface ResendOtpFailureResponse {
    status: "error";
    error: string;
}

// Unified strict type for the response body
export type ResendOtpResponseBody =
    | ResendOtpSuccessResponse
    | ResendOtpFailureResponse;
