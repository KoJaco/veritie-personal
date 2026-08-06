import type { AspectKey } from "@/lib/domain/aspect";

export type PersonalFocusAspect = AspectKey;

export type OnboardingCapturePreference = "voice_first" | "balanced" | "manual";
export type OnboardingAiMode = "guided" | "strict" | "lean";

export interface StubOnboardingProfile {
    enabledAspects: PersonalFocusAspect[];
    capturePreference: OnboardingCapturePreference;
    aiMode: OnboardingAiMode;
    saveVoiceLogAudio?: boolean;
    captureLocationLabel?: string;
}

export type StubBootstrapSummary = StubOnboardingProfile;

export interface StubServerBootstrap {
    onboardingCompleted: boolean;
    summary: StubBootstrapSummary | null;
}

export interface StubOnboardingClientState {
    step: 1 | 2 | 3;
    profile: StubOnboardingProfile;
    completedProfile?: StubOnboardingProfile;
}

/** @deprecated Legacy company onboarding fields — do not use */
export type OnboardingCompanySize = string;
/** @deprecated */
export type OnboardingIndustry = string;
/** @deprecated */
export type OnboardingDataSensitivity = string;
