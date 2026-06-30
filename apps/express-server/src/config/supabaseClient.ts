// config/supabaseClient.ts
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "node:path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config();

export const supabaseUrl = process.env.SUPABASE_URL?.replace(/^"|"$/g, "");
export const supabasePublishableKey = process.env.SUPABASE_PUBLISHABLE_KEY?.replace(/^"|"$/g, "");
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.replace(/^"|"$/g, "");

if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error(
        "Missing Supabase environment variables (URL or Publishable Key) inside Express backend config.",
    );
}

console.log("[Supabase Client Config] URL:", supabaseUrl);
console.log("[Supabase Client Config] Publishable Key:", supabasePublishableKey.substring(0, 15) + "..." + supabasePublishableKey.slice(-5));

// 1. Client for user authentication operations (requires Anon / Publishable key)
export const supabase: SupabaseClient = createClient(
    supabaseUrl,
    supabasePublishableKey,
    {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        },
    },
);

// 2. Client for administrative actions (requires Service Role / Secret key)
// Note: If service key is invalid, some admin operations may fail, but user-scoped client is preferred.
export const supabaseAdmin: SupabaseClient = createClient(
    supabaseUrl,
    supabaseServiceKey || "fallback",
    {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        },
    },
);

// 3. Helper to create a user-scoped client using their own access token
export const getSupabaseUserClient = (accessToken: string): SupabaseClient => {
    return createClient(supabaseUrl, supabasePublishableKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        },
        global: {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        },
    });
};
