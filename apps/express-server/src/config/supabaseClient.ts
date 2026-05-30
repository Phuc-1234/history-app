// config/supabaseClient.ts
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
        "Missing Supabase environment variables inside Express backend config.",
    );
}

// Explicitly type the instantiated client
export const supabase: SupabaseClient = createClient(
    supabaseUrl,
    supabaseServiceKey,
    {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        },
    },
);
