import Link from "next/link";

import { Button } from "@/components/ui/button";

function getErrorContent(error: string | null, message: string | null) {
    switch (error) {
        case "account_deleted":
            return {
                title: "Account deleted",
                description:
                    message ??
                    "This account was previously deleted. Please contact support if you would like to restore your account.",
            };
        case "duplicate_user":
            return {
                title: "Account already exists",
                description:
                    message ??
                    "An account with this identity already exists. Try signing in instead.",
            };
        case "init_account_failed":
            return {
                title: "Could not create account",
                description:
                    message ??
                    "We could not finish setting up your account. Please try again.",
            };
        default:
            return {
                title: "Authentication error",
                description:
                    message ??
                    "There was a problem during sign in. Please try again.",
            };
    }
}

export default async function AuthErrorPage({
    searchParams,
}: {
    searchParams: Promise<{ error?: string; message?: string }>;
}) {
    const params = await searchParams;
    const errorContent = getErrorContent(
        params.error ?? null,
        params.message ?? null,
    );

    return (
        <div className="space-y-6 text-center">
            <div className="space-y-2">
                <h1 className="text-2xl font-semibold tracking-tight text-destructive">
                    {errorContent.title}
                </h1>
                <p className="text-sm text-muted-foreground">
                    {errorContent.description}
                </p>
            </div>

            <Button asChild className="w-full">
                <Link href="/auth/login">Return to sign in</Link>
            </Button>

            <Link
                href="/"
                className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
                Back to home
            </Link>
        </div>
    );
}
