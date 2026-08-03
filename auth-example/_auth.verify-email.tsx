import {
    Form,
    Link,
    useLoaderData,
    useNavigation,
    type LoaderFunctionArgs,
} from "react-router";
import { Button } from "~/components/ui/button";
import { Loader2 } from "lucide-react";
import { Container } from "~/components/ui/container";
import { Fader } from "~/components/fader";
import { SURFACE_CLASS, SURFACE_CLASS_NESTED } from "~/lib/ui/surface";
import { cn } from "~/lib/utils";

export async function loader({ request }: LoaderFunctionArgs) {
    const { createAuthSupabaseClient } =
        await import("~/lib/auth/utils.server");
    const { getCsrfTokenWithHeaders } = await import("~/lib/csrf.server");
    const { db } = await import("~/lib/db/index.server");
    const { users } = await import("~/lib/db/schema");
    const { eq } = await import("drizzle-orm");
    const { reconcileEmailVerificationState } = await import(
        "~/lib/auth/verification.server"
    );
    const { supabase, headers } = await createAuthSupabaseClient(request);

    const {
        data: { user },
        error,
    } = await supabase.auth.getUser();

    if (error || !user) {
        return Response.json({
            error: "No user found",
            isVerified: false,
            status: 401,
            csrfToken: "",
        }, { status: 401, headers });
    }

    const { token: csrfToken, headers: csrfHeaders } =
        await getCsrfTokenWithHeaders(request);
    const dbUser = await db.query.users.findFirst({
        where: eq(users.id, user.id),
    });
    const verificationState = await reconcileEmailVerificationState({
        authUser: user,
        databaseEmailVerified: dbUser?.emailVerified,
    });

    return Response.json(
        {
            email: user.email,
            isVerified: verificationState.effectiveEmailVerified,
            status: 200,
            error: "",
            csrfToken,
        },
        { headers: csrfHeaders },
    );
}

export default function VerifyEmail() {
    const { email, isVerified, error, csrfToken } =
        useLoaderData<typeof loader>();
    const navigation = useNavigation();
    const isSubmitting = navigation.state === "submitting";

    if (error) {
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
                                "space-y-6 py-6 lg:px-6 w-full sm:min-w-[400px] sm:max-w-[440px]",
                            )}
                        >
                            <div className="text-center">
                                <h1 className="text-2xl font-bold">
                                    Verification unavailable
                                </h1>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    {error}
                                </p>
                            </div>
                            <div className="text-center">
                                <Link
                                    to="/login"
                                    className="text-sm text-primary hover:underline"
                                >
                                    Return to login
                                </Link>
                            </div>
                        </Fader>
                    </Container>
                </main>
            </div>
        );
    }

    if (isVerified) {
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
                                "space-y-6 py-6 lg:px-6 w-full sm:min-w-[400px] sm:max-w-[440px]",
                            )}
                        >
                            <div className="text-center">
                                <h1 className="text-2xl font-bold">
                                    Email verified
                                </h1>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    Your JobRef email is confirmed and your
                                    account is ready to use.
                                </p>
                            </div>
                            <div className={cn(SURFACE_CLASS_NESTED, "text-sm text-center")}>
                                You can continue straight to the dashboard.
                            </div>
                            <div className="text-center">
                                <Link
                                    to="/dashboard"
                                    className="text-sm text-primary hover:underline"
                                >
                                    Go to dashboard
                                </Link>
                            </div>
                        </Fader>
                    </Container>
                </main>
            </div>
        );
    }

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
                            "space-y-6 py-6 lg:px-6 w-full sm:min-w-[400px] sm:max-w-[440px]",
                        )}
                    >
                        <div className="text-center">
                            <h1 className="text-2xl font-bold">
                                Verify your email
                            </h1>
                            <p className="mt-2 text-sm text-muted-foreground">
                                We sent a confirmation link to{" "}
                                <span className="font-medium text-foreground">
                                    {email}
                                </span>
                                . Open it to finish setting up JobRef.
                            </p>
                        </div>

                        <div className={cn(SURFACE_CLASS_NESTED, "text-sm text-center")}>
                            If nothing shows up, resend the confirmation email
                            below.
                        </div>

                        <Form
                            method="post"
                            action="/auth/resend-confirmation"
                            className="space-y-4"
                        >
                            <input
                                type="hidden"
                                name="csrf_token"
                                value={csrfToken}
                            />
                            <input type="hidden" name="email" value={email} />
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    "Resend verification email"
                                )}
                            </Button>
                        </Form>

                        <div className="text-center text-sm">
                            <span className="text-muted-foreground">
                                Already verified?{" "}
                            </span>
                            <Link
                                to="/login"
                                className="font-medium text-primary hover:underline"
                            >
                                Sign in
                            </Link>
                        </div>
                    </Fader>
                </Container>
            </main>
        </div>
    );
}
