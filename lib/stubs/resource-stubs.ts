import type { ScopeKey } from "@/lib/lens";
import type {
    AssetCategory,
    AssetConnectionLinkStub,
    ResourceCheckLinkStub,
    AssetCoverageFlags,
    AssetCriticality,
    AssetSensitivity,
    AssetStub,
    AssigneeStub,
} from "./types";
import { getAssigneeStub, getCurrentUser } from "./assignee";
import { getConnectionsStub } from "./connection";
import { randomBoolean, randomDate, randomElement, randomInt } from "./helpers";
import {
    getNormalizedResourceOverride,
    getStoryUser,
} from "@/lib/data-source/stub-normalized-stories";

const ASSET_NAMES: Record<AssetCategory, string[]> = {
    device: [
        "Corporate MacBook Fleet",
        "Production Bastion Hosts",
        "Engineering YubiKey Inventory",
        "Support Team Laptops",
    ],
    service: [
        "Identity Platform",
        "Customer API",
        "Payroll Service",
        "Security Event Pipeline",
    ],
    resource: [
        "AWS Production Account",
        "Customer Data Warehouse",
        "Primary Okta Tenant",
        "GitHub Enterprise Org",
    ],
    entity: [
        "People Operations",
        "Third-Party Payroll Vendor",
        "Finance Department",
        "Managed SOC Partner",
    ],
};

const ASSET_SUMMARIES: Record<AssetCategory, string[]> = {
    device: [
        "Endpoint inventory used to track ownership, monitoring, and attachment posture.",
        "Managed device group with patching and access posture considerations.",
    ],
    service: [
        "Operational service supporting operations-relevant workflows and check execution.",
        "Business-critical service with ownership and attachment expectations.",
    ],
    resource: [
        "Shared technical resource with explicit ownership and check relationships.",
        "Platform resource that contributes posture signals across multiple scopes.",
    ],
    entity: [
        "Real-world organizational entity that owns or influences operations posture.",
        "External or internal entity with accountability over attachments and checks.",
    ],
};

const POSTURE_SUMMARIES: Record<AssetCategory, string[]> = {
    device: [
        "Device posture is driven by owner assignment, monitoring coverage, and attachment freshness.",
        "Endpoint operations depends on strong ownership, inventory hygiene, and check mappings.",
    ],
    service: [
        "Service posture reflects monitoring depth, mapped checks, and current supporting attachments.",
        "Service readiness is strongest when ownership, attachment, and check links stay aligned.",
    ],
    resource: [
        "Resource posture highlights gaps between assigned checks and operational monitoring coverage.",
        "Resource readiness is bounded by attachment recency and explicit check accountability.",
    ],
    entity: [
        "Entity posture summarizes who is accountable and how supporting attachments map into scopes.",
        "Entity readiness depends on explicit ownership, relevant checks, and auditable linkage.",
    ],
};

const SCOPE_PRESETS: ScopeKey[][] = [[], [], [], [], []];

const CONTROL_PRESETS: ResourceCheckLinkStub[][] = [
    [
        { id: "policy-access-governance", title: "Access Control Policy" },
        { id: "check-narrative", title: "Check Narrative" },
    ],
    [{ id: "config-snippet", title: "Config Snippet" }],
    [
        { id: "gap-analysis-standards", title: "Standards Gap Analysis" },
        { id: "attachment-mapping-summary", title: "Attachment Mapping Summary" },
    ],
];

const TASK_PRESETS = [
    "task-ac-policy-review",
    "task-access-provisioning-validation",
    "task-iso-gap-remediation",
    "task-remediation-program",
    "task-attachment-coverage-reconciliation",
    "task-config-hardening-review",
] as const;

const EVIDENCE_PRESETS = [
    { id: "att_versioned", filename: "access_review_export_q1.xlsx" },
    { id: "att_policy_packet", filename: "policy_packet_v3.pdf" },
    { id: "att_hris_access", filename: "hris_access_review.csv" },
    { id: "att_aws_config", filename: "aws_config_snapshot.json" },
] as const;

type AssetSeed = {
    id: string;
    name: string;
    category: AssetCategory;
    summary: string;
    postureSummary: string;
    owner: AssigneeStub | null;
    criticality: AssetCriticality;
    sensitivity: AssetSensitivity;
    scopeIds: ScopeKey[];
    coverageFlags: AssetCoverageFlags;
    linkedChecks: ResourceCheckLinkStub[];
    linkedTaskIds: string[];
    linkedAttachments: Array<{ id: string; filename: string }>;
    linkedConnections: AssetConnectionLinkStub[];
    updatedAt: string;
};

function getRandomOwner(): AssigneeStub | null {
    if (randomBoolean(0.15)) {
        return null;
    }
    return randomBoolean(0.5) ? getCurrentUser() : getAssigneeStub();
}

function getCoverageFlags(owner: AssigneeStub | null): AssetCoverageFlags {
    const hasAttachments = randomBoolean(0.7);
    const mappedToChecks = randomBoolean(0.8);

    return {
        hasOwner: Boolean(owner),
        hasAttachments,
        mappedToChecks,
        monitored: randomBoolean(0.75),
    };
}

function getLinkedConnections(count: number): AssetConnectionLinkStub[] {
    return getConnectionsStub()
        .slice(0, count)
        .map((connection) => ({
            connectionId: connection.id,
            connectionLabel: connection.label,
            connectionKey: connection.key,
            status: connection.status,
        }));
}

function buildSeed(index: number, category: AssetCategory): AssetSeed {
    const seedId = `resource_seed_${index + 1}`;
    const override = getNormalizedResourceOverride(seedId);
    if (override) {
        return {
            id: override.id,
            name: override.name,
            category: override.category,
            summary: override.summary,
            postureSummary: override.postureSummary,
            owner: override.ownerId ? getStoryUser(override.ownerId) : null,
            criticality: override.criticality,
            sensitivity: override.sensitivity,
            scopeIds: [...override.scopeIds],
            coverageFlags: { ...override.coverageFlags },
            linkedChecks: override.linkedChecks.map((item) => ({ ...item })),
            linkedTaskIds: [...override.linkedTaskIds],
            linkedAttachments: override.linkedAttachments.map((item) => ({ ...item })),
            linkedConnections:
                override.linkedConnections?.map((item) => ({ ...item })) ??
                getLinkedConnections(2),
            updatedAt: override.updatedAt,
        };
    }

    const owner = getRandomOwner();
    const linkedChecks = CONTROL_PRESETS[index % CONTROL_PRESETS.length] ?? [];
    const linkedTaskIds = TASK_PRESETS.slice(
        index % 2,
        Math.min(TASK_PRESETS.length, index % 2 + 2),
    );
    const linkedAttachments = EVIDENCE_PRESETS.slice(
        index % 2,
        Math.min(EVIDENCE_PRESETS.length, index % 2 + 2),
    );
    const scopeIds = SCOPE_PRESETS[index % SCOPE_PRESETS.length] ?? [];
    const coverageFlags = getCoverageFlags(owner);

    return {
        id: seedId,
        name: ASSET_NAMES[category][index % ASSET_NAMES[category].length]!,
        category,
        summary: ASSET_SUMMARIES[category][index % ASSET_SUMMARIES[category].length]!,
        postureSummary:
            POSTURE_SUMMARIES[category][index % POSTURE_SUMMARIES[category].length]!,
        owner,
        criticality: randomElement(["low", "medium", "high", "critical"]),
        sensitivity: randomElement(["public", "internal", "restricted"]),
        scopeIds,
        coverageFlags: {
            ...coverageFlags,
            mappedToChecks: linkedChecks.length > 0 && coverageFlags.mappedToChecks,
        },
        linkedChecks,
        linkedTaskIds: [...linkedTaskIds],
        linkedAttachments: linkedAttachments.map((item) => ({ ...item })),
        linkedConnections: getLinkedConnections((index % 2) + 1),
        updatedAt: randomDate(randomInt(-20, 0)),
    };
}

export function getAssetStub(seed: AssetSeed): AssetStub {
    return {
        id: seed.id,
        name: seed.name,
        category: seed.category,
        summary: seed.summary,
        owner: seed.owner ? { ...seed.owner } : null,
        criticality: seed.criticality,
        sensitivity: seed.sensitivity,
        scopeIds: [...seed.scopeIds],
        coverageFlags: { ...seed.coverageFlags },
        linkedChecksCount: seed.linkedChecks.length,
        linkedTasksCount: seed.linkedTaskIds.length,
        linkedAttachmentCount: seed.linkedAttachments.length,
        linkedConnectionsCount: seed.linkedConnections.length,
        updatedAt: seed.updatedAt,
    };
}

export function getSeedResourceRecords(): AssetSeed[] {
    const categories: AssetCategory[] = [
        "device",
        "service",
        "resource",
        "entity",
        "device",
        "service",
        "resource",
        "entity",
        "service",
        "resource",
        "device",
        "entity",
    ];

    return categories.map((category, index) => buildSeed(index, category));
}
