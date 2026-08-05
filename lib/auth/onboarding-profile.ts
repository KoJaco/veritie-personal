import "server-only";

import type { OnboardingProfile } from "@/lib/domain/app-config";
import { getStubServerBootstrap } from "@/lib/onboarding-stub/server";

/**
 * Reads onboarding choices from stub cookies set during the wizard completion step.
 * Returns null when no valid summary is present — initAccountWithUser applies defaults.
 */
export async function getOnboardingProfileForInit(): Promise<OnboardingProfile | null> {
    const bootstrap = await getStubServerBootstrap();

    if (!bootstrap.summary) {
        return null;
    }

    return {
        enabledAspects: [...bootstrap.summary.enabledAspects],
        capturePreference: bootstrap.summary.capturePreference,
        aiMode: bootstrap.summary.aiMode,
    };
}
