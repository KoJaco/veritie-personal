import type { ValidationResult } from "@/lib/contracts/validation";
import { validatePageModel } from "@/lib/page-model";
import type { PageModel } from "@/lib/page-model/types";
import type { WorkRouteContract } from "./build";
import { workRouteContractSchema } from "./schema";

export type EnforcedWorkRouteContract = {
    pageModelValidation: ValidationResult<PageModel>;
    railPayload: WorkRouteContract["railPayloadCandidate"];
};

export function validateWorkRouteContractShape(
    input: unknown,
): ValidationResult<WorkRouteContract> {
    const parsed = workRouteContractSchema.safeParse(input);

    if (!parsed.success) {
        const issue = parsed.error.issues[0];
        const path = issue?.path?.length ? issue.path.join(".") : "root";
        return {
            ok: false,
            errorCode: "INVALID_SHAPE",
            reason: `Work route contract schema validation failed at ${path}: ${issue?.message ?? "unknown error"}`,
        };
    }

    return {
        ok: true,
        value: parsed.data as WorkRouteContract,
        sizeBytes: JSON.stringify(parsed.data).length,
    };
}

// Fail closed when route contract or PageModel validation fails.
export function enforceWorkRouteContract(
    composed: WorkRouteContract,
): EnforcedWorkRouteContract {
    const shapeValidation = validateWorkRouteContractShape(composed);
    if (!shapeValidation.ok) {
        return {
            pageModelValidation: shapeValidation,
            railPayload: null,
        };
    }

    const pageModelValidation = validatePageModel(shapeValidation.value.pageModel);
    if (!pageModelValidation.ok) {
        return {
            pageModelValidation,
            railPayload: null,
        };
    }

    return {
        pageModelValidation,
        railPayload: shapeValidation.value.railPayloadCandidate,
    };
}
