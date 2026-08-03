import {
    PAYLOAD_HARD_LIMIT_BYTES,
    PAYLOAD_SOFT_LIMIT_BYTES,
    type ValidationResult,
    getUnknownKeys,
    isPlainObject,
    serializeAndMeasure,
    validateJsonSafe,
} from "@/lib/contracts/validation";
import type { EntityRef, PageModel, PageModelSection } from "./types";

const PAGE_MODEL_TOP_LEVEL_KEYS = [
    "meta",
    "view",
    "refs",
    "sections",
    "capabilities",
    "actions",
] as const;

const RAW_DOC_FORBIDDEN_KEYS = new Set([
    "rawMarkdown",
    "rawHtml",
    "markdown",
    "html",
    "document",
    "body",
]);

const META_KEYS = ["title", "description", "breadcrumbs", "aspect"] as const;
const VIEW_KEYS = ["key", "featureFlags"] as const;
const REFS_KEYS = ["primary", "visible"] as const;
const SECTION_KEYS = ["key", "title", "kind", "dataRef", "items"] as const;
const ACTIONS_KEYS = ["available"] as const;
const ENTITY_REF_KEYS = ["kind", "id", "summary", "title", "href"] as const;

function isNonEmptyString(value: unknown): value is string {
    return typeof value === "string" && value.trim().length > 0;
}

function validateEntityRef(
    input: unknown,
    path: string,
): ValidationResult<EntityRef> {
    if (!isPlainObject(input)) {
        return {
            ok: false,
            errorCode: "INVALID_SHAPE",
            reason: `${path} must be a plain object`,
        };
    }

    const unknownKeys = getUnknownKeys(input, ENTITY_REF_KEYS);
    if (unknownKeys.length > 0) {
        return {
            ok: false,
            errorCode: "INVALID_SHAPE",
            reason: `${path} contains unknown keys: ${unknownKeys.join(", ")}`,
        };
    }

    if (!isNonEmptyString(input.kind) || !isNonEmptyString(input.id)) {
        return {
            ok: false,
            errorCode: "INVALID_SHAPE",
            reason: `${path} requires non-empty kind/id`,
        };
    }

    if (input.summary !== undefined && typeof input.summary !== "string") {
        return {
            ok: false,
            errorCode: "INVALID_SHAPE",
            reason: `${path}.summary must be a string`,
        };
    }

    if (input.title !== undefined && typeof input.title !== "string") {
        return {
            ok: false,
            errorCode: "INVALID_SHAPE",
            reason: `${path}.title must be a string`,
        };
    }

    if (input.href !== undefined && typeof input.href !== "string") {
        return {
            ok: false,
            errorCode: "INVALID_SHAPE",
            reason: `${path}.href must be a string`,
        };
    }

    return { ok: true, value: input as EntityRef, sizeBytes: 0 };
}

function containsRawDocumentKeys(value: unknown): boolean {
    if (Array.isArray(value)) {
        return value.some((item) => containsRawDocumentKeys(item));
    }

    if (!isPlainObject(value)) {
        return false;
    }

    for (const [key, nested] of Object.entries(value)) {
        if (RAW_DOC_FORBIDDEN_KEYS.has(key)) {
            return true;
        }

        if (containsRawDocumentKeys(nested)) {
            return true;
        }
    }

    return false;
}

function validateSection(
    section: unknown,
    index: number,
): ValidationResult<PageModelSection> {
    const path = `sections[${index}]`;

    if (!isPlainObject(section)) {
        return {
            ok: false,
            errorCode: "INVALID_SHAPE",
            reason: `${path} must be a plain object`,
        };
    }

    const unknownKeys = getUnknownKeys(section, SECTION_KEYS);
    if (unknownKeys.length > 0) {
        return {
            ok: false,
            errorCode: "INVALID_SHAPE",
            reason: `${path} contains unknown keys: ${unknownKeys.join(", ")}`,
        };
    }

    if (!isNonEmptyString(section.key) || !isNonEmptyString(section.kind)) {
        return {
            ok: false,
            errorCode: "INVALID_SHAPE",
            reason: `${path} requires non-empty key/kind`,
        };
    }

    if (section.title !== undefined && typeof section.title !== "string") {
        return {
            ok: false,
            errorCode: "INVALID_SHAPE",
            reason: `${path}.title must be a string`,
        };
    }

    if (section.dataRef !== undefined) {
        const dataRefValidation = validateEntityRef(
            section.dataRef,
            `${path}.dataRef`,
        );
        if (!dataRefValidation.ok) {
            return dataRefValidation;
        }
    }

    if (section.items !== undefined) {
        if (!Array.isArray(section.items)) {
            return {
                ok: false,
                errorCode: "INVALID_SHAPE",
                reason: `${path}.items must be an array`,
            };
        }

        for (const [itemIndex, item] of section.items.entries()) {
            const itemValidation = validateEntityRef(
                item,
                `${path}.items[${itemIndex}]`,
            );
            if (!itemValidation.ok) {
                return itemValidation;
            }
        }
    }

    if (containsRawDocumentKeys(section)) {
        return {
            ok: false,
            errorCode: "INVALID_SHAPE",
            reason: `${path} contains forbidden raw document fields`,
        };
    }

    return { ok: true, value: section as PageModelSection, sizeBytes: 0 };
}

export function validatePageModel(input: unknown): ValidationResult<PageModel> {
    if (!isPlainObject(input)) {
        return {
            ok: false,
            errorCode: "INVALID_SHAPE",
            reason: "PageModel must be a plain object",
        };
    }

    const unknownTopLevelKeys = getUnknownKeys(input, PAGE_MODEL_TOP_LEVEL_KEYS);
    if (unknownTopLevelKeys.length > 0) {
        return {
            ok: false,
            errorCode: "UNKNOWN_TOP_LEVEL_KEY",
            reason: `Unknown PageModel top-level keys: ${unknownTopLevelKeys.join(", ")}`,
        };
    }

    const jsonSafety = validateJsonSafe(input);
    if (!jsonSafety.ok) {
        return jsonSafety;
    }

    if (!isPlainObject(input.meta)) {
        return {
            ok: false,
            errorCode: "INVALID_SHAPE",
            reason: "meta must be a plain object",
        };
    }

    if (!isPlainObject(input.view)) {
        return {
            ok: false,
            errorCode: "INVALID_SHAPE",
            reason: "view must be a plain object",
        };
    }

    if (!isPlainObject(input.capabilities)) {
        return {
            ok: false,
            errorCode: "INVALID_SHAPE",
            reason: "capabilities must be a plain object",
        };
    }

    if (!isPlainObject(input.actions)) {
        return {
            ok: false,
            errorCode: "INVALID_SHAPE",
            reason: "actions must be a plain object",
        };
    }

    const unknownMetaKeys = getUnknownKeys(input.meta, META_KEYS);
    if (unknownMetaKeys.length > 0) {
        return {
            ok: false,
            errorCode: "INVALID_SHAPE",
            reason: `meta contains unknown keys: ${unknownMetaKeys.join(", ")}`,
        };
    }

    if (!isNonEmptyString(input.meta.title)) {
        return {
            ok: false,
            errorCode: "INVALID_SHAPE",
            reason: "meta.title must be a non-empty string",
        };
    }

    if (input.meta.description !== undefined && typeof input.meta.description !== "string") {
        return {
            ok: false,
            errorCode: "INVALID_SHAPE",
            reason: "meta.description must be a string",
        };
    }

    if (!Array.isArray(input.meta.breadcrumbs)) {
        return {
            ok: false,
            errorCode: "INVALID_SHAPE",
            reason: "meta.breadcrumbs must be an array",
        };
    }

    for (const [index, breadcrumb] of input.meta.breadcrumbs.entries()) {
        if (!isPlainObject(breadcrumb)) {
            return {
                ok: false,
                errorCode: "INVALID_SHAPE",
                reason: `meta.breadcrumbs[${index}] must be a plain object`,
            };
        }

        const unknownBreadcrumbKeys = getUnknownKeys(breadcrumb, ["label", "href"]);
        if (unknownBreadcrumbKeys.length > 0) {
            return {
                ok: false,
                errorCode: "INVALID_SHAPE",
                reason: `meta.breadcrumbs[${index}] contains unknown keys: ${unknownBreadcrumbKeys.join(", ")}`,
            };
        }

        if (!isNonEmptyString(breadcrumb.label)) {
            return {
                ok: false,
                errorCode: "INVALID_SHAPE",
                reason: `meta.breadcrumbs[${index}].label must be a non-empty string`,
            };
        }

        if (breadcrumb.href !== undefined && typeof breadcrumb.href !== "string") {
            return {
                ok: false,
                errorCode: "INVALID_SHAPE",
                reason: `meta.breadcrumbs[${index}].href must be a string`,
            };
        }
    }

    if (
        !isPlainObject(input.meta.aspect) ||
        !isNonEmptyString(input.meta.aspect.aspectId)
    ) {
        return {
            ok: false,
            errorCode: "INVALID_SHAPE",
            reason: "meta.aspect.aspectId must be a non-empty string",
        };
    }

    const unknownViewKeys = getUnknownKeys(input.view, VIEW_KEYS);
    if (unknownViewKeys.length > 0) {
        return {
            ok: false,
            errorCode: "INVALID_SHAPE",
            reason: `view contains unknown keys: ${unknownViewKeys.join(", ")}`,
        };
    }

    if (!isNonEmptyString(input.view.key)) {
        return {
            ok: false,
            errorCode: "INVALID_SHAPE",
            reason: "view.key must be a non-empty string",
        };
    }

    if (input.view.featureFlags !== undefined) {
        if (!isPlainObject(input.view.featureFlags)) {
            return {
                ok: false,
                errorCode: "INVALID_SHAPE",
                reason: "view.featureFlags must be a plain object",
            };
        }

        for (const [flag, value] of Object.entries(input.view.featureFlags)) {
            if (typeof value !== "boolean") {
                return {
                    ok: false,
                    errorCode: "INVALID_SHAPE",
                    reason: `view.featureFlags.${flag} must be boolean`,
                };
            }
        }
    }

    if (input.refs !== undefined) {
        if (!isPlainObject(input.refs)) {
            return {
                ok: false,
                errorCode: "INVALID_SHAPE",
                reason: "refs must be a plain object",
            };
        }

        const unknownRefsKeys = getUnknownKeys(input.refs, REFS_KEYS);
        if (unknownRefsKeys.length > 0) {
            return {
                ok: false,
                errorCode: "INVALID_SHAPE",
                reason: `refs contains unknown keys: ${unknownRefsKeys.join(", ")}`,
            };
        }

        if (input.refs.primary !== undefined) {
            const primaryValidation = validateEntityRef(
                input.refs.primary,
                "refs.primary",
            );
            if (!primaryValidation.ok) {
                return primaryValidation;
            }
        }

        if (input.refs.visible !== undefined) {
            if (!Array.isArray(input.refs.visible)) {
                return {
                    ok: false,
                    errorCode: "INVALID_SHAPE",
                    reason: "refs.visible must be an array",
                };
            }

            for (const [index, item] of input.refs.visible.entries()) {
                const itemValidation = validateEntityRef(
                    item,
                    `refs.visible[${index}]`,
                );
                if (!itemValidation.ok) {
                    return itemValidation;
                }
            }
        }
    }

    if (!Array.isArray(input.sections)) {
        return {
            ok: false,
            errorCode: "INVALID_SHAPE",
            reason: "sections must be an array",
        };
    }

    for (const [index, section] of input.sections.entries()) {
        const sectionValidation = validateSection(section, index);
        if (!sectionValidation.ok) {
            return sectionValidation;
        }
    }

    const unknownActionKeys = getUnknownKeys(input.actions, ACTIONS_KEYS);
    if (unknownActionKeys.length > 0) {
        return {
            ok: false,
            errorCode: "INVALID_SHAPE",
            reason: `actions contains unknown keys: ${unknownActionKeys.join(", ")}`,
        };
    }

    if (
        !Array.isArray(input.actions.available) ||
        input.actions.available.some((actionKey) => !isNonEmptyString(actionKey))
    ) {
        return {
            ok: false,
            errorCode: "INVALID_SHAPE",
            reason: "actions.available must be an array of non-empty strings",
        };
    }

    for (const [capabilityKey, capabilityValue] of Object.entries(
        input.capabilities,
    )) {
        if (typeof capabilityValue !== "boolean") {
            return {
                ok: false,
                errorCode: "INVALID_SHAPE",
                reason: `capabilities.${capabilityKey} must be boolean`,
            };
        }
    }

    const serialization = serializeAndMeasure(input);
    if (!serialization.ok) {
        return serialization;
    }

    if (serialization.sizeBytes > PAYLOAD_HARD_LIMIT_BYTES) {
        return {
            ok: false,
            errorCode: "HARD_LIMIT_EXCEEDED",
            reason: `PageModel exceeds hard limit (${serialization.sizeBytes} > ${PAYLOAD_HARD_LIMIT_BYTES})`,
            sizeBytes: serialization.sizeBytes,
        };
    }

    return {
        ok: true,
        value: input as PageModel,
        sizeBytes: serialization.sizeBytes,
        reason:
            serialization.sizeBytes > PAYLOAD_SOFT_LIMIT_BYTES
                ? `PageModel exceeds soft limit (${serialization.sizeBytes} > ${PAYLOAD_SOFT_LIMIT_BYTES})`
                : undefined,
    };
}
