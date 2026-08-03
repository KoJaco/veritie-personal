import { redirect, type LoaderFunctionArgs } from "react-router";
import { type EmailOtpType } from "@supabase/supabase-js";

export function resolvePostAuthRedirect(
    next: string | null,
    requestUrl: URL,
) {
    const fallback = "/dashboard";

    if (!next) {
        return fallback;
    }

    try {
        const resolved = new URL(next, requestUrl.origin);

        if (resolved.origin !== requestUrl.origin) {
            return fallback;
        }

        if (
            resolved.pathname === "/auth/confirm" ||
            resolved.pathname === "/auth/callback"
        ) {
            return fallback;
        }

        return `${resolved.pathname}${resolved.search}${resolved.hash}`;
    } catch {
        return fallback;
    }
}

export async function loader({ request }: LoaderFunctionArgs) {
    const { logger } = await import("~/lib/logging.server");
    const { createAuthSupabaseClient } =
        await import("~/lib/auth/utils.server");
    const { reconcileEmailVerificationState } = await import(
        "~/lib/auth/verification.server"
    );
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get("code"); // PKCE flow
    const token_hash = requestUrl.searchParams.get("token_hash"); // OTP flow
    const type = requestUrl.searchParams.get("type") as EmailOtpType | null;
    const next = resolvePostAuthRedirect(
        requestUrl.searchParams.get("next"),
        requestUrl,
    );

    const { supabase, headers } = await createAuthSupabaseClient(request);

    let data: { user: any; session: any } | null = null;
    let error: any = null;

    // Handle PKCE flow (code parameter)
    if (code) {
        logger.debug("Email confirmation: PKCE flow detected", { code });
        const exchangeResult = await supabase.auth.exchangeCodeForSession(code);
        data = exchangeResult.data;
        error = exchangeResult.error;
    }
    // Handle OTP flow (token_hash parameter)
    else if (token_hash && type) {
        logger.debug("Email confirmation: OTP flow detected", {
            token_hash,
            type,
        });
        const otpResult = await supabase.auth.verifyOtp({
            type,
            token_hash,
        });
        data = otpResult.data;
        error = otpResult.error;
    }
    // Neither flow detected - invalid request
    else {
        return redirect(
            "/auth/error?error=invalid_token&message=Invalid or missing verification token"
        );
    }

    if (error || !data?.user) {
        // Redirect to error page with specific error information
        const errorParams = new URLSearchParams({
            error: "verification_failed",
            message: error?.message || "Email verification failed",
        });
        return redirect(`/auth/error?${errorParams.toString()}`, { headers });
    }

    try {
        await reconcileEmailVerificationState({
            authUser: data.user,
        });
    } catch (dbError) {
        // Log error but continue - Supabase auth succeeded
        const { logError } = await import("~/lib/logging.server");
        logError(dbError, "Database error during email verification", {
            userId: data.user.id,
        });
        // Still redirect since Supabase auth succeeded
    }

    return redirect(next, { headers });
}
