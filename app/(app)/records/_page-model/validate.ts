import type { ValidationResult } from "@/lib/contracts/validation";
import { validatePageModel } from "@/lib/page-model";
import type { PageModel } from "@/lib/page-model/types";
import type { DocumentsRouteContract } from "./build";
import { documentsRouteContractSchema } from "./schema";

export type EnforcedDocumentsRouteContract = {
    pageModelValidation: ValidationResult<PageModel>;
    payload: DocumentsRouteContract["railPayloadCandidate"];
};

export function validateDocumentsRouteContractShape(
    input: unknown,
): ValidationResult<DocumentsRouteContract> {
    const parsed = documentsRouteContractSchema.safeParse(input);

    if (!parsed.success) {
        const issue = parsed.error.issues[0];
        const path = issue?.path?.length ? issue.path.join(".") : "root";
        return {
            ok: false,
            errorCode: "INVALID_SHAPE",
            reason: `Documents route contract schema validation failed at ${path}: ${issue?.message ?? "unknown error"}`,
        };
    }

    return {
        ok: true,
        value: parsed.data as DocumentsRouteContract,
        sizeBytes: JSON.stringify(parsed.data).length,
    };
}

export function enforceDocumentsRouteContract(
    contract: DocumentsRouteContract,
): EnforcedDocumentsRouteContract {
    const shapeValidation = validateDocumentsRouteContractShape(contract);
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
