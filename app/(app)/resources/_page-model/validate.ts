import type { ValidationResult } from "@/lib/contracts/validation";
import { validatePageModel } from "@/lib/page-model";
import type { PageModel } from "@/lib/page-model/types";
import type { ResourcesRouteContract } from "./build";
import { resourcesRouteContractSchema } from "./schema";

export type EnforcedResourcesRouteContract = {
    pageModelValidation: ValidationResult<PageModel>;
    payload: ResourcesRouteContract["railPayloadCandidate"];
};

export function validateResourcesRouteContractShape(
    input: unknown,
): ValidationResult<ResourcesRouteContract> {
    const parsed = resourcesRouteContractSchema.safeParse(input);

    if (!parsed.success) {
        const issue = parsed.error.issues[0];
        const path = issue?.path?.length ? issue.path.join(".") : "root";
        return {
            ok: false,
            errorCode: "INVALID_SHAPE",
            reason: `Resources route contract schema validation failed at ${path}: ${issue?.message ?? "unknown error"}`,
        };
    }

    return {
        ok: true,
        value: parsed.data as ResourcesRouteContract,
        sizeBytes: JSON.stringify(parsed.data).length,
    };
}

export function enforceResourcesRouteContract(
    contract: ResourcesRouteContract,
): EnforcedResourcesRouteContract {
    const shapeValidation = validateResourcesRouteContractShape(contract);
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
