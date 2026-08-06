import { z } from "zod";
import type {
    StubBootstrapSummary,
    StubOnboardingClientState,
    StubOnboardingProfile,
    StubServerBootstrap,
} from "./types";

export const STUB_ONBOARDING_COMPLETED_COOKIE = "stub_onboarding_completed";
export const STUB_BOOTSTRAP_COOKIE = "stub_bootstrap";
export const STUB_ONBOARDING_DRAFT_STORAGE_KEY = "stub_onboarding_draft";

const aspectKeySchema = z.enum([
    "finance",
    "fitness",
    "work",
    "personal",
    "admin",
]);
const capturePreferenceSchema = z.enum(["voice_first", "balanced", "manual"]);
const aiModeSchema = z.enum(["guided", "strict", "lean"]);

const bootstrapSummarySchema = z
    .object({
        enabledAspects: z.array(aspectKeySchema).min(1),
        capturePreference: capturePreferenceSchema,
        aiMode: aiModeSchema,
        saveVoiceLogAudio: z.boolean().optional(),
    })
    .strict();

const onboardingProfileSchema = bootstrapSummarySchema;

const onboardingClientStateSchema = z
    .object({
        step: z.union([z.literal(1), z.literal(2), z.literal(3)]),
        profile: onboardingProfileSchema,
        completedProfile: onboardingProfileSchema.optional(),
    })
    .strict();

export const DEFAULT_ONBOARDING_PROFILE: StubOnboardingProfile = {
    enabledAspects: ["personal", "admin", "finance"],
    capturePreference: "voice_first",
    aiMode: "guided",
    saveVoiceLogAudio: false,
};

export const DEFAULT_CLIENT_STATE: StubOnboardingClientState = {
    step: 1,
    profile: DEFAULT_ONBOARDING_PROFILE,
};

export const DEFAULT_SERVER_BOOTSTRAP: StubServerBootstrap = {
    onboardingCompleted: false,
    summary: null,
};

export function buildBootstrapSummary(
    profile: StubOnboardingProfile,
): StubBootstrapSummary {
    return {
        enabledAspects: [...profile.enabledAspects],
        capturePreference: profile.capturePreference,
        aiMode: profile.aiMode,
    };
}

export function serializeBootstrapSummary(summary: StubBootstrapSummary): string {
    return encodeURIComponent(JSON.stringify(summary));
}

export function parseBootstrapSummary(
    rawValue: string | undefined,
): StubBootstrapSummary | null {
    if (!rawValue) {
        return null;
    }

    try {
        const parsed = JSON.parse(decodeURIComponent(rawValue));
        return bootstrapSummarySchema.parse(parsed);
    } catch {
        return null;
    }
}

export function parseOnboardingCompleted(rawValue: string | undefined): boolean {
    return rawValue === "1";
}

export function buildServerBootstrap({
    onboardingCompleted,
    summary,
}: {
    onboardingCompleted?: string;
    summary?: string;
}): StubServerBootstrap {
    return {
        onboardingCompleted: parseOnboardingCompleted(onboardingCompleted),
        summary: parseBootstrapSummary(summary),
    };
}

export function parseClientState(
    rawValue: string | null,
): StubOnboardingClientState {
    if (!rawValue) {
        return DEFAULT_CLIENT_STATE;
    }

    try {
        const parsed = JSON.parse(rawValue);
        return onboardingClientStateSchema.parse(parsed);
    } catch {
        return DEFAULT_CLIENT_STATE;
    }
}

export function serializeClientState(
    state: StubOnboardingClientState,
): string {
    return JSON.stringify(onboardingClientStateSchema.parse(state));
}

export function profileIsComplete(
    profile: StubOnboardingProfile,
): profile is StubOnboardingProfile {
    return onboardingProfileSchema.safeParse(profile).success;
}

export const ONBOARDING_ASPECT_OPTIONS = [
    { value: "finance", label: "Finance" },
    { value: "fitness", label: "Fitness" },
    { value: "work", label: "Work" },
    { value: "personal", label: "Personal" },
    { value: "admin", label: "Admin" },
] as const;

export const ONBOARDING_CAPTURE_PREFERENCE_OPTIONS = [
    {
        value: "voice_first",
        label: "Voice first",
        description: "Prioritise voice logs as your main capture input.",
    },
    {
        value: "balanced",
        label: "Balanced",
        description: "Mix voice, files, and text captures equally.",
    },
    {
        value: "manual",
        label: "Manual",
        description: "Start with typed notes and uploads; add voice later.",
    },
] as const;

export const ONBOARDING_AI_MODE_OPTIONS = [
    {
        value: "guided",
        label: "Guided",
        description: "Explains decisions and suggests the next best action.",
    },
    {
        value: "strict",
        label: "Strict",
        description: "Flags more issues and keeps recommendations conservative.",
    },
    {
        value: "lean",
        label: "Lean",
        description: "Minimizes noise and surfaces only the critical path.",
    },
] as const;

export function getAspectLabels(
    aspects: StubBootstrapSummary["enabledAspects"],
): string[] {
    return aspects.map(
        (aspect) =>
            ONBOARDING_ASPECT_OPTIONS.find((option) => option.value === aspect)
                ?.label ?? aspect,
    );
}

/** @deprecated Use getAspectLabels */
export function getIndustryLabel(): string {
    return "Personal";
}

/** @deprecated */
export const ONBOARDING_COMPANY_SIZE_OPTIONS = [] as const;
/** @deprecated */
export const ONBOARDING_INDUSTRY_OPTIONS = [] as const;
/** @deprecated */
export const ONBOARDING_SENSITIVITY_OPTIONS = [] as const;
