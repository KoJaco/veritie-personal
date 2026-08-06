import "server-only";

import { createClient } from "@supabase/supabase-js";

import { envPublic } from "@/lib/config/env.public";
import { envServer } from "@/lib/config/env.server";

export function createAdminClient() {
    const url = envPublic.supabaseUrl;
    const serviceKey = envServer.supabaseSecretKey;

    if (!url || !serviceKey) {
        throw new Error(
            "Supabase admin client requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY",
        );
    }

    return createClient(url, serviceKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        },
    });
}
