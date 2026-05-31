// types/auth.ts
import { UserRole } from "@prisma/client";

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
}
// The machine-readable error format for your frontend interceptors
export type AuthErrorCode = 'TOKEN_EXPIRED' | 'TOKEN_INVALID' | 'TOKEN_MISSING';

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
    user: { id: string; email: string };
    session: SessionTokens | null;
}

export type RegisterResponseBody =
    | RegisterSuccessResponse
    | { error: string };

// Shared profile shape returned by login, verify-otp, and GET /user/profile
// Matches the "student" branch of GET /user/profile (with tier info)
export interface UserProfileSummary {
    id: string;
    name: string;
    totalXp: number;
    totalGold: number;
    profileImgUrl: string | null;
    currentStreak: number;
    tierName: string | null;
    badgeImgUrl: string | null;
}

// --- POST /auth/login ---
export interface LoginSuccessResponse {
    message: string;
    session: SessionTokens;
    profile: UserProfileSummary;
}

export type LoginResponseBody =
    | LoginSuccessResponse
    | { error: string };

// --- POST /auth/verify-otp ---
export interface VerifyOtpSuccessResponse {
    message: string;
    session: SessionTokens;
    profile: UserProfileSummary;
}

export type VerifyOtpResponseBody =
    | VerifyOtpSuccessResponse
    | { error: string };