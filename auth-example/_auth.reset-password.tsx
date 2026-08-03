import {
    Form,
    Link,
    useActionData,
    useLoaderData,
    redirect,
    type ActionFunctionArgs,
    type LoaderFunctionArgs,
} from "react-router";
import { Button } from "~/components/ui/button";
import { Container } from "~/components/ui/container";
import { Fader } from "~/components/fader";
import { ErrorAlert } from "~/components/ui/error-alert";
import { SURFACE_CLASS, SURFACE_CLASS_NESTED } from "~/lib/ui/surface";
import { cn } from "~/lib/utils";

export async function loader({ request }: LoaderFunctionArgs) {
    const { createAuthSupabaseClient } =
        await import("~/lib/auth/utils.server");
    const { getCsrfTokenWithHeaders } = await import("~/lib/csrf.server");
    const { getAppShortName } = await import("~/lib/branding.server");

    const { supabase, headers } = await createAuthSupabaseClient(request);

    // Check for existing session
    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return redirect("/auth/forgot-password");
    }

    // Check if user is soft-deleted before allowing access to reset password page
    try {
        const { db } = await import("~/lib/db/index.server");
        const { users } = await import("~/lib/db/schema");
        const { eq } = await import("drizzle-orm");

        const existingUser = await db.query.users.findFirst({
            where: eq(users.id, user.id),
        });

        if (existingUser && existingUser.deletedAt !== null) {
            // User is soft-deleted - sign them out and redirect
            await supabase.auth.signOut();
            return redirect("/auth/forgot-password");
        }
    } catch (dbError: unknown) {
        // Log error but continue - don't block the flow
        const { logError } = await import("~/lib/logging.server");
        logError(
            dbError instanceof Error ? dbError : new Error(String(dbError)),
            "Error checking user deletion status in reset-password loader",
        );
    }

    const { token: csrfToken, headers: csrfHeaders } =
        await getCsrfTokenWithHeaders(request);
    return {
        status: 200,
        error: "",
        csrfToken,
        appName: getAppShortName(),
        headers: csrfHeaders,
    };
}

export async function action({ request }: ActionFunctionArgs) {
    const { checkRateLimit, rateLimitPresets, createRateLimitError } =
        await import("~/lib/rate-limit.server");
    const { requireCsrfToken } = await import("~/lib/csrf.server");
    const { createAuthSupabaseClient } =
        await import("~/lib/auth/utils.server");
    const { createErrorResponse, mapAuthError } =
        await import("~/lib/auth/errors.server");
    const { resetPasswordSchema, safeValidateFormData } =
        await import("~/lib/auth/validation.server");

    // Check rate limit
    const rateLimitResult = await checkRateLimit(
        request,
        rateLimitPresets.passwordReset,
    );
    if (!rateLimitResult.allowed) {
        const { error, status, headers } =
            createRateLimitError(rateLimitResult);
        return createErrorResponse(error, status, headers);
    }

    // Validate CSRF token
    try {
        await requireCsrfToken(request);
    } catch (error) {
        if (error instanceof Response) {
            return createErrorResponse(
                "Invalid CSRF token",
                403,
                new Headers(),
            );
        }
        throw error;
    }

    const formData = await request.formData();
    const { supabase, headers } = await createAuthSupabaseClient(request);

    // Validate input
    const validation = safeValidateFormData(resetPasswordSchema, formData);
    if (!validation.success) {
        return createErrorResponse(validation.error, 400, headers);
    }

    const { password } = validation.data;

    // Get the current session
    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return createErrorResponse(
            "Invalid or expired reset link",
            400,
            headers,
        );
    }

    // Check if user is soft-deleted before allowing password reset
    try {
        const { db } = await import("~/lib/db/index.server");
        const { users } = await import("~/lib/db/schema");
        const { eq } = await import("drizzle-orm");

        const existingUser = await db.query.users.findFirst({
            where: eq(users.id, user.id),
        });

        if (existingUser && existingUser.deletedAt !== null) {
            // User is soft-deleted - sign them out and prevent password reset
            await supabase.auth.signOut();
            return createErrorResponse(
                "This account was previously deleted. Please contact support if you would like to restore your account.",
                403,
                headers,
            );
        }
    } catch (dbError: unknown) {
        const { mapDatabaseError } = await import("~/lib/auth/errors.server");
        return createErrorResponse(mapDatabaseError(dbError), 500, headers);
    }

    // Update the password
    const { error } = await supabase.auth.updateUser({
        password,
    });

    if (error) {
        return createErrorResponse(mapAuthError(error), 400, headers);
    }

    return redirect("/login?message=password-reset-success", { headers });
}

export default function ResetPassword() {
    const actionData = useActionData<typeof action>();
    const loaderData = useLoaderData<typeof loader>();

    return (
        <div className="flex min-h-screen flex-col relative isolate">
            <div className="absolute inset-x-0 left-0 top-1/2 -z-10 transform-gpu overflow-hidden opacity-30 blur-3xl">
                <div className="ml-[max(0%,0rem)] aspect-[1313/771] w-[32.0625rem] bg-gradient-to-tr from-primary to-primary/50 opacity-10"></div>
            </div>
            <main className="flex flex-1 items-center justify-center px-4">
                <Container>
                    <Fader
                        className={cn(
                            SURFACE_CLASS,
                            "space-y-6 py-6 lg:px-6 sm:max-w-[440px]sm:w-[440px]",
                        )}
                    >
                        <div className="text-center">
                            <h2 className="text-2xl font-bold">
                                Choose a new password
                            </h2>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Set a secure password for your JobRef account.
                            </p>
                        </div>

                        <div
                            className={cn(SURFACE_CLASS_NESTED, "text-sm p-4")}
                        >
                            <p className="font-medium mb-2">
                                Password requirements
                            </p>
                            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                                <li>At least 8 characters long</li>
                                <li>Contains at least one letter</li>
                                <li>Contains at least one number</li>
                            </ul>
                        </div>

                        <Form method="post" className="space-y-4">
                            <input
                                type="hidden"
                                name="csrf_token"
                                value={loaderData.csrfToken}
                            />
                            <div>
                                <label
                                    htmlFor="password"
                                    className="block text-sm font-medium"
                                >
                                    New password
                                </label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="new-password"
                                    required
                                    minLength={8}
                                    className="mt-1 block w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="confirmPassword"
                                    className="block text-sm font-medium"
                                >
                                    Confirm password
                                </label>
                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    autoComplete="new-password"
                                    required
                                    minLength={8}
                                    className="mt-1 block w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                />
                            </div>

                            {actionData &&
                                typeof actionData === "object" &&
                                "error" in actionData &&
                                typeof actionData.error === "string" &&
                                actionData.error && (
                                    <ErrorAlert
                                        title="Reset Error"
                                        message={actionData.error}
                                    />
                                )}

                            <Button type="submit" className="w-full">
                                Reset password
                            </Button>
                        </Form>

                        <div className="text-center text-sm">
                            <Link
                                to="/login"
                                className="text-primary hover:underline"
                            >
                                Back to login
                            </Link>
                        </div>
                    </Fader>
                </Container>
            </main>
        </div>
    );
}
