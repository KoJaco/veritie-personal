import type {
    ConnectionCatalogEntryStub,
    ConnectionStatus,
} from "@/lib/stubs";
import { buildAttachmentContextHref } from "@/lib/work/attachment-routes";

const DEFAULT_LENS = { scope: "all" as const };

export type ConnectionListGroup = "connected" | "disconnected";

export interface ConnectionIndexItemReadModel {
    id: string;
    key: string;
    label: string;
    status: ConnectionStatus;
    healthStatus: "healthy" | "warning" | "error" | "inactive";
    lastSyncedAt?: string;
    coverageSummary: string;
    group: ConnectionListGroup;
    detailHref?: string;
    actionLabel: "Connect" | "Reconnect" | "Open";
}

export interface ConnectionsIndexReadModel {
    connected: ConnectionIndexItemReadModel[];
    disconnected: ConnectionIndexItemReadModel[];
    providerOptions: ConnectionProviderOptionReadModel[];
}

export interface ConnectionProviderOptionReadModel {
    key: string;
    label: string;
    authType: ConnectionCatalogEntryStub["authType"];
    coverageSummary: string;
    attachmentTypes: string[];
    recommendedScopes: string[];
}

export interface ConnectionGeneratedAttachmentReadModel {
    id: string;
    title: string;
    status: "active" | "draft" | "superseded" | "archived";
    href: string;
}

export interface ConnectionDetailReadModel {
    id: string;
    key: string;
    label: string;
    status: ConnectionStatus;
    healthStatus: "healthy" | "warning" | "error" | "inactive";
    authType: ConnectionCatalogEntryStub["authType"];
    lastSyncedAt?: string;
    connectedAt?: string;
    externalAccountLabel?: string;
    connectedByName?: string;
    coverageSummary: string;
    automatedChecks: number;
    manualChecksRemaining: number;
    failingResourceCount?: number;
    lastError?: string;
    capabilities: string[];
    recommendedScopes: string[];
    attachmentTypes: string[];
    impactSummary: string;
    generatedAttachments: ConnectionGeneratedAttachmentReadModel[];
    actionAvailability: {
        canSyncNow: boolean;
        canReconnect: boolean;
        canDisconnect: boolean;
    };
}

export function mapConnectionIndexItem(
    entry: ConnectionCatalogEntryStub,
): ConnectionIndexItemReadModel {
    const healthStatus =
        entry.status === "connected"
            ? (entry.health?.status ?? "healthy")
            : entry.status === "error" || entry.status === "revoked"
              ? "error"
              : "inactive";

    const isInspectable =
        entry.status === "connected" ||
        entry.status === "error" ||
        entry.status === "revoked";

    return {
        id: entry.id,
        key: entry.key,
        label: entry.label,
        status: entry.status,
        healthStatus,
        lastSyncedAt: entry.lastSyncedAt,
        coverageSummary: entry.automation.coverageSummary,
        group: isInspectable ? "connected" : "disconnected",
        detailHref: isInspectable ? `/work/connections/${entry.id}` : undefined,
        actionLabel:
            entry.status === "connected"
                ? "Open"
                : entry.status === "error" || entry.status === "revoked"
                  ? "Open"
                  : "Connect",
    };
}

export function buildConnectionsIndexReadModel(
    entries: ConnectionCatalogEntryStub[],
): ConnectionsIndexReadModel {
    const items = entries.map(mapConnectionIndexItem);

    return {
        connected: items.filter((item) => item.group === "connected"),
        disconnected: items.filter((item) => item.group === "disconnected"),
        providerOptions: entries.map((entry) => ({
            key: entry.key,
            label: entry.label,
            authType: entry.authType,
            coverageSummary: entry.automation.coverageSummary,
            attachmentTypes: [...entry.automation.attachmentTypes],
            recommendedScopes: [...entry.recommendedScopes],
        })),
    };
}

export function mapConnectionDetail(
    entry: ConnectionCatalogEntryStub,
): ConnectionDetailReadModel {
    const healthStatus =
        entry.status === "connected"
            ? (entry.health?.status ?? "healthy")
            : entry.status === "error" || entry.status === "revoked"
              ? "error"
              : "inactive";

    return {
        id: entry.id,
        key: entry.key,
        label: entry.label,
        status: entry.status,
        healthStatus,
        authType: entry.authType,
        lastSyncedAt: entry.lastSyncedAt,
        connectedAt: entry.connectedAt,
        externalAccountLabel: entry.externalAccountLabel,
        connectedByName: entry.connectedBy?.name,
        coverageSummary: entry.automation.coverageSummary,
        automatedChecks: entry.automation.automatedChecks,
        manualChecksRemaining: entry.automation.manualChecksRemaining,
        failingResourceCount: entry.health?.failingResourceCount,
        lastError: entry.health?.lastError,
        capabilities: [...entry.capabilities],
        recommendedScopes: [...entry.recommendedScopes],
        attachmentTypes: [...entry.automation.attachmentTypes],
        impactSummary: `This connection currently automates ${entry.automation.automatedChecks} checks and leaves ${entry.automation.manualChecksRemaining} checks dependent on manual attachment refresh.`,
        generatedAttachments: entry.automation.attachmentTypes.map((type, index) => ({
            id: `${entry.id}_attachment_${index + 1}`,
            title: `${entry.label} ${type}`,
            status: index === 0 ? "active" : "draft",
            href: buildAttachmentContextHref(
                index === 0 ? "att_detail" : "att_versioned",
                DEFAULT_LENS,
            ),
        })),
        actionAvailability: {
            canSyncNow: entry.status === "connected",
            canReconnect:
                entry.status === "connected" ||
                entry.status === "error" ||
                entry.status === "revoked",
            canDisconnect: entry.status === "connected",
        },
    };
}
