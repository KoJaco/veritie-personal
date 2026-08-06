import { createBrowserClient } from "@supabase/ssr";

import { envPublic } from "@/lib/config/env.public";

export function createClient() {
    const url = envPublic.supabaseUrl;
    const publishableKey = envPublic.supabasePublishableKey;

    if (!url || !publishableKey) {
        throw new Error(
            "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
        );
    }

    return createBrowserClient(url, publishableKey);
}
