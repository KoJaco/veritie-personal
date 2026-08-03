import type { ConnectionCatalogEntryStub, ConnectionStub } from "./types";
import { getAssigneeStub, getCurrentUser } from "./assignee";
import { randomDate, randomInt, randomBoolean, randomElement } from "./helpers";

const INTEGRATIONS: Omit<
    ConnectionCatalogEntryStub,
    | "id"
    | "status"
    | "connectedAt"
    | "lastSyncedAt"
    | "connectedBy"
    | "externalAccountLabel"
    | "health"
>[] = [
    {
        key: "azure_ad",
        label: "Azure Active Directory",
        icon: "azure",
        authType: "oauth",
        capabilities: ["users", "groups", "access_reviews", "audit_logs"],
        automation: {
            automatedChecks: 18,
            manualChecksRemaining: 5,
            attachmentTypes: [
                "user inventory",
                "access reviews",
                "MFA posture",
            ],
            coverageSummary:
                "Keeps identity attachments fresh for reviewer attestations and MFA posture checks.",
        },
        recommendedScopes: ["Directory users", "Security groups", "Audit logs"],
    },
    {
        key: "github",
        label: "GitHub",
        icon: "github",
        authType: "oauth",
        capabilities: ["repos", "pull_requests", "issues", "commits"],
        automation: {
            automatedChecks: 12,
            manualChecksRemaining: 7,
            attachmentTypes: [
                "branch protection exports",
                "repo inventory",
                "change reviews",
            ],
            coverageSummary:
                "Surfaces engineering check attachment around reviews, repository hygiene, and release change trails.",
        },
        recommendedScopes: ["Repositories", "Pull requests", "Audit events"],
    },
    {
        key: "jira",
        label: "Jira",
        icon: "jira",
        authType: "api_key",
        capabilities: ["issues", "projects", "users", "workflows"],
        automation: {
            automatedChecks: 9,
            manualChecksRemaining: 8,
            attachmentTypes: [
                "change tickets",
                "approval workflows",
                "incident status",
            ],
            coverageSummary:
                "Turns delivery workflows and approvals into attachments for change-management checks.",
        },
        recommendedScopes: ["Projects", "Issue history", "Workflow configuration"],
    },
    {
        key: "okta",
        label: "Okta",
        icon: "okta",
        authType: "oauth",
        capabilities: ["users", "groups", "applications", "audit_logs"],
        automation: {
            automatedChecks: 15,
            manualChecksRemaining: 4,
            attachmentTypes: [
                "SSO posture",
                "group inventory",
                "application access",
            ],
            coverageSummary:
                "Automates access posture attachment across user lifecycle, MFA, and app access reviews.",
        },
        recommendedScopes: ["Users", "Groups", "Applications"],
    },
    {
        key: "slack",
        label: "Slack",
        icon: "slack",
        authType: "oauth",
        capabilities: ["channels", "users", "messages"],
        automation: {
            automatedChecks: 6,
            manualChecksRemaining: 9,
            attachmentTypes: [
                "incident channels",
                "on-call comms",
                "access requests",
            ],
            coverageSummary:
                "Captures communication attachments for approvals, incident response, and operational coordination.",
        },
        recommendedScopes: ["Workspace users", "Public channels", "Audit logs"],
    },
];

export function getConnectionStub(
    overrides?: Partial<ConnectionCatalogEntryStub>,
): ConnectionCatalogEntryStub {
    const integration = overrides?.key
        ? (INTEGRATIONS.find((i) => i.key === overrides.key) ?? INTEGRATIONS[0])
        : INTEGRATIONS[Math.floor(Math.random() * INTEGRATIONS.length)];
    const status =
        overrides?.status ??
        (Math.random() > 0.6
            ? "connected"
            : randomElement(["disconnected", "connected", "error", "pending"]));
    const isConnected = status === "connected";

    const health: ConnectionStub["health"] = isConnected
        ? {
              status: randomBoolean(0.8)
                  ? "healthy"
                  : randomElement(["warning", "error"]),
              lastError: randomBoolean(0.2) ? "Rate limit exceeded" : undefined,
              failingResourceCount: randomBoolean(0.3)
                  ? randomInt(1, 5)
                  : undefined,
          }
        : undefined;

    return {
        id: `conn_${integration.key}`,
        ...integration,
        status,
        connectedAt: isConnected ? randomDate(randomInt(-90, -1)) : undefined,
        lastSyncedAt: isConnected ? randomDate(randomInt(-7, 0)) : undefined,
        connectedBy: isConnected
            ? randomBoolean(0.5)
                ? getCurrentUser()
                : getAssigneeStub()
            : undefined,
        externalAccountLabel: isConnected
            ? `${integration.label} Organization`
            : undefined,
        health,
        ...overrides,
    };
}

export function getConnectionsStub(): ConnectionStub[] {
    return [
        getConnectionStub({
            key: "azure_ad",
            status: "connected",
            connectedAt: "2026-01-12T09:00:00.000Z",
            lastSyncedAt: "2026-03-27T10:15:00.000Z",
            externalAccountLabel: "Workspace Identity Directory",
            health: {
                status: "healthy",
            },
        }),
        getConnectionStub({
            key: "github",
            status: "connected",
            connectedAt: "2026-02-02T11:45:00.000Z",
            lastSyncedAt: "2026-03-26T07:30:00.000Z",
            externalAccountLabel: "Workspace Engineering Org",
            health: {
                status: "warning",
                failingResourceCount: 2,
                lastError: "Repository audit log sync is delayed.",
            },
        }),
        getConnectionStub({
            key: "okta",
            status: "error",
            connectedAt: "2025-12-18T08:20:00.000Z",
            lastSyncedAt: "2026-03-24T06:40:00.000Z",
            externalAccountLabel: "Workspace Workforce",
            health: {
                status: "error",
                failingResourceCount: 4,
                lastError: "Token refresh failed during the last sync window.",
            },
        }),
        getConnectionStub({
            key: "jira",
            status: "disconnected",
            connectedAt: undefined,
            lastSyncedAt: undefined,
            externalAccountLabel: undefined,
            health: undefined,
        }),
        getConnectionStub({
            key: "slack",
            status: "disconnected",
            connectedAt: undefined,
            lastSyncedAt: undefined,
            externalAccountLabel: undefined,
            health: undefined,
        }),
    ];
}

export function getConnectionsCatalogStub(): ConnectionCatalogEntryStub[] {
    return getConnectionsStub().map((connection) => {
        const preset =
            INTEGRATIONS.find((integration) => integration.key === connection.key) ??
            INTEGRATIONS[0];

        return {
            ...connection,
            automation: preset.automation,
            recommendedScopes: [...preset.recommendedScopes],
        };
    });
}

export function getConnectedConnectionsStub(): ConnectionStub[] {
    return getConnectionsStub().filter((c) => c.status === "connected");
}
