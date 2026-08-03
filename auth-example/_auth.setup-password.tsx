import {
    Link,
    redirect,
    type ActionFunctionArgs,
    type LoaderFunctionArgs,
} from "react-router";
import { Form, useActionData, useLoaderData } from "react-router";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Container } from "~/components/ui/container";
import { useState } from "react";
import { SURFACE_CLASS } from "~/lib/ui/surface";
import { cn } from "~/lib/utils";

export async function loader({ request }: LoaderFunctionArgs) {
    const { getCsrfTokenWithHeaders } = await import("~/lib/csrf.server");
    const { getAppShortName } = await import("~/lib/branding.server");
    const { createAuthSupabaseClient } =
        await import("~/lib/auth/utils.server");
    const { supabase, headers } = await createAuthSupabaseClient(request);

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return redirect("/login");
    }

    // Check if user already has a password set
    if (user.user_metadata?.password_set) {
        return redirect("/dashboard");
    }

    const { token: csrfToken, headers: csrfHeaders } =
        await getCsrfTokenWithHeaders(request);
    return {
        user: {
            email: user.email,
            id: user.id,
        },
        status: 200,
        error: "",
        csrfToken,
        appName: getAppShortName(),
        headers: csrfHeaders,
    };
}

export async function action({ request }: ActionFunctionArgs) {
    const { createAuthSupabaseClient } =
        await import("~/lib/auth/utils.server");
    const { createErrorResponse, mapAuthError } =
        await import("~/lib/auth/errors.server");
    const { requireCsrfToken } = await import("~/lib/csrf.server");
    const { setupPasswordSchema, safeValidateFormData } =
        await import("~/lib/auth/validation.server");

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
    const validation = safeValidateFormData(setupPasswordSchema, formData);
    if (!validation.success) {
        return createErrorResponse(validation.error, 400, headers);
    }

    const { password } = validation.data;

    try {
        const { error } = await supabase.auth.updateUser({
            password,
            data: { password_set: true },
        });

        if (error) {
            return createErrorResponse(mapAuthError(error), 400, headers);
        }

        return redirect("/dashboard", { headers });
    } catch (err) {
        return createErrorResponse(
            "Failed to set password. Please try again.",
            500,
            headers,
        );
    }
}

export default function SetupPassword() {
    const loaderData = useLoaderData<typeof loader>();
    const { user } = loaderData;
    const actionData = useActionData<typeof action>();
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div className="flex min-h-screen flex-col">
            <main className="flex flex-1 items-center justify-center">
                <Container>
                    <div
                        className={cn(
                            SURFACE_CLASS,
                            "space-y-6 py-6 lg:px-6 sm:max-w-[440px]",
                        )}
                    >
                        <div className="text-center">
                            <h2 className="text-2xl font-bold">
                                Set Up Your Password
                            </h2>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Welcome! Please create a password for your
                                account: <strong>{user.email}</strong>
                            </p>
                        </div>

                        <Form method="post" className="space-y-4">
                            <input
                                type="hidden"
                                name="csrf_token"
                                value={loaderData.csrfToken}
                            />
                            <div>
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    required
                                    minLength={8}
                                    className="mt-1"
                                />
                            </div>

                            <div>
                                <Label htmlFor="confirmPassword">
                                    Confirm Password
                                </Label>
                                <Input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type={showPassword ? "text" : "password"}
                                    required
                                    minLength={8}
                                    className="mt-1"
                                />
                            </div>

                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="showPassword"
                                    checked={showPassword}
                                    onChange={(e) =>
                                        setShowPassword(e.target.checked)
                                    }
                                    className="rounded border-input"
                                />
                                <Label
                                    htmlFor="showPassword"
                                    className="text-sm"
                                >
                                    Show password
                                </Label>
                            </div>

                            {actionData?.error && (
                                <div className="rounded-md bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive">
                                    <p>{actionData.error}</p>
                                </div>
                            )}

                            <Button type="submit" className="w-full">
                                Set Password & Continue
                            </Button>
                        </Form>

                        <div className="text-xs text-muted-foreground text-center">
                            <p>
                                Your password must be at least 8 characters long
                                and will be used to access your account.
                            </p>
                        </div>
                    </div>
                </Container>
            </main>
        </div>
    );
}
