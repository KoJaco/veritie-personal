import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function getSupabaseEnv(): { url: string; publishableKey: string } | null {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const publishableKey =
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
        process.env.SUPABASE_PUBLISHABLE_KEY ??
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !publishableKey) {
        return null;
    }
    return { url, publishableKey };
}

/**
 * Refreshes the Supabase auth session and returns a response with updated cookies.
 * Call from middleware on every matched request.
 */
export async function updateSession(request: NextRequest) {
    const env = getSupabaseEnv();
    let supabaseResponse = NextResponse.next({
        request,
    });

    if (!env) {
        return supabaseResponse;
    }

    const supabase = createServerClient(env.url, env.publishableKey, {
        cookies: {
            getAll() {
                return request.cookies.getAll();
            },
            setAll(cookiesToSet) {
                cookiesToSet.forEach(({ name, value }) => {
                    request.cookies.set(name, value);
                });
                supabaseResponse = NextResponse.next({
                    request,
                });
                cookiesToSet.forEach(({ name, value, options }) => {
                    supabaseResponse.cookies.set(name, value, options);
                });
            },
        },
    });

    await supabase.auth.getUser();

    return supabaseResponse;
}
