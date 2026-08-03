import type {
    PrimaryObject,
    RailContextData,
    RailContextPayload,
    RailScope,
    ReadinessSnapshot,
    TopBlockingTaskSummary,
} from "./types";
import {
    PAYLOAD_HARD_LIMIT_BYTES,
    PAYLOAD_SOFT_LIMIT_BYTES,
    type ValidationResult,
    getUnknownKeys,
    isPlainObject,
    serializeAndMeasure,
    validateJsonSafe,
} from "@/lib/contracts/validation";

const RAIL_TOP_LEVEL_KEYS = ["scope", "primaryObject", "data"] as const;
const RAIL_DATA_KEYS = [
    "asOf",
    "timezone",
    "lens",
    "snapshot",
    "topBlockingTaskIds",
    "topBlockingTaskSummaries",
    "scopesInView",
] as const;
const SNAPSHOT_KEYS = [
    "blockedChecks",
    "overdueTasks",
    "missingAttachments",
    "tasksTotal",
    "tasksInScope",
    "unmappedChecks",
    "criteriaSetStatus",
    "windowStatus",
    "coverageGapDays",
] as const;
const TOP_BLOCKING_SUMMARY_KEYS = ["id", "title"] as const;
const LENS_KEYS = ["scope"] as const;

const VALID_SCOPE_TYPES = new Set<RailScope["type"]>([
    "timeline",
    "captures_index",
    "capture_detail",
    "task_index",
    "task_detail",
    "records_index",
    "records_detail",
    "resources_index",
    "resources_detail",
    "settings",
]);

const DETAIL_SCOPE_TYPES = new Set<RailScope["type"]>([
    "task_detail",
    "records_detail",
    "resources_detail",
    "capture_detail",
]);

const VALID_PRIMARY_OBJECT_TYPES = new Set<PrimaryObject["type"]>([
    "task",
    "attachment",
    "capture",
    "artifact",
    "resource",
    "timeline_event",
]);

const VALID_LENS_SCOPES = new Set([
    "all",
    "finance",
    "fitness",
    "work",
    "personal",
    "admin",
]);

function isNonEmptyString(value: unknown): value is string {
    return typeof value === "string" && value.trim().length > 0;
}

function validateScope(scope: unknown): ValidationResult<RailScope> {
    if (!isPlainObject(scope)) {
        return {
            ok: false,
            errorCode: "INVALID_SHAPE",
            reason: "scope must be a plain object",
        };
    }

    const unknownScopeKeys = getUnknownKeys(scope, ["type", "id"]);
    if (unknownScopeKeys.length > 0) {
        return {
            ok: false,
            errorCode: "INVALID_SHAPE",
            reason: `scope contains unknown keys: ${unknownScopeKeys.join(", ")}`,
        };
    }

    const type = scope.type;
    if (
        typeof type !== "string" ||
        !VALID_SCOPE_TYPES.has(type as RailScope["type"])
    ) {
        return {
            ok: false,
            errorCode: "INVALID_SHAPE",
            reason: "scope.type is invalid",
        };
    }

    if (DETAIL_SCOPE_TYPES.has(type as RailScope["type"])) {
        if (!isNonEmptyString(scope.id)) {
            return {
                ok: false,
                errorCode: "INVALID_SHAPE",
                reason: `${type} requires a non-empty id`,
            };
        }
    } else if ("id" in scope && scope.id !== undefined) {
        return {
            ok: false,
            errorCode: "INVALID_SHAPE",
            reason: `${type} must not include id`,
        };
    }

    return { ok: true, value: scope as RailScope, sizeBytes: 0 };
}

function validatePrimaryObject(
    primaryObject: unknown,
): ValidationResult<PrimaryObject | undefined> {
    if (primaryObject === undefined) {
        return { ok: true, value: undefined, sizeBytes: 0 };
    }

    if (!isPlainObject(primaryObject)) {
        return {
            ok: false,
            errorCode: "INVALID_SHAPE",
            reason: "primaryObject must be a plain object",
        };
    }

    const unknownPrimaryObjectKeys = getUnknownKeys(primaryObject, [
        "type",
        "id",
    ]);
    if (unknownPrimaryObjectKeys.length > 0) {
        return {
            ok: false,
            errorCode: "INVALID_SHAPE",
            reason: `primaryObject contains unknown keys: ${unknownPrimaryObjectKeys.join(", ")}`,
        };
    }

    if (
        typeof primaryObject.type !== "string" ||
        !VALID_PRIMARY_OBJECT_TYPES.has(
            primaryObject.type as PrimaryObject["type"],
        )
    ) {
        return {
            ok: false,
            errorCode: "INVALID_SHAPE",
            reason: "primaryObject.type is invalid",
        };
    }

    if (!isNonEmptyString(primaryObject.id)) {
        return {
            ok: false,
            errorCode: "INVALID_SHAPE",
            reason: "primaryObject.id must be a non-empty string",
        };
    }

    return { ok: true, value: primaryObject as PrimaryObject, sizeBytes: 0 };
}

function validateSnapshot(
    snapshot: unknown,
): ValidationResult<ReadinessSnapshot | undefined> {
    if (snapshot === undefined) {
        return { ok: true, value: undefined, sizeBytes: 0 };
    }

    if (!isPlainObject(snapshot)) {
        return {
            ok: false,
            errorCode: "INVALID_SHAPE",
            reason: "data.snapshot must be a plain object",
        };
    }

    const unknownSnapshotKeys = getUnknownKeys(snapshot, SNAPSHOT_KEYS);
    if (unknownSnapshotKeys.length > 0) {
        return {
            ok: false,
            errorCode: "INVALID_SHAPE",
            reason: `data.snapshot contains unknown keys: ${unknownSnapshotKeys.join(", ")}`,
        };
    }

    const requiredNumericKeys: Array<keyof ReadinessSnapshot> = [
        "blockedChecks",
        "overdueTasks",
        "missingAttachments",
    ];

    for (const key of requiredNumericKeys) {
        if (
            typeof snapshot[key] !== "number" ||
            !Number.isFinite(snapshot[key])
        ) {
            return {
                ok: false,
                errorCode: "INVALID_SHAPE",
                reason: `data.snapshot.${key} must be a finite number`,
            };
        }
    }

    const optionalNumericKeys: Array<keyof ReadinessSnapshot> = [
        "tasksTotal",
        "tasksInScope",
        "unmappedChecks",
        "coverageGapDays",
    ];

    for (const key of optionalNumericKeys) {
        if (
            snapshot[key] !== undefined &&
            (typeof snapshot[key] !== "number" ||
                !Number.isFinite(snapshot[key]))
        ) {
            return {
                ok: false,
                errorCode: "INVALID_SHAPE",
                reason: `data.snapshot.${key} must be a finite number when provided`,
            };
        }
    }

    if (
        snapshot.criteriaSetStatus !== undefined &&
        snapshot.criteriaSetStatus !== "valid" &&
        snapshot.criteriaSetStatus !== "invalid"
    ) {
        return {
            ok: false,
            errorCode: "INVALID_SHAPE",
            reason: "data.snapshot.criteriaSetStatus must be 'valid' or 'invalid'",
        };
    }

    if (
        snapshot.windowStatus !== undefined &&
        snapshot.windowStatus !== "valid" &&
        snapshot.windowStatus !== "invalid"
    ) {
        return {
            ok: false,
            errorCode: "INVALID_SHAPE",
            reason: "data.snapshot.windowStatus must be 'valid' or 'invalid'",
        };
    }

    return { ok: true, value: snapshot as ReadinessSnapshot, sizeBytes: 0 };
}

function validateTopBlockingSummaries(
    summaries: unknown,
): ValidationResult<TopBlockingTaskSummary[] | undefined> {
    if (summaries === undefined) {
        return { ok: true, value: undefined, sizeBytes: 0 };
    }

    if (!Array.isArray(summaries)) {
        return {
            ok: false,
            errorCode: "INVALID_SHAPE",
            reason: "data.topBlockingTaskSummaries must be an array",
        };
    }

    for (const [index, item] of summaries.entries()) {
        if (!isPlainObject(item)) {
            return {
                ok: false,
                errorCode: "INVALID_SHAPE",
                reason: `data.topBlockingTaskSummaries[${index}] must be a plain object`,
            };
        }

        const unknownSummaryKeys = getUnknownKeys(
            item,
            TOP_BLOCKING_SUMMARY_KEYS,
        );
        if (unknownSummaryKeys.length > 0) {
            return {
                ok: false,
                errorCode: "INVALID_SHAPE",
                reason: `data.topBlockingTaskSummaries[${index}] contains unknown keys: ${unknownSummaryKeys.join(", ")}`,
            };
        }

        if (!isNonEmptyString(item.id) || !isNonEmptyString(item.title)) {
            return {
                ok: false,
                errorCode: "INVALID_SHAPE",
                reason: `data.topBlockingTaskSummaries[${index}] must contain non-empty id/title`,
            };
        }
    }

    return {
        ok: true,
        value: summaries as TopBlockingTaskSummary[],
        sizeBytes: 0,
    };
}

function validateStringArray(
    value: unknown,
    path: string,
): ValidationResult<string[] | undefined> {
    if (value === undefined) {
        return { ok: true, value: undefined, sizeBytes: 0 };
    }

    if (!Array.isArray(value)) {
        return {
            ok: false,
            errorCode: "INVALID_SHAPE",
            reason: `${path} must be an array`,
        };
    }

    for (const [index, item] of value.entries()) {
        if (!isNonEmptyString(item)) {
            return {
                ok: false,
                errorCode: "INVALID_SHAPE",
                reason: `${path}[${index}] must be a non-empty string`,
            };
        }
    }

    return { ok: true, value: value as string[], sizeBytes: 0 };
}

function validateLens(
    lens: unknown,
): ValidationResult<RailContextData["lens"] | undefined> {
    if (lens === undefined) {
        return { ok: true, value: undefined, sizeBytes: 0 };
    }

    if (!isPlainObject(lens)) {
        return {
            ok: false,
            errorCode: "INVALID_SHAPE",
            reason: "data.lens must be a plain object",
        };
    }

    const unknownLensKeys = getUnknownKeys(lens, LENS_KEYS);
    if (unknownLensKeys.length > 0) {
        return {
            ok: false,
            errorCode: "INVALID_SHAPE",
            reason: `data.lens contains unknown keys: ${unknownLensKeys.join(", ")}`,
        };
    }

    if (!VALID_LENS_SCOPES.has(String(lens.scope))) {
        return {
            ok: false,
            errorCode: "INVALID_SHAPE",
            reason: "data.lens.scope is invalid",
        };
    }

    return { ok: true, value: lens as RailContextData["lens"], sizeBytes: 0 };
}

function validateData(
    data: unknown,
): ValidationResult<RailContextData | undefined> {
    if (data === undefined) {
        return { ok: true, value: undefined, sizeBytes: 0 };
    }

    if (!isPlainObject(data)) {
        return {
            ok: false,
            errorCode: "INVALID_SHAPE",
            reason: "data must be a plain object",
        };
    }

    const unknownDataKeys = getUnknownKeys(data, RAIL_DATA_KEYS);
    if (unknownDataKeys.length > 0) {
        return {
            ok: false,
            errorCode: "INVALID_SHAPE",
            reason: `data contains unknown keys: ${unknownDataKeys.join(", ")}`,
        };
    }

    if (data.asOf !== undefined && typeof data.asOf !== "string") {
        return {
            ok: false,
            errorCode: "INVALID_SHAPE",
            reason: "data.asOf must be a string",
        };
    }

    if (data.timezone !== undefined && typeof data.timezone !== "string") {
        return {
            ok: false,
            errorCode: "INVALID_SHAPE",
            reason: "data.timezone must be a string",
        };
    }

    const lensValidation = validateLens(data.lens);
    if (!lensValidation.ok) {
        return lensValidation;
    }

    const snapshotValidation = validateSnapshot(data.snapshot);
    if (!snapshotValidation.ok) {
        return snapshotValidation;
    }

    const topBlockingTaskIdsValidation = validateStringArray(
        data.topBlockingTaskIds,
        "data.topBlockingTaskIds",
    );
    if (!topBlockingTaskIdsValidation.ok) {
        return topBlockingTaskIdsValidation;
    }

    const topBlockingTaskSummariesValidation = validateTopBlockingSummaries(
        data.topBlockingTaskSummaries,
    );
    if (!topBlockingTaskSummariesValidation.ok) {
        return topBlockingTaskSummariesValidation;
    }

    const scopesInViewValidation = validateStringArray(
        data.scopesInView,
        "data.scopesInView",
    );
    if (!scopesInViewValidation.ok) {
        return scopesInViewValidation;
    }

    return {
        ok: true,
        value: data as RailContextData,
        sizeBytes: 0,
    };
}

export function validateRailContextPayload(
    input: unknown,
): ValidationResult<RailContextPayload> {
    if (!isPlainObject(input)) {
        return {
            ok: false,
            errorCode: "INVALID_SHAPE",
            reason: "RouteContext payload must be a plain object",
        };
    }

    const unknownTopLevelKeys = getUnknownKeys(input, RAIL_TOP_LEVEL_KEYS);
    if (unknownTopLevelKeys.length > 0) {
        return {
            ok: false,
            errorCode: "UNKNOWN_TOP_LEVEL_KEY",
            reason: `Unknown RouteContext top-level keys: ${unknownTopLevelKeys.join(", ")}`,
        };
    }

    const jsonSafety = validateJsonSafe(input);
    if (!jsonSafety.ok) {
        return jsonSafety;
    }

    const scopeValidation = validateScope(input.scope);
    if (!scopeValidation.ok) {
        return scopeValidation;
    }

    const primaryObjectValidation = validatePrimaryObject(input.primaryObject);
    if (!primaryObjectValidation.ok) {
        return primaryObjectValidation;
    }

    const dataValidation = validateData(input.data);
    if (!dataValidation.ok) {
        return dataValidation;
    }

    const serialization = serializeAndMeasure(input);
    if (!serialization.ok) {
        return serialization;
    }

    if (serialization.sizeBytes > PAYLOAD_HARD_LIMIT_BYTES) {
        return {
            ok: false,
            errorCode: "HARD_LIMIT_EXCEEDED",
            reason: `RouteContext payload exceeds hard limit (${serialization.sizeBytes} > ${PAYLOAD_HARD_LIMIT_BYTES})`,
            sizeBytes: serialization.sizeBytes,
        };
    }

    return {
        ok: true,
        value: input as RailContextPayload,
        sizeBytes: serialization.sizeBytes,
        reason:
            serialization.sizeBytes > PAYLOAD_SOFT_LIMIT_BYTES
                ? `RouteContext payload exceeds soft limit (${serialization.sizeBytes} > ${PAYLOAD_SOFT_LIMIT_BYTES})`
                : undefined,
    };
}
