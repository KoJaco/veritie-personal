import {
    buildAppConfigFromOnboarding,
    DEFAULT_APP_CONFIG,
    parseAppConfigFromSettings,
    resolveAppConfig,
} from "@/lib/domain/app-config";

describe("app-config", () => {
    it("builds app config from onboarding profile", () => {
        const config = buildAppConfigFromOnboarding({
            enabledAspects: ["work", "finance"],
            capturePreference: "balanced",
            aiMode: "lean",
        });

        expect(config).toEqual({
            onboardingCompleted: true,
            enabledAspects: ["work", "finance"],
            capturePreference: "balanced",
            aiMode: "lean",
        });
    });

    it("uses defaults when onboarding profile is missing", () => {
        const config = resolveAppConfig(null, true);

        expect(config.onboardingCompleted).toBe(true);
        expect(config.enabledAspects).toEqual(
            DEFAULT_APP_CONFIG.enabledAspects,
        );
    });

    it("parses appConfig from account settings", () => {
        const parsed = parseAppConfigFromSettings({
            appConfig: {
                onboardingCompleted: true,
                enabledAspects: ["personal"],
                capturePreference: "voice_first",
                aiMode: "guided",
            },
        });

        expect(parsed?.enabledAspects).toEqual(["personal"]);
    });

    it("returns null for invalid settings payload", () => {
        expect(
            parseAppConfigFromSettings({
                appConfig: { enabledAspects: ["invalid"] },
            }),
        ).toBeNull();
    });
});
