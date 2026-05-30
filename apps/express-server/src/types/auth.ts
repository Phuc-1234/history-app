// types/auth.ts

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