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

const companySizeSchema = z.enum([
    "1_10",
    "11_50",
    "51_200",
    "201_1000",
    "1000_plus",
]);
const industrySchema = z.enum([
    "saas",
    "fintech",
    "healthcare",
    "ecommerce",
    "professional_services",
    "public_sector",
]);
const sensitivitySchema = z.enum(["low", "moderate", "high"]);
const aiModeSchema = z.enum(["guided", "strict", "lean"]);

const bootstrapSummarySchema = z
    .object({
        companySize: companySizeSchema,
        industry: industrySchema,
        dataSensitivity: sensitivitySchema,
        aiMode: aiModeSchema,
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
    companySize: "11_50",
    industry: "saas",
    dataSensitivity: "moderate",
    aiMode: "guided",
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
        companySize: profile.companySize,
        industry: profile.industry,
        dataSensitivity: profile.dataSensitivity,
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

export const ONBOARDING_COMPANY_SIZE_OPTIONS = [
    { value: "1_10", label: "1-10 people" },
    { value: "11_50", label: "11-50 people" },
    { value: "51_200", label: "51-200 people" },
    { value: "201_1000", label: "201-1000 people" },
    { value: "1000_plus", label: "1000+ people" },
] as const;

export const ONBOARDING_INDUSTRY_OPTIONS = [
    { value: "saas", label: "SaaS" },
    { value: "fintech", label: "Fintech" },
    { value: "healthcare", label: "Healthcare" },
    { value: "ecommerce", label: "E-commerce" },
    { value: "professional_services", label: "Professional services" },
    { value: "public_sector", label: "Public sector" },
] as const;

export const ONBOARDING_SENSITIVITY_OPTIONS = [
    {
        value: "low",
        label: "Low",
        description: "Mostly public or low-impact internal information.",
    },
    {
        value: "moderate",
        label: "Moderate",
        description:
            "Core business information with meaningful internal handling requirements.",
    },
    {
        value: "high",
        label: "High",
        description:
            "Sensitive customer, workforce, or regulated data that raises check expectations quickly.",
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

export function getIndustryLabel(value: StubBootstrapSummary["industry"]): string {
    return (
        ONBOARDING_INDUSTRY_OPTIONS.find((option) => option.value === value)
            ?.label ?? value
    );
}
