import type { ValidationResult } from "@/lib/contracts/validation";
import type { CheckRouteContract } from "./build";
import { checkRouteContractSchema } from "./schema";

export function validateCheckRouteContractShape(
    input: unknown,
): ValidationResult<CheckRouteContract> {
    const parsed = checkRouteContractSchema.safeParse(input);

    if (!parsed.success) {
        const issue = parsed.error.issues[0];
        const path = issue?.path?.length ? issue.path.join(".") : "root";

        return {
            ok: false,
            errorCode: "INVALID_SHAPE",
            reason: `Check route contract schema validation failed at ${path}: ${issue?.message ?? "unknown error"}`,
        };
    }

    return {
        ok: true,
        value: parsed.data as CheckRouteContract,
        sizeBytes: JSON.stringify(parsed.data).length,
    };
}

export function enforceCheckRouteContract(contract: CheckRouteContract) {
    const validation = validateCheckRouteContractShape(contract);
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
