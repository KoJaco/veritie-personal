import { z } from "zod";

import { DEFAULT_ONBOARDING_PROFILE } from "@/lib/onboarding-stub/state";
import { captureLocationLabelSchema } from "@/lib/capture/capture-context-schema";

export const aspectKeySchema = z.enum([
    "finance",
    "fitness",
    "work",
    "personal",
    "admin",
]);

export const capturePreferenceSchema = z.enum([
    "voice_first",
    "balanced",
    "manual",
]);

export const aiModeSchema = z.enum(["guided", "strict", "lean"]);

/** Onboarding profile shape — mirrors lib/onboarding-stub/types.ts */
export const onboardingProfileSchema = z
    .object({
        enabledAspects: z.array(aspectKeySchema).min(1),
        capturePreference: capturePreferenceSchema,
        aiMode: aiModeSchema,
        saveVoiceLogAudio: z.boolean().optional(),
        captureLocationLabel: captureLocationLabelSchema,
    })
    .strict();

export type OnboardingProfile = z.infer<typeof onboardingProfileSchema>;

export const appConfigSchema = z
    .object({
        onboardingCompleted: z.boolean(),
        enabledAspects: z.array(aspectKeySchema).min(1),
        capturePreference: capturePreferenceSchema,
        aiMode: aiModeSchema,
        saveVoiceLogAudio: z.boolean().optional().default(false),
        captureLocationLabel: captureLocationLabelSchema,
    })
    .strict();

export type AppConfig = z.infer<typeof appConfigSchema>;

export const DEFAULT_APP_CONFIG: AppConfig = {
    onboardingCompleted: false,
    ...DEFAULT_ONBOARDING_PROFILE,
    saveVoiceLogAudio: false,
};

export function buildAppConfigFromOnboarding(
    profile: OnboardingProfile,
    onboardingCompleted = true,
): AppConfig {
    return appConfigSchema.parse({
        onboardingCompleted,
        enabledAspects: [...profile.enabledAspects],
        capturePreference: profile.capturePreference,
        aiMode: profile.aiMode,
        saveVoiceLogAudio: profile.saveVoiceLogAudio ?? false,
        captureLocationLabel: profile.captureLocationLabel,
    });
}

export function resolveAppConfig(
    profile?: Partial<OnboardingProfile> | null,
    onboardingCompleted = true,
): AppConfig {
    if (!profile) {
        return {
            ...DEFAULT_APP_CONFIG,
            onboardingCompleted,
        };
    }

    return buildAppConfigFromOnboarding(
        onboardingProfileSchema.parse({
            enabledAspects:
                profile.enabledAspects ?? DEFAULT_ONBOARDING_PROFILE.enabledAspects,
            capturePreference:
                profile.capturePreference ??
                DEFAULT_ONBOARDING_PROFILE.capturePreference,
            aiMode: profile.aiMode ?? DEFAULT_ONBOARDING_PROFILE.aiMode,
            saveVoiceLogAudio:
                profile.saveVoiceLogAudio ??
                DEFAULT_ONBOARDING_PROFILE.saveVoiceLogAudio ??
                false,
            captureLocationLabel:
                profile.captureLocationLabel ??
                DEFAULT_ONBOARDING_PROFILE.captureLocationLabel,
        }),
        onboardingCompleted,
    );
}

export function parseAppConfigFromSettings(
    settings: Record<string, unknown> | null | undefined,
): AppConfig | null {
    if (!settings || typeof settings !== "object") {
        return null;
    }

    const raw = settings.appConfig;
    if (!raw || typeof raw !== "object") {
        return null;
    }

    const parsed = appConfigSchema.safeParse(raw);
    return parsed.success ? parsed.data : null;
}
