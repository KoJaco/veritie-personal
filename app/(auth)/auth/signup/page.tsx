import { redirect } from "next/navigation";

import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { DEFAULT_AUTH_REDIRECT } from "@/lib/auth/safe-redirect";
import { getStubServerBootstrap } from "@/lib/onboarding-stub/server";

export default async function SignupPage() {
    const bootstrap = await getStubServerBootstrap();

    if (!bootstrap.onboardingCompleted) {
        redirect("/onboarding");
    }

    return (
        <div className="space-y-6">
            <div className="space-y-2 text-center">
                <h1 className="text-2xl font-semibold tracking-tight">
                    Create your account
                </h1>
                <p className="text-sm text-muted-foreground">
                    Your personal setup is ready. Sign up with Google to open
                    your workspace.
                </p>
            </div>

            <GoogleSignInButton
                redirectTo={DEFAULT_AUTH_REDIRECT}
                label="Sign up with Google"
            />
        </div>
    );
}
