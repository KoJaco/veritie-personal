"use client";

import { useState } from "react";

import { updateCaptureContextAction } from "@/lib/actions/settings-mutations";
import { CAPTURE_LOCATION_LABEL_MAX_LENGTH } from "@/lib/capture/capture-context-schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SURFACE_CLASS } from "@/lib/ui/surface";
import { cn } from "@/lib/utils";

export function CaptureContextForm({
    captureLocationLabel,
    mutationsEnabled,
}: {
    captureLocationLabel: string;
    mutationsEnabled: boolean;
}) {
    const [value, setValue] = useState(captureLocationLabel);
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [saved, setSaved] = useState(false);

    const handleSave = async () => {
        setError(null);
        setSaved(false);
        if (!mutationsEnabled) {
            return;
        }

        setPending(true);
        const result = await updateCaptureContextAction({
            captureLocationLabel: value,
        });
        setPending(false);

        if (!result.ok) {
            setError(result.error);
            return;
        }

        setSaved(true);
    };

    return (
        <section className={cn(SURFACE_CLASS, "space-y-4 p-4")}>
            <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
                    Voice logs
                </p>
                <h2 className="text-lg font-semibold text-foreground">
                    Capture context
                </h2>
                <p className="text-sm text-muted-foreground">
                    Optional default location sent with voice captures as
                    context for transcription and extraction.
                </p>
            </div>
            <div className="space-y-2">
                <Label htmlFor="capture-location-label">
                    Default location label
                </Label>
                <Input
                    id="capture-location-label"
                    type="text"
                    maxLength={CAPTURE_LOCATION_LABEL_MAX_LENGTH}
                    placeholder="e.g. Sydney"
                    value={value}
                    disabled={!mutationsEnabled || pending}
                    onChange={(event) => {
                        setValue(event.target.value);
                        setSaved(false);
                    }}
                />
                <p className="text-xs text-muted-foreground">
                    Leave blank to omit location from capture metadata.
                </p>
            </div>
            <div className="flex items-center gap-3">
                <Button
                    type="button"
                    variant="outline"
                    disabled={!mutationsEnabled || pending}
                    onClick={() => void handleSave()}
                >
                    {pending ? "Saving…" : "Save location"}
                </Button>
                {saved ? (
                    <span className="text-sm text-muted-foreground">Saved</span>
                ) : null}
            </div>
            {error ? (
                <p className="text-sm text-destructive">{error}</p>
            ) : null}
        </section>
    );
}
