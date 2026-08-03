import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SURFACE_CLASS, SURFACE_CLASS_NESTED } from "@/lib/ui/surface";
import { cn } from "@/lib/utils";
import type { SettingsStub } from "@/lib/stubs";
import { MoveRight, Send, TriangleAlert } from "lucide-react";

export function SettingsPageContent({
    settings,
}: {
    settings: SettingsStub;
}) {
    const scopeMapping = settings.scopeMapping;
    const hasValidationErrors = scopeMapping.topValidationErrors.length > 0;
    const capabilityPreview = settings.capabilities.slice(0, 4);

    return (
        <div className="space-y-12 py-6">
            <section className={cn(SURFACE_CLASS, "space-y-6 p-4")}>
                <div className="space-y-2">
                    <p className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
                        Workspace admin
                    </p>
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
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                    <div className={cn(SURFACE_CLASS_NESTED, "space-y-1.5 p-4")}>
                        <p className="text-sm text-muted-foreground">
                            Team members
                        </p>
                        <p className="text-3xl font-semibold">
                            {settings.team.length}
                        </p>
                    </div>
                    <div className={cn(SURFACE_CLASS_NESTED, "space-y-1.5 p-4")}>
                        <p className="text-sm text-muted-foreground">
                            Permission groups
                        </p>
                        <p className="text-3xl font-semibold">
                            {settings.capabilities.length}
                        </p>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                        <h3 className="font-medium text-foreground">Team</h3>
                        <Button variant="outline" size="sm">
                            Invite teammate
                            <Send />
                        </Button>
                    </div>
                    <div className="space-y-1.5">
                        {settings.team.map((member) => (
                            <div
                                key={member.id}
                                className={cn(
                                    SURFACE_CLASS_NESTED,
                                    "flex items-center justify-between gap-3 p-4",
                                )}
                            >
                                <div>
                                    <p className="font-medium text-foreground">
                                        {member.name}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {member.email}
                                    </p>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <Badge variant="outline">
                                        {member.role}
                                    </Badge>
                                    <Badge variant="secondary">
                                        {member.status}
                                    </Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className={cn(SURFACE_CLASS, "space-y-5 p-4")}>
                <div className="space-y-2">
                    <p className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
                        Scope mapping
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-semibold text-foreground">
                            Scope mapping baseline
                        </h2>
                        <Badge
                            variant="outline"
                            className={
                                scopeMapping.mappingStatus === "invalid"
                                    ? "border-amber-300/70 text-amber-700 dark:text-amber-400"
                                    : "border-emerald-300/70 text-emerald-700 dark:text-emerald-400"
                            }
                        >
                            Scope mapping: {scopeMapping.mappingStatus}
                        </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        {scopeMapping.mappingStatus === "invalid"
                            ? "Resolve the top validation errors before treating readiness interpretation as enabled."
                            : "No blocking validation errors are currently detected."}
                    </p>
                </div>

                {hasValidationErrors ? (
                    <div className="space-y-3">
                        <h3 className="font-medium text-foreground">
                            Top validation errors
                        </h3>
                        <div className="space-y-2">
                            {scopeMapping.topValidationErrors.map((error) => (
                                <div
                                    key={error.id}
                                    className={cn(
                                        SURFACE_CLASS_NESTED,
                                        "space-y-2 p-4",
                                    )}
                                >
                                    <div className="flex items-start gap-2">
                                        <TriangleAlert className="mt-0.5 size-4 text-amber-600" />
                                        <div className="space-y-1">
                                            <p className="font-medium text-foreground">
                                                {error.title}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {error.detail}
                                            </p>
                                        </div>
                                    </div>
                                    <Button asChild variant="outline" size="sm">
                                        <Link href={error.remediation.href}>
                                            {error.remediation.label}
                                            <MoveRight className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : null}
            </section>

            <section className={cn(SURFACE_CLASS, "space-y-5 p-4")}>
                <div className="space-y-2">
                    <p className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
                        Permissions
                    </p>
                    <h2 className="text-lg font-semibold text-foreground">
                        Capability preview
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Review the permissions this workspace role set currently
                        unlocks. Controls stay inspection-only in this branch.
                    </p>
                </div>
                <div className="space-y-2">
                    {capabilityPreview.map((capability) => (
                        <div
                            key={capability.name}
                            className={cn(SURFACE_CLASS_NESTED, "space-y-1 p-4")}
                        >
                            <p className="font-medium text-foreground">
                                {capability.name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {capability.description}
                            </p>
                        </div>
                    ))}
                </div>
                <Button variant="outline" size="sm">
                    Review role permissions
                    <MoveRight />
                </Button>
            </section>
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
