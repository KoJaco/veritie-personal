import { describe, expect, it, jest, beforeEach } from "@jest/globals";

type AnyMock = jest.MockedFunction<(...args: never[]) => Promise<unknown>>;

const mockRequireUser = jest.fn() as AnyMock;
const mockRequireAccountScope = jest.fn() as AnyMock;
const mockUpdateUserProfileFullName = jest.fn() as AnyMock;
const mockUpdateAccountName = jest.fn() as AnyMock;
const mockSoftDeleteAccount = jest.fn() as AnyMock;
const mockSignOut = jest.fn() as AnyMock;

jest.mock("@/lib/auth/require-user", () => ({
    requireUser: () => mockRequireUser(),
}));

jest.mock("@/lib/db/repositories/context", () => ({
    requireAccountScope: () => mockRequireAccountScope(),
}));

const mockUpdateAccountAppConfig = jest.fn() as AnyMock;

jest.mock("@/lib/db/repositories/settings", () => ({
    updateUserProfileFullName: (...args: never[]) =>
        mockUpdateUserProfileFullName(...args),
    updateAccountName: (...args: never[]) => mockUpdateAccountName(...args),
    softDeleteAccount: (...args: never[]) => mockSoftDeleteAccount(...args),
    updateAccountAppConfig: (...args: never[]) =>
        mockUpdateAccountAppConfig(...args),
}));

jest.mock("@/lib/data-source/registry", () => ({
    getDataSourceKind: () => "backend",
}));

jest.mock("@/lib/supabase/server", () => ({
    createClient: async () => ({
        auth: {
            signOut: () => mockSignOut(),
        },
    }),
}));

jest.mock("next/navigation", () => ({
    redirect: (url: string) => {
        throw new Error(`REDIRECT:${url}`);
    },
}));

describe("settings actions", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockRequireUser.mockResolvedValue({
            id: "user_1",
            accountId: "account_a",
            role: "owner",
        });
        mockRequireAccountScope.mockResolvedValue({
            accountId: "account_a",
            userId: "user_1",
        });
        mockUpdateUserProfileFullName.mockResolvedValue(true);
        mockUpdateAccountName.mockResolvedValue(true);
        mockSoftDeleteAccount.mockResolvedValue(true);
        mockUpdateAccountAppConfig.mockResolvedValue(true);
        mockSignOut.mockResolvedValue(undefined);
    });

    it("updates capture location label", async () => {
        const { updateCaptureContextAction } = await import(
            "@/lib/actions/settings-mutations"
        );

        const result = await updateCaptureContextAction({
            captureLocationLabel: "North Manly",
        });

        expect(result).toEqual({ ok: true });
        expect(mockUpdateAccountAppConfig).toHaveBeenCalledWith(
            expect.anything(),
            { captureLocationLabel: "North Manly" },
        );
    });

    it("updates display and workspace name for owners", async () => {
        const { updateProfileAction } = await import(
            "@/lib/actions/settings-mutations"
        );

        const result = await updateProfileAction({
            displayName: "Jordan Smith",
            workspaceName: "Jordan Workspace",
        });

        expect(result).toEqual({ ok: true });
        expect(mockUpdateUserProfileFullName).toHaveBeenCalled();
        expect(mockUpdateAccountName).toHaveBeenCalled();
    });

    it("rejects delete for non-owners", async () => {
        mockRequireUser.mockResolvedValue({
            id: "user_2",
            accountId: "account_a",
            role: "admin",
        });

        const { deleteAccountAction } = await import(
            "@/lib/actions/settings-mutations"
        );

        const result = await deleteAccountAction({
            confirmation: "Delete this account",
        });

        expect(result).toEqual({
            ok: false,
            error: "Only account owners can delete accounts",
        });
        expect(mockSoftDeleteAccount).not.toHaveBeenCalled();
    });

    it("soft deletes and signs out for owners", async () => {
        const { deleteAccountAction } = await import(
            "@/lib/actions/settings-mutations"
        );

        await expect(
            deleteAccountAction({ confirmation: "Delete this account" }),
        ).rejects.toThrow("REDIRECT:/auth/error");

        expect(mockSoftDeleteAccount).toHaveBeenCalled();
        expect(mockSignOut).toHaveBeenCalled();
    });
});
