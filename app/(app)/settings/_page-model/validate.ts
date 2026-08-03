import type { ValidationResult } from "@/lib/contracts/validation";
import { validatePageModel } from "@/lib/page-model";
import type { PageModel } from "@/lib/page-model/types";
import type { SettingsRouteContract } from "./build";
import { settingsRouteContractSchema } from "./schema";

export type EnforcedSettingsRouteContract = {
    pageModelValidation: ValidationResult<PageModel>;
    payload: SettingsRouteContract["railPayloadCandidate"];
};

export function validateSettingsRouteContractShape(
    input: unknown,
): ValidationResult<SettingsRouteContract> {
    const parsed = settingsRouteContractSchema.safeParse(input);

    if (!parsed.success) {
        const issue = parsed.error.issues[0];
        const path = issue?.path?.length ? issue.path.join(".") : "root";
        return {
            ok: false,
            errorCode: "INVALID_SHAPE",
            reason: `Settings route contract schema validation failed at ${path}: ${issue?.message ?? "unknown error"}`,
        };
    }

    return {
        ok: true,
        value: parsed.data as SettingsRouteContract,
        sizeBytes: JSON.stringify(parsed.data).length,
    };
}

export function enforceSettingsRouteContract(
    contract: SettingsRouteContract,
): EnforcedSettingsRouteContract {
    const shapeValidation = validateSettingsRouteContractShape(contract);
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
