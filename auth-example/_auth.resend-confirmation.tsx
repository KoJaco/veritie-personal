import {
    Form,
    Link,
    useActionData,
    useLoaderData,
    useSearchParams,
    type ActionFunctionArgs,
    type LoaderFunctionArgs,
} from "react-router";
import { Button } from "~/components/ui/button";
import { Container } from "~/components/ui/container";
import { Fader } from "~/components/fader";
import { ErrorAlert } from "~/components/ui/error-alert";
import { SURFACE_CLASS, SURFACE_CLASS_NESTED } from "~/lib/ui/surface";
import { cn } from "~/lib/utils";

export async function action({ request }: ActionFunctionArgs) {
    const { checkRateLimit, createRateLimitError, rateLimitPresets } =
        await import("~/lib/rate-limit.server");
    const { createAuthSupabaseClient } =
        await import("~/lib/auth/utils.server");
    const { createErrorResponse, mapAuthError } =
        await import("~/lib/auth/errors.server");
    const { logger } = await import("~/lib/logging.server");
    const { requireCsrfToken } = await import("~/lib/csrf.server");
    const { safeValidateFormData, resendConfirmationSchema } =
        await import("~/lib/auth/validation.server");
    const { serverConfig } = await import("~/lib/config.server");

    // Check rate limit
    const rateLimitResult = await checkRateLimit(
        request,
        rateLimitPresets.resendConfirmation,
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
    const validation = safeValidateFormData(resendConfirmationSchema, formData);
    if (!validation.success) {
        return createErrorResponse(validation.error, 400, headers);
    }

    const { email } = validation.data;

    const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: {
            emailRedirectTo: `${serverConfig.APP_URL}/auth/confirm?next=/dashboard`,
        },
    });

    if (error) {
        logger.warn("Confirmation email resend failed", {
            email,
            message: error.message,
            status: (error as any).status,
            code: (error as any).code,
        });
        return createErrorResponse(mapAuthError(error), 400, headers);
    }

    logger.info("Confirmation email resend accepted by Supabase", {
        email,
    });

    return {
        error: "",
        status: 200,
        headers,
    };
}

export async function loader({ request }: LoaderFunctionArgs) {
    const { getCsrfTokenWithHeaders } = await import("~/lib/csrf.server");

    const { token, headers } = await getCsrfTokenWithHeaders(request);

    return { csrfToken: token, headers };
}

export default function ResendConfirmation() {
    const actionData = useActionData<typeof action>();
    const loaderData = useLoaderData<typeof loader>();
    const [searchParams] = useSearchParams();
    const emailFromQuery = searchParams.get("email") || "";

    return (
        <div className="flex min-h-screen flex-col relative isolate">
            <div className="absolute inset-x-0 left-0 top-1/2 -z-10 transform-gpu overflow-hidden opacity-30 blur-3xl">
                <div className="ml-[max(0%,0rem)] aspect-[1313/771] w-[32.0625rem] bg-gradient-to-tr from-primary to-primary/50 opacity-10"></div>
            </div>
            <main className="flex flex-1 items-center justify-center">
                <Container>
                    <Fader
                        className={cn(
                            SURFACE_CLASS,
                            "space-y-6 py-6 lg:px-6 sm:max-w-[440px]",
                        )}
                    >
                        <div className="text-center">
                            <h2 className="text-2xl font-bold">
                                Resend your confirmation email
                            </h2>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Enter the email for your JobRef account and
                                we'll send a fresh confirmation link.
                            </p>
                        </div>

                        {actionData?.status === 200 && (
                            <div
                                className={cn(SURFACE_CLASS_NESTED, "text-sm")}
                            >
                                <p className="font-medium text-emerald-700 dark:text-emerald-200">
                                    Confirmation email sent
                                </p>
                                <p className="mt-1 text-emerald-700/90 dark:text-emerald-200/90">
                                    Check your inbox for a new JobRef
                                    confirmation link.
                                </p>
                            </div>
                        )}

                        <Form method="post" className="space-y-4">
                            <input
                                type="hidden"
                                name="csrf_token"
                                value={loaderData.csrfToken}
                            />
                            <div>
                                <label
                                    htmlFor="email"
                                    className="block text-sm font-medium"
                                >
                                    Email address
                                </label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    defaultValue={emailFromQuery}
                                    className="mt-1 block w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                />
                            </div>

                            {actionData?.error && (
                                <ErrorAlert
                                    title="Resend Error"
                                    message={actionData.error}
                                />
                            )}

                            <Button type="submit" className="w-full">
                                Resend confirmation email
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
