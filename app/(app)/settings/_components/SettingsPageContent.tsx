import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SURFACE_CLASS } from "@/lib/ui/surface";
import { cn } from "@/lib/utils";
import type { SettingsStub } from "@/lib/stubs";
import { DeleteAccountDialog } from "./DeleteAccountDialog";
import { ProfileEditForm } from "./ProfileEditForm";

export function SettingsPageContent({
    settings,
    mutationsEnabled,
}: {
    settings: SettingsStub;
    mutationsEnabled: boolean;
}) {
    const isOwner = settings.profile.role === "Owner";

    return (
        <div className="space-y-8 py-6">
            <section className={cn(SURFACE_CLASS, "space-y-4 p-4")}>
                <div className="flex items-start gap-3">
                    <Avatar className="h-12 w-12 border">
                        <AvatarFallback>
                            {getInitials(settings.profile.name)}
                        </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-x-3">
                            <h2 className="text-lg font-semibold text-foreground">
                                {settings.profile.name}
                            </h2>
                            <div className="flex flex-wrap gap-1.5">
                                <Badge variant="outline">
                                    {settings.profile.role}
                                </Badge>
                                <Badge variant="secondary">
                                    Last login{" "}
                                    {new Date(
                                        settings.profile.lastLoginAt,
                                    ).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                    })}
                                </Badge>
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {settings.profile.email}
                        </p>
                    </div>
                </div>
            </section>

            <ProfileEditForm
                displayName={settings.profile.name}
                email={settings.profile.email}
                workspaceName={settings.profile.workspaceName ?? ""}
                isOwner={isOwner}
                mutationsEnabled={mutationsEnabled}
            />

            <section className={cn(SURFACE_CLASS, "space-y-4 p-4")}>
                <div className="space-y-1">
                    <p className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
                        Session
                    </p>
                    <h2 className="text-lg font-semibold text-foreground">
                        Sign out
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        End your current session on this device.
                    </p>
                </div>
                <Button asChild variant="outline">
                    <Link href="/auth/logout">Sign out</Link>
                </Button>
            </section>

            {isOwner ? (
                <DeleteAccountDialog mutationsEnabled={mutationsEnabled} />
            ) : null}
        </div>
    );
}

function getInitials(name: string) {
    return name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
}
