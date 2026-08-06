import { NextResponse, type NextRequest } from "next/server";

import { sanitizeRedirectPath } from "@/lib/auth/safe-redirect";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_PROVIDERS = new Set(["google"]);

export async function GET(request: NextRequest) {
    const url = new URL(request.url);
    const provider = url.searchParams.get("provider");
    const redirectTo = sanitizeRedirectPath(
        url.searchParams.get("redirectTo"),
    );

    if (!provider || !ALLOWED_PROVIDERS.has(provider)) {
        return NextResponse.redirect(new URL("/auth/login", request.url));
    }

    const supabase = await createClient();
    const origin = url.origin;
    const callbackUrl = `${origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`;

    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider as "google",
        options: {
            redirectTo: callbackUrl,
            queryParams: {
                access_type: "offline",
                prompt: "consent",
            },
        },
    });

    if (error || !data.url) {
        return NextResponse.redirect(new URL("/auth/error", request.url));
    }

    return NextResponse.redirect(data.url);
}
