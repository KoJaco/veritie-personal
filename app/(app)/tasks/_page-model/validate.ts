import type { ValidationResult } from "@/lib/contracts/validation";
import { validatePageModel } from "@/lib/page-model";
import type { PageModel } from "@/lib/page-model/types";
import type { TasksRouteContract } from "./build";
import { tasksRouteContractSchema } from "./schema";

export type EnforcedTasksRouteContract = {
    pageModelValidation: ValidationResult<PageModel>;
    payload: TasksRouteContract["railPayloadCandidate"];
};

export function validateTasksRouteContractShape(
    input: unknown,
): ValidationResult<TasksRouteContract> {
    const parsed = tasksRouteContractSchema.safeParse(input);

    if (!parsed.success) {
        const issue = parsed.error.issues[0];
        const path = issue?.path?.length ? issue.path.join(".") : "root";

        return {
            ok: false,
            errorCode: "INVALID_SHAPE",
            reason: `Tasks route contract schema validation failed at ${path}: ${issue?.message ?? "unknown error"}`,
        };
    }

    return {
        ok: true,
        value: parsed.data as TasksRouteContract,
        sizeBytes: JSON.stringify(parsed.data).length,
    };
}

export function enforceTasksRouteContract(
    contract: TasksRouteContract,
): EnforcedTasksRouteContract {
    const shapeValidation = validateTasksRouteContractShape(contract);

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
