import { deriveAccountNameFromEmail } from "@/lib/auth/init-account";

describe("deriveAccountNameFromEmail", () => {
    it("normalizes email prefix into a short account name", () => {
        expect(deriveAccountNameFromEmail("Jane.Doe@example.com")).toBe(
            "jane-doe",
        );
    });

    it("falls back to user when prefix is empty after normalization", () => {
        expect(deriveAccountNameFromEmail("@example.com")).toBe("user");
    });
});
