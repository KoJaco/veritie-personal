"use client";

import { useState } from "react";

import { updateVoiceLogBehaviorAction } from "@/lib/actions/settings-mutations";
import { SURFACE_CLASS } from "@/lib/ui/surface";
import { cn } from "@/lib/utils";

export function VoiceLogBehaviorForm({
    saveVoiceLogAudio,
    mutationsEnabled,
}: {
    saveVoiceLogAudio: boolean;
    mutationsEnabled: boolean;
}) {
    const [enabled, setEnabled] = useState(saveVoiceLogAudio);
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleToggle = async () => {
        const next = !enabled;
        setEnabled(next);
        setError(null);
        if (!mutationsEnabled) {
            return;
        }

        setPending(true);
        const result = await updateVoiceLogBehaviorAction({
            saveVoiceLogAudio: next,
        });
        setPending(false);

        if (!result.ok) {
            setEnabled(!next);
            setError(result.error);
        }
    };

    return (
        <section className={cn(SURFACE_CLASS, "space-y-4 p-4")}>
            <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
                    Voice logs
                </p>
                <h2 className="text-lg font-semibold text-foreground">
                    Capture behavior
                </h2>
                <p className="text-sm text-muted-foreground">
                    Control whether recorded audio is stored in your private
                    workspace storage for playback.
                </p>
            </div>
            <div className="flex items-start gap-3">
                <input
                    id="save-voice-log-audio"
                    type="checkbox"
                    className="mt-1 size-4 rounded border border-input"
                    checked={enabled}
                    disabled={!mutationsEnabled || pending}
                    onChange={() => void handleToggle()}
                />
                <label
                    htmlFor="save-voice-log-audio"
                    className="text-sm leading-6"
                >
                    Save voice log audio to my workspace
                </label>
            </div>
            {error ? (
                <p className="text-sm text-destructive">{error}</p>
            ) : null}
        </section>
    );
}
