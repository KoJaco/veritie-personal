import {
    buildBootstrapSummary,
    buildServerBootstrap,
    parseBootstrapSummary,
    serializeBootstrapSummary,
} from "@/lib/onboarding-stub";

describe("onboarding stub state", () => {
    it("round-trips the compact bootstrap summary through cookie-safe serialization", () => {
        const summary = buildBootstrapSummary({
            companySize: "11_50",
            industry: "saas",
            dataSensitivity: "moderate",
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
                summary: encodeURIComponent('{"industry":"INVALID"}'),
            }),
        ).toEqual({
            onboardingCompleted: true,
            summary: null,
        });
    });
});
