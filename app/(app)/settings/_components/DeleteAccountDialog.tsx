"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deleteAccountAction } from "@/lib/actions/settings-mutations";
import { DELETE_ACCOUNT_CONFIRMATION } from "@/lib/settings/update-profile-schema";
import { SURFACE_CLASS } from "@/lib/ui/surface";
import { cn } from "@/lib/utils";

interface DeleteAccountDialogProps {
    mutationsEnabled: boolean;
}

export function DeleteAccountDialog({
    mutationsEnabled,
}: DeleteAccountDialogProps) {
    const [open, setOpen] = useState(false);
    const [confirmation, setConfirmation] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const canSubmit =
        mutationsEnabled &&
        confirmation === DELETE_ACCOUNT_CONFIRMATION &&
        !isSubmitting;

    const submit = async () => {
        if (!canSubmit) {
            return;
        }

        setIsSubmitting(true);
        setError(null);

        const result = await deleteAccountAction({ confirmation });
        if (!result.ok) {
            setError(result.error);
            setIsSubmitting(false);
        }
    };

    return (
        <section className={cn(SURFACE_CLASS, "space-y-4 p-4")}>
            <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
                    Danger zone
                </p>
                <h2 className="text-lg font-semibold text-foreground">
                    Delete account
                </h2>
                <p className="text-sm text-muted-foreground">
                    Permanently remove your account and workspace data. This
                    action signs you out and cannot be undone from the app.
                </p>
            </div>

            <Dialog
                open={open}
                onOpenChange={(nextOpen) => {
                    setOpen(nextOpen);
                    if (!nextOpen) {
                        setConfirmation("");
                        setError(null);
                        setIsSubmitting(false);
                    }
                }}
            >
                <DialogTrigger asChild>
                    <Button
                        variant="destructive"
                        disabled={!mutationsEnabled}
                    >
                        Delete account
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete this account?</DialogTitle>
                        <DialogDescription>
                            Type{" "}
                            <span className="font-medium text-foreground">
                                {DELETE_ACCOUNT_CONFIRMATION}
                            </span>
                            to confirm. All users in this workspace will be
                            signed out.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-2">
                        <Label htmlFor="delete-account-confirmation">
                            Confirmation
                        </Label>
                        <Input
                            id="delete-account-confirmation"
                            value={confirmation}
                            onChange={(event) =>
                                setConfirmation(event.target.value)
                            }
                            disabled={isSubmitting}
                            placeholder={DELETE_ACCOUNT_CONFIRMATION}
                        />
                    </div>

                    {error ? (
                        <p className="text-sm text-destructive">{error}</p>
                    ) : null}

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={submit}
                            disabled={!canSubmit}
                        >
                            {isSubmitting ? "Deleting…" : "Delete account"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </section>
    );
}
