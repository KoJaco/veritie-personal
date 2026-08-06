import "server-only";

import { randomUUID } from "crypto";
import { and, eq } from "drizzle-orm";

import { resources } from "@/db/schema/objects";
import { getDb } from "@/lib/db";
import type {
    CreateResourceInput,
    ResourceIndexQuery,
} from "@/lib/data-source/resources-read-model";
import {
    applyResourcesIndexQuery,
} from "@/lib/data-source/resources-read-model";
import type { ResourceStub } from "@/lib/stubs";
import type { ScopeKey } from "@/lib/lens";

import type { AccountScope } from "./context";

function toIso(date: Date): string {
    return date.toISOString();
}

function mapResourceRowToStub(row: typeof resources.$inferSelect): ResourceStub {
    const aspectIds = (row.aspectIds ?? []) as ScopeKey[];
    return {
        id: row.id,
        name: row.name,
        category: row.category as ResourceStub["category"],
        summary: row.summary ?? "",
        owner: null,
        criticality: "medium",
        sensitivity: "internal",
        scopeIds: aspectIds,
        coverageFlags: {
            hasOwner: false,
            hasAttachments: false,
            mappedToChecks: false,
            monitored: false,
        },
        linkedChecksCount: 0,
        linkedTasksCount: 0,
        linkedAttachmentCount: 0,
        linkedConnectionsCount: 0,
        updatedAt: toIso(row.updatedAt),
    };
}

export async function getResourcesIndex(
    scope: AccountScope,
    query?: ResourceIndexQuery,
) {
    const db = getDb();
    const rows = await db
        .select()
        .from(resources)
        .where(eq(resources.accountId, scope.accountId));

    const items = rows.map(mapResourceRowToStub);
    return applyResourcesIndexQuery(items, query);
}

export async function getResourceDetail(scope: AccountScope, id: string) {
    const db = getDb();
    const row = await db
        .select()
        .from(resources)
        .where(
            and(eq(resources.accountId, scope.accountId), eq(resources.id, id)),
        )
        .then((rows) => rows[0]);

    if (!row) {
        return null;
    }

    const stub = mapResourceRowToStub(row);
    return {
        ...stub,
        postureSummary: stub.summary,
        linkedChecks: [],
        linkedTasks: [],
        linkedAttachments: [],
        linkedConnections: [],
        timeline: [],
    };
}

export async function createResource(
    scope: AccountScope,
    input: CreateResourceInput,
) {
    const db = getDb();
    const id = `resource_${randomUUID()}`;
    const now = new Date();

    await db.insert(resources).values({
        id,
        accountId: scope.accountId,
        name: input.name.trim(),
        category: input.category,
        summary: input.description?.trim() ?? "",
        aspectIds: [],
        sourceCaptureIds: [],
        sourceValueIds: [],
        createdAt: now,
        updatedAt: now,
    });

    return { resourceId: id };
}
