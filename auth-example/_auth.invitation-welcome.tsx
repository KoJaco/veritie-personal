import { Link, useSearchParams } from "react-router";
import { Button } from "~/components/ui/button";
import { Container } from "~/components/ui/container";
import { Fader } from "~/components/fader";
import { CheckCircle } from "lucide-react";
import { SURFACE_CLASS, SURFACE_CLASS_NESTED } from "~/lib/ui/surface";
import { cn } from "~/lib/utils";

export default function InvitationWelcome() {
    const [searchParams] = useSearchParams();
    const accountName = searchParams.get("account") || "your account";
    const roleName = searchParams.get("role") || "team member";

    return (
        <div className="flex min-h-screen flex-col relative isolate">
            <div className="absolute inset-x-0 top-1/2 -z-10 -translate-y-1/2 transform-gpu overflow-hidden opacity-30 blur-3xl">
                <div className="ml-[max(50%,38rem)] md:ml-[max(25%,38rem)] aspect-[1313/771] w-[82.0625rem] bg-gradient-to-tr from-primary to-primary/50 opacity-30"></div>
            </div>
            <main className="flex flex-1 items-center justify-center">
                <Container>
                    <Fader
                        className={cn(
                            SURFACE_CLASS,
                            "space-y-6 py-6 lg:px-6 sm:max-w-[440px]",
                        )}
                    >
                        <div className="flex justify-center">
                            <CheckCircle className="w-16 h-16 text-emerald-600" />
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold text-foreground">
                                Welcome to the team!
                            </h2>
                            <p className="mt-2 text-sm text-muted-foreground">
                                You've successfully joined{" "}
                                <span className="font-medium text-foreground">
                                    JobRef
                                </span>{" "}
                                and accepted the invitation to join{" "}
                                <span className="font-medium text-foreground">
                                    {accountName}
                                </span>{" "}
                                as a{" "}
                                <span className="font-medium text-foreground">
                                    {roleName}
                                </span>
                                .
                            </p>
                        </div>

                        <div className={cn(SURFACE_CLASS_NESTED, "text-sm")}>
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 mt-0.5">
                                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                                </div>
                                <div className="flex-1 text-left">
                                    <p className="font-medium text-emerald-700 dark:text-emerald-300">
                                        Access granted
                                    </p>
                                    <p className="mt-1 text-emerald-600 dark:text-emerald-400">
                                        Your JobRef account is ready and your
                                        dashboard access is active.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Button asChild className="w-full">
                                <Link to="/dashboard">Go to Dashboard</Link>
                            </Button>

                            <Button
                                variant="outline"
                                asChild
                                className="w-full"
                            >
                                <Link to="/dashboard/account">
                                    Review account settings
                                </Link>
                            </Button>
                        </div>
                    </Fader>
                </Container>
            </main>
        </div>
    );
}
