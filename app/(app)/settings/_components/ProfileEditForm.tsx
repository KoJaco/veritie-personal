"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateProfileAction } from "@/lib/actions/settings-mutations";
import { SURFACE_CLASS } from "@/lib/ui/surface";
import { cn } from "@/lib/utils";

interface ProfileEditFormProps {
    displayName: string;
    email: string;
    workspaceName?: string;
    isOwner: boolean;
    mutationsEnabled: boolean;
}

export function ProfileEditForm({
    displayName,
    email,
    workspaceName = "",
    isOwner,
    mutationsEnabled,
}: ProfileEditFormProps) {
    const router = useRouter();
    const [name, setName] = useState(displayName);
    const [workspace, setWorkspace] = useState(workspaceName);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const submit = async () => {
        if (!mutationsEnabled) {
            return;
        }

        setIsSubmitting(true);
        try {
            const result = await updateProfileAction({
                displayName: name,
                workspaceName: isOwner ? workspace : undefined,
            });

            if (!result.ok) {
                toast.error(result.error);
                return;
            }

            toast.success("Profile updated");
            router.refresh();
        } catch {
            toast.error("Could not update profile");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <section className={cn(SURFACE_CLASS, "space-y-5 p-4")}>
            <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
                    Profile
                </p>
                <h2 className="text-lg font-semibold text-foreground">
                    Account details
                </h2>
                <p className="text-sm text-muted-foreground">
                    Your Google email is managed by sign-in. Update how your name
                    appears in the app.
                </p>
            </div>

            <div className="space-y-4 max-w-lg">
                <div className="space-y-2">
                    <label
                        className="text-sm font-medium"
                        htmlFor="settings-email"
                    >
                        Email
                    </label>
                    <Input
                        id="settings-email"
                        value={email}
                        readOnly
                        disabled
                    />
                </div>

                <div className="space-y-2">
                    <label
                        className="text-sm font-medium"
                        htmlFor="settings-display-name"
                    >
                        Display name
                    </label>
                    <Input
                        id="settings-display-name"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        disabled={!mutationsEnabled || isSubmitting}
                        maxLength={128}
                    />
                </div>

                {isOwner ? (
                    <div className="space-y-2">
                        <label
                            className="text-sm font-medium"
                            htmlFor="settings-workspace-name"
                        >
                            Workspace name
                        </label>
                        <Input
                            id="settings-workspace-name"
                            value={workspace}
                            onChange={(event) => setWorkspace(event.target.value)}
                            disabled={!mutationsEnabled || isSubmitting}
                            maxLength={128}
                        />
                    </div>
                ) : null}

                {!mutationsEnabled ? (
                    <p className="text-sm text-muted-foreground">
                        Account changes require database-backed mode.
                    </p>
                ) : null}

                <Button
                    type="button"
                    onClick={submit}
                    disabled={!mutationsEnabled || isSubmitting}
                >
                    {isSubmitting ? "Saving…" : "Save changes"}
                </Button>
            </div>
        </section>
    );
}
