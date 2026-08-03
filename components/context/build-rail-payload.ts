import type {
    PrimaryObject,
    RailContextPayload,
    RailScope,
    ReadinessSnapshot,
    TopBlockingTaskSummary,
} from "./types";
import type { ScopeLens } from "@/lib/lens";
import { PAYLOAD_SOFT_LIMIT_BYTES } from "@/lib/contracts/validation";
import { validateRailContextPayload } from "./validate-rail-context-payload";

type BuildRailPayloadParams = {
    scope: RailScope;
    primaryObject?: PrimaryObject;
    lens?: ScopeLens;
    asOf?: string;
    timezone?: string;
    aggregates?: {
        snapshot?: ReadinessSnapshot;
        topBlockingTaskIds?: string[];
        topBlockingTaskSummaries?: TopBlockingTaskSummary[];
        scopesInView?: string[];
    };
};

function stripUndefinedFields<T extends Record<string, unknown>>(obj: T): T {
    return Object.fromEntries(
        Object.entries(obj).filter(([, value]) => value !== undefined),
    ) as T;
}

export function buildRailPayload({
    scope,
    primaryObject,
    lens,
    asOf,
    timezone,
    aggregates,
}: BuildRailPayloadParams): RailContextPayload | null {
    const resolvedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const data: RailContextPayload["data"] = {
        asOf: asOf ?? new Date().toISOString(),
        timezone: timezone ?? resolvedTimezone ?? "UTC",
    };

    if (lens !== undefined) {
        data.lens = stripUndefinedFields(lens);
    }
    if (aggregates?.snapshot !== undefined) {
        data.snapshot = stripUndefinedFields(aggregates.snapshot);
    }
    if (aggregates?.topBlockingTaskIds !== undefined) {
        data.topBlockingTaskIds = aggregates.topBlockingTaskIds;
    }
    if (aggregates?.topBlockingTaskSummaries !== undefined) {
        data.topBlockingTaskSummaries = aggregates.topBlockingTaskSummaries;
    }
    if (aggregates?.scopesInView !== undefined) {
        data.scopesInView = aggregates.scopesInView;
    }

    const payload: RailContextPayload = {
        scope,
        data,
    };

    if (primaryObject !== undefined) {
        payload.primaryObject = primaryObject;
    }

    const validation = validateRailContextPayload(payload);

    if (!validation.ok) {
        console.warn("[rail] payload_rejected", {
            errorCode: validation.errorCode,
            reason: validation.reason,
            sizeBytes: validation.sizeBytes ?? null,
            scope: scope.type,
        });
        return null;
    }

    if (validation.sizeBytes > PAYLOAD_SOFT_LIMIT_BYTES) {
        console.warn("[rail] payload_soft_limit_exceeded", {
            sizeBytes: validation.sizeBytes,
            softLimitBytes: PAYLOAD_SOFT_LIMIT_BYTES,
            scope: scope.type,
        });
    }

    return validation.value;
}
