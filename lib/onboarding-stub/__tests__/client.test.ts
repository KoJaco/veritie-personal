import {
    DEFAULT_CLIENT_STATE,
    STUB_BOOTSTRAP_COOKIE,
    STUB_ONBOARDING_COMPLETED_COOKIE,
    STUB_ONBOARDING_DRAFT_STORAGE_KEY,
} from "@/lib/onboarding-stub";
import {
    loadClientDraftState,
    persistClientDraftState,
    persistOnboardingCompletion,
} from "@/lib/onboarding-stub/client";

describe("onboarding stub client helpers", () => {
    beforeEach(() => {
        window.localStorage.clear();
        document.cookie = `${STUB_ONBOARDING_COMPLETED_COOKIE}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
        document.cookie = `${STUB_BOOTSTRAP_COOKIE}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    });

    it("persists the richer onboarding draft to localStorage only", () => {
        persistClientDraftState({
            ...DEFAULT_CLIENT_STATE,
            step: 2,
            profile: {
                ...DEFAULT_CLIENT_STATE.profile,
                enabledAspects: ["work", "finance", "personal"],
            },
        });

        expect(
            window.localStorage.getItem(STUB_ONBOARDING_DRAFT_STORAGE_KEY),
        ).toContain('"step":2');
        expect(loadClientDraftState().profile.enabledAspects).toEqual([
            "work",
            "finance",
            "personal",
        ]);
    });

    it("writes only the compact server-safe cookie fields for completion", () => {
        persistOnboardingCompletion({
            enabledAspects: ["personal", "admin"],
            capturePreference: "balanced",
            aiMode: "strict",
        });

        expect(document.cookie).toContain(
            `${STUB_ONBOARDING_COMPLETED_COOKIE}=1`,
        );
        expect(document.cookie).toContain(`${STUB_BOOTSTRAP_COOKIE}=`);
    });
});
