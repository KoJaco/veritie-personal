import { getOnboardingProfileForInit } from "@/lib/auth/onboarding-profile";
import * as onboardingServer from "@/lib/onboarding-stub/server";

jest.mock("@/lib/onboarding-stub/server", () => ({
    getStubServerBootstrap: jest.fn(),
}));

describe("getOnboardingProfileForInit", () => {
    const getStubServerBootstrap =
        onboardingServer.getStubServerBootstrap as jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("maps bootstrap summary to onboarding profile", async () => {
        getStubServerBootstrap.mockResolvedValue({
            onboardingCompleted: true,
            summary: {
                enabledAspects: ["work", "finance"],
                capturePreference: "balanced",
                aiMode: "lean",
            },
        });

        const profile = await getOnboardingProfileForInit();

        expect(profile).toEqual({
            enabledAspects: ["work", "finance"],
            capturePreference: "balanced",
            aiMode: "lean",
        });
    });

    it("returns null when summary is missing", async () => {
        getStubServerBootstrap.mockResolvedValue({
            onboardingCompleted: false,
            summary: null,
        });

        expect(await getOnboardingProfileForInit()).toBeNull();
    });
});
