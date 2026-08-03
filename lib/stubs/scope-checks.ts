import type { ScopeKey } from "@/lib/lens";
import type {
    ObjectCoverageStatus,
    ObjectDetailStub,
    ObjectStub,
} from "./types";
import { getAssigneeStub } from "./assignee";
import { getNormalizedAttachmentSummaryStub } from "@/lib/data-source/stub-normalized-stories";

export type ScopeCheckSeed = {
    id: string;
    title: string;
    summary: string;
    domain: string;
    scopeId: ScopeKey;
    coverageStatus: ObjectCoverageStatus;
    linkedTasksCount: number;
    linkedAttachmentCount: number;
    missingAttachmentCount: number;
    updatedAt: string;
    ownerName: string;
    linkedAttachmentIds?: string[];
};

const SCOPE_CHECK_SEEDS: ScopeCheckSeed[] = [
    {
        id: "chk_or_access_reviews",
        title: "Access ownership reviews",
        summary:
            "Quarterly ownership reviews are incomplete for privileged access.",
        domain: "Identity and Access",
        scopeId: "operations-readiness",
        coverageStatus: "blocked",
        linkedTasksCount: 6,
        linkedAttachmentCount: 1,
        missingAttachmentCount: 3,
        updatedAt: "2026-03-25T09:00:00.000Z",
        ownerName: "Jordan Smith",
    },
    {
        id: "chk_or_vendor_due_diligence",
        title: "Third-party onboarding reviews",
        summary:
            "Third-party review attachment is partially collected for critical vendors.",
        domain: "Third-Party Risk",
        scopeId: "operations-readiness",
        coverageStatus: "blocked",
        linkedTasksCount: 5,
        linkedAttachmentCount: 2,
        missingAttachmentCount: 2,
        updatedAt: "2026-03-24T10:30:00.000Z",
        ownerName: "",
    },
    {
        id: "chk_do_endpoint_monitoring",
        title: "Endpoint Monitoring Coverage",
        summary: "Endpoint telemetry coverage dropped below the target window.",
        domain: "Monitoring",
        scopeId: "delivery-observability",
        coverageStatus: "blocked",
        linkedTasksCount: 7,
        linkedAttachmentCount: 3,
        missingAttachmentCount: 4,
        updatedAt: "2026-03-23T11:15:00.000Z",
        ownerName: "Mina Patel",
    },
    {
        id: "chk_wr_patch_latency",
        title: "Patch Latency Remediation",
        summary:
            "Critical patch cadence is outside the agreed remediation threshold.",
        domain: "Vulnerability Management",
        scopeId: "workspace-resilience",
        coverageStatus: "blocked",
        linkedTasksCount: 8,
        linkedAttachmentCount: 2,
        missingAttachmentCount: 3,
        updatedAt: "2026-03-22T08:45:00.000Z",
        ownerName: "Alex Chen",
    },
    {
        id: "chk_do_backup_restore",
        title: "Backup Restore Validation",
        summary:
            "Recent restore test results are missing for the current reporting period.",
        domain: "Resilience",
        scopeId: "delivery-observability",
        coverageStatus: "blocked",
        linkedTasksCount: 4,
        linkedAttachmentCount: 1,
        missingAttachmentCount: 2,
        updatedAt: "2026-03-21T16:05:00.000Z",
        ownerName: "",
    },
    {
        id: "chk_or_joiner_mover_leaver",
        title: "People lifecycle workflow",
        summary:
            "Offboarding approvals are not consistently recorded in the attachment set.",
        domain: "Identity and Access",
        scopeId: "operations-readiness",
        coverageStatus: "unmapped",
        linkedTasksCount: 4,
        linkedAttachmentCount: 0,
        missingAttachmentCount: 4,
        updatedAt: "2026-03-20T12:00:00.000Z",
        ownerName: "",
    },
    {
        id: "chk_wr_admin_hardening",
        title: "Privileged access safeguards",
        summary:
            "Baseline hardening standard has no mapped implementation attachment yet.",
        domain: "Platform Security",
        scopeId: "workspace-resilience",
        coverageStatus: "unmapped",
        linkedTasksCount: 3,
        linkedAttachmentCount: 0,
        missingAttachmentCount: 3,
        updatedAt: "2026-03-19T09:20:00.000Z",
        ownerName: "",
    },
    {
        id: "chk_do_change_authorisation",
        title: "Production Change Authorisation",
        summary: "Emergency change approvals are documented but not yet mapped.",
        domain: "Change Management",
        scopeId: "delivery-observability",
        coverageStatus: "unmapped",
        linkedTasksCount: 2,
        linkedAttachmentCount: 0,
        missingAttachmentCount: 2,
        updatedAt: "2026-03-18T14:10:00.000Z",
        ownerName: "",
    },
    {
        id: "chk_or_security_awareness",
        title: "Team readiness training",
        summary:
            "Training completion records exist but current acknowledgements are incomplete.",
        domain: "People Operations",
        scopeId: "operations-readiness",
        coverageStatus: "at_risk",
        linkedTasksCount: 3,
        linkedAttachmentCount: 2,
        missingAttachmentCount: 1,
        updatedAt: "2026-03-17T15:30:00.000Z",
        ownerName: "Priya Nair",
        linkedAttachmentIds: ["att_detail", "att_api_1"],
    },
    {
        id: "chk_do_log_retention",
        title: "Log Retention Review",
        summary:
            "Retention coverage is in place but one source remains outside policy.",
        domain: "Monitoring",
        scopeId: "delivery-observability",
        coverageStatus: "at_risk",
        linkedTasksCount: 4,
        linkedAttachmentCount: 3,
        missingAttachmentCount: 1,
        updatedAt: "2026-03-16T10:40:00.000Z",
        ownerName: "Sam Rivera",
    },
    {
        id: "chk_wr_application_allowlisting",
        title: "Approved application controls",
        summary: "Policy enforcement is active, but exception handling needs cleanup.",
        domain: "Endpoint Security",
        scopeId: "workspace-resilience",
        coverageStatus: "at_risk",
        linkedTasksCount: 5,
        linkedAttachmentCount: 3,
        missingAttachmentCount: 1,
        updatedAt: "2026-03-15T13:50:00.000Z",
        ownerName: "Chris Taylor",
    },
    {
        id: "chk_or_incident_triage",
        title: "Incident response handoff",
        summary:
            "Runbooks are current, but on-call handoff attachment is aging out.",
        domain: "Incident Response",
        scopeId: "operations-readiness",
        coverageStatus: "at_risk",
        linkedTasksCount: 2,
        linkedAttachmentCount: 2,
        missingAttachmentCount: 1,
        updatedAt: "2026-03-14T08:25:00.000Z",
        ownerName: "Jamie Wong",
    },
    {
        id: "chk_do_secret_rotation",
        title: "Secret Rotation Operations",
        summary:
            "Rotation jobs are green, but attachment export for one environment is stale.",
        domain: "Platform Security",
        scopeId: "delivery-observability",
        coverageStatus: "at_risk",
        linkedTasksCount: 3,
        linkedAttachmentCount: 4,
        missingAttachmentCount: 1,
        updatedAt: "2026-03-13T17:15:00.000Z",
        ownerName: "Morgan Lee",
    },
    {
        id: "chk_wr_macro_checks",
        title: "Application execution controls",
        summary:
            "Execution restrictions are deployed, but two business exceptions remain open.",
        domain: "Endpoint Security",
        scopeId: "workspace-resilience",
        coverageStatus: "at_risk",
        linkedTasksCount: 4,
        linkedAttachmentCount: 2,
        missingAttachmentCount: 1,
        updatedAt: "2026-03-12T11:35:00.000Z",
        ownerName: "Taylor Brooks",
    },
    {
        id: "chk_or_change_review",
        title: "Change review records",
        summary:
            "Meeting records are complete and linked to approved production releases.",
        domain: "Change Management",
        scopeId: "operations-readiness",
        coverageStatus: "complete",
        linkedTasksCount: 1,
        linkedAttachmentCount: 5,
        missingAttachmentCount: 0,
        updatedAt: "2026-03-11T09:45:00.000Z",
        ownerName: "Jordan Smith",
    },
    {
        id: "chk_or_policy_attestation",
        title: "Policy acknowledgement records",
        summary:
            "Annual acknowledgements are approved and retained in the attachment library.",
        domain: "Governance",
        scopeId: "operations-readiness",
        coverageStatus: "complete",
        linkedTasksCount: 0,
        linkedAttachmentCount: 4,
        missingAttachmentCount: 0,
        updatedAt: "2026-03-10T10:10:00.000Z",
        ownerName: "Dana Harper",
    },
    {
        id: "chk_do_database_audit",
        title: "Database Audit Logging",
        summary: "Audit log collection and retention checks are fully documented.",
        domain: "Monitoring",
        scopeId: "delivery-observability",
        coverageStatus: "complete",
        linkedTasksCount: 1,
        linkedAttachmentCount: 6,
        missingAttachmentCount: 0,
        updatedAt: "2026-03-09T07:55:00.000Z",
        ownerName: "Mina Patel",
    },
    {
        id: "chk_do_mfa_enforcement",
        title: "MFA Enforcement Reporting",
        summary: "MFA enforcement attachment is current across workforce identities.",
        domain: "Identity and Access",
        scopeId: "delivery-observability",
        coverageStatus: "complete",
        linkedTasksCount: 0,
        linkedAttachmentCount: 5,
        missingAttachmentCount: 0,
        updatedAt: "2026-03-08T16:20:00.000Z",
        ownerName: "Alex Chen",
    },
    {
        id: "chk_wr_browser_hardening",
        title: "Browser configuration baseline",
        summary: "Secure browser configuration attachment is current and complete.",
        domain: "Endpoint Security",
        scopeId: "workspace-resilience",
        coverageStatus: "complete",
        linkedTasksCount: 1,
        linkedAttachmentCount: 4,
        missingAttachmentCount: 0,
        updatedAt: "2026-03-07T13:30:00.000Z",
        ownerName: "Chris Taylor",
    },
    {
        id: "chk_wr_usb_procedure",
        title: "Removable media handling",
        summary: "USB device check posture is documented and approved.",
        domain: "Device Check",
        scopeId: "workspace-resilience",
        coverageStatus: "complete",
        linkedTasksCount: 0,
        linkedAttachmentCount: 3,
        missingAttachmentCount: 0,
        updatedAt: "2026-03-06T12:10:00.000Z",
        ownerName: "Taylor Brooks",
    },
    {
        id: "chk_do_vuln_sla",
        title: "Vulnerability SLA Reporting",
        summary:
            "SLA metrics are current, but one legacy scanner feed needs replacement.",
        domain: "Vulnerability Management",
        scopeId: "delivery-observability",
        coverageStatus: "at_risk",
        linkedTasksCount: 2,
        linkedAttachmentCount: 3,
        missingAttachmentCount: 1,
        updatedAt: "2026-03-04T15:20:00.000Z",
        ownerName: "Morgan Lee",
    },
    {
        id: "chk_wr_patch_validation",
        title: "Patch Validation Exceptions",
        summary:
            "Two server groups are still pending validation attachment after rollout.",
        domain: "Vulnerability Management",
        scopeId: "workspace-resilience",
        coverageStatus: "blocked",
        linkedTasksCount: 5,
        linkedAttachmentCount: 1,
        missingAttachmentCount: 2,
        updatedAt: "2026-03-03T08:35:00.000Z",
        ownerName: "",
    },
    {
        id: "chk_or_asset_ownership",
        title: "Asset Ownership Register",
        summary:
            "Critical assets are inventoried, but owner assignments are not fully mapped.",
        domain: "Asset Management",
        scopeId: "operations-readiness",
        coverageStatus: "unmapped",
        linkedTasksCount: 2,
        linkedAttachmentCount: 0,
        missingAttachmentCount: 2,
        updatedAt: "2026-03-02T14:40:00.000Z",
        ownerName: "",
    },
    {
        id: "chk_do_service_continuity",
        title: "Service Continuity Drill",
        summary: "The latest continuity drill is scheduled but not yet documented.",
        domain: "Resilience",
        scopeId: "delivery-observability",
        coverageStatus: "blocked",
        linkedTasksCount: 6,
        linkedAttachmentCount: 0,
        missingAttachmentCount: 3,
        updatedAt: "2026-03-01T10:00:00.000Z",
        ownerName: "Sam Rivera",
    },
    {
        id: "chk_wr_email_filtering",
        title: "Messaging filter exceptions",
        summary:
            "Mail gateway posture is solid, but exception recertification is overdue.",
        domain: "Messaging Security",
        scopeId: "workspace-resilience",
        coverageStatus: "at_risk",
        linkedTasksCount: 3,
        linkedAttachmentCount: 2,
        missingAttachmentCount: 1,
        updatedAt: "2026-02-28T11:45:00.000Z",
        ownerName: "Dana Harper",
    },
    {
        id: "chk_kh_document_ownership",
        title: "Document Ownership Register",
        summary:
            "Several operating guides lack an assigned owner or review cadence.",
        domain: "Documentation Operations",
        scopeId: "knowledge-hygiene",
        coverageStatus: "blocked",
        linkedTasksCount: 4,
        linkedAttachmentCount: 1,
        missingAttachmentCount: 2,
        updatedAt: "2026-02-27T09:30:00.000Z",
        ownerName: "",
    },
    {
        id: "chk_kh_handoff_quality",
        title: "Team Handoff Quality",
        summary:
            "Shift handoff notes are inconsistent across on-call rotations.",
        domain: "Operating Knowledge",
        scopeId: "knowledge-hygiene",
        coverageStatus: "at_risk",
        linkedTasksCount: 3,
        linkedAttachmentCount: 2,
        missingAttachmentCount: 1,
        updatedAt: "2026-02-26T14:15:00.000Z",
        ownerName: "Priya Nair",
    },
    {
        id: "chk_kh_policy_baseline",
        title: "Core Policy Baseline",
        summary:
            "Baseline policy set is drafted but not fully linked to active checks.",
        domain: "Governance",
        scopeId: "knowledge-hygiene",
        coverageStatus: "unmapped",
        linkedTasksCount: 2,
        linkedAttachmentCount: 0,
        missingAttachmentCount: 3,
        updatedAt: "2026-02-25T11:00:00.000Z",
        ownerName: "",
    },
    {
        id: "chk_kh_runbook_currency",
        title: "Runbook Currency Review",
        summary:
            "Two incident runbooks have not been reviewed within the agreed window.",
        domain: "Incident Response",
        scopeId: "knowledge-hygiene",
        coverageStatus: "at_risk",
        linkedTasksCount: 5,
        linkedAttachmentCount: 3,
        missingAttachmentCount: 1,
        updatedAt: "2026-02-24T16:45:00.000Z",
        ownerName: "Jamie Wong",
    },
    {
        id: "chk_kh_knowledge_gaps",
        title: "Knowledge Gap Register",
        summary:
            "Open knowledge gaps are tracked, but supporting attachments are incomplete.",
        domain: "Documentation Operations",
        scopeId: "knowledge-hygiene",
        coverageStatus: "complete",
        linkedTasksCount: 1,
        linkedAttachmentCount: 4,
        missingAttachmentCount: 0,
        updatedAt: "2026-02-23T10:20:00.000Z",
        ownerName: "Dana Harper",
    },
];

const SCOPE_CHECK_MAP = new Map(SCOPE_CHECK_SEEDS.map((seed) => [seed.id, seed]));

const SCOPE_KEYS: ScopeKey[] = [
    "operations-readiness",
    "delivery-observability",
    "workspace-resilience",
    "knowledge-hygiene",
];

function resolveOwner(name: string) {
    if (!name.trim()) {
        return getAssigneeStub();
    }

    return {
        id: `owner_${name.toLowerCase().replace(/\s+/g, "_")}`,
        name,
        email: `${name.toLowerCase().replace(/\s+/g, ".")}@company.com`,
        isMe: name === "Jordan Smith",
    };
}

export function getScopeCheckSeeds(): ScopeCheckSeed[] {
    return SCOPE_CHECK_SEEDS;
}

export function getScopeCheckSeedById(id: string): ScopeCheckSeed | undefined {
    return SCOPE_CHECK_MAP.get(id);
}

export function getScopeCheckTitleById(id: string): string {
    return getScopeCheckSeedById(id)?.title ?? id;
}

export function formatScopeCheckLabels(checkIds: string[]): string {
    return checkIds.map(getScopeCheckTitleById).join(", ");
}

export function getScopeCheckSeedsForScope(
    scopeId: ScopeKey,
    count?: number,
): ScopeCheckSeed[] {
    const items = SCOPE_CHECK_SEEDS.filter((seed) => seed.scopeId === scopeId);
    return count === undefined ? items : items.slice(0, count);
}

export function scopeCheckSeedToObjectStub(seed: ScopeCheckSeed): ObjectStub {
    return {
        id: seed.id,
        title: seed.title,
        summary: seed.summary,
        purpose: seed.summary,
        domain: seed.domain,
        objectType: "procedure",
        status: seed.coverageStatus === "complete" ? "approved" : "in_review",
        coverageStatus: seed.coverageStatus,
        owner: resolveOwner(seed.ownerName),
        version: 1,
        linkedTasksCount: seed.linkedTasksCount,
        linkedAttachmentCount: seed.linkedAttachmentCount,
        missingAttachmentCount: seed.missingAttachmentCount,
        updatedAt: seed.updatedAt,
        scopeIds: [seed.scopeId],
    };
}

export function scopeCheckSeedToObjectDetail(seed: ScopeCheckSeed): ObjectDetailStub {
    const linkedAttachments = (seed.linkedAttachmentIds ?? [])
        .map((attachmentId) => getNormalizedAttachmentSummaryStub(attachmentId))
        .filter(
            (attachment): attachment is NonNullable<typeof attachment> =>
                Boolean(attachment),
        );

    return {
        ...scopeCheckSeedToObjectStub(seed),
        versionHistory: [],
        linkedTasks: [],
        linkedAttachments,
    };
}

export function assignScopeIdsForProcedure(
    objectId: string,
    objectType: ObjectStub["objectType"],
    coverageStatus: ObjectCoverageStatus,
): ScopeKey[] {
    if (objectType !== "procedure" || coverageStatus === "unmapped") {
        return [];
    }

    let hash = 0;
    for (let index = 0; index < objectId.length; index += 1) {
        hash = (hash + objectId.charCodeAt(index) * (index + 1)) % SCOPE_KEYS.length;
    }

    return [SCOPE_KEYS[hash]!];
}
