import { redirect, type LoaderFunctionArgs } from "react-router";

import { users } from "~/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * OAuth Callback Handler
 *
 * Handles OAuth provider callbacks (Google, etc.) by exchanging PKCE code for session.
 * Automatically creates user accounts in our database for new social auth users.
 * For password recovery, use /auth/password-recovery instead.
 */
export async function loader({ request }: LoaderFunctionArgs) {
    const { db } = await import("~/lib/db/index.server");
    const { createAuthSupabaseClient } =
        await import("~/lib/auth/utils.server");
    const { mapDatabaseError } = await import("~/lib/auth/errors.server");
    const { logger } = await import("~/lib/logging.server");
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get("code");
    const next = requestUrl.searchParams.get("next") || "/dashboard";

    logger.debug("URL Search Params after callback: ", {
        code,
        next,
    });

    if (!code) {
        return redirect("/auth/error");
    }

    const { supabase, headers } = await createAuthSupabaseClient(request);

    try {
        const { data, error } =
            await supabase.auth.exchangeCodeForSession(code);

        logger.debug("OAuth callback data: ", data);

        if (error) {
            logger.debug("OAuth callback error: ", {
                message: error.message,
                code: error.status,
            });
        }

        if (error || !data.session) {
            return redirect("/auth/error", { headers });
        }

        // Get the user from the session
        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
            return redirect("/auth/error", { headers });
        }

        try {
            // Validate user email exists before proceeding
            if (!user.email) {
                throw new Error("User email is required but not provided");
            }

            const userEmail = user.email;

            // Check if user exists in our database
            const existingUser = await db.query.users.findFirst({
                where: eq(users.id, user.id),
            });

            if (!existingUser) {
                // Auto-create account for social auth users (whether from login or signup)
                try {
                    const emailPrefix = userEmail.split("@")[0];
                    const accountName =
                        emailPrefix
                            .toLowerCase()
                            .replace(/[^a-z0-9-]/g, "-")
                            .replace(/-+/g, "-")
                            .replace(/^-|-$/g, "")
                            .slice(0, 50) || "user";

                    const provider = user.app_metadata.provider || "email";
                    const providerId =
                        user.app_metadata.provider_id || userEmail;

                    const { createAccountWithUser } =
                        await import("~/lib/auth/utils.server");

                    const { user: createdUser } = await createAccountWithUser(
                        accountName,
                        user.id,
                        userEmail,
                        provider,
                        providerId,
                        true // email is verified for social auth
                    );

                    void createdUser;
                } catch (dbError) {
                    // Log error and redirect to error page
                    const { logError } = await import("~/lib/logging.server");
                    const errorMessage = mapDatabaseError(dbError);
                    logError(
                        dbError instanceof Error
                            ? dbError
                            : new Error(String(dbError)),
                        "Failed to create user account in database after OAuth callback",
                        {
                            userId: user.id,
                            email: user.email,
                            errorMessage,
                        }
                    );
                    await supabase.auth.signOut();
                    return redirect("/auth/error", { headers });
                }
            } else if (existingUser.deletedAt !== null) {
                // Check if user is soft-deleted
                await supabase.auth.signOut();
                return redirect(
                    "/auth/error?error=account_deleted&message=This account was previously deleted. Please contact support if you would like to restore your account.",
                    { headers }
                );
            }
        } catch (dbError) {
            // Log error and redirect to error page
            const { logError } = await import("~/lib/logging.server");
            const errorMessage = mapDatabaseError(dbError);
            const errorCause =
                dbError &&
                typeof dbError === "object" &&
                "cause" in dbError &&
                (dbError as { cause?: unknown }).cause
                    ? (dbError as { cause: { message?: string; code?: string } })
                          .cause
                    : undefined;
            logError(
                dbError instanceof Error ? dbError : new Error(String(dbError)),
                "Failed to check user account in database after OAuth callback",
                {
                    userId: user.id,
                    email: user.email,
                    errorMessage,
                    dbCauseCode: errorCause?.code,
                    dbCauseMessage: errorCause?.message,
                }
            );
            await supabase.auth.signOut();
            return redirect("/auth/error", { headers });
        }

        return redirect(next, { headers });
    } catch (error) {
        return redirect("/auth/error", { headers });
    }
}
