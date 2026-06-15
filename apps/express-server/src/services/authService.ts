// services/authService.ts
import { supabase } from "../config/supabaseClient";
import { AuthResponse } from "@supabase/supabase-js";
import {
    RegisterCredentials,
    LoginCredentials,
    VerifyOtpCredentials,
    prisma,
} from "@history-app/shared";

// config/supabaseClient.ts
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabasePublishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error(
        "Missing Supabase environment variables inside Express backend config.",
    );
}

const userSupabaseClient = async (
    accessToken?: string,
    refreshToken?: string,
) => {
    if (!accessToken) {
        throw new Error("Access token is required.");
    }

    const uSupabaseClient = createClient(supabaseUrl, supabasePublishableKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        },
    });

    await uSupabaseClient.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken || "iyl7y35cbakb",
    });

    return uSupabaseClient;
};

const exchangeGoogleIdToken = async (idToken: string) => {
        const uSupabaseClient = createClient(
            supabaseUrl,
            supabasePublishableKey,
            {
                auth: {
                    persistSession: false,
                    autoRefreshToken: false,
                },
            },
        );

        // Exchange the token and directly capture the resulting user and session
        const { data, error } = await uSupabaseClient.auth.signInWithIdToken({
            provider: "google",
            token: idToken,
        });

        if (error) throw error;

        return {
            user: data.user,
            session: data.session, // This contains the real Supabase access_token and refresh_token!
        };
    };

const exchangeFacebookAccessToken = async (accessToken: string) => {
    const uSupabaseClient = createClient(
        supabaseUrl,
        supabasePublishableKey,
        {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
            },
        },
    );

    const { data, error } = await uSupabaseClient.auth.signInWithIdToken({
        provider: "facebook",
        token: accessToken,
    });

    if (error) throw error;

    return {
        user: data.user,
        session: data.session,
    };
};

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

    async refreshUserSession(refreshToken: string) {
        const { data, error } = await supabase.auth.refreshSession({
            refresh_token: refreshToken,
        });
        return { data, error };
    }

    async resendSignUpOtp(email: string) {
        return await supabase.auth.resend({
            type: "signup",
            email: email,
            options: {
                // Optional: If you ever want to redirect them to a specific site page after clicking a link
                // redirectTo: 'https://your-app.com/welcome'
            },
        });
    }

    async updateUserData(userId: string, data: any) {
        if (data.name) {
            // prisma
            const user = await prisma.user.update({
                where: { id: userId },
                data: { name: data.name },
            });
            return user;
        }
    }

    async updateUserPassword(
        accessToken: string,
        oldPassword: string,
        newPassword: string,
    ) {
        const uSupabaseClient = await userSupabaseClient(accessToken);
        const { data, error } = await uSupabaseClient.auth.updateUser({
            password: newPassword,

            current_password: oldPassword,
        });
        return { data, error };
    }

    async updateUserEmail(accessToken: string, newEmail: string) {
        const uSupabaseClient = await userSupabaseClient(accessToken);
        const { data, error } = await uSupabaseClient.auth.updateUser({
            email: newEmail,
        });
        return { data, error };
    }

    

    async getUserViaGoogleToken(idToken: string) {
        try {
            // Call the new dedicated helper
            const { user, session } = await exchangeGoogleIdToken(idToken);

            return {
                data: { user, session },
                error: null,
            };
        } catch (error: any) {
            return {
                data: { user: null, session: null },
                error: error,
            };
        }
    }

    async getUserViaFacebookToken(accessToken: string) {
        try {
            const { user, session } = await exchangeFacebookAccessToken(accessToken);

            return {
                data: { user, session },
                error: null,
            };
        } catch (error: any) {
            return {
                data: { user: null, session: null },
                error: error,
            };
        }
    }
}
