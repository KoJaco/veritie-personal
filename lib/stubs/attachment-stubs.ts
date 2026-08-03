import type {
    AttachmentStub,
    AttachmentDetailStub,
    AttachmentFilters,
    AttachmentSummaryStub,
    RelatedObjectStub,
    AttachmentStatus,
} from "./types";
import { getAssigneeStub, getCurrentUser } from "./assignee";
import {
    randomId,
    randomDate,
    randomElement,
    randomInt,
    randomBoolean,
} from "./helpers";

const FILE_NAMES = [
    "access_review_q1_2026.xlsx",
    "security_policy_v2.3.pdf",
    "mfa_screenshot.png",
    "audit_log_february.csv",
    "vendor_assessment_acme.pdf",
    "incident_report_2026-001.pdf",
    "penetration_test_results.pdf",
    "backup_verification.docx",
    "change_request_4521.pdf",
    "training_completion_report.xlsx",
];

const FILE_TYPES = ["pdf", "xlsx", "png", "csv", "docx"];
const EVIDENCE_TYPES = ["policy", "screenshot", "export", "ticket", "report"];
const SOURCES: AttachmentStub["source"][] = [
    "manual",
    "azure_ad",
    "github",
    "jira",
];

const OBJECT_TITLES = [
    "Access Control Policy",
    "Incident Response Plan",
    "Risk Assessment",
    "Vendor Management",
    "Change Management",
];

const TASK_TITLES = [
    "Complete Risk Assessment for Q1",
    "Review Access Control Policy",
    "Conduct Vendor Security Review",
    "Update Incident Response Procedures",
    "Validate Backup and Recovery Procedures",
];

export function getAttachmentStub(
    overrides?: Partial<AttachmentStub>,
): AttachmentStub {
    const status =
        overrides?.status ??
        randomElement([
            "requested",
            "uploaded",
            "needs_review",
            "accepted",
            "rejected",
            "expired",
        ]);
    const hasLinkedTask = randomBoolean(0.7);
    const hasLinkedObject = randomBoolean(0.5);

    return {
        id: randomId("att"),
        filename: randomElement(FILE_NAMES),
        fileType: randomElement(FILE_TYPES),
        attachmentType: randomBoolean(0.6)
            ? randomElement(EVIDENCE_TYPES)
            : undefined,
        status,
        linkedTaskId: hasLinkedTask ? randomId("task") : undefined,
        linkedTaskTitle: hasLinkedTask ? randomElement(TASK_TITLES) : undefined,
        linkedObjectId: hasLinkedObject ? randomId("obj") : undefined,
        linkedObjectTitle: hasLinkedObject
            ? randomElement(OBJECT_TITLES)
            : undefined,
        uploadedBy:
            status === "requested"
                ? getAssigneeStub()
                : randomBoolean(0.5)
                  ? getCurrentUser()
                  : getAssigneeStub(),
        uploadedAt: randomDate(randomInt(-30, -1)),
        attachmentDate: randomBoolean(0.5)
            ? randomDate(randomInt(-30, 0))
            : undefined,
        validFrom: randomBoolean(0.3)
            ? randomDate(randomInt(-30, -10))
            : undefined,
        validTo: randomBoolean(0.3)
            ? randomDate(randomInt(30, 180))
            : undefined,
        source: randomElement(SOURCES),
        tags: randomBoolean(0.5)
            ? [
                  randomElement([
                      "operations-readiness",
                      "knowledge-hygiene",
                      "workspace-resilience",
                      "access-control",
                      "logging",
                  ]),
              ]
            : undefined,
        updatedAt: randomDate(randomInt(-7, 0)),
        ...overrides,
    };
}

export function getAttachmentsIndexStub(
    count = 15,
    filters?: AttachmentFilters,
): AttachmentStub[] {
    let attachments: AttachmentStub[] = [];

    // Generate attention-needed items first
    const needsAttentionCount = Math.ceil(count * 0.4);
    for (let i = 0; i < needsAttentionCount; i++) {
        const status = randomElement(["needs_review", "requested", "expired"]);
        attachments.push(getAttachmentStub({ status: status as AttachmentStatus }));
    }

    // Generate the rest
    const remaining = count - needsAttentionCount;
    for (let i = 0; i < remaining; i++) {
        attachments.push(
            getAttachmentStub({
                status: randomElement(["uploaded", "accepted"]),
            }),
        );
    }

    // Apply filters
    if (filters) {
        if (filters.status) {
            attachments = attachments.filter((e) =>
                filters.status!.includes(e.status),
            );
        }
        if (filters.linked === "linked") {
            attachments = attachments.filter(
                (e) => e.linkedTaskId || e.linkedObjectId,
            );
        }
        if (filters.linked === "unlinked") {
            attachments = attachments.filter(
                (e) => !e.linkedTaskId && !e.linkedObjectId,
            );
        }
        if (filters.dateRange) {
            const days = parseInt(filters.dateRange, 10);
            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() - days);
            attachments = attachments.filter((e) => new Date(e.uploadedAt) >= cutoff);
        }
        if (filters.fileType && filters.fileType.length > 0) {
            attachments = attachments.filter((e) =>
                filters.fileType!.includes(e.fileType),
            );
        }
        if (filters.source && filters.source.length > 0) {
            attachments = attachments.filter((e) =>
                filters.source!.includes(e.source),
            );
        }
    }

    // Sort: attention items first, then by updated date
    const attentionStatuses = ["needs_review", "requested", "expired"];
    return attachments.sort((a, b) => {
        const aIsAttention = attentionStatuses.includes(a.status);
        const bIsAttention = attentionStatuses.includes(b.status);
        if (aIsAttention && !bIsAttention) return -1;
        if (!aIsAttention && bIsAttention) return 1;
        return (
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
    });
}

export function getAttachmentDetailStub(id: string): AttachmentDetailStub {
    const attachment = getAttachmentStub({ id });
    const linkedChecks: RelatedObjectStub[] = attachment.linkedObjectId
        ? [
              {
                  id: attachment.linkedObjectId,
                  type: "procedure",
                  title: attachment.linkedObjectTitle ?? "Check",
              },
          ]
        : randomBoolean(0.5)
          ? [
                {
                    id: randomId("ctrl"),
                    type: "procedure",
                    title: randomElement(OBJECT_TITLES),
                },
            ]
          : [];

    const reviewDecision =
        attachment.status === "accepted" || attachment.status === "rejected"
            ? {
                  decision: attachment.status as "accepted" | "rejected",
                  reason:
                      attachment.status === "rejected"
                          ? "Attachment does not meet requirements"
                          : undefined,
                  reviewedBy: getAssigneeStub(),
                  reviewedAt: randomDate(randomInt(-5, -1)),
              }
            : undefined;

    return {
        ...attachment,
        sizeBytes: randomInt(50000, 5000000),
        summary:
            attachment.status === "requested"
                ? "An attachment has been requested for this task."
                : `Uploaded attachment for ${attachment.linkedTaskTitle ?? "operational requirements"}.`,
        reviewDecision,
        linkedChecks,
    };
}

// Specialized getters
export function getAttachmentsNeedingAttentionStub(): AttachmentStub[] {
    return getAttachmentsIndexStub(10, {
        status: ["needs_review", "requested", "expired"],
    });
}

export function getUnlinkedAttachmentsStub(): AttachmentStub[] {
    return getAttachmentsIndexStub(5, { linked: "unlinked" });
}

export function getAttachmentSummaryStub(): AttachmentSummaryStub {
    return {
        id: randomId("att"),
        filename: randomElement(FILE_NAMES),
        status: randomElement(["uploaded", "needs_review", "accepted"]),
    };
}
