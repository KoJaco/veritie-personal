import type { ValidationResult } from "@/lib/contracts/validation";
import { validatePageModel } from "@/lib/page-model";
import type { PageModel } from "@/lib/page-model/types";
import type { ConnectionsRouteContract } from "./build";
import { connectionsRouteContractSchema } from "./schema";

export type EnforcedConnectionsRouteContract = {
    pageModelValidation: ValidationResult<PageModel>;
    payload: ConnectionsRouteContract["railPayloadCandidate"];
};

export function validateConnectionsRouteContractShape(
    input: unknown,
): ValidationResult<ConnectionsRouteContract> {
    const parsed = connectionsRouteContractSchema.safeParse(input);

    if (!parsed.success) {
        const issue = parsed.error.issues[0];
        const path = issue?.path?.length ? issue.path.join(".") : "root";
        return {
            ok: false,
            errorCode: "INVALID_SHAPE",
            reason: `Connections route contract schema validation failed at ${path}: ${issue?.message ?? "unknown error"}`,
        };
    }

    return {
        ok: true,
        value: parsed.data as ConnectionsRouteContract,
        sizeBytes: JSON.stringify(parsed.data).length,
    };
}

export function enforceConnectionsRouteContract(
    contract: ConnectionsRouteContract,
): EnforcedConnectionsRouteContract {
    const shapeValidation = validateConnectionsRouteContractShape(contract);
    if (!shapeValidation.ok) {
        return {
            pageModelValidation: shapeValidation,
            payload: null,
        };
    }

    const pageModelValidation = validatePageModel(shapeValidation.value.pageModel);
    if (!pageModelValidation.ok) {
        return {
            pageModelValidation,
            payload: null,
        };
    }

    return {
        pageModelValidation,
        payload: shapeValidation.value.railPayloadCandidate,
    };
}
