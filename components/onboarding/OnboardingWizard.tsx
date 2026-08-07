"use client";

import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
    DEFAULT_CLIENT_STATE,
    ONBOARDING_AI_MODE_OPTIONS,
    ONBOARDING_ASPECT_OPTIONS,
    ONBOARDING_CAPTURE_PREFERENCE_OPTIONS,
    buildBootstrapSummary,
} from "@/lib/onboarding-stub/state";
import {
    loadClientDraftState,
    persistClientDraftState,
    persistOnboardingCompletion,
} from "@/lib/onboarding-stub/client";
import type {
    OnboardingAiMode,
    OnboardingCapturePreference,
    PersonalFocusAspect,
    StubOnboardingClientState,
} from "@/lib/onboarding-stub";
import { SURFACE_CLASS, SURFACE_CLASS_NESTED } from "@/lib/ui/surface";

const STEP_META = [
    {
        id: 1,
        label: "Life areas",
        title: "Which areas matter most?",
        description: "Choose the aspects you want to track and filter by.",
    },
    {
        id: 2,
        label: "Capture style",
        title: "How do you want to capture?",
        description: "Set your default capture preference and assistant tone.",
    },
    {
        id: 3,
        label: "Review",
        title: "Review",
        description: "Confirm your personal setup before opening the app.",
    },
] as const;

export function OnboardingWizard() {
    const router = useRouter();
    const [state, setState] = useState<StubOnboardingClientState>(
        DEFAULT_CLIENT_STATE,
    );
    const hydratedRef = useRef(false);

    useEffect(() => {
        const draft = loadClientDraftState();
        startTransition(() => {
            setState(draft);
            hydratedRef.current = true;
        });
    }, []);

    useEffect(() => {
        if (!hydratedRef.current) return;
        persistClientDraftState(state);
    }, [state]);

    const stepMeta = STEP_META[state.step - 1];

    const canContinue = useMemo(() => {
        if (state.step === 1) {
            return state.profile.enabledAspects.length > 0;
        }
        return true;
    }, [state.profile.enabledAspects.length, state.step]);

    const toggleAspect = (aspect: PersonalFocusAspect) => {
        setState((current) => {
            const enabled = current.profile.enabledAspects.includes(aspect)
                ? current.profile.enabledAspects.filter((a) => a !== aspect)
                : [...current.profile.enabledAspects, aspect];
            return {
                ...current,
                profile: { ...current.profile, enabledAspects: enabled },
            };
        });
    };

    const finish = () => {
        const summary = buildBootstrapSummary(state.profile);
        persistOnboardingCompletion(summary);
        router.push("/auth/signup");
    };

    return (
        <div className="mx-auto w-full max-w-2xl space-y-8">
            <div className="space-y-2 text-center">
                <p className="text-sm uppercase tracking-[0.28em] text-muted-foreground">
                    Personal setup
                </p>
                <h1 className="text-2xl font-semibold tracking-tight">
                    {stepMeta.title}
                </h1>
                <p className="text-sm text-muted-foreground">
                    {stepMeta.description}
                </p>
            </div>

            <div className={cn(SURFACE_CLASS, "p-6 space-y-6")}>
                {state.step === 1 && (
                    <div className="grid gap-3 sm:grid-cols-2">
                        {ONBOARDING_ASPECT_OPTIONS.map((option) => {
                            const selected = state.profile.enabledAspects.includes(
                                option.value,
                            );
                            return (
                                <button
                                    key={option.value}
                                    type="button"
                                    className={cn(
                                        SURFACE_CLASS_NESTED,
                                        "rounded-xl px-4 py-3 text-left transition-colors",
                                        selected && "ring-2 ring-primary",
                                    )}
                                    onClick={() => toggleAspect(option.value)}
                                >
                                    <div className="font-medium">
                                        {option.label}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}

                {state.step === 2 && (
                    <div className="space-y-6">
                        <section className="space-y-3">
                            <p className="text-sm font-medium">Capture preference</p>
                            {ONBOARDING_CAPTURE_PREFERENCE_OPTIONS.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    className={cn(
                                        SURFACE_CLASS_NESTED,
                                        "w-full rounded-xl px-4 py-3 text-left",
                                        state.profile.capturePreference ===
                                        option.value && "ring-2 ring-primary",
                                    )}
                                    onClick={() =>
                                        setState((current) => ({
                                            ...current,
                                            profile: {
                                                ...current.profile,
                                                capturePreference:
                                                    option.value as OnboardingCapturePreference,
                                            },
                                        }))
                                    }
                                >
                                    <div className="font-medium">{option.label}</div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {option.description}
                                    </p>
                                </button>
                            ))}
                        </section>
                        <section className="space-y-3">
                            <Label>Default location label</Label>
                            <Input
                                type="text"
                                placeholder="e.g. Sydney"
                                maxLength={120}
                                value={state.profile.captureLocationLabel ?? ""}
                                onChange={(event) =>
                                    setState((current) => ({
                                        ...current,
                                        profile: {
                                            ...current.profile,
                                            captureLocationLabel:
                                                event.target.value,
                                        },
                                    }))
                                }
                            />
                            <p className="text-xs text-muted-foreground">
                                Optional context sent with voice captures. Leave
                                blank to omit.
                            </p>
                        </section>
                        <section className="space-y-3">
                            <p className="text-sm font-medium">Voice log audio</p>
                            <button
                                type="button"
                                className={cn(
                                    SURFACE_CLASS_NESTED,
                                    "w-full rounded-xl px-4 py-3 text-left",
                                    state.profile.saveVoiceLogAudio &&
                                    "ring-2 ring-primary",
                                )}
                                onClick={() =>
                                    setState((current) => ({
                                        ...current,
                                        profile: {
                                            ...current.profile,
                                            saveVoiceLogAudio:
                                                !current.profile.saveVoiceLogAudio,
                                        },
                                    }))
                                }
                            >
                                <div className="font-medium">
                                    Save voice log audio
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Store recordings in your private workspace
                                    for playback inside captures.
                                </p>
                            </button>
                        </section>
                        <section className="space-y-3">
                            <p className="text-sm font-medium">Assistant mode</p>
                            {ONBOARDING_AI_MODE_OPTIONS.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    className={cn(
                                        SURFACE_CLASS_NESTED,
                                        "w-full rounded-xl px-4 py-3 text-left",
                                        state.profile.aiMode === option.value &&
                                        "ring-2 ring-primary",
                                    )}
                                    onClick={() =>
                                        setState((current) => ({
                                            ...current,
                                            profile: {
                                                ...current.profile,
                                                aiMode: option.value as OnboardingAiMode,
                                            },
                                        }))
                                    }
                                >
                                    <div className="font-medium">{option.label}</div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {option.description}
                                    </p>
                                </button>
                            ))}
                        </section>
                    </div>
                )}

                {state.step === 3 && (
                    <dl className="space-y-4 text-sm">
                        <div>
                            <dt className="text-muted-foreground">Aspects</dt>
                            <dd className="font-medium">
                                {state.profile.enabledAspects.join(", ")}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-muted-foreground">Capture</dt>
                            <dd className="font-medium">
                                {state.profile.capturePreference}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-muted-foreground">Assistant</dt>
                            <dd className="font-medium">{state.profile.aiMode}</dd>
                        </div>
                        <div>
                            <dt className="text-muted-foreground">Location</dt>
                            <dd className="font-medium">
                                {state.profile.captureLocationLabel?.trim()
                                    ? state.profile.captureLocationLabel
                                    : "Not set"}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-muted-foreground">Save audio</dt>
                            <dd className="font-medium">
                                {state.profile.saveVoiceLogAudio ? "Yes" : "No"}
                            </dd>
                        </div>
                    </dl>
                )}
            </div>

            <div className="flex items-center justify-between gap-4">
                <Button
                    type="button"
                    variant="outline"
                    disabled={state.step === 1}
                    onClick={() =>
                        setState((current) => ({
                            ...current,
                            step: (current.step - 1) as 1 | 2 | 3,
                        }))
                    }
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                </Button>
                {state.step < 3 ? (
                    <Button
                        type="button"
                        disabled={!canContinue}
                        onClick={() =>
                            setState((current) => ({
                                ...current,
                                step: (current.step + 1) as 1 | 2 | 3,
                            }))
                        }
                    >
                        Continue
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                ) : (
                    <Button type="button" onClick={finish}>
                        <Check className="mr-2 h-4 w-4" />
                        Continue to sign up
                    </Button>
                )}
            </div>
        </div>
    );
}
