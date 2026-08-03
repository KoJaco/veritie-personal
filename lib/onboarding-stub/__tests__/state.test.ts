import {
    buildBootstrapSummary,
    buildServerBootstrap,
    DEFAULT_ONBOARDING_PROFILE,
    parseBootstrapSummary,
    serializeBootstrapSummary,
} from "@/lib/onboarding-stub";

describe("onboarding stub state", () => {
    it("round-trips the compact bootstrap summary through cookie-safe serialization", () => {
        const summary = buildBootstrapSummary({
            enabledAspects: ["work", "finance"],
            capturePreference: "voice_first",
            aiMode: "guided",
        });

        expect(parseBootstrapSummary(serializeBootstrapSummary(summary))).toEqual(
            summary,
        );
    });

    it("fails closed when the bootstrap summary cookie contains invalid data", () => {
        expect(
            buildServerBootstrap({
                onboardingCompleted: "1",
                summary: encodeURIComponent('{"enabledAspects":["INVALID"]}'),
            }),
        ).toEqual({
            onboardingCompleted: true,
            summary: null,
        });
    });

    it("uses default profile shape for onboarding bootstrap", () => {
        expect(DEFAULT_ONBOARDING_PROFILE.enabledAspects.length).toBeGreaterThan(
            0,
        );
        expect(DEFAULT_ONBOARDING_PROFILE.capturePreference).toBe("voice_first");
    });
});
