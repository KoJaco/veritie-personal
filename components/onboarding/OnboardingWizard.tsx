"use client";

import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    ArrowRight,
    Check,
    ChevronsUpDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";

import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
    DEFAULT_CLIENT_STATE,
    DEFAULT_ONBOARDING_PROFILE,
    ONBOARDING_AI_MODE_OPTIONS,
    ONBOARDING_COMPANY_SIZE_OPTIONS,
    ONBOARDING_INDUSTRY_OPTIONS,
    ONBOARDING_SENSITIVITY_OPTIONS,
    getIndustryLabel,
} from "@/lib/onboarding-stub";
import {
    loadClientDraftState,
    persistClientDraftState,
    persistOnboardingCompletion,
} from "@/lib/onboarding-stub/client";
import type {
    OnboardingAiMode,
    OnboardingCompanySize,
    OnboardingDataSensitivity,
    OnboardingIndustry,
    StubOnboardingClientState,
    StubOnboardingProfile,
} from "@/lib/onboarding-stub";
import { SURFACE_CLASS, SURFACE_CLASS_NESTED } from "@/lib/ui/surface";

const STEP_META = [
    {
        id: 1,
        label: "Company context",
        title: "Company context",
        description: "Add the basics that shape setup-first guidance.",
    },
    {
        id: 2,
        label: "AI behaviour",
        title: "AI behaviour",
        description: "Choose how opinionated the setup guidance should feel.",
    },
    {
        id: 3,
        label: "Review",
        title: "Review",
        description: "Check your selections before finishing onboarding.",
    },
] as const;

export function OnboardingWizard() {
    const router = useRouter();
    const [state, setState] =
        useState<StubOnboardingClientState>(DEFAULT_CLIENT_STATE);
    const [hydrated, setHydrated] = useState(false);
    const [industryOpen, setIndustryOpen] = useState(false);
    const [animatedHeight, setAnimatedHeight] = useState<number | null>(null);
    const animatedContentRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const draft = loadClientDraftState();
        startTransition(() => {
            setState(draft ?? DEFAULT_CLIENT_STATE);
            setHydrated(true);
        });
    }, []);

    useEffect(() => {
        if (!hydrated) {
            return;
        }

        persistClientDraftState(state);
    }, [hydrated, state]);

    useEffect(() => {
        const node = animatedContentRef.current;
        if (!node) {
            return;
        }

        const updateHeight = () => {
            setAnimatedHeight(node.getBoundingClientRect().height);
        };

        updateHeight();

        const observer = new ResizeObserver(() => {
            updateHeight();
        });

        observer.observe(node);

        return () => {
            observer.disconnect();
        };
    }, [state.step]);

    const currentStepMeta = STEP_META.find((step) => step.id === state.step)!;
    const totalSteps = STEP_META.length;

    const validationMessage = useMemo(() => null, []);

    const updateProfile = (nextProfile: Partial<StubOnboardingProfile>) => {
        setState((current) => ({
            ...current,
            profile: {
                ...current.profile,
                ...nextProfile,
            },
        }));
    };

    const goNext = () => {
        if (validationMessage) {
            return;
        }

        setState((current) => ({
            ...current,
            step: Math.min(
                current.step + 1,
                totalSteps,
            ) as StubOnboardingClientState["step"],
        }));
    };

    const goBack = () => {
        setState((current) => ({
            ...current,
            step: Math.max(
                current.step - 1,
                1,
            ) as StubOnboardingClientState["step"],
        }));
    };

    const completeOnboarding = () => {
        const completedProfile = {
            ...DEFAULT_ONBOARDING_PROFILE,
            ...state.profile,
        };

        persistOnboardingCompletion(completedProfile);
        persistClientDraftState({
            step: 3,
            profile: completedProfile,
            completedProfile,
        });
        router.push("/work");
    };

    return (
        <div
            className={cn(
                "w-full max-w-3xl p-3 lg:p-4 space-y-6 lg:mx-auto mx-2",
                SURFACE_CLASS,
            )}
        >
            <div className="space-y-1.5">
                <p className="text-sm text-foreground/50">
                    Step {state.step} of {totalSteps}
                </p>
                <h1 className="text-2xl">Onboarding</h1>
            </div>

            <div className="space-y-1.5">
                <h2 className="text-lg font-medium">
                    {currentStepMeta.id}. {currentStepMeta.title}
                </h2>
                <p className="text-sm text-muted-foreground">
                    {currentStepMeta.description}
                </p>
            </div>
            <div
                className={cn(
                    "overflow-hidden transition-[height] duration-1000 ease-in-out",
                )}
                style={
                    animatedHeight !== null
                        ? { height: `${animatedHeight}px` }
                        : undefined
                }
            >
                <div
                    key={state.step}
                    ref={animatedContentRef}
                    className="space-y-6 animate-in fade-in-0 duration-1000"
                >
                    {state.step === 1 ? (
                        <section className="grid gap-3 md:grid-cols-2">
                            <Field label="Company size">
                                <Select
                                    value={state.profile.companySize}
                                    onValueChange={(value) =>
                                        updateProfile({
                                            companySize:
                                                value as OnboardingCompanySize,
                                        })
                                    }
                                >
                                    <SelectTrigger className="w-full mb-1.5">
                                        <SelectValue placeholder="Select size" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {ONBOARDING_COMPANY_SIZE_OPTIONS.map(
                                            (option) => (
                                                <SelectItem
                                                    key={option.value}
                                                    value={option.value}
                                                >
                                                    {option.label}
                                                </SelectItem>
                                            ),
                                        )}
                                    </SelectContent>
                                </Select>
                            </Field>

                            <Field label="Industry">
                                <Popover
                                    open={industryOpen}
                                    onOpenChange={setIndustryOpen}
                                >
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="w-full justify-between mb"
                                        >
                                            {ONBOARDING_INDUSTRY_OPTIONS.find(
                                                (option) =>
                                                    option.value ===
                                                    state.profile.industry,
                                            )?.label ?? "Select industry"}
                                            <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent
                                        align="start"
                                        className="min-w-[20rem] w-full p-0"
                                    >
                                        <Command>
                                            <CommandInput placeholder="Search industry" />
                                            <CommandList>
                                                <CommandEmpty>
                                                    No industry found.
                                                </CommandEmpty>
                                                <CommandGroup>
                                                    {ONBOARDING_INDUSTRY_OPTIONS.map(
                                                        (option) => (
                                                            <CommandItem
                                                                key={
                                                                    option.value
                                                                }
                                                                value={
                                                                    option.label
                                                                }
                                                                onSelect={() => {
                                                                    updateProfile(
                                                                        {
                                                                            industry:
                                                                                option.value as OnboardingIndustry,
                                                                        },
                                                                    );
                                                                    setIndustryOpen(
                                                                        false,
                                                                    );
                                                                }}
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        "mr-2 h-4 w-4",
                                                                        option.value ===
                                                                            state
                                                                                .profile
                                                                                .industry
                                                                            ? "opacity-100"
                                                                            : "opacity-0",
                                                                    )}
                                                                />
                                                                {option.label}
                                                            </CommandItem>
                                                        ),
                                                    )}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </Field>

                            <Field
                                label="Data sensitivity"
                                className="md:col-span-2"
                            >
                                <div className="grid gap-3 md:grid-cols-3">
                                    {ONBOARDING_SENSITIVITY_OPTIONS.map(
                                        (option) => {
                                            const isSelected =
                                                state.profile
                                                    .dataSensitivity ===
                                                option.value;
                                            return (
                                                <button
                                                    key={option.value}
                                                    type="button"
                                                    onClick={() =>
                                                        updateProfile({
                                                            dataSensitivity:
                                                                option.value as OnboardingDataSensitivity,
                                                        })
                                                    }
                                                    className={cn(
                                                        "rounded-2xl border p-3 text-left transition-colors h-full items-center flex flex-col",
                                                        SURFACE_CLASS_NESTED,
                                                        isSelected &&
                                                            "border-primary bg-primary/5",
                                                    )}
                                                >
                                                    <div className="space-y-1.5">
                                                        <div className="flex items-center justify-between gap-3">
                                                            <p className="font-medium">
                                                                {option.label}
                                                            </p>
                                                            {isSelected ? (
                                                                <Check className="h-4 w-4 text-primary" />
                                                            ) : null}
                                                        </div>
                                                        <p className="text-sm leading-6 text-muted-foreground">
                                                            {option.description}
                                                        </p>
                                                    </div>
                                                </button>
                                            );
                                        },
                                    )}
                                </div>
                            </Field>
                        </section>
                    ) : null}

                    {state.step === 2 ? (
                        <section className="grid gap-3 md:grid-cols-3">
                            {ONBOARDING_AI_MODE_OPTIONS.map((option) => {
                                const isSelected =
                                    state.profile.aiMode === option.value;
                                return (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() =>
                                            updateProfile({
                                                aiMode: option.value as OnboardingAiMode,
                                            })
                                        }
                                        className={cn(
                                            "rounded-2xl border p-4 text-left transition-colors flex flex-col justify-start",
                                            SURFACE_CLASS_NESTED,
                                            isSelected &&
                                                "border-primary bg-primary/5",
                                        )}
                                    >
                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between gap-3">
                                                <p className="font-medium">
                                                    {option.label}
                                                </p>
                                                {isSelected ? (
                                                    <Check className="h-4 w-4 text-primary" />
                                                ) : null}
                                            </div>
                                            <p className="text-sm leading-6 text-muted-foreground">
                                                {option.description}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                        </section>
                    ) : null}

                    {state.step === 3 ? (
                        <section className="space-y-1.5">
                            <ReviewGroup
                                label="Company size"
                                value={
                                    ONBOARDING_COMPANY_SIZE_OPTIONS.find(
                                        (option) =>
                                            option.value ===
                                            state.profile.companySize,
                                    )?.label ?? state.profile.companySize
                                }
                            />
                            <ReviewGroup
                                label="Industry"
                                value={getIndustryLabel(state.profile.industry)}
                            />
                            <ReviewGroup
                                label="Data sensitivity"
                                value={
                                    ONBOARDING_SENSITIVITY_OPTIONS.find(
                                        (option) =>
                                            option.value ===
                                            state.profile.dataSensitivity,
                                    )?.label ?? state.profile.dataSensitivity
                                }
                            />
                            <ReviewGroup
                                label="AI behaviour"
                                value={
                                    ONBOARDING_AI_MODE_OPTIONS.find(
                                        (option) =>
                                            option.value ===
                                            state.profile.aiMode,
                                    )?.label ?? state.profile.aiMode
                                }
                            />
                        </section>
                    ) : null}

                    <div className="flex items-center justify-between gap-3 border-t pt-6">
                        <Button
                            variant="outline"
                            onClick={goBack}
                            disabled={state.step === 1}
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back
                        </Button>
                        {state.step < totalSteps ? (
                            <Button
                                onClick={goNext}
                                disabled={Boolean(validationMessage)}
                            >
                                Continue
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        ) : (
                            <Button onClick={completeOnboarding}>
                                Finish onboarding
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function Field({
    label,
    className,
    children,
}: {
    label: string;
    className?: string;
    children: React.ReactNode;
}) {
    return (
        <div className={cn("flex flex-col gap-y-1", className)}>
            <label className="text-sm font-medium">{label}</label>
            {children}
        </div>
    );
}

function ReviewGroup({ label, value }: { label: string; value: string }) {
    return (
        <div className={cn("p-3", SURFACE_CLASS_NESTED)}>
            <p className="text-sm font-medium">{label}</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {value}
            </p>
        </div>
    );
}
