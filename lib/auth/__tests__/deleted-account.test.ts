import { DeletedAccountError } from "@/lib/auth/errors";
import { assertAccountActive, isAccountDeleted, isUserDeleted } from "@/lib/auth/deleted-account";

describe("deleted-account", () => {
    it("detects soft-deleted user or account rows", () => {
        expect(isUserDeleted({ deletedAt: new Date() })).toBe(true);
        expect(isAccountDeleted({ deletedAt: null })).toBe(false);
    });

    it("throws when account or user is soft-deleted", () => {
        expect(() =>
            assertAccountActive(
                { deletedAt: new Date() },
                { deletedAt: null },
            ),
        ).toThrow(DeletedAccountError);
    });
});
