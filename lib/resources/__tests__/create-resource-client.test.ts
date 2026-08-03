import { createResourceViaApi } from "@/lib/resources/create-resource-client";

describe("createResourceViaApi", () => {
    beforeEach(() => {
        Object.defineProperty(globalThis, "fetch", {
            writable: true,
            value: jest.fn().mockResolvedValue({
                ok: true,
                json: async () => ({ resourceId: "resource_created_1" }),
            }),
        });
    });

    it("posts the resource create payload to the generic API route", async () => {
        const result = await createResourceViaApi({
            name: "Identity Platform",
            category: "service",
            ownerName: "Jordan Smith",
            criticality: "high",
            sensitivity: "internal",
            description: "Primary authentication service.",
        });

        expect(globalThis.fetch).toHaveBeenCalledWith(
            "/api/resources",
            expect.objectContaining({
                method: "POST",
            }),
        );
        expect(result).toEqual({ resourceId: "resource_created_1" });
    });
});
