// services/authService.ts
import { supabase, supabaseAdmin } from "../config/supabaseClient";
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
    // 1. Fetch user profile info from Facebook Graph API
    const fbRes = await fetch(
        `https://graph.facebook.com/me?fields=id,name,email&access_token=${accessToken}`
    );
    if (!fbRes.ok) {
        const errJson = await fbRes.json().catch(() => ({}));
        throw new Error(errJson?.error?.message || "Failed to verify Facebook access token.");
    }
    const fbData = (await fbRes.json()) as { id: string; name: string; email?: string };

    // 2. Resolve email fallback (Facebook users might not have email enabled)
    const email = fbData.email || `fb_${fbData.id}@facebook.placeholder`;
    const name = fbData.name || "Facebook User";

    // 3. Check if user already registered in DB (syndicated from Supabase)
    const existingDbUser = await prisma.user.findUnique({
        where: { email },
    });

    let user;
    if (existingDbUser) {
        const { data, error } = await supabaseAdmin.auth.admin.getUserById(existingDbUser.id);
        if (error || !data?.user) {
            throw error || new Error("Failed to retrieve existing Supabase user by ID.");
        }
        user = data.user;
    } else {
        const { data, error } = await supabaseAdmin.auth.admin.createUser({
            email,
            email_confirm: true,
            user_metadata: { name },
        });
        if (error || !data?.user) {
            throw error || new Error("Failed to create new user in Supabase.");
        }
        user = data.user;
    }

    // 4. Generate magic link token hash for the target user's email
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email: email,
    });

    if (linkError || !linkData) {
        throw linkError || new Error("Failed to generate authentication link.");
    }

    // 5. Establish a user-scoped session by verifying the token hash
    const { data: sessionData, error: sessionError } = await supabase.auth.verifyOtp({
        token_hash: linkData.properties.hashed_token,
        type: "magiclink",
    });

    if (sessionError || !sessionData) {
        throw sessionError || new Error("Failed to establish Supabase session.");
    }

    return {
        user: sessionData.user,
        session: sessionData.session,
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
