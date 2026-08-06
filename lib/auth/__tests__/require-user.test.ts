import { UnauthorizedError } from "@/lib/auth/errors";
import * as initAccountModule from "@/lib/auth/init-account";
import { requireUser } from "@/lib/auth/require-user";
import * as supabaseServer from "@/lib/supabase/server";

jest.mock("@/lib/supabase/server", () => ({
    createClient: jest.fn(),
}));

jest.mock("@/lib/auth/init-account", () => ({
    findAppUserByAuthId: jest.fn(),
    assertAccountActive: jest.requireActual("@/lib/auth/init-account")
        .assertAccountActive,
}));

describe("requireUser", () => {
    const createClient = supabaseServer.createClient as jest.Mock;
    const findAppUserByAuthId =
        initAccountModule.findAppUserByAuthId as jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("throws when Supabase session is missing", async () => {
        createClient.mockResolvedValue({
            auth: {
                getUser: async () => ({ data: { user: null }, error: null }),
            },
        });

        await expect(requireUser()).rejects.toThrow(UnauthorizedError);
    });

    it("returns AppUser when session and DB row exist", async () => {
        createClient.mockResolvedValue({
            auth: {
                getUser: async () => ({
                    data: { user: { id: "user-1" } },
                    error: null,
                }),
            },
        });

        findAppUserByAuthId.mockResolvedValue({
            id: "user-1",
            email: "test@example.com",
            accountId: "acc-1",
            role: "owner",
            deletedAt: null,
            account: {
                plan: "free",
                deletedAt: null,
                settings: {
                    appConfig: {
                        onboardingCompleted: true,
                        enabledAspects: ["personal"],
                        capturePreference: "voice_first",
                        aiMode: "guided",
                    },
                },
            },
        });

        const appUser = await requireUser();

        expect(appUser.accountId).toBe("acc-1");
        expect(appUser.appConfig.enabledAspects).toEqual(["personal"]);
    });
});
