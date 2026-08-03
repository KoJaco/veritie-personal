import type {
    ObjectStub,
    ObjectDetailStub,
    ObjectFilters,
    VersionStub,
    TaskStub,
    AttachmentSummaryStub,
    ObjectType,
} from "./types";
import { getAssigneeStub, getCurrentUser } from "./assignee";
import { getTaskStub } from "./task";
import { randomId, randomDate, randomInt, randomBoolean } from "./helpers";
import { getAttachmentSummaryStub } from "./attachment-stubs";
import {
    getNormalizedAttachmentSummaryStub,
    getNormalizedObjectSeed,
    getNormalizedObjectVersionHistory,
    getNormalizedTaskStub,
    getStoryUser,
    NORMALIZED_OBJECT_IDS,
    type NormalizedObjectSeed,
} from "@/lib/data-source/stub-normalized-stories";
import { assignScopeIdsForProcedure } from "./scope-checks";

function normalizedObjectSeedToObjectStub(
    seed: NormalizedObjectSeed,
    overrides?: Partial<ObjectStub>,
): ObjectStub {
    return {
        id: seed.id,
        title: seed.title,
        summary: seed.summary,
        purpose: seed.purpose,
        domain: seed.domain,
        objectType: seed.objectType,
        status: seed.status,
        coverageStatus: seed.coverageStatus,
        owner: getStoryUser(seed.ownerId),
        version: seed.version,
        linkedTasksCount: seed.linkedTaskIds.length,
        linkedAttachmentCount: seed.linkedAttachmentIds.length,
        missingAttachmentCount: seed.missingAttachmentCount,
        updatedAt: seed.updatedAt,
        scopeIds: [...seed.scopeIds],
        relatedTaskId: seed.relatedTaskId,
        ...overrides,
    };
}

export function buildObjectMarkdownContent(stub: ObjectStub): string {
    return `# ${stub.title}

${stub.summary}

## Purpose

${stub.purpose ?? "No purpose documented."}

## Domain

${stub.domain}

## Status

- Document status: **${stub.status}**
- Coverage status: **${stub.coverageStatus}**
- Version: **${stub.version}**
`;
}

export function getNormalizedObjectStubs(): ObjectStub[] {
    return NORMALIZED_OBJECT_IDS.map((id) => {
        const seed = getNormalizedObjectSeed(id);
        if (!seed) {
            throw new Error(`Missing normalized object seed: ${id}`);
        }

        return normalizedObjectSeedToObjectStub(seed);
    });
}

export function getObjectStub(overrides?: Partial<ObjectStub>): ObjectStub {
    const objectType =
        overrides?.objectType ??
        randomElement(["policy", "procedure", "risk", "assessment"]);
    const status =
        overrides?.status ??
        randomElement(["draft", "in_review", "approved", "archived"]);
    const coverageStatus =
        overrides?.coverageStatus ??
        randomElement(["complete", "blocked", "at_risk", "unmapped"]);
    const isOwnerMe = randomBoolean(0.3);

    const OBJECT_SUMMARIES: Record<ObjectType, string[]> = {
        policy: [
            "Policy baseline defining ownership, scope, and required checks.",
            "Governance policy draft used for operations readiness review.",
            "Operational policy covering mandatory security procedures.",
        ],
        procedure: [
            "Check implementation detail covering workflows and validation steps.",
            "Operational check narrative for internal and reviewer review.",
            "Technical check definition with assigned check owners.",
        ],
        risk: [
            "Risk artifact capturing treatment plan and current risk posture.",
            "Risk assessment summary with remediation priorities and owners.",
            "Risk register extract focused on open high-impact findings.",
        ],
        assessment: [
            "Assessment summary artifact tracking scope-level coverage posture.",
            "Readiness assessment output with mapped checks and open gaps.",
            "Scope assessment note for review preparation and reporting.",
        ],
    };

    const OBJECT_PURPOSES: Record<ObjectType, string[]> = {
        policy: [
            "Define expected check behavior and governance responsibilities.",
            "Document operations intent and required operational guardrails.",
        ],
        procedure: [
            "Describe how check requirements are implemented and verified.",
            "Provide operating details for review and internal assurance use.",
        ],
        risk: [
            "Track remediation accountability for accepted and active risks.",
            "Support risk-informed prioritization across operations workstreams.",
        ],
        assessment: [
            "Summarize scope coverage and identify highest-priority gaps.",
            "Capture current operations posture for planning and execution.",
        ],
    };

    const OBJECT_DOMAINS: Record<ObjectType, string[]> = {
        policy: ["Access Management", "Governance", "Operations Program"],
        procedure: ["Identity and Access", "Security Operations", "Monitoring"],
        risk: [
            "Risk and Operations",
            "Remediation Program",
            "Third-Party Risk",
        ],
        assessment: ["Assurance", "Check Assessment", "Attachment Operations"],
    };

    const OBJECT_TITLES: Record<ObjectType, string[]> = {
        policy: [
            "Access Control Policy",
            "Information Security Policy",
            "Data Protection Policy",
            "Incident Response Policy",
        ],
        procedure: [
            "Access Provisioning Check",
            "Encryption Standards",
            "Log Monitoring Check",
            "Backup Verification Check",
        ],
        risk: [
            "Vendor Risk Assessment",
            "System Risk Register",
            "Data Breach Risk Analysis",
            "Third-Party Risk Matrix",
        ],
        assessment: [
            "Operations Readiness Assessment",
            "Standards Gap Analysis",
            "Resilience Maturity Assessment",
            "Security Checks Assessment",
        ],
    };

    const objectId = overrides?.id ?? randomId("obj");
    const scopeIds =
        overrides?.scopeIds ??
        (coverageStatus === "unmapped"
            ? []
            : assignScopeIdsForProcedure(objectId, objectType, coverageStatus));

    return {
        id: objectId,
        title: overrides?.title ?? randomElement(OBJECT_TITLES[objectType]),
        summary:
            overrides?.summary ?? randomElement(OBJECT_SUMMARIES[objectType]),
        purpose:
            overrides?.purpose ?? randomElement(OBJECT_PURPOSES[objectType]),
        domain: overrides?.domain ?? randomElement(OBJECT_DOMAINS[objectType]),
        objectType,
        status,
        coverageStatus,
        owner: isOwnerMe ? getCurrentUser() : getAssigneeStub(),
        version: randomInt(1, 5),
        linkedTasksCount: randomInt(0, 8),
        linkedAttachmentCount: randomInt(0, 12),
        missingAttachmentCount: randomInt(0, 5),
        updatedAt: randomDate(randomInt(-30, 0)),
        scopeIds,
        relatedTaskId: overrides?.relatedTaskId ?? randomRelatedTaskId(),
        ...overrides,
    };
}

export function getObjectsIndexStub(
    count = 12,
    filters?: ObjectFilters,
): ObjectStub[] {
    let objects = getNormalizedObjectStubs();

    if (filters) {
        if (filters.type && filters.type.length > 0) {
            objects = objects.filter((object) =>
                filters.type!.includes(object.objectType),
            );
        }
        if (filters.status && filters.status.length > 0) {
            objects = objects.filter((object) =>
                filters.status!.includes(object.status),
            );
        }
    }

    if (objects.length < count) {
        const additionalCount = count - objects.length;
        for (let i = 0; i < additionalCount; i += 1) {
            objects.push(getObjectStub());
        }
    }

    return objects
        .slice(0, count)
        .sort(
            (left, right) =>
                new Date(right.updatedAt).getTime() -
                new Date(left.updatedAt).getTime(),
        );
}

export function getObjectDetailStub(
    id: string,
    objectType?: ObjectStub["objectType"],
): ObjectDetailStub {
    const normalized = getNormalizedObjectSeed(id);
    if (normalized) {
        const baseStub = normalizedObjectSeedToObjectStub(normalized);

        return {
            ...baseStub,
            markdownContent: buildObjectMarkdownContent(baseStub),
            versionHistory: getNormalizedObjectVersionHistory(id) ?? [],
            linkedTasks: normalized.linkedTaskIds
                .map((taskId) => getNormalizedTaskStub(taskId))
                .filter((task): task is NonNullable<typeof task> => Boolean(task)),
            linkedAttachments: normalized.linkedAttachmentIds
                .map((attachmentId) =>
                    getNormalizedAttachmentSummaryStub(attachmentId),
                )
                .filter(
                    (attachment): attachment is NonNullable<typeof attachment> =>
                        Boolean(attachment),
                ),
        };
    }

    const baseStub = getObjectStub({
        id,
        objectType:
            objectType ??
            randomElement(["policy", "procedure", "risk", "assessment"]),
    });

    const versionHistory: VersionStub[] = [];
    for (let i = baseStub.version; i >= 1; i -= 1) {
        versionHistory.push({
            number: i,
            createdAt: randomDate(randomInt(-90, -30 * (baseStub.version - i))),
            createdBy: randomBoolean(0.5)
                ? getCurrentUser()
                : getAssigneeStub(),
            changeSummary:
                i === baseStub.version
                    ? "Current version"
                    : i === 1
                      ? "Initial version"
                      : randomElement([
                            "Updated content",
                            "Minor revisions",
                            "Review updates",
                        ]),
        });
    }

    const linkedTasks: TaskStub[] = [];
    for (let i = 0; i < Math.min(baseStub.linkedTasksCount, 3); i += 1) {
        linkedTasks.push(getTaskStub());
    }

    const linkedAttachments: AttachmentSummaryStub[] = [];
    for (let i = 0; i < Math.min(baseStub.linkedAttachmentCount, 4); i += 1) {
        linkedAttachments.push(getAttachmentSummaryStub());
    }

    return {
        ...baseStub,
        markdownContent: buildObjectMarkdownContent(baseStub),
        versionHistory,
        linkedTasks,
        linkedAttachments,
    };
}

export function getPoliciesStub(): ObjectStub[] {
    return getObjectsIndexStub(6, { type: ["policy"] });
}

export function getControlsStub(): ObjectStub[] {
    return getObjectsIndexStub(8, { type: ["procedure"] });
}

export function getAssessmentsStub(): ObjectStub[] {
    return getObjectsIndexStub(4, { type: ["assessment"] });
}

function randomElement<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
}

function randomRelatedTaskId(): string | undefined {
    return randomBoolean(0.7) ? randomId("task") : undefined;
}
