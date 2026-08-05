import { describe, expect, it, jest, beforeEach } from "@jest/globals";

const mockUpdate = jest.fn();
const mockInsert = jest.fn();
const mockFindFirst = jest.fn();

jest.mock("@/lib/db", () => ({
    getDb: () => ({
        update: mockUpdate,
        insert: mockInsert,
        query: {
            users: {
                findFirst: mockFindFirst,
            },
        },
    }),
}));

describe("settings repository", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockUpdate.mockReturnValue({
            set: jest.fn().mockReturnValue({
                where: jest.fn().mockReturnValue({
                    returning: jest.fn(async () => [{ id: "profile_1" }]),
                }),
            }),
        });
        mockInsert.mockReturnValue({
            values: jest.fn(async () => undefined),
        });
    });

    it("updates user profile full name", async () => {
        const { updateUserProfileFullName } = await import(
            "@/lib/db/repositories/settings"
        );

        const result = await updateUserProfileFullName(
            { accountId: "account_a", userId: "user_1" },
            "Jordan Smith",
        );

        expect(result).toBe(true);
        expect(mockUpdate).toHaveBeenCalled();
    });

    it("soft deletes account users and account row", async () => {
        mockUpdate.mockReturnValue({
            set: jest.fn().mockReturnValue({
                where: jest
                    .fn()
                    .mockReturnValueOnce({})
                    .mockReturnValueOnce({
                        returning: jest.fn(async () => [{ id: "account_a" }]),
                    }),
            }),
        });

        const { softDeleteAccount } = await import(
            "@/lib/db/repositories/settings"
        );

        const result = await softDeleteAccount({
            accountId: "account_a",
            userId: "user_1",
        });

        expect(result).toBe(true);
        expect(mockUpdate).toHaveBeenCalledTimes(2);
    });
});
