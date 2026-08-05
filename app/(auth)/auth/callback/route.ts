import { NextResponse, type NextRequest } from "next/server";

import {
    DeletedAccountError,
    DuplicateUserError,
    InitAccountError,
} from "@/lib/auth/errors";
import {
    deriveAccountNameFromEmail,
    findAppUserByAuthId,
    initAccountWithUser,
    isAccountDeleted,
    isUserDeleted,
} from "@/lib/auth/init-account";
import { getOnboardingProfileForInit } from "@/lib/auth/onboarding-profile";
import { sanitizeRedirectPath } from "@/lib/auth/safe-redirect";
import { createClient } from "@/lib/supabase/server";

function buildErrorRedirect(
    request: NextRequest,
    error: string,
    message?: string,
): NextResponse {
    const url = new URL("/auth/error", request.url);
    url.searchParams.set("error", error);
    if (message) {
        url.searchParams.set("message", message);
    }
    return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get("code");
    const next = sanitizeRedirectPath(requestUrl.searchParams.get("next"));

    if (!code) {
        return NextResponse.redirect(new URL("/auth/error", request.url));
    }

    const supabase = await createClient();

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error || !data.session) {
        return NextResponse.redirect(new URL("/auth/error", request.url));
    }

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return NextResponse.redirect(new URL("/auth/error", request.url));
    }

    if (!user.email) {
        await supabase.auth.signOut();
        return buildErrorRedirect(
            request,
            "init_account_failed",
            "User email is required but was not provided.",
        );
    }

    try {
        const existingUser = await findAppUserByAuthId(user.id);

        if (!existingUser) {
            const provider =
                (user.app_metadata?.provider as string | undefined) ?? "google";
            const providerId =
                (user.app_metadata?.provider_id as string | undefined) ??
                user.id;
            const onboardingProfile = await getOnboardingProfileForInit();

            await initAccountWithUser({
                authUserId: user.id,
                email: user.email,
                provider,
                providerId,
                emailVerified: true,
                accountName: deriveAccountNameFromEmail(user.email),
                onboardingProfile,
            });
        } else if (
            isUserDeleted(existingUser) ||
            isAccountDeleted(existingUser.account)
        ) {
            await supabase.auth.signOut();
            return buildErrorRedirect(
                request,
                "account_deleted",
                "This account was previously deleted. Please contact support if you would like to restore your account.",
            );
        }
    } catch (dbError) {
        await supabase.auth.signOut();

        if (dbError instanceof DeletedAccountError) {
            return buildErrorRedirect(request, "account_deleted", dbError.message);
        }

        if (dbError instanceof DuplicateUserError) {
            return buildErrorRedirect(request, "duplicate_user", dbError.message);
        }

        if (dbError instanceof InitAccountError) {
            return buildErrorRedirect(
                request,
                "init_account_failed",
                dbError.message,
            );
        }

        return buildErrorRedirect(
            request,
            "init_account_failed",
            "Failed to initialize your account.",
        );
    }

    return NextResponse.redirect(new URL(next, request.url));
}
