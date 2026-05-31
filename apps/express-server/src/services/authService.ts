// services/authService.ts
import { supabase } from "../config/supabaseClient";
import { AuthResponse } from "@supabase/supabase-js";
import {
    RegisterCredentials,
    LoginCredentials,
    VerifyOtpCredentials,
} from "@history-app/shared";

export class AuthService {
    /**
     * Registers a brand new user session with Supabase Auth
     */
    async signUpUser(credentials: RegisterCredentials): Promise<AuthResponse> {
        const { email, password, name } = credentials;

        return await supabase.auth.signUp({
            email,
            password,
            options: {
                // Stashing the name in raw metadata so the DB trigger can grab it
                data: { name },
            },
        });
    }

    /**
     * Authenticates an existing user and returns JWT sessions
     */
    async signInUser(credentials: LoginCredentials): Promise<AuthResponse> {
        const { email, password } = credentials;

        return await supabase.auth.signInWithPassword({
            email,
            password,
        });
    }

    /**
     * Verifies the 6-digit signup token and activates the account
     */
    async verifyOtpToken(
        credentials: VerifyOtpCredentials,
    ): Promise<AuthResponse> {
        const { email, token } = credentials;

        return await supabase.auth.verifyOtp({
            email,
            token,
            type: "email", // Dictates we are validating a standard signup email token
        });
    }
}
