import { buildScopesRouteContract } from "../build";
import {
    enforceScopesRouteContract,
    validateScopesRouteContractShape,
} from "../validate";

describe("scopes route contract validation", () => {
    it("accepts a valid scopes contract shape", () => {
        const contract = buildScopesRouteContract({
            scope: "scopes_index",
            lens: { scope: "all" },
        });

        const result = validateScopesRouteContractShape(contract);
        expect(result.ok).toBe(true);
    });

    it("rejects unknown scope values", () => {
        const result = validateScopesRouteContractShape({
            scope: "scopes_unknown",
            railPayloadCandidate: null,
        });

        expect(result).toMatchObject({
            ok: false,
            errorCode: "INVALID_SHAPE",
        });
    });

    it("enforces fail-closed payload behavior on invalid shape", () => {
        const { payload, validation } = enforceScopesRouteContract({
            scope: "scopes_index",
            lens: { scope: "delivery-observability" },
            railPayloadCandidate: null,
            // @ts-expect-error test invalid shape
            debug: true,
        });

        expect(validation.ok).toBe(false);
        expect(payload).toBeNull();
    });
});
