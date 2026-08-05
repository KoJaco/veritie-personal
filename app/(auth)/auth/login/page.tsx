import Link from "next/link";

import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { sanitizeRedirectPath } from "@/lib/auth/safe-redirect";

export default async function LoginPage({
    searchParams,
}: {
    searchParams: Promise<{ next?: string }>;
}) {
    const params = await searchParams;
    const redirectTo = sanitizeRedirectPath(params.next);

    return (
        <div className="space-y-6">
            <div className="space-y-2 text-center">
                <h1 className="text-2xl font-semibold tracking-tight">
                    Sign in
                </h1>
                <p className="text-sm text-muted-foreground">
                    Continue with Google to access your workspace.
                </p>
            </div>

            <GoogleSignInButton redirectTo={redirectTo} label="Sign in with Google" />

            <p className="text-center text-sm text-muted-foreground">
                New here?{" "}
                <Link
                    href="/onboarding"
                    className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                    Start onboarding
                </Link>
            </p>
        </div>
    );
}
