import { Button } from "@/components/ui/button";
import { sanitizeRedirectPath } from "@/lib/auth/safe-redirect";

interface GoogleSignInButtonProps {
    redirectTo?: string;
    label?: string;
}

export function GoogleSignInButton({
    redirectTo,
    label = "Continue with Google",
}: GoogleSignInButtonProps) {
    const safeRedirect = sanitizeRedirectPath(redirectTo);
    const href = `/auth/social?provider=google&redirectTo=${encodeURIComponent(safeRedirect)}`;

    return (
        <Button asChild className="w-full" size="lg">
            <a href={href}>{label}</a>
        </Button>
    );
}
