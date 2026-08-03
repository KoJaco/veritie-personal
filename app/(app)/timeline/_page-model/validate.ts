import type { ValidationResult } from "@/lib/contracts/validation";
import { validatePageModel } from "@/lib/page-model";
import type { PageModel } from "@/lib/page-model/types";
import type { TimelineRouteContract } from "./build";
import { timelineRouteContractSchema } from "./schema";

export type EnforcedTimelineRouteContract = {
    pageModelValidation: ValidationResult<PageModel>;
    payload: TimelineRouteContract["railPayloadCandidate"];
};

export function enforceTimelineRouteContract(
    contract: TimelineRouteContract,
): EnforcedTimelineRouteContract {
    const parsed = timelineRouteContractSchema.safeParse(contract);
    if (!parsed.success) {
        const issue = parsed.error.issues[0];
        return {
            pageModelValidation: {
                ok: false,
                errorCode: "INVALID_SHAPE",
                reason: issue?.message ?? "Invalid timeline route contract",
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
