export type OnboardingCompanySize =
    | "1_10"
    | "11_50"
    | "51_200"
    | "201_1000"
    | "1000_plus";
export type OnboardingIndustry =
    | "saas"
    | "fintech"
    | "healthcare"
    | "ecommerce"
    | "professional_services"
    | "public_sector";
export type OnboardingDataSensitivity = "low" | "moderate" | "high";
export type OnboardingAiMode = "guided" | "strict" | "lean";

export interface StubOnboardingProfile {
    companySize: OnboardingCompanySize;
    industry: OnboardingIndustry;
    dataSensitivity: OnboardingDataSensitivity;
    aiMode: OnboardingAiMode;
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
