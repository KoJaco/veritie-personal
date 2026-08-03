import type { ValidationResult } from "@/lib/contracts/validation";
import { validatePageModel } from "@/lib/page-model";
import type { PageModel } from "@/lib/page-model/types";
import type { CapturesRouteContract } from "./build";
import { capturesRouteContractSchema } from "./schema";

export type EnforcedCapturesRouteContract = {
    pageModelValidation: ValidationResult<PageModel>;
    payload: CapturesRouteContract["railPayloadCandidate"];
};

export function enforceCapturesRouteContract(
    contract: CapturesRouteContract,
): EnforcedCapturesRouteContract {
    const parsed = capturesRouteContractSchema.safeParse(contract);
    if (!parsed.success) {
        const issue = parsed.error.issues[0];
        return {
            pageModelValidation: {
                ok: false,
                errorCode: "INVALID_SHAPE",
                reason: issue?.message ?? "Invalid captures route contract",
            },
            payload: null,
        };
    }

    const pageModelValidation = validatePageModel(parsed.data.pageModel);
    if (!pageModelValidation.ok) {
        return { pageModelValidation, payload: null };
    }

    return {
        pageModelValidation,
        payload: parsed.data.railPayloadCandidate,
    };
}
