import { buildCheckRouteContract } from "../build";
import {
    enforceCheckRouteContract,
    validateCheckRouteContractShape,
} from "../validate";

describe("check route contract validation", () => {
    it("accepts a valid check detail contract shape", () => {
        const contract = buildCheckRouteContract({
            lens: { scope: "operations-readiness" },
            checkScope: { scopeId: "operations-readiness" },
            check: {
                id: "chk_or_access_reviews",
                title: "Access Provisioning Check",
                summary: "Provisioning approvals and review cadence.",
                domain: "Identity and Access",
                scopeId: "operations-readiness",
                scopeLabel: "Operations Readiness",
                readiness: "at_risk",
                linkedAttachmentCount: 2,
                linkedTasksCount: 1,
                missingAttachmentCount: 1,
                updatedAt: "2026-03-27T00:00:00.000Z",
                description: "Check detail",
                ownerName: "Owner",
                version: 2,
                status: "approved",
                relatedAttachments: [],
                relatedTasks: [],
            },
        });

        const result = validateCheckRouteContractShape(contract);
        expect(result.ok).toBe(true);
    });

    it("fails closed on invalid contract shape", () => {
        const { payload, validation } = enforceCheckRouteContract({
            checkScope: { scopeId: "operations-readiness" },
            railPayloadCandidate: null,
            // @ts-expect-error intentional invalid shape
            pageModel: null,
        });

        expect(validation.ok).toBe(false);
        expect(payload).toBeNull();
    });
});
