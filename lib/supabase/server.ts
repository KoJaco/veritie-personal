import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { envPublic } from "@/lib/config/env.public";
import { envServer } from "@/lib/config/env.server";

export async function createClient() {
    const url = envPublic.supabaseUrl;
    const publishableKey =
        envPublic.supabasePublishableKey ?? envServer.supabasePublishableKey;

    if (!url || !publishableKey) {
        throw new Error(
            "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or SUPABASE_PUBLISHABLE_KEY on server).",
        );
    }

    const cookieStore = await cookies();

    return createServerClient(url, publishableKey, {
        cookies: {
            getAll() {
                return cookieStore.getAll();
            },
            setAll(cookiesToSet) {
                try {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        cookieStore.set(name, value, options);
                    });
                } catch {
                    // setAll from Server Component — proxy.ts refreshes session cookies
                }
            },
        },
    });
}
