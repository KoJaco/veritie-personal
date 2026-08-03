import { buildResourcesRouteContract } from "../build";
import {
    enforceResourcesRouteContract,
    validateResourcesRouteContractShape,
} from "../validate";
import { stubDataSourceAdapters } from "@/lib/data-source/stub-adapter";

describe("resources route contract validation", () => {
    it("accepts a valid resource detail contract shape", () => {
        const contract = buildResourcesRouteContract({
            scope: "resources_detail",
            lens: { scope: "all" },
            resource: stubDataSourceAdapters.resources.getResourceDetail("resource_seed_3"),
        });

        const result = validateResourcesRouteContractShape(contract);
        expect(result.ok).toBe(true);
    });

    it("rejects an invalid page model view key", () => {
        const result = validateResourcesRouteContractShape({
            pageModel: {
                meta: {
                    title: "Resources",
                    breadcrumbs: [{ label: "Resources" }],
                    aspect: { aspectId: "all" },
                },
                view: { key: "bad_view" },
                sections: [],
                capabilities: {},
                actions: { available: [] },
            },
            railPayloadCandidate: null,
        });

        expect(result).toMatchObject({
            ok: false,
            errorCode: "INVALID_SHAPE",
        });
    });

    it("enforces fail-closed payload behavior on invalid shape", () => {
        const { payload, pageModelValidation } = enforceResourcesRouteContract({
            pageModel: {
                meta: {
                    title: "Resources",
                    breadcrumbs: [{ label: "Resources" }],
                    aspect: { aspectId: "all" },
                },
                view: { key: "resources_index" },
                sections: [],
                capabilities: {},
                actions: { available: [] },
            },
            railPayloadCandidate: null,
            debug: true,
        } as Parameters<typeof enforceResourcesRouteContract>[0]);

        expect(pageModelValidation.ok).toBe(false);
        expect(payload).toBeNull();
    });
});
