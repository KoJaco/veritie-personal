import type { ValidationResult } from "@/lib/contracts/validation";
import type { ScopesRouteContract } from "./build";
import { scopesRouteContractSchema } from "./schema";

export function validateScopesRouteContractShape(
    input: unknown,
): ValidationResult<ScopesRouteContract> {
    const parsed = scopesRouteContractSchema.safeParse(input);

    if (!parsed.success) {
        const issue = parsed.error.issues[0];
        const path = issue?.path?.length ? issue.path.join(".") : "root";
        return {
            ok: false,
            errorCode: "INVALID_SHAPE",
            reason: `Scopes contract schema validation failed at ${path}: ${issue?.message ?? "unknown error"}`,
        };
    }

    return {
        ok: true,
        value: parsed.data as ScopesRouteContract,
        sizeBytes: JSON.stringify(parsed.data).length,
    };
}

export function enforceScopesRouteContract(
    contract: ScopesRouteContract,
) {
    const validation = validateScopesRouteContractShape(contract);
    if (!validation.ok) {
        return {
            validation,
            payload: null,
        };
    }

    return {
        validation,
        payload: contract.railPayloadCandidate,
    };
}
